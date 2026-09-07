'use strict';

const { Pool } = require('pg');

// Supabase (and most managed Postgres providers) require SSL in production.
// Locally (NODE_ENV=development / no sslmode) we connect without SSL.
const useSsl = /sslmode=require/.test(process.env.DATABASE_URL || '') ||
  process.env.PGSSL === 'true';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  // Unexpected error on an idle client — log and let the process supervisor
  // (Render, pm2, etc.) restart if it becomes fatal, rather than crashing
  // silently or leaking connection info to a response.
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

module.exports = { pool };
