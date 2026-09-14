'use strict';

const { pool } = require('../db/pool');

/**
 * Writes one audit log row. Never throws into the caller's request flow —
 * a failure to log must not fail the underlying user-facing action, but
 * we do log the logging failure itself to stderr so it isn't silently lost.
 */
async function recordAudit({ actorId = null, action, entityType = null, entityId = null, req = null, metadata = null }) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        actorId,
        action,
        entityType,
        entityId,
        req ? req.ip : null,
        req ? req.get('user-agent') : null,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );
  } catch (err) {
    console.error('Failed to write audit log:', action, err.message);
  }
}

module.exports = { recordAudit };
