(() => {
  window.clubFetch = async (url, options = {}) => {
    const sb = window.supabaseClient;
    if (!sb) throw new Error('Authentication unavailable / المصادقة غير متاحة');
    const { data, error } = await sb.auth.getSession();
    if (error) throw error;
    if (!data.session) throw new Error('Please sign in / يرجى تسجيل الدخول');
    return fetch(url, { ...options, signal: AbortSignal.timeout(15000), headers: { ...options.headers, Authorization: 'Bearer ' + data.session.access_token } });
  };
})();