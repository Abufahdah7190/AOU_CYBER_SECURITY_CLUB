-- Additive: retain legacy progress and certificates unchanged.
CREATE TABLE IF NOT EXISTS verified_lesson_results (
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_slug varchar(80) NOT NULL,
  lesson_index integer NOT NULL CHECK (lesson_index >= 0),
  passed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, course_slug, lesson_index)
);
REVOKE ALL ON verified_lesson_results FROM PUBLIC;

ALTER TABLE verified_lesson_results ENABLE ROW LEVEL SECURITY;
-- No public policies: only the owner connection used by Express may access this new table.
