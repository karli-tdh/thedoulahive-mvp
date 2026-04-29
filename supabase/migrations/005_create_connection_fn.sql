-- ============================================================
-- Migration 005: SECURITY DEFINER function for creating connections
--
-- Why: The client-side RLS chain (connections → family_profiles → auth.uid())
-- is fragile when auth.uid() doesn't resolve inside PostgREST during a
-- server-side session refresh. A SECURITY DEFINER function runs as the
-- function owner, bypassing RLS, while still having access to auth.uid()
-- from the JWT claims — giving us one reliable, atomic operation.
-- ============================================================

create or replace function public.create_connection(
  p_doula_profile_id uuid,
  p_reaction_note    text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid               uuid := auth.uid();
  v_role              text;
  v_family_profile_id uuid;
begin
  -- Must be authenticated
  if v_uid is null then
    return jsonb_build_object('error', 'Not authenticated');
  end if;

  -- Must be a family account
  select role into v_role
  from profiles
  where id = v_uid;

  if v_role is distinct from 'family' then
    return jsonb_build_object('error', 'Only family accounts can connect with doulas');
  end if;

  -- Get existing family_profiles row
  select id into v_family_profile_id
  from family_profiles
  where user_id = v_uid;

  -- Create a minimal one if it doesn't exist yet
  if v_family_profile_id is null then
    insert into family_profiles (user_id)
    values (v_uid)
    returning id into v_family_profile_id;
  end if;

  -- Insert connection; silently ignore if already sent (unique constraint)
  begin
    insert into connections (family_id, doula_id, reaction_note, status)
    values (v_family_profile_id, p_doula_profile_id, p_reaction_note, 'pending');
  exception
    when unique_violation then
      null; -- already connected — not an error
  end;

  return jsonb_build_object('success', true);

exception
  when others then
    return jsonb_build_object('error', sqlerrm);
end;
$$;

-- Only authenticated users can call this
revoke execute on function public.create_connection(uuid, text) from public, anon;
grant  execute on function public.create_connection(uuid, text) to authenticated;
