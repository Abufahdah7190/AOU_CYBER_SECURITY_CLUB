'use strict';

const { pool } = require('./pool');
const env = require('../config/env');

async function storeRefreshToken({ userId, tokenHash, userAgent, ip }) {
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, user_agent, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, now() + ($5 || ' days')::interval)`,
    [userId, tokenHash, userAgent || null, ip || null, String(env.JWT_REFRESH_TTL_DAYS)]
  );
}

async function findValidRefreshToken(tokenHash) {
  const { rows } = await pool.query(
    `SELECT * FROM refresh_tokens
     WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()`,
    [tokenHash]
  );
  return rows[0] || null;
}

async function revokeRefreshToken(tokenHash) {
  await pool.query('UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1', [tokenHash]);
}

async function revokeAllRefreshTokensForUser(userId) {
  await pool.query(
    'UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
    [userId]
  );
}

async function storePasswordResetToken({ userId, tokenHash, ttlMinutes = 30 }) {
  await pool.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + ($3 || ' minutes')::interval)`,
    [userId, tokenHash, String(ttlMinutes)]
  );
}

async function findValidPasswordResetToken(tokenHash) {
  const { rows } = await pool.query(
    `SELECT * FROM password_reset_tokens
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()`,
    [tokenHash]
  );
  return rows[0] || null;
}

async function markPasswordResetTokenUsed(id) {
  await pool.query('UPDATE password_reset_tokens SET used_at = now() WHERE id = $1', [id]);
}

module.exports = {
  storeRefreshToken,
  findValidRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokensForUser,
  storePasswordResetToken,
  findValidPasswordResetToken,
  markPasswordResetTokenUsed,
};
