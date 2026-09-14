ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE users ADD CONSTRAINT users_gender_check CHECK (gender IS NULL OR gender IN ('male', 'female'));
