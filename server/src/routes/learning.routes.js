const express = require('express');
const { body, param } = require('express-validator');
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { handleValidation } = require('../middleware/errors');
const {
  studentFullName,
  issueCertificate,
  findByCode,
  renderCertificateSvg,
  queueCertificateEmail,
  withQrDataUrl,
} = require('../services/certificate.service');

const router = express.Router();
const courseParam = param('courseSlug').trim().isSlug().isLength({ max: 80 });
const certificateCodeParam = param('certificateCode').trim().isLength({ min: 5, max: 60 });

// Public verification endpoint: exposes only certificate verification data.
router.get('/verify/:certificateCode', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT certificate_code AS "certificateCode", course_name AS "courseName", student_name AS "studentName",
              language, theme, issued_at AS "issuedAt", 'valid' AS status
       FROM student_course_certificates
       WHERE certificate_code = $1`,
      [req.params.certificateCode]
    );
    if (!rows[0]) return res.status(404).json({ valid: false, error: 'الشهادة غير موجودة أو غير صالحة' });
    return res.json({ valid: true, certificate: rows[0] });
  } catch (error) { return next(error); }
});

// Public certificate artwork: renders the same dynamic SVG used for the
// email attachment/download so the verification page (or anyone with the
// certificate code) can display the real certificate image. No sensitive
// data beyond what /verify already exposes.
router.get('/certificates/:certificateCode/image', [certificateCodeParam], handleValidation, async (req, res, next) => {
  try {
    const certificate = await findByCode(req.params.certificateCode);
    if (!certificate) return res.status(404).send('Certificate not found');
    const svg = await renderCertificateSvg(certificate);
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(svg);
  } catch (error) { return next(error); }
});

router.use(requireAuth);

router.get('/progress', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT course_slug AS "courseSlug", percent, last_section AS "lastSection",
              last_accessed_at AS "lastAccessedAt", quiz_scores AS "quizScores",
              certificate_language AS language, completed_at AS "completedAt"
       FROM student_course_progress WHERE student_id = $1 ORDER BY last_accessed_at DESC`,
      [req.user.id]
    );
    const certificates = await pool.query(
      `SELECT course_slug AS "courseSlug", course_name AS "courseName", student_name AS "studentName", language, theme,
              certificate_code AS "certificateCode", issued_at AS "issuedAt"
       FROM student_course_certificates WHERE student_id = $1 ORDER BY issued_at DESC`,
      [req.user.id]
    );
    return res.json({ progress: rows, certificates: certificates.rows });
  } catch (error) { return next(error); }
});

router.put('/progress/:courseSlug', [
  courseParam,
  body('percent').isInt({ min: 0, max: 100 }),
  body('lastSection').optional().isInt({ min: 0, max: 30 }),
  body('quizScores').optional().isObject(),
  body('language').optional().isIn(['ar', 'en']),
  body('theme').optional().isIn(['light']),
  body('courseName').optional().trim().isLength({ min: 2, max: 200 }),
], handleValidation, async (req, res, next) => {
  try {
    const { courseSlug } = req.params;
    const percent = Number(req.body.percent);
    const lastSection = Number(req.body.lastSection || 0);
    const quizScores = req.body.quizScores || {};
    const language = req.body.language || 'ar';
    const theme = req.body.theme || 'light';
    const completedAt = percent >= 80 ? new Date() : null;
    const { rows } = await pool.query(
      `INSERT INTO student_course_progress (student_id, course_slug, percent, last_section, last_accessed_at, quiz_scores, certificate_language, completed_at)
       VALUES ($1,$2,$3,$4,now(),$5,$6,$7)
       ON CONFLICT (student_id, course_slug) DO UPDATE SET percent=EXCLUDED.percent,
         last_section=EXCLUDED.last_section, last_accessed_at=now(), quiz_scores=EXCLUDED.quiz_scores,
         certificate_language=EXCLUDED.certificate_language,
         completed_at=CASE WHEN EXCLUDED.percent >= 80 THEN COALESCE(student_course_progress.completed_at, now()) ELSE NULL END,
         updated_at=now()
       RETURNING course_slug AS "courseSlug", percent, last_section AS "lastSection", last_accessed_at AS "lastAccessedAt", quiz_scores AS "quizScores", certificate_language AS language, completed_at AS "completedAt"`,
      [req.user.id, courseSlug, percent, lastSection, quizScores, language, completedAt]
    );

    let certificate = null;
    if (percent >= 100) {
      const userResult = await pool.query(
        'SELECT email, first_name, last_name FROM users WHERE id = $1',
        [req.user.id]
      );
      const user = userResult.rows[0];
      if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

      const issued = await issueCertificate({
        studentId: req.user.id,
        courseSlug,
        courseName: String(req.body.courseName || courseSlug).trim(),
        studentName: studentFullName(user),
        language,
        theme,
      });
      certificate = issued.certificate;

      // Mail rendering and delivery run after the response has been scheduled;
      // the learner never waits for SMTP/API availability or attachment creation.
      if (issued.created) {
        queueCertificateEmail({ certificate, recipientEmail: user.email });
      }
    }

    return res.json({
      progress: rows[0],
      certificate,
      certificateEmailQueued: Boolean(certificate),
    });
  } catch (error) { return next(error); }
});

router.post('/certificates/:courseSlug', [
  courseParam,
  body('courseName').trim().isLength({ min: 2, max: 200 }),
  body('language').isIn(['ar', 'en']),
  body('theme').optional().isIn(['light']),
], handleValidation, async (req, res, next) => {
  try {
    const progressResult = await pool.query(
      'SELECT percent FROM student_course_progress WHERE student_id=$1 AND course_slug=$2',
      [req.user.id, req.params.courseSlug]
    );
    const completionPercent = Number(progressResult.rows[0]?.percent || 0);
    if (completionPercent < 100) {
      return res.status(400).json({ error: 'يجب إكمال جميع دروس الدورة بنسبة 100% للحصول على الشهادة' });
    }

    const userResult = await pool.query(
      'SELECT email, first_name, last_name FROM users WHERE id=$1',
      [req.user.id]
    );
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

    // This endpoint is used from the profile page to (re)issue a certificate
    // with a different language and/or theme. It reuses the single
    // certificate code and only emails again when the certificate is new.
    const issued = await issueCertificate({
      studentId: req.user.id,
      courseSlug: req.params.courseSlug,
      courseName: req.body.courseName,
      studentName: studentFullName(user),
      language: req.body.language,
      theme: req.body.theme || 'light',
      updateExisting: true,
    });
    if (issued.created) {
      queueCertificateEmail({ certificate: issued.certificate, recipientEmail: user.email });
    }

    return res.status(issued.created ? 201 : 200).json({
      certificate: await withQrDataUrl(issued.certificate),
      email: { queued: issued.created },
    });
  } catch (error) { return next(error); }
});

module.exports = router;
