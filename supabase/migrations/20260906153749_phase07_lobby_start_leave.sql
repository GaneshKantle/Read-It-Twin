create or replace function public.set_player_ready(
  p_player_id uuid,
  p_session_token uuid,
  p_ready boolean
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
begin
  session_row := public.assert_player_session(p_player_id, p_session_token);
  select * into current_player from public.players where id = p_player_id for update;
  if current_player is null then
    raise exception 'Room not found' using errcode = 'P0002';
  end if;
  select * into current_room from public.rooms where id = current_player.room_id for update;
  if current_room is null then
    raise exception 'Room not found' using errcode = 'P0002';
  end if;
  if current_room.expires_at <= now() then
    if current_room.status <> 'closed' then
      update public.rooms set status = 'closed' where id = current_room.id returning * into current_room;
    end if;
    raise exception 'Room expired' using errcode = 'P0001';
  end if;
  if current_room.status not in ('waiting', 'ready') then
    raise exception 'Room closed' using errcode = 'P0006';
  end if;
  update public.players set ready = coalesce(p_ready, false) where id = p_player_id returning * into current_player;
  current_room := public.sync_room_ready_status(current_room.id);
  return jsonb_build_object('room', to_jsonb(current_room), 'player', to_jsonb(current_player));
end;
$$;

create or replace function public.start_match(
  p_room_id uuid,
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
  current_room public.rooms;
  player_count integer;
  ready_count integer;
  passage uuid;
  created_match public.matches;
  existing_match public.matches;
begin
  session_row := public.assert_player_session(p_player_id, p_session_token);
  if session_row.room_id <> p_room_id then
    raise exception 'Invalid session' using errcode = 'P0004';
  end if;
  select * into current_room from public.rooms where id = p_room_id for update;
  if current_room is null then
    raise exception 'Room not found' using errcode = 'P0002';
  end if;
  if current_room.expires_at <= now() then
    if current_room.status <> 'closed' then
      update public.rooms set status = 'closed' where id = current_room.id returning * into current_room;
    end if;
    raise exception 'Room expired' using errcode = 'P0001';
  end if;
  if current_room.status = 'countdown' then
    select * into existing_match from public.matches
    where room_id = p_room_id and completed_at is null
    order by started_at desc limit 1;
    return jsonb_build_object('room', to_jsonb(current_room), 'match', to_jsonb(existing_match));
  end if;
  if current_room.status not in ('waiting', 'ready') then
    raise exception 'Room closed' using errcode = 'P0006';
  end if;
  if current_room.host_player_id is distinct from p_player_id then
    raise exception 'Not host' using errcode = 'P0007';
  end if;
  select count(*)::integer, count(*) filter (where ready)::integer
  into player_count, ready_count from public.players where room_id = p_room_id;
  if player_count <> 2 or ready_count <> 2 then
    raise exception 'Players not ready' using errcode = 'P0008';
  end if;
  passage := current_room.passage_id;
  if passage is null then
    select id into passage from public.passages order by random() limit 1;
    if passage is null then
      raise exception 'Passage not found' using errcode = 'P0002';
    end if;
  end if;
  insert into public.matches (room_id, passage_id) values (p_room_id, passage) returning * into created_match;
  update public.rooms set status = 'countdown', passage_id = passage where id = p_room_id returning * into current_room;
  return jsonb_build_object('room', to_jsonb(current_room), 'match', to_jsonb(created_match));
end;
$$;

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
  was_host := current_room.host_player_id is not distinct from p_player_id;
  delete from public.player_sessions where player_id = p_player_id;
  delete from public.players where id = p_player_id;
  if was_host and current_room.status in ('waiting', 'ready') then
    update public.rooms set status = 'closed', host_player_id = null where id = current_room.id returning * into current_room;
    return jsonb_build_object('room', to_jsonb(current_room), 'closed', true, 'host_left', true);
  end if;
  if current_room.status in ('waiting', 'ready') then
    update public.players set ready = false where room_id = current_room.id;
    current_room := public.sync_room_ready_status(current_room.id);
  end if;
  select * into current_room from public.rooms where id = current_room.id;
  return jsonb_build_object('room', to_jsonb(current_room), 'closed', current_room.status = 'closed', 'host_left', false);
end;
$$;

create or replace function public.get_room_by_code(p_room_code text)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  code text := upper(trim(p_room_code));
  current_room public.rooms;
begin
  if code is null or code = '' then
    raise exception 'Room not found' using errcode = 'P0002';
  end if;
  select * into current_room from public.rooms where room_code = code;
  if current_room is null then
    raise exception 'Room not found' using errcode = 'P0002';
  end if;
  if current_room.expires_at <= now() and current_room.status <> 'closed' then
    update public.rooms set status = 'closed' where id = current_room.id returning * into current_room;
  end if;
  return current_room;
end;
$$;
