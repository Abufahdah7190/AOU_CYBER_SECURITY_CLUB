ALTER TABLE student_course_certificates ADD COLUMN IF NOT EXISTS theme VARCHAR(10) NOT NULL DEFAULT 'light';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'student_course_certificates_theme_check'
  ) THEN
    ALTER TABLE student_course_certificates
      ADD CONSTRAINT student_course_certificates_theme_check CHECK (theme IN ('light', 'dark'));
  END IF;
END $$;
