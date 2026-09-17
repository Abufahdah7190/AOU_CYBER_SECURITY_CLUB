-- Server-side enforcement of "AOU students only" registration.
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- Why this is needed: js/auth.js only checks the email domain in the
-- browser. Anyone who opens devtools and calls
-- `supabaseClient.auth.signUp({ email: 'anyone@gmail.com', ... })`
-- directly bypasses that check completely, because nothing on the
-- server ever validates the domain. This trigger closes that gap by
-- rejecting the INSERT into auth.users itself, so no client-side
-- bypass is possible.
begin;

create or replace function public.enforce_university_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null or lower(new.email) !~ '^[^\s@]+@aou\.edu\.sa$' then
    raise exception 'الموقع متاح فقط لطلاب الجامعة العربية المفتوحة بالبريد الجامعي الرسمي'
      using errcode = '23514'; -- check_violation: the client can detect this code specifically.
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_university_email_before_insert on auth.users;
create trigger enforce_university_email_before_insert
before insert on auth.users
for each row execute function public.enforce_university_email();

-- Also cover email changes on existing accounts (e.g. someone with a
-- confirmed university account trying to switch their login email to
-- a personal one later).
drop trigger if exists enforce_university_email_before_update on auth.users;
create trigger enforce_university_email_before_update
before update of email on auth.users
for each row execute function public.enforce_university_email();

commit;
