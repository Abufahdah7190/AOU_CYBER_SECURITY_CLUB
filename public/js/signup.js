
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
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/.test(password)) {
      setStatus('استخدم 10 أحرف على الأقل مع حرف كبير وحرف صغير ورقم.', 'error');
      form.password.focus();
      return;
    }
    if (!window.supabaseClient) {
      setStatus('تعذر تهيئة خدمة التسجيل. تحقق من إعدادات Supabase.', 'error');
      return;
    }
    submit.disabled = true;
    setStatus('جارٍ إنشاء الحساب…');
    try {
      const { data, error } = await window.supabaseClient.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/index.html` },
      });
      if (error) throw error;
      if (data?.session) { window.location.replace('/index.html'); return; }
      setStatus('لم تبدأ جلسة الدخول. تواصل مع الإدارة عبر الاقتراحات والشكاوى لمراجعة إعداد التسجيل.', 'error');
    } catch (error) {
      setStatus(error?.message || 'تعذر إنشاء الحساب. حاول مرة أخرى.', 'error');
    } finally {
      submit.disabled = false;
    }
  });
})();
