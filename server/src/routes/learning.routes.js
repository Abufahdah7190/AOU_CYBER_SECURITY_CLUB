const express = require('express');
const { body, param } = require('express-validator');
const { pool } = require('../db/pool');
const requireAuth = require('../middleware/supabaseAuth');
const { evaluate, courses } = require('../services/assessment');
const { handleValidation } = require('../middleware/errors');
const {
  studentFullName,
  issueCertificate,
  findByCode,
  renderCertificateSvg,
  queueCertificateEmail,
  withQrDataUrl,
  courseTitleFor,
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
    // A learner may reissue the same certificate code in a different language
    // or theme. Do not let a browser keep the earlier SVG for an hour.
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.send(svg);
  } catch (error) { return next(error); }
});

router.use(requireAuth);

router.get('/progress', async (req, res, next) => {
  try {
    // التحقق المباشر من وجود المستخدم لتجنب أخطاء غير متوقعة
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول للمتابعة' });
    }

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
    const verified = await pool.query('SELECT course_slug,lesson_index FROM verified_lesson_results WHERE student_id=$1',[req.user.id]);
    for (const progress of rows) {
      const lessonCount=courses[progress.courseSlug]?.modules.flatMap(m=>m.lessons).length || 0;
      const scores=Object.fromEntries(verified.rows.filter(r=>r.course_slug===progress.courseSlug).map(r=>[r.lesson_index,true]));
      progress.quizScores=scores;progress.percent=lessonCount?Math.round(Object.keys(scores).length/lessonCount*100):0;
    }
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
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول للمتابعة' });
    }

    const { courseSlug } = req.params;
    const assessment = evaluate(courseSlug, req.body.lessonIndex, req.body.answers);
    if (!assessment) return res.status(400).json({ error: 'Unknown lesson or invalid answers' });
    if (!assessment.passed) return res.status(422).json({ error: 'At least 80% correct answers required' });
    await pool.query('INSERT INTO verified_lesson_results(student_id,course_slug,lesson_index) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [req.user.id,courseSlug,req.body.lessonIndex]);
    const verified = await pool.query('SELECT lesson_index FROM verified_lesson_results WHERE student_id=$1 AND course_slug=$2', [req.user.id,courseSlug]);
    const trustedScores = Object.fromEntries(verified.rows.map(r => [r.lesson_index,true]));
    const percent = Math.round(verified.rows.length / assessment.count * 100);
    const lastSection = Number(req.body.lastSection || 0);
    const quizScores = trustedScores;
    const language = req.body.language || 'ar';
    const theme = req.body.theme || 'light';
    const completedAt = percent >= 100 ? new Date() : null;
    const { rows } = await pool.query(
      `INSERT INTO student_course_progress (student_id, course_slug, percent, last_section, last_accessed_at, quiz_scores, certificate_language, completed_at)
       VALUES ($1,$2,$3,$4,now(),$5,$6,$7)
       ON CONFLICT (student_id, course_slug) DO UPDATE SET percent=EXCLUDED.percent,
         last_section=EXCLUDED.last_section, last_accessed_at=now(), quiz_scores=EXCLUDED.quiz_scores,
         certificate_language=EXCLUDED.certificate_language,
         completed_at=CASE WHEN EXCLUDED.percent >= 100 THEN COALESCE(student_course_progress.completed_at, now()) ELSE NULL END,
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
        courseName: courseTitleFor(courseSlug, language, req.body.courseName),
        studentName: studentFullName(user),
        language,
        theme,
      });
      certificate = issued.certificate;

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
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول للمتابعة' });
    }

    const lessons = courses[req.params.courseSlug]?.modules.flatMap(m => m.lessons);
    if (!lessons) return res.status(404).json({ error: 'Unknown course' });
    const verified = await pool.query('SELECT count(*)::int AS count FROM verified_lesson_results WHERE student_id=$1 AND course_slug=$2', [req.user.id, req.params.courseSlug]);
    if (verified.rows[0].count !== lessons.length) return res.status(400).json({ error: 'Complete all verified lesson assessments first' });
    const progressResult = await pool.query(
      'SELECT percent FROM student_course_progress WHERE student_id=$1 AND course_slug=$2',
      [req.user.id, req.params.courseSlug]
    );
    const completionPercent = Math.round(verified.rows[0].count / lessons.length * 100);
    if (completionPercent < 100) {
      return res.status(400).json({ error: 'يجب إكمال جميع دروس الدورة بنسبة 100% للحصول على الشهادة' });
    }

    const userResult = await pool.query(
      'SELECT email, first_name, last_name FROM users WHERE id=$1',
      [req.user.id]
    );
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

    const issued = await issueCertificate({
      studentId: req.user.id,
      courseSlug: req.params.courseSlug,
      courseName: courseTitleFor(req.params.courseSlug, req.body.language, req.body.courseName),
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
