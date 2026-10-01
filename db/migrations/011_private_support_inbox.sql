-- Public submissions now use the validated, rate-limited Node endpoints.
CREATE TABLE IF NOT EXISTS public.suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), created_at timestamptz NOT NULL DEFAULT now(),
  name text, email text, phone text, message text
);
CREATE TABLE IF NOT EXISTS public.join_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), created_at timestamptz NOT NULL DEFAULT now(),
  name text, email text, phone text, major text, reason_to_join text
);
ALTER TABLE public.join_applications ADD COLUMN IF NOT EXISTS reason_to_join text;
DO $$
DECLARE t text; cols text; r text; p record;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='join_applications' AND column_name='message') THEN
    EXECUTE 'UPDATE public.join_applications SET reason_to_join=message WHERE reason_to_join IS NULL';
    EXECUTE 'ALTER TABLE public.join_applications ALTER COLUMN message DROP NOT NULL';
  END IF;
  FOREACH t IN ARRAY ARRAY['suggestions','join_applications'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY %I ON public.%I',p.policyname,t);
    END LOOP;
    SELECT string_agg(quote_ident(column_name),', ') INTO cols FROM information_schema.columns WHERE table_schema='public' AND table_name=t;
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC',t);
    EXECUTE format('REVOKE SELECT (%s), INSERT (%s), UPDATE (%s), REFERENCES (%s) ON public.%I FROM PUBLIC',cols,cols,cols,cols,t);
    FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
      IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN
        EXECUTE format('REVOKE ALL ON public.%I FROM %I',t,r);
        EXECUTE format('REVOKE SELECT (%s), INSERT (%s), UPDATE (%s), REFERENCES (%s) ON public.%I FROM %I',cols,cols,cols,cols,t,r);
      END IF;
    END LOOP;
  END LOOP;
END $$;
