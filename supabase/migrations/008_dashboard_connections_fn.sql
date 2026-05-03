-- ============================================================
-- Migration 008: Dashboard connection functions
--
-- get_my_connections()
--   Returns all connections for the calling user, with the
--   joined family/doula profile data needed by the dashboard.
--   SECURITY DEFINER so the doula can read family_profiles for
--   *pending* connections (the existing accepted-only RLS policy
--   would block those reads otherwise).
--
-- respond_to_connection(p_connection_id, p_status)
--   Lets a doula accept or decline a pending connection.
--   Server-side auth check ensures only the correct doula can call it.
-- ============================================================

-- ── get_my_connections ────────────────────────────────────────────────────────

create or replace function public.get_my_connections()
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_uid               uuid := auth.uid();
  v_role              text;
  v_doula_profile_id  uuid;
  v_is_published      boolean;
  v_family_profile_id uuid;
  v_result            jsonb;
begin
  if v_uid is null then
    return jsonb_build_object('error', 'Not authenticated');
  end if;

  select role into v_role from profiles where id = v_uid;

  -- ── DOULA ──────────────────────────────────────────────────────────────────
  if v_role = 'doula' then

    select id, is_published
      into v_doula_profile_id, v_is_published
      from doula_profiles
     where user_id = v_uid;

    if v_doula_profile_id is null then
      return jsonb_build_object(
        'role',        'doula',
        'is_published', false,
        'connections', '[]'::jsonb
      );
    end if;

    select jsonb_build_object(
      'role',             'doula',
      'doula_profile_id', v_doula_profile_id,
      'is_published',     coalesce(v_is_published, false),
      'connections',
        coalesce(
          jsonb_agg(
            jsonb_build_object(
              'id',            c.id,
              'status',        c.status,
              'reaction_note', c.reaction_note,
              'initiated_at',  c.initiated_at,
              'responded_at',  c.responded_at,
              -- family profile fields
              'family_profile_id', fp.id,
              'due_date',          fp.due_date,
              'birth_setting',     fp.birth_setting,
              'what_they_want',    fp.what_they_want,
              'pregnancy_notes',   fp.pregnancy_notes,
              'family_video_id',   fp.intro_video_id,
              'family_name',       p.full_name,
              -- turn indicator: last message sender's user id
              'last_message_sender_id', (
                select m.sender_id
                from   messages m
                where  m.connection_id = c.id
                order  by m.created_at desc
                limit  1
              )
            )
            order by c.initiated_at desc
          ),
          '[]'::jsonb
        )
    ) into v_result
    from   connections     c
    join   family_profiles fp on fp.id = c.family_id
    join   profiles        p  on p.id  = fp.user_id
    where  c.doula_id = v_doula_profile_id;

    return v_result;

  -- ── FAMILY ─────────────────────────────────────────────────────────────────
  elsif v_role = 'family' then

    select id into v_family_profile_id
      from family_profiles
     where user_id = v_uid;

    if v_family_profile_id is null then
      return jsonb_build_object(
        'role',        'family',
        'connections', '[]'::jsonb
      );
    end if;

    select jsonb_build_object(
      'role',              'family',
      'family_profile_id', v_family_profile_id,
      'connections',
        coalesce(
          jsonb_agg(
            jsonb_build_object(
              'id',            c.id,
              'status',        c.status,
              'reaction_note', c.reaction_note,
              'initiated_at',  c.initiated_at,
              'responded_at',  c.responded_at,
              -- doula profile fields
              'doula_profile_id', dp.id,
              'doula_tagline',    dp.tagline,
              'doula_video_id',   dp.intro_video_id,
              'doula_name',       p.full_name,
              'doula_location',   p.location,
              -- turn indicator
              'last_message_sender_id', (
                select m.sender_id
                from   messages m
                where  m.connection_id = c.id
                order  by m.created_at desc
                limit  1
              )
            )
            order by c.initiated_at desc
          ),
          '[]'::jsonb
        )
    ) into v_result
    from   connections    c
    join   doula_profiles dp on dp.id = c.doula_id
    join   profiles       p  on p.id  = dp.user_id
    where  c.family_id = v_family_profile_id;

    return v_result;

  else
    return jsonb_build_object('error', 'Unknown role');
  end if;
end;
$$;

revoke execute on function public.get_my_connections() from public, anon;
grant  execute on function public.get_my_connections() to authenticated;


-- ── respond_to_connection ─────────────────────────────────────────────────────

create or replace function public.respond_to_connection(
  p_connection_id uuid,
  p_status        text    -- 'accepted' or 'declined'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid              uuid := auth.uid();
  v_doula_profile_id uuid;
begin
  if v_uid is null then
    return jsonb_build_object('error', 'Not authenticated');
  end if;

  if p_status not in ('accepted', 'declined') then
    return jsonb_build_object('error', 'Invalid status');
  end if;

  -- Confirm the calling user is the doula on this connection
  select dp.id into v_doula_profile_id
    from doula_profiles dp
    join connections    c  on c.doula_id = dp.id
   where c.id       = p_connection_id
     and dp.user_id = v_uid;

  if v_doula_profile_id is null then
    return jsonb_build_object('error', 'Not authorised');
  end if;

  update connections
     set status       = p_status,
         responded_at = now()
   where id = p_connection_id;

  return jsonb_build_object('success', true);

exception
  when others then
    return jsonb_build_object('error', sqlerrm);
end;
$$;

revoke execute on function public.respond_to_connection(uuid, text) from public, anon;
grant  execute on function public.respond_to_connection(uuid, text) to authenticated;
