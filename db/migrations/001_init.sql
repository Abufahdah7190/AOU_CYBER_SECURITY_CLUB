-- =====================================================================
-- 001_init.sql
-- المخطط الكامل لقاعدة بيانات منصة نادي الأمن السيبراني (AOU Riyadh)
-- Full initial schema for the Cybersecurity Club LMS platform.
--
-- يغطي هذا الملف كل الكيانات المطلوبة في النقطة 19 من متطلبات المشروع:
-- Users, Students, Instructors, Courses, CourseSections, Lessons,
-- Enrollments, Progress, Quizzes, Questions, QuizAttempts, Certificates,
-- Articles, Notifications, AuditLogs.
--
-- المرحلة الحالية (Phase 4) تُفعّل فقط: users + audit_logs + refresh_tokens
-- + password_reset_tokens. باقي الجداول مُنشأة الآن لتفادي migrations
-- مؤلمة لاحقًا، لكنها ستُستخدم فعليًا في المراحل القادمة (الدورات،
-- الاختبارات، الشهادات...).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;   -- for case-insensitive email column

-- ---------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('student', 'instructor', 'reviewer', 'admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE course_status AS ENUM ('draft', 'pending_review', 'approved', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE article_status AS ENUM ('draft', 'pending_review', 'approved', 'published', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE certificate_status AS ENUM ('valid', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE certificate_language AS ENUM ('ar', 'en');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------
-- USERS  (core identity table for every role)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name          VARCHAR(100) NOT NULL,
  last_name           VARCHAR(100) NOT NULL,
  email               CITEXT NOT NULL UNIQUE,
  phone               VARCHAR(30),
  password_hash       TEXT NOT NULL,
  major               VARCHAR(150),              -- التخصص
  role                user_role NOT NULL DEFAULT 'student',
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  email_verified_at   TIMESTAMPTZ,
  failed_login_count  INTEGER NOT NULL DEFAULT 0,
  locked_until        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ---------------------------------------------------------------------
-- REFRESH TOKENS (for JWT refresh / logout-everywhere support)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL UNIQUE,
  user_agent   TEXT,
  ip_address   VARCHAR(64),
  expires_at   TIMESTAMPTZ NOT NULL,
  revoked_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

-- ---------------------------------------------------------------------
-- PASSWORD RESET TOKENS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL UNIQUE,
  expires_at   TIMESTAMPTZ NOT NULL,
  used_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pwreset_user ON password_reset_tokens(user_id);

-- ---------------------------------------------------------------------
-- COURSES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title               VARCHAR(200) NOT NULL,
  description         TEXT,
  image_url           TEXT,
  category            VARCHAR(100),
  level               course_level NOT NULL DEFAULT 'beginner',
  duration_minutes    INTEGER,
  status              course_status NOT NULL DEFAULT 'draft',
  pass_percentage     INTEGER NOT NULL DEFAULT 80,   -- شرط اجتياز الاختبار النهائي
  completion_requires_all_lessons BOOLEAN NOT NULL DEFAULT TRUE,
  quiz_retake_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  reviewed_by         UUID REFERENCES users(id),
  reviewed_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);

-- ---------------------------------------------------------------------
-- COURSE SECTIONS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS course_sections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title        VARCHAR(200) NOT NULL,
  position     INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sections_course ON course_sections(course_id);

-- ---------------------------------------------------------------------
-- LESSONS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lessons (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id     UUID NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
  title          VARCHAR(200) NOT NULL,
  video_url      TEXT,
  content        TEXT,
  attachment_url TEXT,
  position       INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lessons_section ON lessons(section_id);

-- ---------------------------------------------------------------------
-- ENROLLMENTS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enrollments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  UNIQUE(student_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);

-- ---------------------------------------------------------------------
-- LESSON PROGRESS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lesson_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  lesson_id       UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed       BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at    TIMESTAMPTZ,
  last_position_seconds INTEGER DEFAULT 0,
  UNIQUE(enrollment_id, lesson_id)
);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment ON lesson_progress(enrollment_id);

-- ---------------------------------------------------------------------
-- QUIZZES  (per-lesson quiz OR final course quiz when lesson_id IS NULL)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quizzes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id    UUID REFERENCES lessons(id) ON DELETE CASCADE,
  is_final     BOOLEAN NOT NULL DEFAULT FALSE,
  title        VARCHAR(200) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quizzes_course ON quizzes(course_id);

-- ---------------------------------------------------------------------
-- QUESTIONS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id        UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  prompt         TEXT NOT NULL,
  options        JSONB NOT NULL,      -- [{ "id": "a", "text": "..." }, ...]
  correct_option_id VARCHAR(20) NOT NULL,
  points         INTEGER NOT NULL DEFAULT 1,
  position       INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_questions_quiz ON questions(quiz_id);

-- ---------------------------------------------------------------------
-- QUIZ ATTEMPTS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id      UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answers      JSONB NOT NULL,        -- { "questionId": "optionId", ... }
  score        NUMERIC(6,2) NOT NULL,
  max_score    NUMERIC(6,2) NOT NULL,
  passed       BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz ON quiz_attempts(quiz_id);

-- ---------------------------------------------------------------------
-- CERTIFICATES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS certificates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id    VARCHAR(40) NOT NULL UNIQUE,   -- e.g. CYB-2026-000001
  verification_id   VARCHAR(60) NOT NULL UNIQUE,
  student_id        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  course_id         UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  course_name_snapshot     VARCHAR(200) NOT NULL,
  student_name_snapshot    VARCHAR(200) NOT NULL,
  instructor_name_snapshot VARCHAR(200) NOT NULL,
  issue_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  completion_date   DATE NOT NULL,
  language          certificate_language NOT NULL DEFAULT 'ar',
  status            certificate_status NOT NULL DEFAULT 'valid',
  pdf_path          TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course ON certificates(course_id);

-- ---------------------------------------------------------------------
-- ARTICLES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS articles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(200) NOT NULL,
  content         TEXT NOT NULL,
  image_url       TEXT,
  category        VARCHAR(100),
  references_text TEXT,
  status          article_status NOT NULL DEFAULT 'draft',
  reviewed_by     UUID REFERENCES users(id),
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id);

-- ---------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         VARCHAR(60) NOT NULL,
  title        VARCHAR(200) NOT NULL,
  body         TEXT,
  data         JSONB,
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at);

-- ---------------------------------------------------------------------
-- AUDIT LOGS  (admin/security-relevant actions)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action       VARCHAR(100) NOT NULL,     -- e.g. 'user.login', 'course.publish'
  entity_type  VARCHAR(60),
  entity_id    UUID,
  ip_address   VARCHAR(64),
  user_agent   TEXT,
  metadata     JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- ---------------------------------------------------------------------
-- updated_at auto-touch trigger (users, courses, articles)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_courses_updated_at ON courses;
CREATE TRIGGER trg_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_articles_updated_at ON articles;
CREATE TRIGGER trg_articles_updated_at BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
