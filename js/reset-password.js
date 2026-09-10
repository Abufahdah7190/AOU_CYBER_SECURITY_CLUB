(function () {
  'use strict';
  const form = document.getElementById('reset-form');
  const message = document.getElementById('reset-message');
  const getSupabase = () => window.supabaseClient || (window.supabase && typeof window.supabase.auth === 'object' ? window.supabase : null) || window._supabase || null;
  const en = () => window.i18n?.lang === 'en';
  const text = (key) => ({
    saving: en() ? 'Saving…' : 'جارٍ الحفظ...', save: en() ? 'Save new password' : 'حفظ كلمة المرور الجديدة',
    invalid: en() ? 'The reset link is invalid or expired.' : 'رابط إعادة التعيين غير صالح أو منتهي الصلاحية.',
    mismatch: en() ? 'Password confirmation does not match.' : 'تأكيد كلمة المرور غير مطابق.',
    unavailable: en() ? 'Supabase authentication is unavailable.' : 'خدمة المصادقة غير متاحة حاليًا.',
    failed: en() ? 'Password reset could not be completed.' : 'تعذر إعادة تعيين كلمة المرور.',
    success: en() ? 'Your password was changed. You can now sign in.' : 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.'
  }[key]);
  function showMessage(value, type) { message.textContent = value; message.className = `auth-message ${type || ''}`; }
  function setBusy(busy) { const button = form.querySelector('button[type="submit"]'); button.disabled = busy; button.textContent = busy ? text('saving') : text('save'); }

  const sb = getSupabase();
  let recoverySessionReady = false;
  const hasAuthCallback = /(?:^#|&)access_token=|(?:^#|&)type=recovery|(?:^\?|&)code=/.test(window.location.hash + window.location.search);

  function markSessionReady(session) {
    if (session) { recoverySessionReady = true; form.hidden = false; showMessage('', ''); }
  }

  if (!sb) {
    form.hidden = true;
    showMessage(text('unavailable'), 'error');
  } else {
    sb.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) markSessionReady(session);
    });
    sb.auth.getSession().then(({ data, error }) => {
      if (error) throw error;
      if (data.session) markSessionReady(data.session);
      else if (!hasAuthCallback) { form.hidden = true; showMessage(text('invalid'), 'error'); }
      else setTimeout(() => { if (!recoverySessionReady) { form.hidden = true; showMessage(text('invalid'), 'error'); } }, 1500);
    }).catch(() => { form.hidden = true; showMessage(text('invalid'), 'error'); });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const newPassword = document.getElementById('new-password').value;
    const confirmation = document.getElementById('confirm-password').value;
    if (newPassword !== confirmation) return showMessage(text('mismatch'), 'error');
    if (!sb || !recoverySessionReady) return showMessage(text('invalid'), 'error');
    setBusy(true);
    try {
      const { error } = await sb.auth.updateUser({ password: newPassword });
      if (error) throw error;
      form.reset(); showMessage(text('success'), 'success');
      setTimeout(() => window.location.replace(new URL('index.html', window.location.href).href), 1200);
    } catch (error) { showMessage(error.message || text('failed'), 'error'); }
    finally { setBusy(false); }
  });
})();
