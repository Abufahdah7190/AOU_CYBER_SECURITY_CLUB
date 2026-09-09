/* Supabase browser client for public/anon operations.
 * Load supabase-config.js first and configure its public Project URL and publishable key.
 * NEVER put the service_role key in this file.
 */
window.supabaseClient = null;

if (window.supabase &&
    SUPABASE_URL.startsWith('https://') &&
    !SUPABASE_URL.includes('YOUR-PROJECT-REF') &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_PUBLIC_KEY')) {
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.error('Supabase client not initialized: check SUPABASE_URL / SUPABASE_ANON_KEY in js/supabase-config.js');
}
