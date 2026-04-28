-- ============================================================
-- Migration 002: doula_profile improvements
-- ============================================================

-- Add clients_supported text column (replaces the integer years_experience
-- field for the "Clients supported" range selector in onboarding)
alter table public.doula_profiles
  add column if not exists clients_supported text;

-- Enforce one doula_profile per user — required for upsert with onConflict
alter table public.doula_profiles
  add constraint doula_profiles_user_id_key unique (user_id);
