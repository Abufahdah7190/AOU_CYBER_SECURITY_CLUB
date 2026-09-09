
(function () {
  'use strict';
  const UNIVERSITY_EMAIL = /^[^\s@]+@aou\.edu\.sa$/i;
  const form = document.getElementById('signup-form');
  const status = document.getElementById('signup-status');
  const submit = form?.querySelector('button[type=submit]');
  const setStatus = (message, type) => { status.textContent = message; status.dataset.type = type || ''; };
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = String(new FormData(form).get('email') || '').trim().toLowerCase();
    const password = String(new FormData(form).get('password') || '');
    if (!UNIVERSITY_EMAIL.test(email)) {
      setStatus('يرجى استخدام بريد الجامعة المنتهي حصراً بالنطاق @aou.edu.sa.', 'error');
      form.email.focus();
      return;
    }
    if (password.length < 10) {
      setStatus('يجب أن تتكون كلمة المرور من 10 أحرف على الأقل.', 'error');
      form.password.focus();
      return;
    }
    if (!window.supabaseClient) {
      setStatus('تعذر تهيئة خدمة التسجيل. تحقق من إعدادات Supabase.', 'error');
      return;
    }
    submit.disabled = true;
    setStatus('جارٍ إنشاء الحساب وإرسال رابط التحقق…');
    try {
      const { error } = await window.supabaseClient.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/index.html` },
      });
      if (error) throw error;
      form.reset();
      setStatus('تم إنشاء الحساب. تحقق من بريدك الجامعي لتفعيل الحساب.', 'success');
    } catch (error) {
      setStatus(error?.message || 'تعذر إنشاء الحساب. حاول مرة أخرى.', 'error');
    } finally {
      submit.disabled = false;
    }
  });
})();
