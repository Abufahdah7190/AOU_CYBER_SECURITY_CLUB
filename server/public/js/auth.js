/* AOU Cyber Club authentication client - Supabase Email & Password */
(function () {
  'use strict';

  const getSupabase = () => window.supabaseClient || (window.supabase && typeof window.supabase.auth === 'object' ? window.supabase : null) || window._supabase || null;
  const $ = (selector) => document.querySelector(selector);
  const UNIVERSITY_EMAIL_PATTERN = /^[^\s@]+@(aou\.edu\.sa|aou\.edu)$/i;
  const tr = (key, fallback) => window.i18n?.t(key, fallback) || fallback;
  const universityEmailMessage = () => tr('auth.universityEmailTitle', 'الموقع متاح فقط لطلاب الجامعة العربية المفتوحة بالبريد الجامعي الرسمي');

  function setMessage(text, type) {
    const box = $('#auth-message');
    if (!box) return;
    box.textContent = text || '';
    box.className = `auth-message${type ? ` ${type}` : ''}`;
  }

  function validateUniversityEmailField(input) {
    const value = String(input?.value || '').trim();
    const valid = !value || UNIVERSITY_EMAIL_PATTERN.test(value);
    input?.setCustomValidity(valid ? '' : universityEmailMessage());
    return valid;
  }

  function validateUniversityEmailForm(form) {
    const input = form?.querySelector('input[name="email"]');
    if (!input || validateUniversityEmailField(input)) return true;
    input.closest('.auth-field')?.classList.add('field-invalid');
    setMessage(universityEmailMessage(), 'error');
    input.focus();
    return false;
  }

  function validatePasswordPolicy(form) {
    if (form?.id !== 'register-form') return true;
    const input = form.querySelector('input[name="password"]');
    if (!input) return true;
    const valid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/.test(input.value);
    input.setCustomValidity(valid ? '' : tr('auth.passwordHelp', 'يجب أن تتكون كلمة المرور من 10 أحرف على الأقل، وتتضمن حرفًا كبيرًا وحرفًا صغيرًا ورقمًا.'));
    return valid;
  }

  function setBusy(form, busy) {
    const button = form?.querySelector('button[type="submit"]');
    if (!button) return;
    button.disabled = busy;
    button.dataset.originalText ||= button.textContent;
    button.textContent = busy ? tr('auth.working', 'جارٍ التنفيذ...') : button.dataset.originalText;
  }

  function unlockSite() {
    document.body.classList.remove('auth-locked');
    document.querySelectorAll('.panel').forEach((panel) => { panel.style.display = panel.id === 'tab-home' ? 'block' : 'none'; });
    document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === 'home'));
    const authPanel = $('#tab-auth'); if (authPanel) authPanel.style.display = 'none';
    const authTab = document.querySelector('[data-tab="auth"]'); if (authTab) authTab.hidden = true;
    const profileTab = document.querySelector('[data-tab="profile"]'); if (profileTab) profileTab.hidden = false;
    const profileLink = document.querySelector('[data-profile-link]'); if (profileLink) profileLink.hidden = false;
    const accountMenu = document.querySelector('[data-account-menu]'); if (accountMenu) accountMenu.hidden = false;
  }

  function lockSite() {
    document.body.classList.add('auth-locked');
    document.querySelectorAll('.panel').forEach((panel) => { panel.style.display = panel.id === 'tab-auth' ? 'block' : 'none'; });
    document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === 'auth'));
    const authTab = document.querySelector('[data-tab="auth"]'); if (authTab) authTab.hidden = false;
  }

  function showUser(user) {
    unlockSite();
    const authPanel = $('#tab-auth'); if (authPanel) { authPanel.style.display = 'none'; authPanel.hidden = true; }
    const authTab = document.querySelector('[data-tab="auth"]'); if (authTab) authTab.hidden = true;
    const email = user?.email || '';
    const headerName = $('#header-profile-name'); if (headerName) headerName.textContent = email;
    const headerAvatar = $('#header-profile-avatar'); if (headerAvatar) headerAvatar.textContent = email.trim().charAt(0).toUpperCase();
    if ($('#auth-user-name')) $('#auth-user-name').textContent = email;
    if ($('#auth-user')) $('#auth-user').hidden = false;
    if ($('#login-form')) $('#login-form').hidden = true;
    if ($('#register-form')) $('#register-form').hidden = true;
    if ($('#forgot-form')) $('#forgot-form').hidden = true;
    const switcher = document.querySelector('.auth-switcher'); if (switcher) switcher.hidden = true;
    document.dispatchEvent(new CustomEvent('auth:ready', { detail: { user } }));
  }

  function showForms() {
    lockSite();
    const authPanel = $('#tab-auth'); if (authPanel) { authPanel.hidden = false; authPanel.removeAttribute('aria-hidden'); }
    const authTab = document.querySelector('[data-tab="auth"]'); if (authTab) authTab.hidden = false;
    const profileTab = document.querySelector('[data-tab="profile"]'); if (profileTab) profileTab.hidden = true;
    const profileLink = document.querySelector('[data-profile-link]'); if (profileLink) profileLink.hidden = true;
    const accountMenu = document.querySelector('[data-account-menu]'); if (accountMenu) accountMenu.hidden = true;
    if ($('#auth-user')) $('#auth-user').hidden = true;
    const switcher = document.querySelector('.auth-switcher'); if (switcher) switcher.hidden = false;
    switchView('login');
  }

  function switchView(view) {
    const login = view === 'login';
    const card = document.querySelector('[data-auth-card]');
    card?.classList.toggle('register-mode', !login);
    card?.classList.remove('forgot-mode');
    if ($('#login-form')) $('#login-form').hidden = !login;
    if ($('#register-form')) $('#register-form').hidden = login;
    if ($('#forgot-form')) $('#forgot-form').hidden = true;
    document.querySelectorAll('[data-auth-view]').forEach((button) => {
      const active = button.dataset.authView === view;
      button.classList.toggle('active', active); button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1;
    });
    const title = $('[data-auth-welcome-title]'); if (title) title.textContent = login ? tr('auth.welcomeBack', 'مرحبًا بعودتك') : tr('auth.welcomeNew', 'ابدأ رحلتك معنا');
    const copy = $('[data-auth-welcome-copy]'); if (copy) copy.textContent = login ? tr('auth.welcomeBackCopy', 'سجّل دخولك وواصل بناء مسارك في الأمن السيبراني.') : tr('auth.welcomeNewCopy', 'أنشئ حسابك الجامعي وانضم إلى مجتمع النادي السيبراني.');
    setMessage('');
  }

  function showForgotForm(event) {
    event?.preventDefault();
    const card = document.querySelector('[data-auth-card]');
    card?.classList.add('forgot-mode');
    if ($('#login-form')) $('#login-form').hidden = true;
    if ($('#register-form')) $('#register-form').hidden = true;
    if ($('#forgot-form')) $('#forgot-form').hidden = false;
    document.querySelectorAll('[data-auth-view]').forEach((button) => { button.classList.remove('active'); button.setAttribute('aria-selected', 'false'); });
    const email = $('#login-email')?.value;
    if (email && $('#forgot-email')) $('#forgot-email').value = email;
    setMessage('');
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (form.dataset.submitting === 'true') return;
    if (form.id === 'forgot-form') {
      const input = form.querySelector('input[name="email"]');
      const email = String(input?.value || '').trim().toLowerCase();
      if (!email) {
        setMessage(tr('auth.emailRequired', 'يرجى إدخال بريدك الإلكتروني.'), 'error');
        input?.focus();
        return;
      }
      input.value = email;
    }
    validatePasswordPolicy(form);
    if (!validateUniversityEmailForm(form) || !form.reportValidity()) return;
    const sb = getSupabase();
    if (!sb) return setMessage('خطأ في إعدادات الاتصال بقاعدة البيانات (Supabase غير متوفر).', 'error');
    const values = Object.fromEntries(new FormData(form).entries());
    const email = String(values.email || '').trim().toLowerCase();
    if (form.id === 'register-form' && values.password !== values.confirmPassword) {
      setMessage(tr('auth.passwordMismatch', 'تأكيد كلمة المرور غير مطابق.'), 'error');
      return;
    }
    form.dataset.submitting = 'true';
    setBusy(form, true); setMessage('');
    try {
      let result;
      if (form.id === 'login-form') {
        result = await sb.auth.signInWithPassword({ email, password: values.password });
      } else if (form.id === 'register-form') {
        result = await sb.auth.signUp({
          email,
          password: values.password,
          options: { data: { firstName: values.firstName, lastName: values.lastName, phone: values.phone, major: values.major, gender: values.gender } }
        });
      } else {
        const { data, error } = await sb.auth.resetPasswordForEmail(email, {
          redirectTo: new URL('/reset-password.html', location.origin).href,
        });
        if (error) throw error;
        setMessage(tr('auth.recoverySent', 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.'), 'success');
        form.reset();
        return;
      }
      if (result.error) throw result.error;
      if (result.data?.session) window.location.replace('/profile.html');
      else setMessage(tr('auth.confirmEmail', 'Check your email to confirm your account / تحقق من بريدك لتأكيد الحساب'), 'success');
    } catch (error) {
      setMessage(error?.message || tr('auth.requestFailed', 'تعذر تنفيذ الطلب.'), 'error');
    } finally {
      delete form.dataset.submitting;
      setBusy(form, false);
    }
  }

  async function loadCurrentUser() {
    const sb = getSupabase();
    if (!sb) { showForms(); setMessage('تعذر تحميل خدمة المصادقة. تحقق من الاتصال وإعدادات Supabase ثم أعد تحميل الصفحة.', 'error'); return; }
    const { data: { session }, error } = await sb.auth.getSession();
    if (error) { showForms(); setMessage(error.message, 'error'); return; }
    if (session?.user && /\/login\.html$/.test(location.pathname)) { location.replace('/profile.html'); return; }
    if (session?.user) showUser(session.user); else showForms();
    sb.auth.onAuthStateChange((event, currentSession) => {
      // Leave Supabase's auth lock before listeners perform API requests.
      setTimeout(() => {
        if (event === 'PASSWORD_RECOVERY') return; // Central client owns recovery navigation.
        if (event === 'SIGNED_IN' && /\/login\.html$/.test(location.pathname)) { location.replace('/profile.html'); return; }
        if (event === 'SIGNED_OUT') showForms();
        else if (event === 'INITIAL_SESSION') currentSession?.user ? showUser(currentSession.user) : showForms();
      }, 0);
    });
  }

  async function handleLogout() {
    const sb = getSupabase(); const button = $('#logout-button'); if (button) button.disabled = true;
    try { if (sb) await sb.auth.signOut(); showForms(); setMessage(tr('auth.logoutSuccess', 'تم تسجيل الخروج بنجاح.'), 'success'); }
    catch (error) { setMessage(error.message, 'error'); }
    finally { if (button) button.disabled = false; }
  }

  function initAuth() {
    ['login-form', 'register-form', 'forgot-form'].forEach((id) => document.getElementById(id)?.addEventListener('submit', handleAuthSubmit));
    $('#logout-button')?.addEventListener('click', handleLogout);
    $('#header-logout-button')?.addEventListener('click', handleLogout);
    document.querySelectorAll('[data-auth-view]').forEach((button) => button.addEventListener('click', () => switchView(button.dataset.authView)));
    $('[data-auth-forgot]')?.addEventListener('click', showForgotForm);
    $('[data-auth-forgot-back]')?.addEventListener('click', (event) => { event.preventDefault(); switchView('login'); });
    document.querySelectorAll('input[name="email"]').forEach((input) => input.addEventListener('input', () => validateUniversityEmailField(input)));
    lockSite();
    loadCurrentUser().catch(() => { showForms(); setMessage('تعذر الاتصال بخدمة المصادقة. أعد المحاولة.', 'error'); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAuth); else initAuth();
})();
