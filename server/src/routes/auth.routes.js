const express = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');
const { handleValidation } = require('../middleware/errors');
const { loginLimiter, registerLimiter, passwordResetLimiter } = require('../middleware/rateLimit');
const { validateUniversityEmail, REJECTION_MESSAGE } = require('../utils/universityEmail');

const router = express.Router();

// Keep the domain check at the route boundary as well as in the controller.
// This guarantees a direct, consistent error response before any account or
// reset-token operation is attempted.
function universityEmailField() {
  return body('email')
    .trim()
    .custom((value) => {
      const validationError = validateUniversityEmail(value);
      if (validationError) throw new Error(validationError);
      return true;
    })
    .bail()
    .isEmail()
    .withMessage(REJECTION_MESSAGE)
    .normalizeEmail();
}

router.post(
  '/register',
  registerLimiter,
  [
    body('firstName').trim().isLength({ min: 2, max: 100 }).withMessage('الاسم الأول مطلوب'),
    body('lastName').trim().isLength({ min: 2, max: 100 }).withMessage('اسم العائلة مطلوب'),
    universityEmailField(),
    body('phone').trim().isMobilePhone('any').withMessage('رقم الهاتف غير صالح'),
    body('major').trim().isLength({ min: 2, max: 150 }).withMessage('التخصص مطلوب'),
    body('password').isString(),
  ],
  handleValidation,
  ctrl.register
);

router.post(
  '/login',
  loginLimiter,
  [
    body('email').trim().isEmail().withMessage('البريد الإلكتروني غير صالح').normalizeEmail(),
    body('password').isString().notEmpty().withMessage('كلمة المرور مطلوبة'),
  ],
  handleValidation,
  ctrl.login
);

router.post('/refresh', ctrl.refresh);
// Logout must remain public so expired access tokens cannot prevent cookie cleanup.
router.post('/logout', ctrl.logout);
router.get('/me', requireAuth, ctrl.me);

router.patch(
  '/profile',
  requireAuth,
  [
    body('firstName').trim().isLength({ min: 2, max: 100 }),
    body('lastName').trim().isLength({ min: 2, max: 100 }),
    body('phone').optional({ checkFalsy: true }).trim().isMobilePhone('any'),
    body('major').optional({ checkFalsy: true }).trim().isLength({ max: 150 }),
    body('gender').optional({ checkFalsy: true }).isIn(['male', 'female']),
  ],
  handleValidation,
  ctrl.updateProfile
);

router.post(
  '/change-password',
  requireAuth,
  [
    body('currentPassword').isString().notEmpty(),
    body('newPassword').isString(),
  ],
  handleValidation,
  ctrl.changePassword
);

router.post(
  '/forgot-password',
  passwordResetLimiter,
  [universityEmailField()],
  handleValidation,
  ctrl.forgotPassword
);

router.post(
  '/reset-password',
  passwordResetLimiter,
  [
    body('token').isString().notEmpty(),
    body('newPassword').isString(),
  ],
  handleValidation,
  ctrl.resetPassword
);

module.exports = router;
