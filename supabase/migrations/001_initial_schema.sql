-- ============================================================
-- The Doula Hive — Initial Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

-- profiles: one row per auth user, shared by both roles
create table public.profiles (
  id           uuid references auth.users on delete cascade primary key,
  role         text check (role in ('doula', 'family')) not null,
  full_name    text,
  email        text,
  avatar_url   text,
  location     text,
  created_at   timestamptz default now()
);

-- doula_profiles: extended data for doulas
create table public.doula_profiles (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references public.profiles(id) on delete cascade not null,
  tagline            text,
  bio                text,
  intro_video_url    text,
  intro_video_id     text,
  years_experience   integer,
  training_body      text,
  languages          text[],
  specialisms        text[],
  support_types      text[],
  birth_settings     text[],
  travel_radius_km   integer,
  price_range        text,
  availability       text,
  is_published       boolean default false,
  created_at         timestamptz default now()
);

-- family_profiles: extended data for families
create table public.family_profiles (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.profiles(id) on delete cascade not null,
  due_date          date,
  birth_setting     text,
  pregnancy_notes   text,
  intro_video_url   text,
  intro_video_id    text,
  what_they_want    text,
  created_at        timestamptz default now()
);

-- connections: a family expressing interest in a doula
create table public.connections (
  id             uuid primary key default gen_random_uuid(),
  family_id      uuid references public.family_profiles(id) on delete cascade not null,
  doula_id       uuid references public.doula_profiles(id) on delete cascade not null,
  status         text check (status in ('pending', 'accepted', 'declined')) not null default 'pending',
  reaction_note  text,
  initiated_at   timestamptz default now(),
  responded_at   timestamptz,
  unique (family_id, doula_id)
);

-- messages: video or text messages within a connection
create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  connection_id   uuid references public.connections(id) on delete cascade not null,
  sender_id       uuid references public.profiles(id) on delete cascade not null,
  message_type    text check (message_type in ('video', 'text')) not null,
  video_url       text,
  video_id        text,
  body            text,
  created_at      timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index on public.doula_profiles (user_id);
create index on public.doula_profiles (is_published);
create index on public.family_profiles (user_id);
create index on public.connections (family_id);
create index on public.connections (doula_id);
create index on public.connections (status);
create index on public.messages (connection_id);
create index on public.messages (sender_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles       enable row level security;
alter table public.doula_profiles enable row level security;
alter table public.family_profiles enable row level security;
alter table public.connections    enable row level security;
alter table public.messages       enable row level security;

-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------

-- Anyone authenticated can read any profile (needed for messaging UI etc.)
create policy "profiles: authenticated read"
  on public.profiles for select
  to authenticated
  using (true);

-- Users can only insert their own profile
create policy "profiles: insert own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- Users can only update their own profile
create policy "profiles: update own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ------------------------------------------------------------
-- doula_profiles
-- ------------------------------------------------------------

-- Published doula profiles are readable by everyone (including anonymous)
create policy "doula_profiles: public read when published"
  on public.doula_profiles for select
  using (is_published = true);

-- Doulas can always read their own profile (even unpublished)
create policy "doula_profiles: own read"
  on public.doula_profiles for select
  to authenticated
  using (user_id = auth.uid());

-- Doulas can insert their own profile
create policy "doula_profiles: insert own"
  on public.doula_profiles for insert
  to authenticated
  with check (user_id = auth.uid());

-- Doulas can update their own profile
create policy "doula_profiles: update own"
  on public.doula_profiles for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ------------------------------------------------------------
-- family_profiles
-- ------------------------------------------------------------

-- Families can read their own profile
create policy "family_profiles: own read"
  on public.family_profiles for select
  to authenticated
  using (user_id = auth.uid());

-- Doulas with an accepted connection can read the family profile
create policy "family_profiles: accepted doula read"
  on public.family_profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.connections c
      join public.doula_profiles dp on dp.id = c.doula_id
      where c.family_id = family_profiles.id
        and c.status    = 'accepted'
        and dp.user_id  = auth.uid()
    )
  );

-- Families can insert their own profile
create policy "family_profiles: insert own"
  on public.family_profiles for insert
  to authenticated
  with check (user_id = auth.uid());

-- Families can update their own profile
create policy "family_profiles: update own"
  on public.family_profiles for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ------------------------------------------------------------
-- connections
-- ------------------------------------------------------------

-- Both parties in a connection can read it
create policy "connections: parties read"
  on public.connections for select
  to authenticated
  using (
    -- the family side
    exists (
      select 1 from public.family_profiles fp
      where fp.id = connections.family_id
        and fp.user_id = auth.uid()
    )
    or
    -- the doula side
    exists (
      select 1 from public.doula_profiles dp
      where dp.id = connections.doula_id
        and dp.user_id = auth.uid()
    )
  );

-- Only families can initiate a connection
create policy "connections: family insert"
  on public.connections for insert
  to authenticated
  with check (
    exists (
      select 1 from public.family_profiles fp
      where fp.id = connections.family_id
        and fp.user_id = auth.uid()
    )
  );

-- Only the doula can update status (accept / decline)
create policy "connections: doula update status"
  on public.connections for update
  to authenticated
  using (
    exists (
      select 1 from public.doula_profiles dp
      where dp.id = connections.doula_id
        and dp.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- messages
-- ------------------------------------------------------------

-- Only the two parties in the connection can read messages
create policy "messages: parties read"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1
      from public.connections c
      join public.family_profiles fp on fp.id = c.family_id
      join public.doula_profiles  dp on dp.id = c.doula_id
      where c.id = messages.connection_id
        and (fp.user_id = auth.uid() or dp.user_id = auth.uid())
    )
  );

-- Only the two parties in the connection can send messages
create policy "messages: parties insert"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.connections c
      join public.family_profiles fp on fp.id = c.family_id
      join public.doula_profiles  dp on dp.id = c.doula_id
      where c.id = messages.connection_id
        and c.status = 'accepted'
        and (fp.user_id = auth.uid() or dp.user_id = auth.uid())
    )
  );

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGN-UP
-- ============================================================

-- Trigger function: fires after a new auth.users row is inserted
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    -- role is passed as a user_metadata field during sign-up
    coalesce(new.raw_user_meta_data->>'role', 'family')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
