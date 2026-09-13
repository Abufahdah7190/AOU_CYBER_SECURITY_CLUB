(() => {
  const form = document.getElementById('verify-form');
  const input = document.getElementById('certificate-code');
  const result = document.getElementById('verify-result');
  const codeFromUrl = new URLSearchParams(location.search).get('code');
  const requestedLanguage = new URLSearchParams(location.search).get('lang');
  if (['ar','en'].includes(requestedLanguage)) window.i18n?.setLanguage(requestedLanguage);
  if (codeFromUrl) input.value = codeFromUrl;
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  let lastCertificate = null; let generation = 0; let activeCode = '';
  const english = () => window.i18n?.lang === 'en';
  const copy = (key) => ({
    checking: english() ? 'Verifying…' : 'جارٍ التحقق...', valid: english() ? 'Certificate is valid and active' : 'الشهادة صحيحة وفعّالة',
    student: english() ? 'Student' : 'الطالب', course: english() ? 'Course' : 'الدورة', serial: english() ? 'Serial number' : 'الرقم التسلسلي',
    status: english() ? 'Certificate status' : 'حالة الشهادة', issued: english() ? 'Issue date' : 'تاريخ الإصدار',
    validStatus: english() ? 'Verified and valid' : 'معتمدة وصالحة', revoked: english() ? 'Revoked' : 'ملغاة', invalid: english() ? 'Certificate is invalid' : 'الشهادة غير صالحة'
  }[key]);
  function renderCertificate(c) {
    const imageUrl = `/api/learning/certificates/${encodeURIComponent(c.certificateCode)}/image?lang=${c.language}`;
    result.className = 'verify-success';
    const displayLocale = english() ? 'en-GB' : 'ar-SA';
    result.innerHTML = `<strong class="verify-verdict">✓ ${copy('valid')}</strong><img class="verify-certificate-image" src="${imageUrl}" alt="${copy('valid')} ${escapeHtml(c.studentName)}"><dl><dt>${copy('student')}</dt><dd dir="auto">${escapeHtml(c.studentName)}</dd><dt>${copy('course')}</dt><dd dir="auto">${escapeHtml(c.courseName)}</dd><dt>${copy('serial')}</dt><dd dir="ltr" class="verify-code">${escapeHtml(c.certificateCode)}</dd><dt>${copy('status')}</dt><dd>${c.status === 'valid' ? copy('validStatus') : copy('revoked')}</dd><dt>${copy('issued')}</dt><dd>${new Date(c.issuedAt).toLocaleDateString(displayLocale)}</dd></dl>`;
    const actions=document.createElement('div');actions.className='certificate-export-actions';
    const download=document.createElement('a');download.href=imageUrl;download.download=c.certificateCode+'-'+c.language+'.svg';download.textContent=english()?'Download SVG':'تنزيل SVG';
    const print=document.createElement('button');print.type='button';print.className='btn';print.textContent=english()?'Print / Save as PDF':'طباعة / حفظ PDF';print.onclick=()=>window.print();
    print.disabled=true;
    const artwork=result.querySelector('img');
    artwork.addEventListener('load',()=>{print.disabled=false;});
    artwork.addEventListener('error',()=>{print.disabled=true;});
    if(artwork.complete && artwork.naturalWidth)print.disabled=false;
    actions.append(download,print);result.append(actions);
  }
  async function verify(code) {
    activeCode = code;
    const current=++generation; lastCertificate=null;
    result.className = 'verify-loading'; result.textContent = copy('checking');
    try {
      const response = await fetch(`/api/learning/verify/${encodeURIComponent(code)}?lang=${english()?'en':'ar'}`, {signal:AbortSignal.timeout(15000)});
      const data = await response.json(); if(current!==generation)return;
      if (!response.ok || !data.valid) throw new Error(copy('invalid'));
      const c = data.certificate;
      lastCertificate = c;
      renderCertificate(c);
    } catch (error) { if(current!==generation)return; result.className = 'verify-error'; result.textContent = error.message; }
  }
  form.addEventListener('submit', (event) => { event.preventDefault(); verify(input.value.trim()); });
  document.addEventListener('languagechange', () => { if (activeCode) verify(activeCode); });
  if (codeFromUrl) verify(codeFromUrl);
})();
