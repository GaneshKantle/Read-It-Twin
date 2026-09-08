create or replace function public.leave_room(
  p_player_id uuid,
  p_session_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  session_row public.player_sessions;
  current_player public.players;
  current_room public.rooms;
  was_host boolean;
  has_results boolean;
begin
  session_row := public.assert_player_session(p_player_id, p_session_token);

  select * into current_player from public.players where id = p_player_id;
  if current_player is null then
    raise exception 'Room not found' using errcode = 'P0002';
  end if;

  select * into current_room from public.rooms where id = current_player.room_id for update;
  if current_room is null then
    raise exception 'Room not found' using errcode = 'P0002';
  end if;

  if current_room.status in ('countdown', 'reading', 'quiz') then
    return jsonb_build_object(
      'room', to_jsonb(current_room),
      'closed', false,
      'host_left', false,
      'kept_seat', true
    );
  end if;

  was_host := current_room.host_player_id is not distinct from p_player_id;

  if current_room.status = 'results' then
    update public.players
    set wants_rematch = false
    where id = p_player_id;

    delete from public.player_sessions where player_id = p_player_id;

    update public.rooms
    set status = 'closed'
    where id = current_room.id
    returning * into current_room;

    return jsonb_build_object(
      'room', to_jsonb(current_room),
      'closed', true,
      'host_left', was_host,
      'kept_seat', false
    );
  end if;

  delete from public.player_sessions where player_id = p_player_id;

  select exists (
    select 1 from public.results r where r.player_id = p_player_id
  ) into has_results;

  if has_results then
    update public.players
    set ready = false,
        wants_rematch = false
    where id = p_player_id;

    update public.rooms
    set status = 'closed',
        host_player_id = case when was_host then null else host_player_id end
    where id = current_room.id
    returning * into current_room;

    return jsonb_build_object(
      'room', to_jsonb(current_room),
      'closed', true,
      'host_left', was_host,
      'kept_seat', false
    );
  end if;

  delete from public.players where id = p_player_id;

  if was_host and current_room.status in ('waiting', 'ready') then
    update public.rooms
    set status = 'closed',
        host_player_id = null
    where id = current_room.id
    returning * into current_room;

    return jsonb_build_object(
      'room', to_jsonb(current_room),
      'closed', true,
      'host_left', true,
      'kept_seat', false
    );
  end if;

  if current_room.status in ('waiting', 'ready') then
    update public.players
    set ready = false
    where room_id = current_room.id;

    current_room := public.sync_room_ready_status(current_room.id);
  end if;

  select * into current_room from public.rooms where id = current_room.id;

  return jsonb_build_object(
    'room', to_jsonb(current_room),
    'closed', current_room.status = 'closed',
    'host_left', false,
    'kept_seat', false
  );
end;
$$;
