(() => {
  const form = document.getElementById('verify-form');
  const input = document.getElementById('certificate-code');
  const result = document.getElementById('verify-result');
  const codeFromUrl = new URLSearchParams(location.search).get('code');
  if (codeFromUrl) input.value = codeFromUrl;
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  async function verify(code) {
    result.className = 'verify-loading'; result.textContent = 'جارٍ التحقق...';
    try {
      const response = await fetch(`/api/learning/verify/${encodeURIComponent(code)}`);
      const data = await response.json();
      if (!response.ok || !data.valid) throw new Error(data.error || 'الشهادة غير صالحة');
      const c = data.certificate;
      const imageUrl = `/api/learning/certificates/${encodeURIComponent(c.certificateCode)}/image`;
      result.className = 'verify-success';
      result.innerHTML = `<strong>✓ الشهادة صحيحة وفعّالة</strong><img class="verify-certificate-image" src="${imageUrl}" alt="شهادة ${escapeHtml(c.studentName)}"><dl><dt>الطالب</dt><dd>${escapeHtml(c.studentName)}</dd><dt>الدورة</dt><dd>${escapeHtml(c.courseName)}</dd><dt>الرقم التسلسلي</dt><dd>${escapeHtml(c.certificateCode)}</dd><dt>حالة الشهادة</dt><dd>${c.status === 'valid' ? 'معتمدة وصالحة' : 'ملغاة'}</dd><dt>تاريخ الإصدار</dt><dd>${new Date(c.issuedAt).toLocaleDateString('ar-SA')}</dd></dl>`;
    } catch (error) { result.className = 'verify-error'; result.textContent = error.message; }
  }
  form.addEventListener('submit', (event) => { event.preventDefault(); verify(input.value.trim()); });
  if (codeFromUrl) verify(codeFromUrl);
})();
