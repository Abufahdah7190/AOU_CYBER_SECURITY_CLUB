-- The Node server connects as the table owner (or a dedicated BYPASSRLS role).
-- Supabase browser roles must never read password hashes or forge learning records.
DO $$
DECLARE t text; r text; cols text; p record;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','refresh_tokens','password_reset_tokens','courses','course_sections',
    'lessons','enrollments','lesson_progress','quizzes','questions','quiz_attempts',
    'certificates','articles','notifications','audit_logs','student_course_progress',
    'student_course_certificates','verified_lesson_results','supabase_identity_links',
    'learning_foundation_courses','learning_foundation_lessons',
    'learning_foundation_lesson_progress','learning_foundation_quiz_attempts',
    'learning_foundation_import_runs','schema_migrations'
  ] LOOP
    IF to_regclass('public.' || t) IS NULL THEN CONTINUE; END IF;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', p.policyname,t);
    END LOOP;
    SELECT string_agg(quote_ident(column_name), ', ') INTO cols
      FROM information_schema.columns WHERE table_schema='public' AND table_name=t;
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC', t);
    EXECUTE format('REVOKE SELECT (%s), INSERT (%s), UPDATE (%s), REFERENCES (%s) ON public.%I FROM PUBLIC',cols,cols,cols,cols,t);
    FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=r) THEN
        EXECUTE format('REVOKE ALL ON public.%I FROM %I',t,r);
        EXECUTE format('REVOKE SELECT (%s), INSERT (%s), UPDATE (%s), REFERENCES (%s) ON public.%I FROM %I',cols,cols,cols,cols,t,r);
      END IF;
    END LOOP;
  END LOOP;
END $$;
