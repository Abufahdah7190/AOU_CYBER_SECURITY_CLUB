'use strict';

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Supply the provider CA explicitly while retaining certificate and hostname
// verification. URI SSL options must not override this verified TLS policy.
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
const ssl = useSsl ? { rejectUnauthorized: true } : false;
if (ssl && isSupabasePooler) {
  ssl.ca = fs.readFileSync(path.join(__dirname, '../../certs/supabase-ca.crt'), 'utf8');
}

const pool = new Pool({
  connectionString: normalizedDatabaseUrl,
  ssl,
  max: 10,
  connectionTimeoutMillis: 10000,
  statement_timeout: 15000,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  // Unexpected error on an idle client — log and let the process supervisor
  // (Render, pm2, etc.) restart if it becomes fatal, rather than crashing
  // silently or leaking connection info to a response.
  console.error('Unexpected PostgreSQL pool error:', { code: err.code, name: err.name });
});

module.exports = { pool };
