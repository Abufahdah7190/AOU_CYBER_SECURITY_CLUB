(function () {
  'use strict';
  const form = document.getElementById('reset-form');
  const message = document.getElementById('reset-message');
  const API_BASE = (window.CYBERCLUB_API_BASE || '').replace(/\/$/, '');
  const token = new URLSearchParams(window.location.search).get('token');
  const en = () => window.i18n?.lang === 'en';
  const text = (key) => ({ saving: en() ? 'Saving…' : 'جارٍ الحفظ...', save: en() ? 'Save new password' : 'حفظ كلمة المرور الجديدة', invalid: en() ? 'The reset link is invalid or missing its token.' : 'رابط إعادة التعيين غير صالح أو لا يحتوي على رمز.', mismatch: en() ? 'Password confirmation does not match.' : 'تأكيد كلمة المرور غير مطابق.', failed: en() ? 'Password reset could not be completed.' : 'تعذر إعادة تعيين كلمة المرور.', success: en() ? 'Your password was changed. You can now sign in.' : 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.' }[key]);

  function showMessage(text, type) {
    message.textContent = text;
    message.className = `auth-message ${type || ''}`;
  }

  function setBusy(busy) {
    const button = form.querySelector('button[type="submit"]');
    button.disabled = busy;
    button.textContent = busy ? text('saving') : text('save');
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (!token) return showMessage(text('invalid'), 'error');
    const newPassword = document.getElementById('new-password').value;
    const confirmation = document.getElementById('confirm-password').value;
    if (newPassword !== confirmation) return showMessage(text('mismatch'), 'error');
    setBusy(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(text('failed'));
      form.reset();
      showMessage(text('success'), 'success');
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setBusy(false);
    }
  });
  document.addEventListener('languagechange', () => { if (!form.querySelector('button[type="submit"]').disabled) setBusy(false); });
})();
