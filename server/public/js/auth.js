/* CyberClub authentication client - Supabase Edition */
(function () {
  'use strict';

  // البحث الآمن عن عميل Supabase بجميع الاحتمالات الممكنة لمنع خطأ undefined
  const getSupabase = () => {
    if (window.supabaseClient) return window.supabaseClient;
    if (window.supabase && typeof window.supabase.auth === 'object') return window.supabase;
    // إذا تم إنشاؤه عبر createClient مباشرة
    if (window._supabase) return window._supabase;
    return null;
  };

  const $ = (selector) => document.querySelector(selector);
  const UNIVERSITY_EMAIL_PATTERN = /^[^\s@]+@(aou\.edu\.sa|aou\.edu)$/i;
  const tr = (key, fallback) => window.i18n?.t(key, fallback) || fallback;
  const universityEmailMessage = () => tr('auth.universityEmailTitle', 'الموقع متاح فقط لطلاب الجامعة العربية المفتوحة بالبريد الجامعي الرسمي');

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

  function setBusy(form, busy) {
    const button = form && form.querySelector('button[type="submit"]');
    if (!button) return;
    button.disabled = busy;
    button.dataset.originalText ||= button.textContent;
    button.textContent = busy ? tr('auth.working', 'جارٍ التنفيذ...') : button.dataset.originalText;
  }

  const PUBLIC_PANEL_IDS = [];

  function unlockSite() {
    document.body.classList.remove('auth-locked');
    document.querySelectorAll('.panel').forEach((panel) => {
      if (PUBLIC_PANEL_IDS.includes(panel.id)) return;
      panel.style.display = panel.id === 'tab-home' ? 'block' : 'none';
    });
    document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === 'home'));
    const authPanel = $('#tab-auth');
    if (authPanel) authPanel.style.display = 'none';
    const authTab = document.querySelector('[data-tab="auth"]');
    if (authTab) authTab.hidden = true;
    const profileTab = document.querySelector('[data-tab="profile"]');
    if (profileTab) profileTab.hidden = false;
    const profileLink = document.querySelector('[data-profile-link]');
    if (profileLink) profileLink.hidden = false;
    const accountMenu = document.querySelector('[data-account-menu]');
    if (accountMenu) accountMenu.hidden = false;
  }

  function lockSite() {
    document.body.classList.add('auth-locked');
    document.querySelectorAll('.panel').forEach((panel) => {
      if (PUBLIC_PANEL_IDS.includes(panel.id)) return;
      panel.style.display = panel.id === 'tab-auth' ? 'block' : 'none';
    });
    document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === 'auth'));
    const authTab = document.querySelector('[data-tab="auth"]');
    if (authTab) authTab.hidden = false;
  }

  function showUser(user) {
    unlockSite();
    const authPanel = $('#tab-auth');
    const authTab = document.querySelector('[data-tab="auth"]');
    const profileTab = document.querySelector('[data-tab="profile"]');
    if (authPanel) { authPanel.style.display = 'none'; authPanel.hidden = true; authPanel.setAttribute('aria-hidden', 'true'); }
    if (authTab) { authTab.hidden = true; authTab.setAttribute('aria-hidden', 'true'); }
    if (profileTab) { profileTab.hidden = false; profileTab.removeAttribute('aria-hidden'); }
    const profileLink = document.querySelector('[data-profile-link]');
    if (profileLink) { profileLink.hidden = false; profileLink.removeAttribute('aria-hidden'); }
    const accountMenu = document.querySelector('[data-account-menu]');
    if (accountMenu) { accountMenu.hidden = false; accountMenu.removeAttribute('aria-hidden'); }
    
    const email = user.email || '';
    const headerName = $('#header-profile-name');
    const headerAvatar = $('#header-profile-avatar');
    if (headerName) headerName.textContent = email;
    if (headerAvatar) headerAvatar.textContent = email.trim().charAt(0).toUpperCase();
    
    if ($('#auth-user-name')) $('#auth-user-name').textContent = email;
    if ($('#auth-user')) $('#auth-user').hidden = false;
    if ($('#login-form')) $('#login-form').hidden = true;
    if ($('#register-form')) $('#register-form').hidden = true;
    const switcher = document.querySelector('.auth-switcher');
    if (switcher) switcher.hidden = true;
    document.dispatchEvent(new CustomEvent('auth:ready', { detail: { user } }));
  }

  function showForms() {
    lockSite();
    const authPanel = $('#tab-auth');
    const authTab = document.querySelector('[data-tab="auth"]');
    const profileTab = document.querySelector('[data-tab="profile"]');
    if (authPanel) { authPanel.hidden = false; authPanel.removeAttribute('aria-hidden'); }
    if (authTab) { authTab.hidden = false; authTab.removeAttribute('aria-hidden'); }
    if (profileTab) { profileTab.hidden = true; profileTab.setAttribute('aria-hidden', 'true'); }
    const profileLink = document.querySelector('[data-profile-link]');
    if (profileLink) { profileLink.hidden = true; profileLink.setAttribute('aria-hidden', 'true'); }
    const accountMenu = document.querySelector('[data-account-menu]');
    if (accountMenu) { accountMenu.hidden = true; accountMenu.setAttribute('aria-hidden', 'true'); }
    
    if ($('#auth-user')) $('#auth-user').hidden = true;
    const switcher = document.querySelector('.auth-switcher');
    if (switcher) switcher.hidden = false;
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
      const isActive = button.dataset.authView === view;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', String(isActive));
      button.tabIndex = isActive ? 0 : -1;
    });
    
    const welcomeTitle = document.querySelector('[data-auth-welcome-title]');
    const welcomeCopy = document.querySelector('[data-auth-welcome-copy]');
    if (welcomeTitle) welcomeTitle.textContent = login ? tr('auth.welcomeBack', 'مرحبًا بعودتك') : tr('auth.welcomeNew', 'ابدأ رحلتك معنا');
    if (welcomeCopy) welcomeCopy.textContent = login
      ? tr('auth.welcomeBackCopy', 'سجّل دخولك برابط سحري يُرسل إلى بريدك الجامعي.')
      : tr('auth.welcomeNewCopy', 'أنشئ حسابك الجامعي وانضم إلى مجتمع النادي السيبراني.');
    setMessage('');
  }

  async function handleAuthEmailSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!validateUniversityEmailForm(form) || !form.reportValidity()) return;

    const sb = getSupabase();
    if (!sb) {
      setMessage('خطأ في إعدادات الاتصال بقاعدة البيانات (Supabase غير متوفر).', 'error');
      return;
    }

    const formDataObj = Object.fromEntries(new FormData(form).entries());
    const email = formDataObj.email.trim().toLowerCase();

    setBusy(form, true);
    setMessage('');

    try {
      const { error } = await sb.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: form.id === 'register-form',
          ...(form.id === 'register-form' ? { data: { firstName: formDataObj.firstName, lastName: formDataObj.lastName, phone: formDataObj.phone, major: formDataObj.major, gender: formDataObj.gender } } : {}),
          emailRedirectTo: new URL('verify-email.html', window.location.href).href
        }
      });

      if (error) throw error;

      try { sessionStorage.setItem('cyberclub.pendingEmail', email); } catch (_) {}
      window.location.assign(new URL('verify-email.html', window.location.href).href);
    } catch (error) {
      setMessage(error.message || 'حدث خطأ أثناء إرسال رابط التحقق.', 'error');
    } finally {
      setBusy(form, false);
    }
  }

  async function loadCurrentUser() {
    const sb = getSupabase();
    if (!sb) { showForms(); setMessage('تعذر تحميل خدمة التحقق. تحقق من الاتصال وإعدادات Supabase ثم أعد تحميل الصفحة.', 'error'); return; }
    
    const { data: { session }, error } = await sb.auth.getSession();
    if (error) { showForms(); setMessage(error.message, 'error'); return; }
    
    if (session && session.user) {
      showUser(session.user);
    } else {
      showForms();
    }

    sb.auth.onAuthStateChange((event, currentSession) => {
      if (currentSession && currentSession.user) {
        showUser(currentSession.user);
      } else {
        showForms();
      }
    });
  }

  async function handleLogout() {
    const sb = getSupabase();
    const button = $('#logout-button');
    if (button) button.disabled = true;
    try {
      if (sb) await sb.auth.signOut();
      showForms();
      setMessage(tr('auth.logoutSuccess', 'تم تسجيل الخروج بنجاح.'), 'success');
    } catch (error) {
      setMessage(error.message, 'error');
    } finally {
      if (button) button.disabled = false;
    }
  }

  function initAuth() {
    const login = $('#login-form');
    const register = $('#register-form');
    const forgot = $('#forgot-form');

    if (login) login.addEventListener('submit', handleAuthEmailSubmit);
    if (register) register.addEventListener('submit', handleAuthEmailSubmit);
    if (forgot) forgot.addEventListener('submit', handleAuthEmailSubmit);

    $('#logout-button')?.addEventListener('click', handleLogout);
    $('#header-logout-button')?.addEventListener('click', handleLogout);

    lockSite();
    document.querySelectorAll('[data-auth-view]').forEach((button) => {
      button.addEventListener('click', () => switchView(button.dataset.authView));
    });

    loadCurrentUser().catch(() => { showForms(); setMessage('تعذر الاتصال بخدمة التحقق. أعد المحاولة.', 'error'); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAuth);
  else initAuth();
})();
