'use strict';

// A deliberately small public aggregate. It never returns member records,
// certificate records, or any engagement/challenge figures.
const express = require('express');
const { pool } = require('../db/pool');

const router = express.Router();
const CACHE_MS = 60 * 1000;
let cached = null;
let cachedAt = 0;

router.get('/status', async (_req, res) => {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_MS) {
    return res.set('Cache-Control', 'public, max-age=60').json(cached);
  }
  try {
    const { rows } = await pool.query(
      `SELECT
         (SELECT count(*)::int FROM users WHERE is_active = TRUE) AS "activeMembers",
         (SELECT count(*)::int FROM student_course_certificates) AS "issuedCertificates"`
    );
    cached = { available: true, activeMembers: rows[0].activeMembers, issuedCertificates: rows[0].issuedCertificates };
    cachedAt = now;
    return res.set('Cache-Control', 'public, max-age=60').json(cached);
  } catch (_error) {
    // Status is non-essential; keep database failures private and let the UI
    // omit the strip rather than render invented counts.
    return res.status(503).set('Cache-Control', 'no-store').json({ available: false });
  }
});

module.exports = router;
