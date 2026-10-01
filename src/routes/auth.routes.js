'use strict';
const router = require('express').Router();
router.use((_req, res) => res.status(410).set('Cache-Control', 'no-store').json({
  error: 'استخدم تسجيل الدخول في الموقع. للمساعدة في الحساب تواصل عبر الاقتراحات والشكاوى.',
  supportUrl: '/suggestions.html'
}));
module.exports = router;
