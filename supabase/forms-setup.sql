-- Run once in your Supabase project's SQL Editor. Safe to rerun.
-- Existing submissions are preserved. These tables are private inboxes.
begin;

create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text, email text, phone text, message text
);
create table if not exists public.join_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text, email text, phone text, major text, reason_to_join text
);

alter table public.suggestions
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists name text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists message text;
alter table public.join_applications
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists name text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists major text,
  add column if not exists reason_to_join text;

-- Older setup instructions called the join reason "message". Preserve that
-- column and historical data, but don't require it on new submissions.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public'
    and table_name = 'join_applications' and column_name = 'message') then
    execute 'update public.join_applications set reason_to_join = message where reason_to_join is null';
    execute 'alter table public.join_applications alter column message drop not null';
  end if;
end $$;

alter table public.suggestions enable row level security;
alter table public.join_applications enable row level security;

-- Replace old policies on these two inbox tables only. There must be no
-- public SELECT policy exposing names, email addresses or phone numbers.
do $$
declare p record;
begin
  for p in select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public' and tablename in ('suggestions', 'join_applications')
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

revoke all on public.suggestions, public.join_applications from public, anon, authenticated;
-- Revoke any legacy column-level grants too.
do $$
declare t text; cols text;
begin
  foreach t in array array['suggestions', 'join_applications'] loop
    select string_agg(quote_ident(column_name), ', ') into cols
      from information_schema.columns where table_schema = 'public' and table_name = t;
    execute format('revoke select (%s), insert (%s), update (%s), references (%s) on public.%I from public, anon, authenticated', cols, cols, cols, cols, t);
  end loop;
end $$;
grant usage on schema public to anon, authenticated;
grant insert (name, email, phone, message) on public.suggestions to anon, authenticated;
grant insert (name, email, phone, major, reason_to_join) on public.join_applications to anon, authenticated;

create policy inbox_submit_suggestion on public.suggestions
  for insert to anon, authenticated with check (
    name is not null and char_length(btrim(name)) between 2 and 120
    and email is not null and char_length(email) <= 254
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
    and phone is not null and phone ~ '^[+]?[0-9]{8,15}$'
    and message is not null and char_length(btrim(message)) between 10 and 4000
  );
create policy inbox_submit_join on public.join_applications
  for insert to anon, authenticated with check (
    name is not null and char_length(btrim(name)) between 2 and 120
    and email is not null and char_length(email) <= 254
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
    and phone is not null and phone ~ '^[+]?[0-9]{8,15}$'
    and major is not null and char_length(btrim(major)) between 2 and 160
    and reason_to_join is not null and char_length(btrim(reason_to_join)) between 10 and 4000
  );

-- Support existing serial/identity IDs as well as newly created UUID IDs.
do $$
declare t text; seq text;
begin
  foreach t in array array['suggestions', 'join_applications'] loop
    seq := pg_get_serial_sequence('public.' || t, 'id');
    if seq is not null then
      execute format('grant usage on sequence %s to anon, authenticated', seq);
    end if;
  end loop;
end $$;
notify pgrst, 'reload schema';
commit;
