(() => {
  'use strict';
  const AUTH_URL = `${(window.CYBERCLUB_API_BASE || '').replace(/\/$/, '')}/api/auth`;
  const USER_PROFILE_URL = `${(window.CYBERCLUB_API_BASE || '').replace(/\/$/, '')}/api/user/profile`;
  const $ = (selector) => document.querySelector(selector);
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const request = async (url, options = {}) => { const response = await fetch(url, { ...options, credentials: 'include', cache: 'no-store', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || 'تعذر تنفيذ العملية.'); return data; };
  function setMessage(text, type = '') { const box = $('#profile-message'); if (!box) return; box.textContent = text || ''; box.className = `profile-message${type ? ` ${type}` : ''}`; }
  function fillUser(user) { if (!user) return; $('#profile-first-name') && ($('#profile-first-name').value = user.firstName || ''); $('#profile-last-name') && ($('#profile-last-name').value = user.lastName || ''); $('#profile-email') && ($('#profile-email').value = user.email || ''); $('#profile-phone') && ($('#profile-phone').value = user.phone || ''); $('#profile-major') && ($('#profile-major').value = user.major || ''); $('#profile-gender') && ($('#profile-gender').value = user.gender || ''); const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'طالب'; if ($('#profile-full-name')) $('#profile-full-name').textContent = fullName; if ($('#profile-role')) $('#profile-role').textContent = user.role === 'admin' ? 'مسؤول / Admin' : 'طالب / Student'; if ($('#profile-joined')) $('#profile-joined').textContent = `تاريخ الانضمام: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-SA') : '—'}`; if ($('#profile-avatar')) $('#profile-avatar').textContent = fullName.slice(0, 1); }
  function renderStats(stats = {}) { if ($('#stat-enrolled')) $('#stat-enrolled').textContent = stats.enrolledCourses || 0; if ($('#stat-completed')) $('#stat-completed').textContent = stats.completedCourses || 0; if ($('#stat-certificates')) $('#stat-certificates').textContent = stats.certificatesEarned || 0; }
  function certificateImageUrl(certificate) { return certificate.imageUrl || `${(window.CYBERCLUB_API_BASE || '').replace(/\/$/, '')}/api/learning/certificates/${encodeURIComponent(certificate.certificateCode)}/image`; }
  function certificatePreview(certificate) { const verifyUrl = certificate.verificationUrl || `${window.location.origin}/certificate-verify.html?code=${encodeURIComponent(certificate.certificateCode)}`; const imageUrl = certificateImageUrl(certificate); const modal = document.createElement('div'); modal.className = 'certificate-modal'; modal.innerHTML = `<div class="certificate-sheet certificate-sheet-image"><img class="certificate-render" src="${imageUrl}" alt="شهادة ${escapeHtml(certificate.courseName)}"><p class="certificate-disclaimer">يمكن التحقق من صحة الشهادة عبر مسح رمز QR الظاهر عليها أو <a href="${verifyUrl}" target="_blank" rel="noopener">فتح رابط التحقق</a>.</p><div class="certificate-actions-print"><a class="btn primary" href="${imageUrl}" download="${escapeHtml(certificate.certificateCode)}.svg">تحميل الشهادة (SVG)</a><button class="btn ghost print-certificate" type="button">طباعة / حفظ PDF</button><button class="btn ghost close-certificate" type="button">إغلاق</button></div></div>`; document.body.appendChild(modal); modal.querySelector('.print-certificate').onclick = () => window.print(); modal.querySelector('.close-certificate').onclick = () => modal.remove(); modal.addEventListener('click', (event) => { if (event.target === modal) modal.remove(); }); }
  function openCertificateOptions(certificate) {
    document.querySelector('.certificate-options-modal')?.remove();
    const modal = document.createElement('div');
    modal.className = 'certificate-modal certificate-options-modal';
    modal.innerHTML = `<div class="certificate-options-sheet">
      <h3>تخصيص الشهادة</h3>
      <p>اختر لغة الشهادة قبل إعادة إصدارها.</p>
      <label class="certificate-option-field">لغة الشهادة
        <select class="certificate-option-language">
          <option value="ar" ${certificate.language !== 'en' ? 'selected' : ''}>العربية</option>
          <option value="en" ${certificate.language === 'en' ? 'selected' : ''}>English</option>
        </select>
      </label>
      <div class="certificate-actions-print">
        <button class="btn primary apply-certificate-options" type="button">إصدار الشهادة</button>
        <button class="btn ghost close-certificate" type="button">إلغاء</button>
      </div>
    </div>`;
    document.body.appendChild(modal);
    modal.querySelector('.close-certificate').onclick = () => modal.remove();
    modal.addEventListener('click', (event) => { if (event.target === modal) modal.remove(); });
    modal.querySelector('.apply-certificate-options').onclick = async () => {
      const language = modal.querySelector('.certificate-option-language').value;
      const applyButton = modal.querySelector('.apply-certificate-options');
      applyButton.disabled = true; applyButton.textContent = 'جارٍ الإصدار...';
      try {
        const data = await request(`${(window.CYBERCLUB_API_BASE || '').replace(/\/$/, '')}/api/learning/certificates/${encodeURIComponent(certificate.courseSlug)}`, { method: 'POST', body: JSON.stringify({ courseName: certificate.courseName, language, theme: 'light' }) });
        Object.assign(certificate, data.certificate);
        modal.remove();
        certificatePreview(certificate);
        loadProfile();
      } catch (error) {
        setMessage(error.message, 'error');
        applyButton.disabled = false; applyButton.textContent = 'إصدار الشهادة';
      }
    };
  }
  function renderCertificates(certificates = []) { const list = $('#profile-certificates-list'); const summary = $('#profile-certificates-summary'); if (!list) return; if (summary) summary.textContent = certificates.length ? `${certificates.length} شهادة محفوظة في حسابك` : 'لم تحصل على شهادات بعد'; if (!certificates.length) { list.innerHTML = '<div class="profile-empty">لم تحصل على شهادات بعد، أكمل دوراتك الأولى لإصدار شهادتك!</div>'; return; } list.innerHTML = certificates.map((certificate) => `<article class="profile-certificate-item"><img class="profile-certificate-thumb" src="${certificateImageUrl(certificate)}" alt="معاينة شهادة ${escapeHtml(certificate.courseName)}" loading="lazy"><div class="profile-certificate-info"><h4>${escapeHtml(certificate.courseName)}</h4><p>المعرف الفريد: <strong>${escapeHtml(certificate.certificateCode)}</strong></p><small>تاريخ الإصدار: ${new Date(certificate.issuedAt).toLocaleDateString('ar-SA')} · اللغة: ${certificate.language === 'en' ? 'English' : 'العربية'}</small></div><div class="profile-certificate-actions"><button class="btn small" type="button" data-preview-certificate="${escapeHtml(certificate.certificateCode)}">معاينة / تحميل</button><button class="btn small ghost" type="button" data-customize-certificate="${escapeHtml(certificate.certificateCode)}">تخصيص</button><a class="btn small ghost" href="${window.location.origin}/certificate-verify.html?code=${encodeURIComponent(certificate.certificateCode)}" target="_blank" rel="noopener">تحقق</a></div></article>`).join(''); list.querySelectorAll('[data-preview-certificate]').forEach((button) => button.addEventListener('click', () => certificatePreview(certificates.find((item) => item.certificateCode === button.dataset.previewCertificate)))); list.querySelectorAll('[data-customize-certificate]').forEach((button) => button.addEventListener('click', () => { const certificate = certificates.find((item) => item.certificateCode === button.dataset.customizeCertificate); if (certificate) openCertificateOptions(certificate); })); }
  
async function loadProfile(isRetry) {
    try {
      const data = await request(USER_PROFILE_URL);
      fillUser(data.user); renderStats(data.stats); renderCertificates(data.certificates);
      document.body.classList.remove('auth-locked'); setMessage('');
    } catch (error) {
      // The access-token cookie is short-lived by design (15 minutes). A 401 here
      // does not necessarily mean the visitor is logged out — the refresh-token
      // cookie may still be valid. Rotate it once before treating this as a real
      // login requirement, otherwise every ordinary token expiry bounces the
      // student to the login page even though their session is still good.
      if (!isRetry) {
        try {
          await request(`${AUTH_URL}/refresh`, { method: 'POST', body: '{}' });
          return loadProfile(true);
        } catch (_) { /* refresh token also invalid/expired — fall through to real redirect */ }
      }
      if (document.body.classList.contains('profile-page')) window.location.replace('/index.html?auth=required&return=profile.html');
      else setMessage(error.message, 'error');
    }
  }
  async function updateProfile(event) { event.preventDefault(); const form = event.currentTarget; if (!form.reportValidity()) return; try { const data = await request(`${AUTH_URL}/profile`, { method: 'PATCH', body: JSON.stringify(Object.fromEntries(new FormData(form).entries())) }); fillUser(data.user); setMessage('تم تحديث بيانات ملفك بنجاح.', 'success'); } catch (error) { setMessage(error.message, 'error'); } }
  async function changePassword(event) { event.preventDefault(); const form = event.currentTarget; if (!form.reportValidity()) return; const button = form.querySelector('button[type="submit"]'); try { button.disabled = true; await request(`${AUTH_URL}/change-password`, { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form).entries())) }); form.reset(); setMessage('تم تغيير كلمة المرور بنجاح.', 'success'); } catch (error) { setMessage(error.message, 'error'); } finally { button.disabled = false; } }
  async function logout() { try { await request(`${AUTH_URL}/logout`, { method: 'POST' }); window.location.replace('/index.html'); } catch (error) { setMessage(error.message, 'error'); } }
  document.addEventListener('auth:ready', (event) => { fillUser(event.detail?.user); loadProfile(); });
  document.addEventListener('DOMContentLoaded', () => {
    $('#profile-form')?.addEventListener('submit', updateProfile);
    $('#password-form')?.addEventListener('submit', changePassword);
    $('#profile-logout')?.addEventListener('click', logout);
    $('#profile-avatar-input')?.addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (!file || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => { const avatar = $('#profile-avatar'); if (avatar) { avatar.textContent = ''; avatar.style.backgroundImage = `url(${reader.result})`; avatar.style.backgroundSize = 'cover'; avatar.style.backgroundPosition = 'center'; } };
      reader.readAsDataURL(file);
    });
    if (document.body.classList.contains('profile-page')) loadProfile();
  });
})();
