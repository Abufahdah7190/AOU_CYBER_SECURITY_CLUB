'use strict';

const crypto = require('crypto');
const usersRepo = require('../db/usersRepo');
const tokensRepo = require('../db/tokensRepo');
const { hashPassword, verifyPassword, passwordPolicyErrors } = require('../utils/password');
const { validateUniversityEmail } = require('../utils/universityEmail');
const { signAccessToken, generateRefreshToken, hashToken } = require('../utils/tokens');
const { recordAudit } = require('../utils/auditLog');
const { sendEmail } = require('../utils/email');
const env = require('../config/env');

const MAX_FAILED_ATTEMPTS = 5;

function cookieOptions(maxAgeMs) {
  const options = {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'lax',
    domain: env.COOKIE_DOMAIN,
    path: '/',
  };
  // Omitting Max-Age/Expires creates a browser-session cookie. It is
  // intentionally not restored after the browser is closed.
  if (Number.isFinite(maxAgeMs)) options.maxAge = maxAgeMs;
  return options;
}

async function issueSession(res, user, req) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  const accessToken = signAccessToken(user);
  const refreshToken = generateRefreshToken();
  await tokensRepo.storeRefreshToken({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    userAgent: req.get('user-agent'),
    ip: req.ip,
  });

  // Both cookies are session-only. The JWT/database TTLs still limit the
  // lifetime while the browser session is open, but reopening the browser
  // requires a fresh login.
  res.cookie('cc_access_session', accessToken, cookieOptions());
  res.cookie('cc_refresh_session', refreshToken, cookieOptions());
}

function publicUser(user) {
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    phone: user.phone,
    major: user.major,
    role: user.role,
    gender: user.gender,
    createdAt: user.created_at,
  };
}

// ---------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------
async function register(req, res, next) {
  try {
    const { firstName, lastName, phone, email, password, major, gender } = req.body;
    const normalizedEmail = String(email).trim().toLowerCase();

    const emailError = validateUniversityEmail(normalizedEmail);
    if (emailError) {
      return res.status(400).json({ error: emailError });
    }

    const policyErrors = passwordPolicyErrors(password);
    if (policyErrors.length) {
      return res.status(400).json({ error: 'بيانات غير صالحة', details: policyErrors });
    }

    const existing = await usersRepo.findByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: 'هذا البريد الإلكتروني مستخدم بالفعل' });
    }

    const passwordHash = await hashPassword(password);
    const user = await usersRepo.createUser({
      firstName,
      lastName,
      email: normalizedEmail,
      phone,
      passwordHash,
      major,
      gender,
      role: 'student', // public registration can never self-assign a privileged role
    });

    await issueSession(res, user, req);
    await recordAudit({ actorId: user.id, action: 'user.register', entityType: 'user', entityId: user.id, req });

    sendEmail({
      to: user.email,
      subject: 'مرحبًا بك في نادي الأمن السيبراني',
      html: `<div dir="rtl" style="font-family: Tahoma, sans-serif;">
        <h2>أهلًا ${user.first_name}!</h2>
        <p>تم إنشاء حسابك بنجاح في منصة نادي الأمن السيبراني - الجامعة العربية المفتوحة (فرع الرياض).</p>
      </div>`,
    }).then((result) => {
      if (!result.success) console.error('Failed to send welcome email:', result.error);
    });

    return res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    return next(err);
  }
}

// ---------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email).trim().toLowerCase();

    // Generic message for every failure branch below — never reveal
    // whether the email exists, which field was wrong, or that an
    // account is locked, to avoid user enumeration.
    const genericError = { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };

    const user = await usersRepo.findByEmail(normalizedEmail);
    if (!user) return res.status(401).json(genericError);

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(401).json(genericError);
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'تم تعطيل هذا الحساب. الرجاء التواصل مع الإدارة.' });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      const willLock = user.failed_login_count + 1 >= MAX_FAILED_ATTEMPTS;
      await usersRepo.recordFailedLogin(user.id, { lock: willLock });
      await recordAudit({ actorId: user.id, action: 'user.login_failed', entityType: 'user', entityId: user.id, req });
      return res.status(401).json(genericError);
    }

    await usersRepo.resetFailedLogins(user.id);
    await issueSession(res, user, req);
    await recordAudit({ actorId: user.id, action: 'user.login', entityType: 'user', entityId: user.id, req });

    return res.json({ user: publicUser(user) });
  } catch (err) {
    return next(err);
  }
}

// ---------------------------------------------------------------------
// POST /api/auth/refresh
// ---------------------------------------------------------------------
async function refresh(req, res, next) {
  try {
    const rawToken = req.cookies && req.cookies.cc_refresh_session;
    if (!rawToken) return res.status(401).json({ error: 'يجب تسجيل الدخول للمتابعة' });

    const tokenHash = hashToken(rawToken);
    const stored = await tokensRepo.findValidRefreshToken(tokenHash);
    if (!stored) return res.status(401).json({ error: 'انتهت صلاحية الجلسة، الرجاء تسجيل الدخول مرة أخرى' });

    const user = await usersRepo.findById(stored.user_id);
    if (!user || !user.is_active) return res.status(401).json({ error: 'الحساب غير متاح' });

    // Rotate: revoke the old refresh token and issue a brand new pair.
    // This limits how long a stolen refresh token remains useful.
    await tokensRepo.revokeRefreshToken(tokenHash);
    await issueSession(res, user, req);

    return res.json({ user: publicUser(user) });
  } catch (err) {
    return next(err);
  }
}

