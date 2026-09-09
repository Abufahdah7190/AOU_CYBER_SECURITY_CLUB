const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { validateUniversityEmail, REJECTION_MESSAGE } = require('../src/utils/universityEmail');

assert.equal(validateUniversityEmail('student@aou.edu.sa'), null);
assert.equal(validateUniversityEmail('STUDENT@AOU.EDU.SA'), null);
assert.equal(validateUniversityEmail('student@aou.edu'), REJECTION_MESSAGE);
assert.equal(validateUniversityEmail('student@mail.aou.edu.sa'), REJECTION_MESSAGE);
assert.equal(validateUniversityEmail('student@gmail.com'), REJECTION_MESSAGE);
const publicRoot = path.join(__dirname, '..', 'public');
const signup = fs.readFileSync(path.join(publicRoot, 'js', 'signup.js'), 'utf8');
assert.match(signup, /supabaseClient\.auth\.signUp/);
assert.match(signup, /@aou\\.edu\\.sa/);
assert.match(fs.readFileSync(path.join(publicRoot, 'index.html'), 'utf8'), /contact\.joinCard/);
assert.doesNotMatch(fs.readFileSync(path.join(publicRoot, 'css/style.css'), 'utf8'), /auth-welcome::before[^}]*radial-gradient/);
console.log('Regression tests passed.');
