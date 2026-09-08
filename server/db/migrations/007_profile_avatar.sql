-- Persistent, database-backed profile avatar. Data is a compact, validated
-- PNG/JPEG/WebP data URI; no user-controlled filesystem paths are stored.
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_data TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_updated_at TIMESTAMPTZ;
