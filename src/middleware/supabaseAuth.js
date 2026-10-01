'use strict';
const { pool } = require('../db/pool');
module.exports = async function supabaseAuth(req, res, next) {
  const token = req.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];
  if (!token) return res.status(401).json({ error: 'Please sign in / يرجى تسجيل الدخول' });
  const base = process.env.SUPABASE_URL, key = process.env.SUPABASE_ANON_KEY;
  if (!base || !key) return res.status(503).json({ error: 'Authentication not configured' });
  try {
    const headers = { apikey: key, Authorization: `Bearer ${token}` };
    const response = await fetch(new URL('/auth/v1/user', base), { headers, redirect: 'error', signal: AbortSignal.timeout(10000) });
    if (!response.ok) return res.status(response.status >= 500 ? 503 : 401).json({ error: 'Authentication failed' });
    const user = await response.json();
    if (!user.id || !user.email_confirmed_at || !/^[^\s@]+@aou\.edu\.sa$/i.test(user.email || '')) return res.status(403).json({ error: 'University account required' });
    const responseProfile = await fetch(new URL(`/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=first_name,last_name`, base), { headers, redirect: 'error', signal: AbortSignal.timeout(3000) }).catch(() => ({ ok: false }));
    const profile = responseProfile.ok ? ((await responseProfile.json())[0] || {}) : {};
    // Only an administrator-reviewed mapping may connect a legacy identity.
    // User metadata and email equality never grant a legacy account implicitly.
    const links = await pool.query('SELECT student_id FROM public.supabase_identity_links WHERE auth_user_id=$1', [user.id]);
    const studentId = links.rows[0]?.student_id || user.id;
    const { rows } = await pool.query(`INSERT INTO users (id, first_name, last_name, email, password_hash, email_verified_at)
      VALUES ($1,$2,$3,$4,'!supabase-only',now()) ON CONFLICT (id) DO UPDATE SET
      first_name=COALESCE(NULLIF(EXCLUDED.first_name,''),users.first_name),
      last_name=COALESCE(NULLIF(EXCLUDED.last_name,''),users.last_name), email=EXCLUDED.email RETURNING id,is_active`,
      [studentId, String(profile.first_name || user.user_metadata?.firstName || '').slice(0,100), String(profile.last_name || user.user_metadata?.lastName || '').slice(0,100), user.email]);
    if (!rows[0]?.is_active) return res.status(403).json({ error: 'Account disabled' });
    res.set('Cache-Control', 'no-store, private');
    req.user = { id: studentId, authId: user.id, email: user.email, role: 'student' };
    return next();
  } catch (error) {
    if (error.code === '42P01') return res.status(503).json({ error: 'يحتاج سجل التعلم إلى تحديث قاعدة البيانات من مسؤول الموقع.', code: 'LEARNING_SCHEMA_REQUIRED' });
    if (error.code === '23505') return res.status(409).json({ error: 'حسابك القديم يحتاج ربطًا من الإدارة لاستعادة الشهادات. تواصل عبر الاقتراحات والشكاوى.', code: 'IDENTITY_LINK_REQUIRED' });
    return next(error);
  }
};
