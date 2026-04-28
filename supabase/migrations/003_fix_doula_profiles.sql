-- ============================================================
-- Migration 003: fix doula_profiles schema issues
-- Safe to run regardless of whether 002 was applied.
-- ============================================================

-- 1. Fix training_body: was incorrectly typed as text, should be text[]
alter table public.doula_profiles
  alter column training_body type text[]
  using case when training_body is null then null else array[training_body] end;

-- 2. Add clients_supported if not already present (from migration 002)
alter table public.doula_profiles
  add column if not exists clients_supported text;

-- 3. Add unique constraint on user_id if not already present (from migration 002)
--    Required for upsert with onConflict: 'user_id' to work
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'doula_profiles_user_id_key'
      and conrelid = 'public.doula_profiles'::regclass
  ) then
    alter table public.doula_profiles
      add constraint doula_profiles_user_id_key unique (user_id);
  end if;
end $$;
