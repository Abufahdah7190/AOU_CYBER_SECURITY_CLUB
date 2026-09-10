(function () {
  'use strict';
  const status = document.getElementById('verify-status');
  const resend = document.getElementById('resend');
  const form = document.getElementById('otp-form');
  const confirmButton = document.getElementById('confirm-login');
  const digits = Array.from(document.querySelectorAll('.otp-digit'));
  const sb = window.supabaseClient;

  let email = '';
  try { email = sessionStorage.getItem('cyberclub.pendingEmail') || ''; } catch (_) {}
  document.getElementById('pending-email').textContent = email;

  if (!email) {
    status.textContent = 'لا يوجد طلب تحقق نشط. ارجع لصفحة تسجيل الدخول وأدخل بريدك الجامعي أولًا.';
    if (form) form.hidden = true;
    if (resend) resend.hidden = true;
    return;
  }

  if (!sb) {
    status.textContent = 'تعذر تحميل خدمة التحقق. تحقق من اتصالك وإعدادات Supabase ثم أعد تحميل الصفحة.';
    if (form) form.hidden = true;
    if (resend) resend.disabled = true;
    return;
  }

  let redirecting = false;
  let verifying = false;
  let cooldownUntil = Date.now() + 60000;

  function getCode() {
    return digits.map((input) => input.value.trim()).join('');
  }

  function focusFirstEmpty() {
    const target = digits.find((input) => !input.value) || digits[digits.length - 1];
    target.focus();
  }

  // التنقل التلقائي بين خانات الأرقام والتعامل مع النسخ واللصق
  digits.forEach((input, index) => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/[^0-9]/g, '').slice(0, 1);
      if (input.value && index < digits.length - 1) digits[index + 1].focus();
      if (getCode().length === digits.length && form) form.requestSubmit(confirmButton);
    });

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Backspace' && !input.value && index > 0) digits[index - 1].focus();
    });

    input.addEventListener('paste', (event) => {
      const pasted = (event.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '');
      if (!pasted) return;
      event.preventDefault();
      pasted.slice(0, digits.length).split('').forEach((char, i) => { if (digits[i]) digits[i].value = char; });
      focusFirstEmpty();
      if (getCode().length === digits.length && form) form.requestSubmit(confirmButton);
    });
  });

  function cooldown() {
    const seconds = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
    resend.disabled = seconds > 0;
    resend.textContent = seconds ? `إعادة الإرسال بعد ${seconds} ثانية` : 'إعادة إرسال الرمز';
  }

  resend.addEventListener('click', async () => {
    if (resend.disabled) return;
    resend.disabled = true;
    status.textContent = 'جارٍ إرسال رمز جديد…';
    try {
      const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
      if (error) throw error;
      digits.forEach((input) => { input.value = ''; });
      digits[0].focus();
      status.textContent = 'تم إرسال رمز جديد إلى بريدك. الرمز السابق لم يعد صالحًا.';
      cooldownUntil = Date.now() + 60000;
    } catch (error) {
      status.textContent = 'تعذر إعادة الإرسال: ' + (error.message || 'حاول لاحقًا.');
      if (error.status === 429) cooldownUntil = Date.now() + 60000;
    } finally {
      cooldown();
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const code = getCode();
    if (verifying || redirecting) return;

    if (code.length !== digits.length) {
      status.textContent = `أدخل الرمز المكوّن من ${digits.length} أرقام كاملًا.`;
      focusFirstEmpty();
      return;
    }

    verifying = true;
    confirmButton.disabled = true;
    digits.forEach((input) => { input.disabled = true; });
    status.textContent = 'جارٍ التحقق من الرمز…';

    try {
      const { data, error } = await sb.auth.verifyOtp({ email, token: code, type: 'email' });
      if (error) throw error;
      if (!data?.session?.user) throw new Error('لم تُنشأ جلسة دخول. اطلب رمزًا جديدًا.');

      redirecting = true;
      try { sessionStorage.removeItem('cyberclub.pendingEmail'); } catch (_) {}
      status.textContent = 'تم التحقق بنجاح. جارٍ الانتقال إلى النادي…';
      window.location.replace(new URL('index.html', window.location.href).href);
    } catch (error) {
      status.textContent = error.code === 'otp_expired'
        ? 'انتهت صلاحية الرمز أو أنه غير صحيح. اطلب رمزًا جديدًا وحاول مرة أخرى.'
        : 'تعذر التحقق: ' + (error.message || 'تحقق من الرمز وحاول مجددًا.');
      
      confirmButton.disabled = false;
      digits.forEach((input) => { input.disabled = false; input.value = ''; });
      digits[0].focus();
      verifying = false;
    }
  });

  if (digits.length > 0) digits[0].focus();
  cooldown();
  setInterval(cooldown, 1000);
})();
