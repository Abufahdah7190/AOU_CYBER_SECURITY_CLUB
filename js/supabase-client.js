/* Supabase browser client for public/anon operations.
 * Replace the two placeholders below with your Supabase Project URL and anon public key.
 * NEVER put the service_role key in this file.
 */
const SUPABASE_URL = window.SUPABASE_URL || 'https://znsbsbqsrbjbzhaxjaxe.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'sb_publishable_9lcAuDmyfwAW9l9gupbT8Q_imlN_oci';

window.supabaseClient = null;

if (window.supabase &&
    SUPABASE_URL.startsWith('https://') &&
    !SUPABASE_URL.includes('YOUR-PROJECT-REF') &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_PUBLIC_KEY')) {
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.error('Supabase client not initialized: check SUPABASE_URL / SUPABASE_ANON_KEY in js/supabase-client.js');
}
