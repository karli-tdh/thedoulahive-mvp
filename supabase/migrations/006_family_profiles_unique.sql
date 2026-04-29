-- ============================================================
-- Migration 006: unique constraint on family_profiles.user_id
-- Required for upsert with onConflict: 'user_id' in family onboarding.
-- Deduplicates any rows created by create_connection before this runs.
-- ============================================================

-- Remove any duplicate rows (keep the earliest one per user)
delete from public.family_profiles
where id in (
  select id from (
    select id,
           row_number() over (
             partition by user_id
             order by created_at
           ) as rn
    from public.family_profiles
  ) ranked
  where rn > 1
);

alter table public.family_profiles
  add constraint family_profiles_user_id_key unique (user_id);
