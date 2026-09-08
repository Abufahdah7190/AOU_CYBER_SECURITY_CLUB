(() => {
  'use strict';
  const AUTH_URL = `${(window.CYBERCLUB_API_BASE || '').replace(/\/$/, '')}/api/auth`;
  const USER_PROFILE_URL = `${(window.CYBERCLUB_API_BASE || '').replace(/\/$/, '')}/api/user/profile`;
  const $ = (selector) => document.querySelector(selector);
  const lang = () => window.i18n?.lang === 'en' ? 'en' : 'ar';
  const messageFor = (key) => ({
    generic: lang() === 'en' ? 'The request could not be completed.' : 'تعذر إكمال الطلب.',
    updated: lang() === 'en' ? 'Your profile was updated.' : 'تم تحديث بيانات ملفك بنجاح.',
    password: lang() === 'en' ? 'Your password was changed.' : 'تم تغيير كلمة المرور بنجاح.',
  }[key]);
  let profileState = { user: null, stats: null, certificates: null };
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const request = async (url, options = {}) => { const response = await fetch(url, { ...options, credentials: 'include', cache: 'no-store', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || 'تعذر تنفيذ العملية.'); return data; };
  function setMessage(text, type = '') { const box = $('#profile-message'); if (!box) return; box.textContent = text || ''; box.className = `profile-message${type ? ` ${type}` : ''}`; }
  function renderAvatar(user, fullName) {
    const avatar = $('#profile-avatar');
    if (!avatar) return;
    const source = String(user?.avatarData || '');
    avatar.style.backgroundImage = source ? `url("${source.replace(/"/g, '%22')}")` : '';
    avatar.textContent = source ? '' : fullName.slice(0, 1).toUpperCase();
    avatar.setAttribute('aria-label', source
      ? (lang() === 'en' ? `Profile photo for ${fullName}` : `الصورة الشخصية لـ ${fullName}`)
      : (lang() === 'en' ? `Initials for ${fullName}` : `الحرف الأول من اسم ${fullName}`));
  }
  function fillUser(user) { if (!user) return; const english = lang() === 'en'; $('#profile-first-name') && ($('#profile-first-name').value = user.firstName || ''); $('#profile-last-name') && ($('#profile-last-name').value = user.lastName || ''); $('#profile-email') && ($('#profile-email').value = user.email || ''); $('#profile-phone') && ($('#profile-phone').value = user.phone || ''); $('#profile-major') && ($('#profile-major').value = user.major || ''); $('#profile-gender') && ($('#profile-gender').value = user.gender || ''); const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || (english ? 'Student' : 'طالب'); if ($('#profile-full-name')) $('#profile-full-name').textContent = fullName; if ($('#profile-role')) $('#profile-role').textContent = user.role === 'admin' ? (english ? 'Administrator' : 'مسؤول') : (english ? 'Student' : 'طالب'); if ($('#profile-joined')) $('#profile-joined').textContent = `${english ? 'Joined:' : 'تاريخ الانضمام:'} ${user.createdAt ? new Date(user.createdAt).toLocaleDateString(english ? 'en-GB' : 'ar-SA') : '—'}`; renderAvatar(user, fullName); }
  function renderStats(stats = {}) { if ($('#stat-enrolled')) $('#stat-enrolled').textContent = stats.enrolledCourses || 0; if ($('#stat-completed')) $('#stat-completed').textContent = stats.completedCourses || 0; if ($('#stat-certificates')) $('#stat-certificates').textContent = stats.certificatesEarned || 0; }
  function certificateImageUrl(certificate) {
    const apiBase = (window.CYBERCLUB_API_BASE || '').replace(/\/$/, '');
    const fallback = `${apiBase}/api/learning/certificates/${encodeURIComponent(certificate.certificateCode)}/image`;
    if (!certificate.imageUrl) return fallback;
    try {
      const supplied = new URL(certificate.imageUrl, window.location.origin);
      const isLocalAddress = ['localhost', '127.0.0.1', '::1'].includes(supplied.hostname);
      // Old certificates can contain the development URL that was configured
      // when they were issued. A deployed visitor must never try to contact
      // localhost on their own device; use the live site's API instead.
      if (isLocalAddress && !['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)) return fallback;
      return supplied.href;
    } catch (_) { return fallback; }
  }
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
        setMessage(messageFor('generic'), 'error');
        applyButton.disabled = false; applyButton.textContent = lang() === 'en' ? 'Issue certificate' : 'إصدار الشهادة';
      }
    };
  }
  function renderCertificates(certificates = []) { const list = $('#profile-certificates-list'); const summary = $('#profile-certificates-summary'); const english = lang() === 'en'; if (!list) return; if (summary) summary.textContent = certificates.length ? (english ? `${certificates.length} certificate${certificates.length === 1 ? '' : 's'} saved to your account` : `${certificates.length} شهادة محفوظة في حسابك`) : (english ? 'No certificates yet' : 'لم تحصل على شهادات بعد'); if (!certificates.length) { list.innerHTML = `<div class="profile-empty">${english ? 'Complete your first course to issue a certificate.' : 'لم تحصل على شهادات بعد، أكمل دوراتك الأولى لإصدار شهادتك!'}</div>`; return; } list.innerHTML = certificates.map((certificate) => `<article class="profile-certificate-item"><img class="profile-certificate-thumb" src="${certificateImageUrl(certificate)}" alt="${english ? 'Certificate preview' : 'معاينة شهادة'} ${escapeHtml(certificate.courseName)}" loading="lazy"><div class="profile-certificate-info"><h4>${escapeHtml(certificate.courseName)}</h4><p>${english ? 'Unique ID' : 'المعرف الفريد'}: <strong>${escapeHtml(certificate.certificateCode)}</strong></p><small>${english ? 'Issued' : 'تاريخ الإصدار'}: ${new Date(certificate.issuedAt).toLocaleDateString(english ? 'en-GB' : 'ar-SA')} · ${english ? 'Language' : 'اللغة'}: ${certificate.language === 'en' ? 'English' : 'العربية'}</small></div><div class="profile-certificate-actions"><button class="btn small" type="button" data-preview-certificate="${escapeHtml(certificate.certificateCode)}">${english ? 'Preview / download' : 'معاينة / تحميل'}</button><button class="btn small ghost" type="button" data-customize-certificate="${escapeHtml(certificate.certificateCode)}">${english ? 'Customize' : 'تخصيص'}</button><a class="btn small ghost" href="${window.location.origin}/certificate-verify.html?code=${encodeURIComponent(certificate.certificateCode)}" target="_blank" rel="noopener">${english ? 'Verify' : 'تحقق'}</a></div></article>`).join(''); list.querySelectorAll('[data-preview-certificate]').forEach((button) => button.addEventListener('click', () => certificatePreview(certificates.find((item) => item.certificateCode === button.dataset.previewCertificate)))); list.querySelectorAll('[data-customize-certificate]').forEach((button) => button.addEventListener('click', () => { const certificate = certificates.find((item) => item.certificateCode === button.dataset.customizeCertificate); if (certificate) openCertificateOptions(certificate); })); }
  
  async function loadProfile(isRetry) {
    try {
      const data = await request(USER_PROFILE_URL);
      profileState = { user: data.user, stats: data.stats, certificates: data.certificates };
      fillUser(data.user); renderStats(data.stats); renderCertificates(data.certificates);
      document.body.classList.remove('auth-locked'); setMessage('');
    } catch (error) {
      if (!isRetry) {
        try {
          await request(`${AUTH_URL}/refresh`, { method: 'POST', body: '{}' });
          return loadProfile(true);
        } catch (_) {
          if (document.body.classList.contains('profile-page')) {
            window.location.replace('/index.html');
            return;
          }
        }
      }
      setMessage(messageFor('generic'), 'error');
    }
  }

  function profilePayload() { return { ...Object.fromEntries(new FormData($('#profile-form')).entries()), avatarData: profileState.user?.avatarData || undefined }; }
  async function saveProfile(payload, successMessage = messageFor('updated')) { const data = await request(`${AUTH_URL}/profile`, { method: 'PATCH', body: JSON.stringify(payload) }); profileState.user = data.user; fillUser(data.user); setMessage(successMessage, 'success'); return data; }
  async function updateProfile(event) { event.preventDefault(); const form = event.currentTarget; if (!form.reportValidity()) return; try { await saveProfile(profilePayload()); } catch (error) { setMessage(error.message || messageFor('generic'), 'error'); } }
  async function changePassword(event) { event.preventDefault(); const form = event.currentTarget; if (!form.reportValidity()) return; const button = form.querySelector('button[type="submit"]'); try { button.disabled = true; await request(`${AUTH_URL}/change-password`, { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form).entries())) }); form.reset(); setMessage(messageFor('password'), 'success'); } catch (error) { setMessage(messageFor('generic'), 'error'); } finally { button.disabled = false; } }
  async function logout() { try { await request(`${AUTH_URL}/logout`, { method: 'POST' }); window.location.replace('/index.html'); } catch (error) { setMessage(error.message, 'error'); } }
  document.addEventListener('auth:ready', (event) => { fillUser(event.detail?.user); loadProfile(); });
  document.addEventListener('languagechange', () => { if (profileState.user) fillUser(profileState.user); if (profileState.certificates) renderCertificates(profileState.certificates); });
  document.addEventListener('DOMContentLoaded', () => {
    $('#profile-form')?.addEventListener('submit', updateProfile);
    $('#password-form')?.addEventListener('submit', changePassword);
    $('#profile-logout')?.addEventListener('click', logout);
    $('#profile-avatar-input')?.addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      const allowed = ['image/png', 'image/jpeg', 'image/webp'];
      const maxBytes = 250 * 1024;
      if (!file) return;
      if (!allowed.includes(file.type) || file.size > maxBytes) {
        event.target.value = '';
        setMessage(lang() === 'en' ? 'Choose a PNG, JPEG, or WebP image smaller than 250 KB.' : 'اختر صورة PNG أو JPEG أو WebP بحجم أقل من 250 كيلوبايت.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          if (!profileState.user) throw new Error('Profile is still loading.');
          profileState.user.avatarData = String(reader.result);
          renderAvatar(profileState.user, `${profileState.user.firstName || ''} ${profileState.user.lastName || ''}`.trim() || profileState.user.email);
          await saveProfile(profilePayload(), lang() === 'en' ? 'Profile photo saved.' : 'تم حفظ الصورة الشخصية.');
        } catch (error) { setMessage(error.message || messageFor('generic'), 'error'); }
      };
      reader.readAsDataURL(file);
    });
    if (document.body.classList.contains('profile-page')) loadProfile();
  });
})();
