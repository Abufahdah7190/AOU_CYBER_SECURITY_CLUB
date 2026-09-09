/* CyberClub Authentication Client (Supabase Edition) */
(function () {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const UNIVERSITY_EMAIL_PATTERN = /^[^\s@]+@aou\.edu\.sa$/i;
  const tr = (key, fallback) => window.i18n?.t(key, fallback) || fallback;
  const universityEmailMessage = () => tr('auth.universityEmailTitle', 'الموقع متاح فقط لطلاب الجامعة العربية المفتوحة بالبريد الجامعي الرسمي');

  // تهيئة عميل Supabase (تأكد من تضمين مكتبة supabase-js في ملف HTML الرئيسي)
  const SUPABASE_URL = window.SUPABASE_URL || 'YOUR_SUPABASE_URL';
  const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
  let supabaseClient = null;

  try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
  }

  function validateUniversityEmailField(input) {
    const value = String(input?.value || '').trim();
    const isValid = !value || UNIVERSITY_EMAIL_PATTERN.test(value);
    input?.setCustomValidity(isValid ? '' : universityEmailMessage());
    return isValid;
  }

  function validateUniversityEmailForm(form) {
    const input = form?.querySelector('input[name="email"]');
    if (!input || validateUniversityEmailField(input)) return true;
    input.closest('.auth-field')?.classList.add('field-invalid');
    setMessage(universityEmailMessage(), 'error');
    input.focus();
    return false;
  }

  function setMessage(text, type) {
    const box = $('#auth-message');
    if (!box) return;
    box.textContent = text || '';
    box.className = `auth-message${type ? ` ${type}` : ''}`;
  }

  function formData(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function setBusy(form, busy) {
    const button = form && form.querySelector('button[type="submit"]');
    if (!button) return;
    button.disabled = busy;
    button.dataset.originalText ||= button.textContent;
    button.textContent = busy ? tr('auth.working', 'جارٍ التنفيذ...') : button.dataset.originalText;
  }

  function unlockSite() {
    document.body.classList.remove('auth-locked');
    document.querySelectorAll('.panel').forEach((panel) => {
      panel.style.display = panel.id === 'tab-home' ? 'block' : 'none';
    });
    document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === 'home'));
    const authPanel = $('#tab-auth');
    if (authPanel) authPanel.style.display = 'none';
    const authTab = document.querySelector('[data-tab="auth"]');
    if (authTab) authTab.hidden = true;
    const profileTab = document.querySelector('[data-tab="profile"]');
    if (profileTab) profileTab.hidden = false;
  }

  function showUser(user) {
    unlockSite();
    const email = user.email || '';
    const headerName = $('#header-profile-name');
    const headerAvatar = $('#header-profile-avatar');
    if (headerName) headerName.textContent = email;
    if (headerAvatar) headerAvatar.textContent = email.trim().slice(0, 1).toUpperCase();
    $('#auth-user-name').textContent = email;
    $('#auth-user').hidden = false;
    $('#login-form').hidden = true;
    $('#register-form').hidden = true;
    document.querySelector('.auth-switcher').hidden = true;
  }

  function showForms() {
    document.body.classList.add('auth-locked');
    const authPanel = $('#tab-auth');
    if (authPanel) authPanel.hidden = false;
    $('#auth-user').hidden = true;
    document.querySelector('.auth-switcher').hidden = false;
  }

  async function handleLogin(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!validateUniversityEmailForm(form) || !form.reportValidity()) return;
    
    const { email } = formData(form);
    setBusy(form, true);
    setMessage('');

    try {
      if (!supabaseClient) throw new Error('Supabase client not initialized.');
      
      // إرسال رابط تسجيل الدخول السحري (Magic Link) عبر Supabase
      const { error } = await supabaseClient.auth.signInWithOtp({
        email: email,
        options: { emailRedirectTo: window.location.origin }
      });

      if (error) throw error;

      setMessage('تم إرسال رابط تسجيل الدخول إلى بريدك الجامعي. تحقق من صندوق الوارد.', 'success');
      form.reset();
    } catch (error) {
      setMessage(error.message || 'تعذر إرسال رابط الدخول.', 'error');
    } finally {
      setBusy(form, false);
    }
  }

  async function handleLogout() {
    try {
      if (supabaseClient) await supabaseClient.auth.signOut();
      showForms();
      setMessage('تم تسجيل الخروج بنجاح.', 'success');
    } catch (error) {
      setMessage(error.message, 'error');
    }
  }

  async function initAuth() {
    if (!supabaseClient) {
      console.error('Supabase is missing.');
      return;
    }

    // التحقق من الجلسة الحالية
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session?.user) {
      showUser(session.user);
    } else {
      showForms();
    }

    // الاستماع لتغييرات المصادقة
    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        showUser(session.user);
      } else {
        showForms();
      }
    });

    const loginForm = $('#login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    $('#logout-button')?.addEventListener('click', handleLogout);
    $('#header-logout-button')?.addEventListener('click', handleLogout);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAuth);
  else initAuth();
})();
