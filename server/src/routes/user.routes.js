'use strict';
const express = require('express');
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const QRCode = require('qrcode');
const env = require('../config/env');
const router = express.Router();

router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const [userResult, progressResult, certificateResult] = await Promise.all([
      pool.query(`SELECT id, first_name AS "firstName", last_name AS "lastName", email, role, phone, major, gender, created_at AS "createdAt" FROM users WHERE id = $1`, [req.user.id]),
      pool.query(`SELECT course_slug AS "courseSlug", percent, completed_at AS "completedAt", last_accessed_at AS "lastAccessedAt" FROM student_course_progress WHERE student_id = $1 ORDER BY last_accessed_at DESC`, [req.user.id]),
      pool.query(`SELECT course_slug AS "courseSlug", course_name AS "courseName", student_name AS "studentName", language, theme, certificate_code AS "certificateCode", issued_at AS "issuedAt" FROM student_course_certificates WHERE student_id = $1 ORDER BY issued_at DESC`, [req.user.id]),
    ]);
    if (!userResult.rows[0]) return res.status(404).json({ error: 'المستخدم غير موجود' });
    const progress = progressResult.rows;
    const certificates = await Promise.all(certificateResult.rows.map(async (certificate) => {
      const verificationUrl = `${env.FRONTEND_URL}/certificate-verify.html?code=${encodeURIComponent(certificate.certificateCode)}`;
      const imageUrl = `${env.FRONTEND_URL}/api/learning/certificates/${encodeURIComponent(certificate.certificateCode)}/image`;
      const qrDataUrl = await QRCode.toDataURL(verificationUrl, { errorCorrectionLevel: 'M', margin: 1, width: 220 });
      return { ...certificate, theme: certificate.theme || 'light', verificationUrl, imageUrl, qrDataUrl };
    }));
    return res.json({
      user: userResult.rows[0],
      progress,
      certificates,
      stats: {
        enrolledCourses: progress.length,
        completedCourses: progress.filter((item) => Number(item.percent) >= 100).length,
        certificatesEarned: certificates.length,
      },
    });
  } catch (error) { return next(error); }
});

module.exports = router;
