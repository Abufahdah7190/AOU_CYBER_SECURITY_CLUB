(function () {
  'use strict';
  const status = document.getElementById('verify-status');
  const resend = document.getElementById('resend');
  const sb = window.supabaseClient;
  let email = '';
  try { email = sessionStorage.getItem('cyberclub.pendingEmail') || ''; } catch (_) {}
  document.getElementById('pending-email').textContent = email;
  resend.hidden = !email;
  let redirecting = false;
  let cooldownUntil = 0;
  function accept(session) {
    if (!session?.user?.email_confirmed_at || redirecting) return false;
    redirecting = true;
    try { sessionStorage.removeItem('cyberclub.pendingEmail'); } catch (_) {}
    status.textContent = 'تم التحقق بنجاح. جارٍ الانتقال إلى النادي…';
    window.location.replace(new URL('index.html', window.location.href).href);
    return true;
  }
  function cooldown() {
    const seconds = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
    resend.disabled = seconds > 0;
    resend.textContent = seconds ? `إعادة الإرسال بعد ${seconds} ثانية` : 'إعادة إرسال رابط التحقق';
  }
  if (!sb) {
    status.textContent = 'تعذر تحميل خدمة التحقق. تحقق من اتصالك وإعدادات Supabase ثم أعد تحميل الصفحة.';
    resend.disabled = true;
    return;
  }
  resend.addEventListener('click', async () => {
    if (resend.disabled) return;
    resend.disabled = true;
    try {
      const { error } = await sb.auth.signInWithOtp({ email, options: {
        shouldCreateUser: false,
        emailRedirectTo: new URL('verify-email.html', window.location.href).href
      } });
      if (error) throw error;
      status.textContent = 'تم إرسال رابط جديد. افتح أحدث رسالة للتحقق.';
      cooldownUntil = Date.now() + 60000;
    } catch (error) {
      status.textContent = 'تعذر إعادة الإرسال: ' + (error.message || 'حاول لاحقًا.');
      if (error.status === 429) cooldownUntil = Date.now() + 60000;
    } finally { cooldown(); }
  });
  // The SDK consumes the callback tokens and synchronizes sessions across tabs.
  sb.auth.onAuthStateChange((_event, session) => accept(session));
  async function init() {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    const callbackError = hash.get('error_description') || query.get('error_description') || hash.get('error') || query.get('error');
    const { data, error } = await sb.auth.getSession();
    if (callbackError || error) {
      history.replaceState(null, '', window.location.pathname);
      status.textContent = 'تعذر التحقق؛ ربما انتهت صلاحية الرابط أو استُخدم سابقًا. اطلب رابطًا جديدًا من هنا أو من صفحة الدخول.';
      return;
    }
    if (!accept(data.session)) status.textContent = email ? 'أُرسل طلب رابط التحقق. ننتظر ضغطك على الرابط في البريد.' : 'لا توجد جلسة متحققة. افتح رابط البريد أو ارجع لتسجيل الدخول وطلب رابط جديد.';
  }
  init().catch(() => { status.textContent = 'تعذر الاتصال بخدمة التحقق. أعد تحميل الصفحة أو اطلب رابطًا جديدًا.'; });
  if (email) { cooldownUntil = Date.now() + 60000; cooldown(); }
  setInterval(cooldown, 1000);
})();
