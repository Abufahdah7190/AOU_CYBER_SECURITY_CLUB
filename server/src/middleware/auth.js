'use strict';

const { verifyAccessToken } = require('../utils/tokens');

/**
 * Requires a valid access token. Reads it from the httpOnly cookie
 * (primary, used by the browser frontend) or an Authorization: Bearer
 * header (useful for API testing / future mobile clients).
 *
 * IMPORTANT: this is enforced server-side on every protected route —
 * hiding a button in the UI is never treated as access control (req #13).
 */
function requireAuth(req, res, next) {
  const cookieToken = req.cookies && req.cookies.cc_access_session;
  const header = req.headers.authorization;
  const bearerToken = header && header.startsWith('Bearer ') ? header.slice(7) : null;
  const token = cookieToken || bearerToken;

  if (!token) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول للمتابعة' });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'انتهت صلاحية الجلسة، الرجاء تسجيل الدخول مرة أخرى' });
  }
}

/**
 * Optional auth — attaches req.user if a valid token is present, but never
 * blocks the request. Useful for endpoints whose response shape changes
 * slightly when logged in (not needed yet in Phase 4, kept for later use).
 */
function optionalAuth(req, res, next) {
  const cookieToken = req.cookies && req.cookies.cc_access_session;
  if (!cookieToken) return next();
  try {
    const payload = verifyAccessToken(cookieToken);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
  } catch (err) {
    // ignore invalid/expired token — treat as anonymous
  }
  return next();
}

/**
 * Restricts a route to one or more roles. Must run after requireAuth.
 * Role hierarchy is intentionally NOT implicit (e.g. admin does not
 * automatically pass a `requireRole('instructor')` check) — each route
 * declares exactly which roles may call it, which is safer and easier to
 * audit than an inheritance chain that's easy to get wrong.
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول للمتابعة' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'ليست لديك صلاحية للوصول إلى هذا المورد' });
    }
    return next();
  };
}

module.exports = { requireAuth, optionalAuth, requireRole };
