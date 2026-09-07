'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');

/**
 * Short-lived access token (carries identity + role, used to authorize
 * every request). Kept short (15m default) so a stolen token has a small
 * blast radius.
 */
function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_TTL }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

/**
 * Long-lived refresh token. We only ever store its SHA-256 hash in the
 * database (refresh_tokens.token_hash) — never the raw token — the same
 * principle as password storage, so a DB leak alone can't be used to
 * mint new sessions.
 */
function generateRefreshToken() {
  return crypto.randomBytes(48).toString('hex');
}

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashToken,
};
