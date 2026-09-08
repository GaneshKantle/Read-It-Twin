create or replace function public.create_room_and_join(
  p_nickname text,
  p_client_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  trimmed text := trim(p_nickname);
  created_room public.rooms;
  created_player public.players;
  created_session public.player_sessions;
begin
  if p_client_id is null then
    raise exception 'Client id required' using errcode = 'P0004';
  end if;
  if trimmed is null or char_length(trimmed) < 1 or char_length(trimmed) > 24 then
    raise exception 'Nickname required' using errcode = 'P0005';
  end if;
  insert into public.rooms (room_code)
  values (public.generate_room_code())
  returning * into created_room;
  insert into public.players (room_id, nickname)
  values (created_room.id, trimmed)
  returning * into created_player;
  update public.rooms
  set host_player_id = created_player.id
  where id = created_room.id
  returning * into created_room;
  insert into public.player_sessions (player_id, room_id, client_id)
  values (created_player.id, created_room.id, p_client_id)
  returning * into created_session;
  return jsonb_build_object(
    'room', to_jsonb(created_room),
    'player', to_jsonb(created_player),
    'session_token', created_session.session_token
  );
end;
$$;

create or replace function public.join_room(
  p_room_code text,
  p_nickname text,
  p_client_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  trimmed text := trim(p_nickname);
  code text := upper(trim(p_room_code));
  current_room public.rooms;
  existing_session public.player_sessions;
  existing_player public.players;
  created_player public.players;
  created_session public.player_sessions;
  player_count integer;
begin
  if p_client_id is null then
    raise exception 'Client id required' using errcode = 'P0004';
  end if;
  if code is null or code = '' then
    raise exception 'Room not found' using errcode = 'P0002';
  end if;
  select * into current_room from public.rooms where room_code = code for update;
  if current_room is null then
    raise exception 'Room not found' using errcode = 'P0002';
  end if;
  if current_room.expires_at <= now() then
    if current_room.status <> 'closed' then
      update public.rooms set status = 'closed' where id = current_room.id returning * into current_room;
    end if;
    raise exception 'Room expired' using errcode = 'P0001';
  end if;
  if current_room.status = 'closed' then
    raise exception 'Room closed' using errcode = 'P0006';
  end if;
  select * into existing_session from public.player_sessions where room_id = current_room.id and client_id = p_client_id;
  if existing_session is not null then
    select * into existing_player from public.players where id = existing_session.player_id;
    if existing_player is null then
      raise exception 'Room not found' using errcode = 'P0002';
    end if;
    if current_room.status in ('waiting', 'ready')
       and trimmed is not null
       and char_length(trimmed) between 1 and 24
       and existing_player.nickname is distinct from trimmed then
      update public.players set nickname = trimmed where id = existing_player.id returning * into existing_player;
    end if;
    return jsonb_build_object(
      'room', to_jsonb(current_room),
      'player', to_jsonb(existing_player),
      'session_token', existing_session.session_token
    );
  end if;
  if current_room.status not in ('waiting', 'ready') then
    raise exception 'Room closed' using errcode = 'P0006';
  end if;
  if trimmed is null or char_length(trimmed) < 1 or char_length(trimmed) > 24 then
    raise exception 'Nickname required' using errcode = 'P0005';
  end if;
  select count(*)::integer into player_count from public.players where room_id = current_room.id;
  if player_count >= 2 then
    raise exception 'Room full' using errcode = 'P0003';
  end if;
  insert into public.players (room_id, nickname) values (current_room.id, trimmed) returning * into created_player;
  if current_room.host_player_id is null then
    update public.rooms set host_player_id = created_player.id where id = current_room.id returning * into current_room;
  end if;
  insert into public.player_sessions (player_id, room_id, client_id)
  values (created_player.id, current_room.id, p_client_id)
  returning * into created_session;
  perform public.sync_room_ready_status(current_room.id);
  select * into current_room from public.rooms where id = current_room.id;
  return jsonb_build_object(
    'room', to_jsonb(current_room),
    'player', to_jsonb(created_player),
    'session_token', created_session.session_token
  );
end;
$$;
