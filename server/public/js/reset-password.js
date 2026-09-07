(function () {
  'use strict';
  const form = document.getElementById('reset-form');
  const message = document.getElementById('reset-message');
  const API_BASE = (window.CYBERCLUB_API_BASE || '').replace(/\/$/, '');
  const token = new URLSearchParams(window.location.search).get('token');

  function showMessage(text, type) {
    message.textContent = text;
    message.className = `auth-message ${type || ''}`;
  }

  function setBusy(busy) {
    const button = form.querySelector('button[type="submit"]');
    button.disabled = busy;
    button.textContent = busy ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور الجديدة';
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (!token) return showMessage('رابط إعادة التعيين غير صالح أو لا يحتوي على رمز.', 'error');
    const newPassword = document.getElementById('new-password').value;
    const confirmation = document.getElementById('confirm-password').value;
    if (newPassword !== confirmation) return showMessage('تأكيد كلمة المرور غير مطابق.', 'error');
    setBusy(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error((data.error || 'تعذر إعادة تعيين كلمة المرور.') + (Array.isArray(data.details) ? ` ${data.details.join(' ')}` : ''));
      form.reset();
      showMessage('تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.', 'success');
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setBusy(false);
    }
  });
})();