// ---------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------
async function logout(req, res, next) {
  try {
    const rawToken = req.cookies && req.cookies.cc_refresh_session;
    if (rawToken) {
      await tokensRepo.revokeRefreshToken(hashToken(rawToken));
    }
    res.clearCookie('cc_access_session', cookieOptions());
    res.clearCookie('cc_refresh_session', cookieOptions());
    // Remove cookies created by older deployments as well.
    res.clearCookie('access_token', cookieOptions());
    res.clearCookie('refresh_token', cookieOptions());
    if (req.user) {
      await recordAudit({ actorId: req.user.id, action: 'user.logout', entityType: 'user', entityId: req.user.id, req });
    }
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

// ---------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------
async function me(req, res, next) {
  try {
    const user = await usersRepo.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
    return res.json({
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        major: user.major,
        gender: user.gender,
        role: user.role,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    return next(err);
  }
}

// ---------------------------------------------------------------------
// PATCH /api/auth/profile
// ---------------------------------------------------------------------
async function updateProfile(req, res, next) {
  try {
    const { firstName, lastName, phone, major, gender } = req.body;
    const updated = await usersRepo.updateProfile(req.user.id, { firstName, lastName, phone, major, gender });
    await recordAudit({ actorId: req.user.id, action: 'user.update_profile', entityType: 'user', entityId: req.user.id, req });
    return res.json({ user: publicUser(updated) });
  } catch (err) {
    return next(err);
  }
}

// ---------------------------------------------------------------------
// POST /api/auth/change-password  (logged-in user changes their own password)
// ---------------------------------------------------------------------
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const policyErrors = passwordPolicyErrors(newPassword);
    if (policyErrors.length) {
      return res.status(400).json({ error: 'بيانات غير صالحة', details: policyErrors });
    }

    const user = await usersRepo.findByEmail(req.user.email);
    const valid = await verifyPassword(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'كلمة المرور الحالية غير صحيحة' });

    const newHash = await hashPassword(newPassword);
    await usersRepo.updatePasswordHash(user.id, newHash);
    await usersRepo.resetFailedLogins(user.id);
    await tokensRepo.revokeAllRefreshTokensForUser(user.id); // force re-login on other devices
    await recordAudit({ actorId: user.id, action: 'user.change_password', entityType: 'user', entityId: user.id, req });

    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

// ---------------------------------------------------------------------
// POST /api/auth/forgot-password
// ---------------------------------------------------------------------
async function forgotPassword(req, res, next) {
  try {
    const normalizedEmail = String(req.body.email).trim().toLowerCase();

    // Reject non-university domains outright — this check doesn't leak
    // whether an account exists (a non-AOU address never has one), so it's
    // safe to return before the generic-response branch below.
    const emailError = validateUniversityEmail(normalizedEmail);
    if (emailError) {
      return res.status(400).json({ error: emailError });
    }

    const user = await usersRepo.findByEmail(normalizedEmail);

    // Always respond identically whether or not the email exists —
    // otherwise this endpoint becomes an account-enumeration oracle.
    const genericResponse = { ok: true, message: 'إذا كان البريد الإلكتروني مسجلاً لدينا، فستصلك رسالة لإعادة تعيين كلمة المرور.' };

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      await tokensRepo.storePasswordResetToken({ userId: user.id, tokenHash: hashToken(rawToken), ttlMinutes: 30 });
      const resetUrl = `${env.FRONTEND_URL}/reset-password.html?token=${rawToken}`;

      // The reset token is saved before scheduling delivery, while the
      // response itself remains independent from SMTP/API availability.
      // This guarantees that the client exits its busy state immediately.
      setImmediate(() => {
        sendEmail({
          to: user.email,
          subject: 'إعادة تعيين كلمة المرور - نادي الأمن السيبراني',
          html: `<div dir="rtl" style="font-family: Tahoma, sans-serif;">
            <p>مرحبًا ${user.first_name}،</p>
            <p>اضغط على الرابط التالي لإعادة تعيين كلمة المرور (صالح لمدة 30 دقيقة):</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>إذا لم تطلب ذلك، تجاهل هذه الرسالة.</p>
          </div>`,
        }).then((emailResult) => {
          if (!emailResult.success) console.error('Failed to send reset email:', emailResult.error);
        }).catch((emailError) => {
          console.error('Reset email delivery task failed:', emailError.message);
        });
      });

      await recordAudit({ actorId: user.id, action: 'user.request_password_reset', entityType: 'user', entityId: user.id, req });
    }

    return res.json(genericResponse);
  } catch (err) {
    return next(err);
  }
}

// ---------------------------------------------------------------------
// POST /api/auth/reset-password
// ---------------------------------------------------------------------
async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    const policyErrors = passwordPolicyErrors(newPassword);
    if (policyErrors.length) {
      return res.status(400).json({ error: 'بيانات غير صالحة', details: policyErrors });
    }

    const tokenHash = hashToken(token);
    const stored = await tokensRepo.findValidPasswordResetToken(tokenHash);
    if (!stored) {
      return res.status(400).json({ error: 'رابط إعادة التعيين غير صالح أو منتهي الصلاحية' });
    }

    const newHash = await hashPassword(newPassword);
    await usersRepo.updatePasswordHash(stored.user_id, newHash);
    await usersRepo.resetFailedLogins(stored.user_id); // proving email ownership clears any prior lockout
    await tokensRepo.markPasswordResetTokenUsed(stored.id);
    await tokensRepo.revokeAllRefreshTokensForUser(stored.user_id);
    await recordAudit({ actorId: stored.user_id, action: 'user.reset_password', entityType: 'user', entityId: stored.user_id, req });

    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
