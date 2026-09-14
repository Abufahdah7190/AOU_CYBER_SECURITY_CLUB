const assert = require('node:assert/strict');
const { renderCertificateSvg } = require('../src/services/certificate.service');

async function main() {
  const students = Array.from({ length: 10 }, (_, index) => ({
    studentName: `Student ${index + 1}`,
    courseName: index % 2 ? 'Introduction to Cybersecurity' : 'أساسيات الأمن السيبراني',
    certificateCode: `CERT-2026-${String(index + 1).padStart(4, '0')}`,
    language: index % 2 ? 'en' : 'ar',
    issuedAt: '2026-09-03T00:00:00.000Z',
  }));
  const svgs = await Promise.all(students.map(renderCertificateSvg));
  assert.equal(svgs.length, 10);
  svgs.forEach((svg, index) => {
    assert.match(svg, /width="1600" height="900"/);
    assert.match(svg, new RegExp(students[index].studentName));
    assert.match(svg, new RegExp(students[index].certificateCode));
    assert.match(svg, new RegExp(`lang="${students[index].language}"`));
  });
  console.log('Concurrent certificate simulation passed for 10 students.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
