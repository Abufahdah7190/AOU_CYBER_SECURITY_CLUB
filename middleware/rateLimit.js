'use strict';

const rateLimit = require('express-rate-limit');

// Login: the most sensitive endpoint — tight limit per IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'محاولات تسجيل دخول كثيرة جدًا. الرجاء المحاولة لاحقًا.' },
});

// Registration: prevent automated mass account creation.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'محاولات تسجيل كثيرة جدًا من هذا العنوان. الرجاء المحاولة لاحقًا.' },
});

// Password reset request: prevent email-bombing a victim address.
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'طلبات كثيرة جدًا. الرجاء المحاولة لاحقًا.' },
});

// General API-wide limiter as defense-in-depth.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter, registerLimiter, passwordResetLimiter, generalLimiter };
