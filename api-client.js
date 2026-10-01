(() => {
  window.clubFetch = async (url, options = {}) => {
    const target = new URL(url, location.origin);
    if (target.origin !== location.origin || !target.pathname.startsWith('/api/')) throw new Error('Invalid API destination');
    const sb = window.supabaseClient;
    if (!sb) throw new Error('Authentication unavailable / المصادقة غير متاحة');
    const { data, error } = await sb.auth.getSession();
    if (error) throw error;
    if (!data.session) throw new Error('Please sign in / يرجى تسجيل الدخول');
    return fetch(target.href, { ...options, redirect: 'error', signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(30000)]) : AbortSignal.timeout(30000), headers: { ...options.headers, Authorization: 'Bearer ' + data.session.access_token } });
  };
})();