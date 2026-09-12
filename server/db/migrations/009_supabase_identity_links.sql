-- Explicit administrator-reviewed identity links preserve legacy student IDs.
CREATE TABLE IF NOT EXISTS public.supabase_identity_links (
  auth_user_id uuid PRIMARY KEY,
  student_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  linked_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.supabase_identity_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.supabase_identity_links FROM PUBLIC;
-- No browser policies. Only the backend owner connection may resolve links.
