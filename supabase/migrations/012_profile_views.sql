-- ============================================================
-- 012 — Profile views tracking
-- ============================================================

create table if not exists public.profile_views (
  id         uuid        primary key default gen_random_uuid(),
  doula_id   uuid        not null references public.doula_profiles(id) on delete cascade,
  viewer_id  uuid        references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.profile_views enable row level security;

-- Doulas can read their own view counts
create policy "profile_views: doula read own"
  on public.profile_views
  for select
  to authenticated
  using (
    doula_id in (
      select id from public.doula_profiles where user_id = auth.uid()
    )
  );

-- Any authenticated user can insert a view
create policy "profile_views: authenticated insert"
  on public.profile_views
  for insert
  to authenticated
  with check (true);
