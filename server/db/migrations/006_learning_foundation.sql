-- Phase 0-A: additive learning foundation.
--
-- The existing `lessons`, `lesson_progress`, `quiz_attempts`, and
-- `certificates` tables belong to the original relational design, while the
-- live site still uses `student_course_progress`.  These names intentionally
-- stay separate so this migration cannot disrupt either system before the
-- secure API cutover in Phase 0-B.

-- The guards make the script safe to re-run from Supabase SQL Editor if a
-- previous attempt stopped after creating one of the types.
DO $$ BEGIN
  CREATE TYPE learning_foundation_lesson_type AS ENUM ('article', 'simulation', 'animated', 'quiz');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE learning_foundation_progress_status AS ENUM ('not_started', 'in_progress', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE learning_foundation_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) NOT NULL UNIQUE,
  title_ar VARCHAR(240) NOT NULL,
  title_en VARCHAR(240) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE learning_foundation_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(160) NOT NULL UNIQUE,
  course_id UUID NOT NULL REFERENCES learning_foundation_courses(id) ON DELETE CASCADE,
  module_key VARCHAR(160),
  module_order INTEGER NOT NULL DEFAULT 0,
  lesson_order INTEGER NOT NULL DEFAULT 0,
  lesson_type learning_foundation_lesson_type NOT NULL DEFAULT 'article',
  icon VARCHAR(40) NOT NULL DEFAULT 'article',
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, module_key, lesson_order)
);
CREATE INDEX idx_learning_foundation_lessons_course ON learning_foundation_lessons(course_id, module_order, lesson_order);

CREATE TABLE learning_foundation_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES learning_foundation_lessons(id) ON DELETE CASCADE,
  status learning_foundation_progress_status NOT NULL DEFAULT 'not_started',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);
CREATE INDEX idx_learning_foundation_progress_user ON learning_foundation_lesson_progress(user_id, status);

CREATE TABLE learning_foundation_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES learning_foundation_lessons(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  submitted_answer JSONB,
  is_correct BOOLEAN,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_learning_foundation_attempts_user_lesson ON learning_foundation_quiz_attempts(user_id, lesson_id, submitted_at DESC);

CREATE TABLE learning_foundation_import_runs (
  source_name TEXT PRIMARY KEY,
  source_fingerprint TEXT NOT NULL,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  imported_courses INTEGER NOT NULL DEFAULT 0,
  imported_lessons INTEGER NOT NULL DEFAULT 0,
  imported_challenges INTEGER NOT NULL DEFAULT 0
);

DROP TRIGGER IF EXISTS trg_learning_foundation_courses_updated_at ON learning_foundation_courses;
CREATE TRIGGER trg_learning_foundation_courses_updated_at BEFORE UPDATE ON learning_foundation_courses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_learning_foundation_lessons_updated_at ON learning_foundation_lessons;
CREATE TRIGGER trg_learning_foundation_lessons_updated_at BEFORE UPDATE ON learning_foundation_lessons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_learning_foundation_progress_updated_at ON learning_foundation_lesson_progress;
CREATE TRIGGER trg_learning_foundation_progress_updated_at BEFORE UPDATE ON learning_foundation_lesson_progress
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
