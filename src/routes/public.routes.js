'use strict';

// A deliberately small public aggregate. It never returns member records,
// certificate records, or any engagement/challenge figures.
const express = require('express');
const { pool } = require('../db/pool');

const router = express.Router();
const { body } = require('express-validator');
const { handleValidation } = require('../middleware/errors');
const rateLimit = require('express-rate-limit');
const supportLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 8, standardHeaders: true, legacyHeaders: false,
  message: { error: 'طلبات كثيرة. حاول مرة أخرى لاحقًا.' } });
const contactFields = [
  body('name').isString().trim().isLength({ min: 2, max: 120 }),
  body('email').isString().trim().isLength({ max: 254 }).isEmail(),
  body('phone').isString().matches(/^\+?[0-9]{8,15}$/),
];
// Public support must remain available to a member who cannot sign in.
// Only the server writes to the private inbox; browser database grants are revoked.
router.post('/suggestions', supportLimiter, [...contactFields,
  body('message').isString().trim().isLength({ min: 10, max: 4000 })], handleValidation, async(req,res,next)=>{
  try {
    const {name,email,phone,message}=req.body;
    await pool.query('INSERT INTO public.suggestions(name,email,phone,message) VALUES($1,$2,$3,$4)',[name,email,phone,message]);
    res.status(201).json({ok:true});
  } catch(error) { next(error); }
});
router.post('/join_applications', supportLimiter, [...contactFields,
  body('major').isString().trim().isLength({ min: 2, max: 160 }),
  body('reason_to_join').isString().trim().isLength({ min: 10, max: 4000 })], handleValidation, async(req,res,next)=>{
  try {
    const {name,email,phone,major,reason_to_join}=req.body;
    await pool.query('INSERT INTO public.join_applications(name,email,phone,major,reason_to_join) VALUES($1,$2,$3,$4,$5)',[name,email,phone,major,reason_to_join]);
    res.status(201).json({ok:true});
  } catch(error) { next(error); }
});
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
