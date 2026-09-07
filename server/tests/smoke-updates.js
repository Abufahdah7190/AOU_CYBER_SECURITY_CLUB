const assert = require('node:assert/strict');
const { validateUniversityEmail, REJECTION_MESSAGE } = require('../src/utils/universityEmail');
const { studentFullName, createCertificateAttachment } = require('../src/services/certificate.service');
const { sendEmail } = require('../src/utils/email');

async function main() {
  assert.equal(validateUniversityEmail('student@aou.edu.sa'), null);
  assert.equal(validateUniversityEmail('student@aou.edu'), null);
  assert.equal(validateUniversityEmail('STUDENT@AOU.EDU.SA'), null);
  assert.equal(validateUniversityEmail('student@mail.aou.edu.sa'), REJECTION_MESSAGE);
  assert.equal(validateUniversityEmail('student@gmail.com'), REJECTION_MESSAGE);
  assert.equal(validateUniversityEmail('not-an-email'), REJECTION_MESSAGE);

  assert.equal(studentFullName({ first_name: 'سارة', last_name: 'العتيبي' }), 'سارة العتيبي');
  assert.equal(studentFullName({ first_name: '  Sara ', last_name: '  Alotaibi  ' }), 'Sara Alotaibi');

  const attachment = await createCertificateAttachment({
    studentName: 'سارة العتيبي',
    courseName: 'أساسيات الأمن السيبراني',
    certificateCode: 'CERT-2026-TEST',
    language: 'ar',
    issuedAt: '2026-09-03T00:00:00.000Z',
    verificationUrl: 'https://example.test/certificate-verify.html?code=CERT-2026-TEST',
  });
  const svg = attachment.content.toString('utf8');
  assert.equal(attachment.filename, 'CERT-2026-TEST.svg');
  assert.equal(attachment.contentType, 'image/svg+xml');
  assert.match(svg, /width="1600" height="900"/);
  assert.match(svg, /سارة العتيبي/);
  assert.match(svg, /data:image\/png;base64,/);

  const emailResult = await sendEmail({
    to: 'student@aou.edu.sa',
    subject: 'Smoke test',
    html: '<p>Test</p>',
    attachments: [{ filename: 'CERT-TEST.svg', content: Buffer.from('<svg/>'), contentType: 'image/svg+xml' }],
  });
  assert.equal(emailResult.success, true);
  console.log('Smoke module tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});