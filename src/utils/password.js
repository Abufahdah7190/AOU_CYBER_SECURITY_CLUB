'use strict';

const bcrypt = require('bcryptjs');

// Cost factor 12: strong in 2026 hardware terms while staying fast enough
// (~150-250ms) not to make login feel sluggish or invite DoS via the
// hashing cost itself.
const SALT_ROUNDS = 12;

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

/**
 * Server-side password strength check. Mirrors what a client-side checker
 * might show but is enforced here because client-side validation is
 * trivially bypassed.
 */
function passwordPolicyErrors(password) {
  const errors = [];
  if (typeof password !== 'string' || password.length < 10) {
    errors.push('يجب أن تتكون كلمة المرور من 10 أحرف على الأقل');
  }
  if (!/[a-z]/.test(password)) errors.push('يجب أن تحتوي على حرف صغير واحد على الأقل');
  if (!/[A-Z]/.test(password)) errors.push('يجب أن تحتوي على حرف كبير واحد على الأقل');
  if (!/[0-9]/.test(password)) errors.push('يجب أن تحتوي على رقم واحد على الأقل');
  return errors;
}

module.exports = { hashPassword, verifyPassword, passwordPolicyErrors };
