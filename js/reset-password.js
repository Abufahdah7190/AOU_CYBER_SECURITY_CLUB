(function () {
  'use strict';
  const form = document.getElementById('reset-form');
  const message = document.getElementById('reset-message');
  const pwInput = document.getElementById('new-password');
  const confirmInput = document.getElementById('confirm-password');
  const meterBar = document.getElementById('reset-pw-meter');
  const hintEl = document.getElementById('reset-pw-hint');
  const scoreLabelEl = document.getElementById('reset-pw-score-label');
  const checksEl = document.getElementById('reset-pw-checks');
  const matchHintEl = document.getElementById('reset-pw-match-hint');
  const submitBtn = document.getElementById('reset-submit');
  const getSupabase = () => window.supabaseClient || (window.supabase && typeof window.supabase.auth === 'object' ? window.supabase : null) || window._supabase || null;
  const en = () => window.i18n?.lang === 'en';
  const POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/;
  const text = (key) => ({
    saving: en() ? 'Saving…' : 'جارٍ الحفظ...', save: en() ? 'Save new password' : 'حفظ كلمة المرور الجديدة',
    invalid: en() ? 'The reset link is invalid or expired.' : 'رابط إعادة التعيين غير صالح أو منتهي الصلاحية.',
    mismatch: en() ? 'Password confirmation does not match.' : 'تأكيد كلمة المرور غير مطابق.',
    unavailable: en() ? 'Supabase authentication is unavailable.' : 'خدمة المصادقة غير متاحة حاليًا.',
    failed: en() ? 'Password reset could not be completed.' : 'تعذر إعادة تعيين كلمة المرور.',
    success: en() ? 'Your password was changed. You can now sign in.' : 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.',
    hint: en() ? 'At least 10 characters, including an uppercase letter, a lowercase letter and a digit.' : '10 أحرف على الأقل، وتتضمن حرفًا كبيرًا وحرفًا صغيرًا ورقمًا.',
    checkLength: en() ? '10+ characters' : '10 أحرف فأكثر',
    checkCase: en() ? 'Upper & lower case' : 'حرف كبير وصغير',
    checkDigit: en() ? 'A digit' : 'رقم واحد على الأقل',
    matchOk: en() ? 'Passwords match.' : 'كلمتا المرور متطابقتان.',
    labels: en() ? ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'] : ['ضعيفة جدًا', 'ضعيفة', 'متوسطة', 'قوية', 'قوية جدًا']
  }[key]);
  let isBusy = false;
  function showMessage(value, type) { message.textContent = value; message.className = `auth-message ${type || ''}`; }
  function setBusy(busy) { isBusy = busy; submitBtn.disabled = busy || !isPasswordAcceptable(); submitBtn.textContent = busy ? text('saving') : text('save'); }

  const CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;vertical-align:-2px;"><path d="M20 6L9 17l-5-5"></path></svg>';
  const CROSS_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;vertical-align:-2px;"><path d="M18 6L6 18M6 6l12 12"></path></svg>';

  function isPasswordAcceptable() {
    return POLICY.test(pwInput.value) && confirmInput.value.length > 0 && confirmInput.value === pwInput.value;
  }

  function renderCheck(passed, label) {
    const color = passed ? 'var(--good)' : 'var(--muted)';
    return `<span style="display:inline-flex;align-items:center;gap:4px;color:${color}">${passed ? CHECK_ICON : CROSS_ICON}${label}</span>`;
  }

  function updateStrengthUI() {
    const password = pwInput.value;
    const hasLength = password.length >= 10;
    const hasCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const result = window.analyzePassword ? window.analyzePassword(password) : null;

    if (meterBar) {
      const score100 = password.length === 0 ? 0 : (result ? result.score100 : (hasLength && hasCase && hasDigit ? 60 : 25));
      const score0to4 = result ? result.score0to4 : (POLICY.test(password) ? 2 : 0);
      meterBar.style.width = `${score100}%`;
      meterBar.style.background = score0to4 < 2 ? 'var(--bad)' : score0to4 < 3 ? 'var(--warn)' : 'linear-gradient(90deg, #ff4d4d, #f9d423, #2ecc71)';
      if (scoreLabelEl) scoreLabelEl.textContent = password.length === 0 ? '—' : text('labels')[score0to4] || text('labels')[0];
    }
    if (hintEl) hintEl.textContent = text('hint');
    if (checksEl) {
      checksEl.innerHTML = [
        renderCheck(hasLength, text('checkLength')),
        renderCheck(hasCase, text('checkCase')),
        renderCheck(hasDigit, text('checkDigit'))
      ].join('');
    }
    if (matchHintEl) {
      if (confirmInput.value.length === 0) matchHintEl.textContent = '';
      else if (confirmInput.value === password) { matchHintEl.textContent = text('matchOk'); matchHintEl.style.color = 'var(--good)'; }
      else { matchHintEl.textContent = text('mismatch'); matchHintEl.style.color = 'var(--bad)'; }
    }
    submitBtn.disabled = isBusy || !isPasswordAcceptable();
  }

  pwInput.addEventListener('input', updateStrengthUI);
  confirmInput.addEventListener('input', updateStrengthUI);
  updateStrengthUI();

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
    const newPassword = pwInput.value;
    const confirmation = confirmInput.value;
    if (!POLICY.test(newPassword)) return showMessage(text('hint'), 'error');
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
