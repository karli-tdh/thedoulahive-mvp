-- ============================================================
-- Migration 004: allow anonymous users to read profiles for
-- published doulas (required for /doulas browse + profile pages)
-- ============================================================

-- The existing "profiles: authenticated read" policy only covers
-- logged-in users. Families browsing before sign-up would get no
-- names or locations. This policy extends read access to the anon
-- role, but only for profiles that have a published doula profile.

create policy "profiles: public read for published doulas"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.doula_profiles dp
      where dp.user_id   = profiles.id
        and dp.is_published = true
    )
  );
