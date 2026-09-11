(() => {
  'use strict';

  // This page intentionally uses the same Supabase Auth session as login/reset.
  // Set window.CYBERCLUB_PROFILE_TABLE = 'users' only if your project uses that
  // table instead of the recommended public.profiles table.
  const PROFILE_TABLE = window.CYBERCLUB_PROFILE_TABLE || 'profiles';
  const PROFILE_TABLES = [...new Set([PROFILE_TABLE, 'profiles', 'users'])];
  const SESSION_TIMEOUT_MS = 10000;
  const SESSION_RETRY_COUNT = 5;
  const SESSION_RETRY_DELAY_MS = 700;
  const $ = (selector) => document.querySelector(selector);
  const getSupabase = () => window.supabaseClient || null;
  const lang = () => window.i18n?.lang === 'en' ? 'en' : 'ar';
  const text = (key) => ({
    loading: lang() === 'en' ? 'Loading your profile…' : 'جارٍ تحميل ملفك…',
    updated: lang() === 'en' ? 'Your profile was updated successfully.' : 'تم تحديث بيانات ملفك بنجاح.',
    password: lang() === 'en' ? 'Your password was changed successfully.' : 'تم تغيير كلمة المرور بنجاح.',
    unavailable: lang() === 'en' ? 'The authentication service is unavailable. Please try again.' : 'خدمة المصادقة غير متاحة حاليًا. حاول مرة أخرى.',
    notFound: lang() === 'en' ? 'No profile record was found. Complete the form and save it to create one.' : 'لم يتم العثور على سجل ملفك. أكمل النموذج واحفظه لإنشاء السجل.',
    expired: lang() === 'en' ? 'Your session expired. Please sign in again.' : 'انتهت صلاحية جلستك. سجّل الدخول مرة أخرى.',
    generic: lang() === 'en' ? 'The request could not be completed.' : 'تعذر إكمال الطلب.',
    passwordMismatch: lang() === 'en' ? 'The current password is incorrect.' : 'كلمة المرور الحالية غير صحيحة.',
    profileTable: lang() === 'en' ? 'Profile storage is not configured. Ask an administrator to create the profiles table and its RLS policies.' : 'لم يتم إعداد تخزين الملف الشخصي. اطلب من المسؤول إنشاء جدول profiles وسياسات RLS الخاصة به.'
  }[key]);

  let state = { user: null, profile: null, table: null, loading: false, saving: false };
  let authSubscription = null;
  let initialized = false;
  let loadGeneration = 0;

  function setMessage(message = '', type = '') {
    const box = $('#profile-message');
    if (!box) return;
    box.textContent = message;
    box.className = `profile-message${type ? ` ${type}` : ''}`;
  }

  function setFormBusy(form, busy, busyText) {
    if (!form) return;
    form.dataset.busy = String(busy);
    form.querySelectorAll('input, select, button').forEach((control) => {
      control.disabled = busy;
    });
    const button = form.querySelector('button[type="submit"]');
    if (button) {
      if (!button.dataset.defaultText) button.dataset.defaultText = button.textContent;
      button.textContent = busy ? busyText : button.dataset.defaultText;
    }
  }

  function redirectToLogin() {
    if (window.location.pathname !== '/login.html') window.location.replace('/login.html');
  }

  function normalizeError(error, fallback = text('generic')) {
    const message = String(error?.message || error || '').trim();
    if (/JWT|token|session|not authenticated|unauthorized|401/i.test(message)) return text('expired');
    if (/relation .* does not exist|schema cache|could not find the table/i.test(message)) return text('profileTable');
    return message || fallback;
  }

  function withTimeout(promise, ms, label) {
    let timer;
    return Promise.race([
      promise,
      new Promise((_, reject) => { timer = window.setTimeout(() => reject(new Error(label)), ms); })
    ]).finally(() => window.clearTimeout(timer));
  }

  async function getSession() {
    const sb = getSupabase();
    if (!sb?.auth?.getSession) throw new Error(text('unavailable'));
    const result = await withTimeout(sb.auth.getSession(), SESSION_TIMEOUT_MS, text('unavailable'));
    if (result?.error) throw result.error;
    return result?.data?.session || null;
  }

  function fieldValue(profile, user, key) {
    const aliases = {
      firstName: ['firstName', 'first_name'], lastName: ['lastName', 'last_name'],
      phone: ['phone', 'phone_number'], major: ['major', 'specialization'],
      gender: ['gender', 'sex'], avatarData: ['avatarData', 'avatar_data']
    };
    for (const name of aliases[key] || [key]) {
      if (profile?.[name] !== undefined && profile?.[name] !== null) return profile[name];
      if (user?.user_metadata?.[name] !== undefined && user.user_metadata[name] !== null) return user.user_metadata[name];
    }
    return '';
  }

  function fillForm(profile, user) {
    const values = {
      firstName: fieldValue(profile, user, 'firstName'), lastName: fieldValue(profile, user, 'lastName'),
      phone: fieldValue(profile, user, 'phone'), major: fieldValue(profile, user, 'major'), gender: fieldValue(profile, user, 'gender')
    };
    Object.entries(values).forEach(([name, value]) => {
      const control = document.querySelector(`[name="${name}"]`);
      if (control) control.value = String(value ?? '');
    });
    const email = $('#profile-email'); if (email) email.value = user?.email || profile?.email || '';
    const fullName = `${values.firstName} ${values.lastName}`.trim() || user?.email || (lang() === 'en' ? 'Student' : 'طالب');
    const name = $('#profile-full-name'); if (name) name.textContent = fullName;
    const role = $('#profile-role'); if (role) role.textContent = profile?.role === 'admin' ? (lang() === 'en' ? 'Administrator' : 'مسؤول') : (lang() === 'en' ? 'Student' : 'طالب');
    const joined = $('#profile-joined');
    const createdAt = profile?.created_at || profile?.createdAt || user?.created_at;
    if (joined) joined.textContent = `${lang() === 'en' ? 'Joined:' : 'تاريخ الانضمام:'} ${createdAt ? new Date(createdAt).toLocaleDateString(lang() === 'en' ? 'en-GB' : 'ar-SA') : '—'}`;
    const avatar = $('#profile-avatar');
    const avatarData = fieldValue(profile, user, 'avatarData');
    if (avatar) { avatar.style.backgroundImage = avatarData ? `url("${String(avatarData).replace(/"/g, '%22')}")` : ''; avatar.textContent = avatarData ? '' : fullName.slice(0, 1).toUpperCase(); }
  }

  function renderEmptyDashboard() {
    ['stat-enrolled', 'stat-completed', 'stat-certificates'].forEach((id) => { const el = document.getElementById(id); if (el) el.textContent = '0'; });
    const summary = $('#profile-certificates-summary'); if (summary) summary.textContent = lang() === 'en' ? 'No certificates loaded' : 'لا توجد شهادات محملة';
    const list = $('#profile-certificates-list'); if (list) list.innerHTML = `<div class="profile-empty">${lang() === 'en' ? 'Certificate history will appear here.' : 'سيظهر سجل الشهادات هنا.'}</div>`;
  }

  async function queryProfile(sb, user) {
    let lastError = null;
    for (const table of PROFILE_TABLES) {
      try {
        const result = await sb.from(table).select('*').eq('id', user.id).maybeSingle();
        if (!result.error) return { table, profile: result.data };
        lastError = result.error;
      } catch (error) { lastError = error; }
    }
    throw lastError || new Error(text('profileTable'));
  }

  async function createOrUpdateProfile(sb, table, user, values) {
    const payload = {
      id: user.id, email: user.email || null, first_name: values.firstName, last_name: values.lastName,
      phone: values.phone || null, major: values.major || null, gender: values.gender || null,
      updated_at: new Date().toISOString()
    };
    // Profiles normally use auth.users.id as their primary key. If a legacy table
    // does not expose email/updated_at, retry with only the common profile fields.
    let result = await sb.from(table).upsert(payload, { onConflict: 'id' }).select('*').single();
    if (result.error && /column .* does not exist|schema cache/i.test(result.error.message || '')) {
      result = await sb.from(table).upsert({ id: user.id, first_name: values.firstName, last_name: values.lastName, phone: values.phone || null, major: values.major || null, gender: values.gender || null }, { onConflict: 'id' }).select('*').single();
    }
    if (result.error) throw result.error;
    return result.data;
  }

  async function loadProfile({ allowRedirect = true } = {}) {
    const generation = ++loadGeneration;
    state.loading = true; setMessage(text('loading'), ''); document.body.classList.add('auth-locked');
    try {
      let session = null;
      for (let attempt = 0; attempt < SESSION_RETRY_COUNT && !session; attempt += 1) {
        session = await getSession();
        if (!session && attempt < SESSION_RETRY_COUNT - 1) await new Promise((resolve) => window.setTimeout(resolve, SESSION_RETRY_DELAY_MS));
      }
      if (generation !== loadGeneration) return;
      if (!session?.user) { setMessage(text('expired'), 'error'); if (allowRedirect) window.setTimeout(redirectToLogin, 250); return; }
      state.user = session.user;
      const sb = getSupabase();
      const result = await queryProfile(sb, session.user);
      if (generation !== loadGeneration) return;
      state.table = result.table; state.profile = result.profile;
      fillForm(result.profile || {}, session.user); renderEmptyDashboard();
      document.body.classList.remove('auth-locked');
      setMessage(result.profile ? '' : text('notFound'), result.profile ? '' : 'info');
    } catch (error) {
      if (generation !== loadGeneration) return;
      const message = normalizeError(error);
      setMessage(message, 'error');
      if (/session|token|authentication|unavailable/i.test(message) && allowRedirect) window.setTimeout(redirectToLogin, 700);
    } finally {
      if (generation === loadGeneration) state.loading = false;
    }
  }

  function profilePayload() {
    return {
      firstName: String($('#profile-first-name')?.value || '').trim(), lastName: String($('#profile-last-name')?.value || '').trim(),
      phone: String($('#profile-phone')?.value || '').trim(), major: String($('#profile-major')?.value || '').trim(), gender: String($('#profile-gender')?.value || '').trim()
    };
  }

  async function saveProfile(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (state.saving || state.loading || !form.reportValidity()) return;
    state.saving = true; setFormBusy(form, true, lang() === 'en' ? 'Saving…' : 'جارٍ الحفظ…'); setMessage('');
    try {
      const session = await getSession();
      if (!session?.user) throw new Error(text('expired'));
      const sb = getSupabase();
      if (!state.table) { const found = await queryProfile(sb, session.user); state.table = found.table; state.profile = found.profile; }
      state.profile = await createOrUpdateProfile(sb, state.table, session.user, profilePayload());
      state.user = session.user; fillForm(state.profile, state.user); setMessage(text('updated'), 'success');
    } catch (error) { setMessage(normalizeError(error), 'error'); }
    finally { state.saving = false; setFormBusy(form, false); }
  }

  async function changePassword(event) {
    event.preventDefault(); const form = event.currentTarget;
    if (form.dataset.busy === 'true' || !form.reportValidity()) return;
    const button = form.querySelector('button[type="submit"]'); setFormBusy(form, true, lang() === 'en' ? 'Updating…' : 'جارٍ التحديث…');
    try {
      const session = await getSession(); if (!session?.user) throw new Error(text('expired'));
      const currentPassword = String($('#current-password')?.value || ''); const newPassword = String($('#new-password')?.value || '');
      const sb = getSupabase(); const login = await sb.auth.signInWithPassword({ email: session.user.email, password: currentPassword });
      if (login.error) throw new Error(text('passwordMismatch'));
      const updated = await sb.auth.updateUser({ password: newPassword }); if (updated.error) throw updated.error;
      form.reset(); setMessage(text('password'), 'success');
    } catch (error) { setMessage(normalizeError(error), 'error'); }
    finally { setFormBusy(form, false); if (button) button.disabled = false; }
  }

  async function logout() {
    const button = $('#profile-logout'); if (button) button.disabled = true;
    try { const sb = getSupabase(); if (sb?.auth) { const result = await sb.auth.signOut(); if (result.error) throw result.error; } redirectToLogin(); }
    catch (error) { setMessage(normalizeError(error), 'error'); if (button) button.disabled = false; }
  }

  function init() {
    if (initialized) return; initialized = true;
    $('#profile-form')?.addEventListener('submit', saveProfile); $('#password-form')?.addEventListener('submit', changePassword); $('#profile-logout')?.addEventListener('click', logout);
    const sb = getSupabase();
    if (!sb) { setMessage(text('unavailable'), 'error'); return; }
    try {
      const subscription = sb.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) { document.body.classList.add('auth-locked'); redirectToLogin(); return; }
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'PASSWORD_RECOVERY') loadProfile({ allowRedirect: false }).catch((error) => setMessage(normalizeError(error), 'error'));
      });
      authSubscription = subscription?.data?.subscription || null;
    } catch (error) { setMessage(normalizeError(error), 'error'); }
    loadProfile().catch((error) => setMessage(normalizeError(error), 'error'));
  }

  window.addEventListener('beforeunload', () => authSubscription?.unsubscribe?.());
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
//# sourceURL=profile.js
