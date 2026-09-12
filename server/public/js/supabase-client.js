/* Supabase browser client for public/anon operations.
 * Load supabase-config.js first and configure its public Project URL and publishable key.
 * NEVER put the service_role key in this file.
 */
window.supabaseClient = null;

try {
  const url = typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : window.SUPABASE_URL;
  const anonKey = typeof SUPABASE_ANON_KEY !== 'undefined' ? SUPABASE_ANON_KEY : window.SUPABASE_ANON_KEY;

  if (
    window.supabase &&
    url && typeof url === 'string' && url.startsWith('https://') && !url.includes('YOUR-PROJECT-REF') &&
    anonKey && typeof anonKey === 'string' && !anonKey.includes('YOUR_SUPABASE_ANON_PUBLIC_KEY')
  ) {
    window.supabaseClient = window.supabase.createClient(url, anonKey, { global: { fetch: (input, options = {}) => fetch(input, { ...options, signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000) }) } });
    window.supabaseClient.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && location.pathname !== '/reset-password.html') setTimeout(() => location.replace('/reset-password.html'), 0);
    });
  } else {
    console.error('Supabase client not initialized: check SUPABASE_URL / SUPABASE_ANON_KEY in js/supabase-config.js');
  }
} catch (e) {
  console.error('Error initializing Supabase client:', e);
}
