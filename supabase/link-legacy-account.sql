-- Administrator-only recovery. Use after migrations, in Supabase SQL Editor.
-- Check the member's identity independently: email ownership is NOT established
-- by signup when confirmation is disabled. Never run bulk email-based linking.
-- Replace both UUIDs after inspecting auth.users and public.users.
-- Leaves all certificates/progress attached to their existing student UUID.
BEGIN;
DO $$
DECLARE
  auth_id uuid := '00000000-0000-0000-0000-000000000000';
  legacy_id uuid := '00000000-0000-0000-0000-000000000000';
BEGIN
  IF auth_id='00000000-0000-0000-0000-000000000000' OR legacy_id='00000000-0000-0000-0000-000000000000' THEN
    RAISE EXCEPTION 'Replace UUID placeholders after independently verifying the member';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id=auth_id AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Supabase account not found';
  END IF;
  PERFORM 1 FROM public.users WHERE id=legacy_id AND is_active=true FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Active legacy student not found'; END IF;
  IF auth_id<>legacy_id AND EXISTS(SELECT 1 FROM public.users WHERE id=auth_id) THEN
    RAISE EXCEPTION 'Both local identities exist; review their records before merging';
  END IF;
  INSERT INTO public.supabase_identity_links(auth_user_id,student_id)
    VALUES(auth_id,legacy_id);
  -- Conflicting links fail atomically; never silently overwrite ownership.
END $$;
COMMIT;
