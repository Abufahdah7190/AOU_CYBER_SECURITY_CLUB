-- Persistent student learning state linked to the authenticated account.
CREATE TABLE IF NOT EXISTS student_course_progress (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_slug        VARCHAR(80) NOT NULL,
  percent            INTEGER NOT NULL DEFAULT 0 CHECK (percent BETWEEN 0 AND 100),
  last_section       INTEGER NOT NULL DEFAULT 0,
  last_accessed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  quiz_scores        JSONB NOT NULL DEFAULT '{}'::jsonb,
  certificate_language certificate_language NOT NULL DEFAULT 'ar',
  completed_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, course_slug)
);
CREATE INDEX IF NOT EXISTS idx_student_progress_student ON student_course_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_last_access ON student_course_progress(student_id, last_accessed_at DESC);

CREATE TABLE IF NOT EXISTS student_course_certificates (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_slug        VARCHAR(80) NOT NULL,
  course_name        VARCHAR(200) NOT NULL,
  student_name       VARCHAR(200) NOT NULL,
  language           certificate_language NOT NULL DEFAULT 'ar',
  certificate_code   VARCHAR(60) NOT NULL UNIQUE,
  issued_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, course_slug)
);
CREATE INDEX IF NOT EXISTS idx_student_certificates_student ON student_course_certificates(student_id);
