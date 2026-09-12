-- Keep the lobby open when the host leaves waiting/ready so they can rejoin.
-- Only close when the last player leaves. A later join restores host_player_id.

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
  remaining integer;
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
    set status = 'closed',
        last_left_nickname = current_player.nickname,
        last_left_at = now(),
        last_left_was_host = was_host
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
        host_player_id = case when was_host then null else host_player_id end,
        last_left_nickname = current_player.nickname,
        last_left_at = now(),
        last_left_was_host = was_host
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

  select count(*)::integer into remaining
  from public.players
  where room_id = current_room.id;

  if remaining = 0 then
    update public.rooms
    set status = 'closed',
        host_player_id = null,
        last_left_nickname = current_player.nickname,
        last_left_at = now(),
        last_left_was_host = was_host
    where id = current_room.id
    returning * into current_room;

    return jsonb_build_object(
      'room', to_jsonb(current_room),
      'closed', true,
      'host_left', was_host,
      'kept_seat', false
    );
  end if;

  update public.rooms
  set host_player_id = case when was_host then null else host_player_id end,
      last_left_nickname = current_player.nickname,
      last_left_at = now(),
      last_left_was_host = was_host
  where id = current_room.id
  returning * into current_room;

  if current_room.status in ('waiting', 'ready') then
    update public.players
    set ready = false
    where room_id = current_room.id;

    current_room := public.sync_room_ready_status(current_room.id);
  end if;

  return jsonb_build_object(
    'room', to_jsonb(current_room),
    'closed', false,
    'host_left', was_host,
    'kept_seat', false
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
  nickname_taken boolean;
begin
  if p_client_id is null then
    raise exception 'Client id required' using errcode = 'P0004';
  end if;

  if code is null or code = '' then
    raise exception 'Room not found' using errcode = 'P0002';
  end if;

  select * into current_room
  from public.rooms
  where room_code = code
  for update;

  if current_room is null then
    raise exception 'Room not found' using errcode = 'P0002';
  end if;

  if current_room.expires_at <= now() then
    if current_room.status <> 'closed' then
      update public.rooms
      set status = 'closed'
      where id = current_room.id
      returning * into current_room;
    end if;
    raise exception 'Room expired' using errcode = 'P0001';
  end if;

  if current_room.status = 'closed' then
    raise exception 'Room closed' using errcode = 'P0006';
  end if;

  select * into existing_session
  from public.player_sessions
  where room_id = current_room.id
    and client_id = p_client_id;

  if existing_session is not null then
    select * into existing_player
    from public.players
    where id = existing_session.player_id;

    if existing_player is null then
      raise exception 'Room not found' using errcode = 'P0002';
    end if;

    if current_room.status in ('waiting', 'ready')
       and trimmed is not null
       and char_length(trimmed) between 1 and 24
       and existing_player.nickname is distinct from trimmed then
      select exists (
        select 1
        from public.players p
        where p.room_id = current_room.id
          and p.id <> existing_player.id
          and lower(p.nickname) = lower(trimmed)
      ) into nickname_taken;

      if nickname_taken then
        raise exception 'Nickname taken' using errcode = 'P0017';
      end if;

      update public.players
      set nickname = trimmed
      where id = existing_player.id
      returning * into existing_player;
    end if;

    if current_room.host_player_id is null then
      update public.rooms
      set host_player_id = existing_player.id,
          last_left_nickname = null,
          last_left_at = null,
          last_left_was_host = false
      where id = current_room.id
      returning * into current_room;
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

  select count(*)::integer into player_count
  from public.players
  where room_id = current_room.id;

  if player_count >= 2 then
    raise exception 'Room full' using errcode = 'P0003';
  end if;

  select exists (
    select 1
    from public.players p
    where p.room_id = current_room.id
      and lower(p.nickname) = lower(trimmed)
  ) into nickname_taken;

  if nickname_taken then
    raise exception 'Nickname taken' using errcode = 'P0017';
  end if;

  insert into public.players (room_id, nickname)
  values (current_room.id, trimmed)
  returning * into created_player;

  insert into public.player_sessions (player_id, room_id, client_id)
  values (created_player.id, current_room.id, p_client_id)
  returning * into created_session;

  update public.rooms
  set host_player_id = coalesce(host_player_id, created_player.id),
      last_left_nickname = null,
      last_left_at = null,
      last_left_was_host = false
  where id = current_room.id
  returning * into current_room;

  perform public.sync_room_ready_status(current_room.id);

  select * into current_room
  from public.rooms
  where id = current_room.id;

  return jsonb_build_object(
    'room', to_jsonb(current_room),
    'player', to_jsonb(created_player),
    'session_token', created_session.session_token
  );
end;
$$;
