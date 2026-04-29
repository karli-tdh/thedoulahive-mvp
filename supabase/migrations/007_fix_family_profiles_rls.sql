-- ============================================================
-- Migration 007: fix infinite recursion in family_profiles RLS
--
-- Root cause:
--   family_profiles "accepted doula read" policy queries connections
--   → connections "parties read" policy queries family_profiles
--   → infinite recursion
--
-- Fix:
--   Replace the recursive policy with a SECURITY DEFINER function.
--   The function runs as the function owner (postgres), which bypasses
--   RLS on every table it touches, breaking the cycle.
--   auth.uid() still resolves correctly inside SECURITY DEFINER functions.
-- ============================================================

-- ── Drop all existing family_profiles policies ────────────────────────────────

drop policy if exists "family_profiles: own read"            on public.family_profiles;
drop policy if exists "family_profiles: accepted doula read" on public.family_profiles;
drop policy if exists "family_profiles: insert own"          on public.family_profiles;
drop policy if exists "family_profiles: update own"          on public.family_profiles;

-- ── Helper: doula accepted-connection check ───────────────────────────────────
-- Checks whether the calling user (a doula) has an accepted connection to the
-- given family_profile row. Runs as function owner → no RLS on inner queries
-- → no recursion. Returns a simple boolean so policies stay readable.

create or replace function public.doula_has_accepted_connection(
  p_family_profile_id uuid
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from  public.connections   c
    join  public.doula_profiles dp on dp.id = c.doula_id
    where c.family_id = p_family_profile_id
      and c.status    = 'accepted'
      and dp.user_id  = auth.uid()
  );
$$;

-- Only authenticated users should call this (it reads auth.uid())
revoke execute on function public.doula_has_accepted_connection(uuid)
  from public, anon;
grant  execute on function public.doula_has_accepted_connection(uuid)
  to authenticated;

-- ── Recreate family_profiles policies ────────────────────────────────────────

-- Family users can read their own row
create policy "family_profiles: own read"
  on public.family_profiles for select
  to authenticated
  using ( user_id = auth.uid() );

-- Doulas with an accepted connection can read the family profile.
-- Uses the SECURITY DEFINER function — does NOT re-query family_profiles.
create policy "family_profiles: accepted doula read"
  on public.family_profiles for select
  to authenticated
  using ( public.doula_has_accepted_connection(id) );

-- Family users can insert their own row
create policy "family_profiles: insert own"
  on public.family_profiles for insert
  to authenticated
  with check ( user_id = auth.uid() );

-- Family users can update their own row
create policy "family_profiles: update own"
  on public.family_profiles for update
  to authenticated
  using  ( user_id = auth.uid() )
  with check ( user_id = auth.uid() );
