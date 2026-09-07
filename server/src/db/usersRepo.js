'use strict';

const { pool } = require('./pool');

// Every query below uses parameterized placeholders ($1, $2, ...) — never
// string concatenation — which is what actually prevents SQL injection
// (req #18). node-postgres sends parameters separately from the query
// text, so user input is never interpreted as SQL syntax.

const PUBLIC_COLUMNS = `id, first_name, last_name, email, phone, major, gender, role,
  is_active, email_verified_at, created_at`;

async function findByEmail(email) {
  const { rows } = await pool.query(
    `SELECT id, first_name, last_name, email, phone, password_hash, major, gender, role,
            is_active, failed_login_count, locked_until, created_at
     FROM users WHERE email = $1`,
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await pool.query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function createUser({ firstName, lastName, email, phone, passwordHash, major, gender, role = 'student' }) {
  const { rows } = await pool.query(
    `INSERT INTO users (first_name, last_name, email, phone, password_hash, major, gender, role)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING ${PUBLIC_COLUMNS}`,
    [firstName, lastName, email, phone || null, passwordHash, major || null, gender || null, role]
  );
  return rows[0];
}

async function updateProfile(id, { firstName, lastName, phone, major, gender }) {
  const { rows } = await pool.query(
    `UPDATE users SET first_name = $2, last_name = $3, phone = $4, major = $5, gender = $6
     WHERE id = $1
     RETURNING ${PUBLIC_COLUMNS}`,
    [id, firstName, lastName, phone || null, major || null, gender || null]
  );
  return rows[0] || null;
}

async function updatePasswordHash(id, passwordHash) {
  await pool.query('UPDATE users SET password_hash = $2 WHERE id = $1', [id, passwordHash]);
}

async function recordFailedLogin(id, { lock = false, lockMinutes = 15 } = {}) {
  if (lock) {
    await pool.query(
      `UPDATE users SET failed_login_count = failed_login_count + 1,
              locked_until = now() + ($2 || ' minutes')::interval
       WHERE id = $1`,
      [id, String(lockMinutes)]
    );
  } else {
    await pool.query('UPDATE users SET failed_login_count = failed_login_count + 1 WHERE id = $1', [id]);
  }
}

async function resetFailedLogins(id) {
  await pool.query('UPDATE users SET failed_login_count = 0, locked_until = NULL WHERE id = $1', [id]);
}

async function setActive(id, isActive) {
  const { rows } = await pool.query(
    `UPDATE users SET is_active = $2 WHERE id = $1 RETURNING ${PUBLIC_COLUMNS}`,
    [id, isActive]
  );
  return rows[0] || null;
}

module.exports = {
  findByEmail,
  findById,
  createUser,
  updateProfile,
  updatePasswordHash,
  recordFailedLogin,
  resetFailedLogins,
  setActive,
};
