-- ============================================================
-- 011 — Access code gate + circle_verified flag
-- ============================================================

-- ── access_codes table ────────────────────────────────────────────────────────

create table if not exists public.access_codes (
  id          uuid        primary key default gen_random_uuid(),
  code        text        not null,
  is_active   boolean     not null default true,
  expires_at  timestamptz not null
);

alter table public.access_codes enable row level security;

-- Any authenticated user may read (needed to validate their code via server action)
create policy "access_codes: authenticated read"
  on public.access_codes
  for select
  to authenticated
  using (true);

-- ── Add circle_verified to doula_profiles ─────────────────────────────────────

alter table public.doula_profiles
  add column if not exists circle_verified boolean not null default false;
