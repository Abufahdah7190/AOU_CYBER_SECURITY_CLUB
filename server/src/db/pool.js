'use strict';

const { Pool } = require('pg');

// `pg` interprets sslmode=require in a connection URI itself. In recent
// versions that value can override the `ssl` object below and turn it into
// verify-full, which rejects Supabase's pooled IPv4 certificate chain on
// Render. Normalise only the URI option, then supply the TLS policy here.
// Encryption remains mandatory; the narrow exception is limited to the
// Supabase pooler endpoint (whose proxy chain is not publicly rooted).
const rawDatabaseUrl = process.env.DATABASE_URL || '';
let normalizedDatabaseUrl = rawDatabaseUrl;
let databaseHost = '';
try {
  const parsed = new URL(rawDatabaseUrl);
  databaseHost = parsed.hostname;
  parsed.searchParams.delete('sslmode');
  normalizedDatabaseUrl = parsed.toString();
} catch (_) { /* env validation reports malformed URLs elsewhere */ }
const isSupabasePooler = /(^|\.)pooler\.supabase\.com$/i.test(databaseHost);
const useSsl = Boolean(rawDatabaseUrl) && (/sslmode=(require|prefer|verify-ca|verify-full)/i.test(rawDatabaseUrl) || process.env.PGSSL === 'true' || isSupabasePooler);

const pool = new Pool({
  connectionString: normalizedDatabaseUrl,
  ssl: useSsl ? { rejectUnauthorized: !isSupabasePooler } : false,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  // Unexpected error on an idle client — log and let the process supervisor
  // (Render, pm2, etc.) restart if it becomes fatal, rather than crashing
  // silently or leaking connection info to a response.
  console.error('Unexpected PostgreSQL pool error:', { code: err.code, name: err.name });
});

module.exports = { pool };
