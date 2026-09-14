const path=require('node:path');
const assert=require('assert');
const {certificateInLanguage,buildLightSvg}=require('../src/services/certificate.service');
const original={certificateCode:'TEST-CERT',courseSlug:'cyber-basics',courseName:'أساسيات الأمن السيبراني',studentName:'omar Alnajjar',language:'ar',issuedAt:'2026-09-08T00:00:00Z'};
for(const language of ['ar','en']){
 const c=certificateInLanguage(original,language);const svg=buildLightSvg(c,'data:image/png;base64,');
 assert.equal(c.studentName,original.studentName);assert.equal(c.certificateCode,original.certificateCode);assert.equal(c.issuedAt,original.issuedAt);
 assert(svg.includes(language==='en'?'CERTIFICATE OF COMPLETION':'شهادة إتمام التدريب'));
 assert.equal(c.courseName,language==='en'?'Introduction to Cybersecurity':'أساسيات الأمن السيبراني');
 if(language==='en')assert(!/[\u0600-\u06ff]/.test([...svg.matchAll(/<text\b[^>]*>(.*?)<\/text>/gs)].map(m=>m[1]).join('')));
 console.log('PASS localized artwork '+language);
}
assert.equal(original.language,'ar');assert.throws(()=>certificateInLanguage(original,'fr'));
console.log('PASS immutable original and rejected unsupported language');
