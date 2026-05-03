-- ============================================================
-- Migration 009: Conversation thread
--
-- 1. Add phone + website to doula_profiles
-- 2. Extend messages.message_type to include 'contact_share'
-- 3. get_conversation_thread() — SECURITY DEFINER function that
--    returns all thread data for a single connection.
--    Bypasses RLS so both parties can read each other's profile
--    data regardless of connection status edge cases.
-- ============================================================

-- ── doula_profiles: contact fields ───────────────────────────────────────────

alter table public.doula_profiles
  add column if not exists phone   text,
  add column if not exists website text;

-- ── messages: extend message_type ────────────────────────────────────────────

alter table public.messages
  drop constraint if exists messages_message_type_check;

alter table public.messages
  add constraint messages_message_type_check
  check (message_type in ('video', 'text', 'contact_share'));

-- ── get_conversation_thread ───────────────────────────────────────────────────

create or replace function public.get_conversation_thread(
  p_connection_id uuid
)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_uid            uuid := auth.uid();
  v_doula_user_id  uuid;
  v_family_user_id uuid;
  v_status         text;
  v_role           text;
  v_other_name     text;
  v_other_location text;
  v_my_name        text;
begin
  if v_uid is null then
    return jsonb_build_object('error', 'Not authenticated');
  end if;

  -- Verify the caller is a party to this connection
  select c.status, dp.user_id, fp.user_id
    into v_status, v_doula_user_id, v_family_user_id
    from connections     c
    join doula_profiles  dp on dp.id = c.doula_id
    join family_profiles fp on fp.id = c.family_id
   where c.id = p_connection_id
     and (dp.user_id = v_uid or fp.user_id = v_uid);

  if not found then
    return jsonb_build_object('error', 'Not found');
  end if;

  if v_status != 'accepted' then
    return jsonb_build_object('error', 'Connection not accepted');
  end if;

  -- Determine role and other-party name/location
  if v_doula_user_id = v_uid then
    v_role := 'doula';
    select full_name, location
      into v_other_name, v_other_location
      from profiles where id = v_family_user_id;
  else
    v_role := 'family';
    select full_name, location
      into v_other_name, v_other_location
      from profiles where id = v_doula_user_id;
  end if;

  select full_name into v_my_name from profiles where id = v_uid;

  return jsonb_build_object(
    'role',              v_role,
    'other_name',        v_other_name,
    'other_location',    v_other_location,
    'current_user_name', v_my_name,
    'connection_id',     p_connection_id,

    -- All messages, oldest first, with sender name resolved
    'messages', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id',           m.id,
            'sender_id',    m.sender_id,
            'sender_name',  p.full_name,
            'message_type', m.message_type,
            'video_id',     m.video_id,
            'video_url',    m.video_url,
            'body',         m.body,
            'created_at',   m.created_at,
            'is_mine',      (m.sender_id = v_uid)
          )
          order by m.created_at asc
        )
        from messages m
        join profiles p on p.id = m.sender_id
       where m.connection_id = p_connection_id
      ),
      '[]'::jsonb
    ),

    -- Doula's shareable contact info (only returned to the doula themselves)
    'doula_contact', case
      when v_role = 'doula' then jsonb_build_object(
        'phone',   (select phone   from doula_profiles where user_id = v_uid),
        'email',   (select email   from profiles       where id      = v_uid),
        'website', (select website from doula_profiles where user_id = v_uid)
      )
      else null
    end
  );
end;
$$;

revoke execute on function public.get_conversation_thread(uuid) from public, anon;
grant  execute on function public.get_conversation_thread(uuid) to authenticated;
