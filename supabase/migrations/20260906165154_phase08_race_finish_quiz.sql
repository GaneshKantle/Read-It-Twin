create or replace function public.ack_race_start(
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
  current_match public.matches;
begin
  session_row := public.assert_player_session(p_player_id, p_session_token);

  if session_row.room_id <> p_room_id then
    raise exception 'Invalid session' using errcode = 'P0004';
  end if;

  select * into current_room from public.rooms where id = p_room_id for update;
  if current_room is null then
    raise exception 'Room not found' using errcode = 'P0002';
  end if;

  select * into current_match
  from public.matches
  where room_id = p_room_id
    and completed_at is null
  order by started_at desc
  limit 1
  for update;

  if current_match is null then
    raise exception 'Match not found' using errcode = 'P0009';
  end if;

  if current_room.status <> 'countdown' and current_match.status <> 'countdown' then
    return jsonb_build_object(
      'room', to_jsonb(current_room),
      'match', to_jsonb(current_match),
      'server_now', now()
    );
  end if;

  if current_match.race_start_at is null or now() < current_match.race_start_at then
    return jsonb_build_object(
      'room', to_jsonb(current_room),
      'match', to_jsonb(current_match),
      'server_now', now()
    );
  end if;

  if current_match.status = 'countdown' then
    update public.matches
    set status = 'reading'
    where id = current_match.id
    returning * into current_match;
  end if;

  if current_room.status = 'countdown' then
    update public.rooms
    set status = 'reading'
    where id = current_room.id
    returning * into current_room;
  end if;

  return jsonb_build_object(
    'room', to_jsonb(current_room),
    'match', to_jsonb(current_match),
    'server_now', now()
  );
end;
$$;

create or replace function public.finish_reading(
  p_match_id uuid,
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
  current_match public.matches;
  current_room public.rooms;
  current_player public.players;
  passage_row public.passages;
  reading_ms integer;
  min_ms numeric;
  computed_wpm integer;
  finished_count integer;
begin
  session_row := public.assert_player_session(p_player_id, p_session_token);

  select * into current_match
  from public.matches
  where id = p_match_id
  for update;

  if current_match is null then
    raise exception 'Match not found' using errcode = 'P0009';
  end if;

  if session_row.room_id <> current_match.room_id then
    raise exception 'Invalid session' using errcode = 'P0004';
  end if;

  select * into current_room from public.rooms where id = current_match.room_id for update;
  if current_room is null then
    raise exception 'Room not found' using errcode = 'P0002';
  end if;

  if current_room.expires_at <= now() then
    raise exception 'Room expired' using errcode = 'P0001';
  end if;

  select * into current_player
  from public.players
  where id = p_player_id
  for update;

  if current_player is null or current_player.room_id <> current_match.room_id then
    raise exception 'Invalid session' using errcode = 'P0004';
  end if;

  if current_player.finished then
    return jsonb_build_object(
      'room', to_jsonb(current_room),
      'match', to_jsonb(current_match),
      'player', to_jsonb(current_player),
      'server_now', now()
    );
  end if;

  if current_match.status not in ('countdown', 'reading') then
    raise exception 'Match not active' using errcode = 'P0010';
  end if;

  if current_match.race_start_at is null or now() < current_match.race_start_at then
    raise exception 'Race not started' using errcode = 'P0011';
  end if;

  if current_match.passage_id is null then
    raise exception 'Passage not found' using errcode = 'P0002';
  end if;

  select * into passage_row from public.passages where id = current_match.passage_id;
  if passage_row is null then
    raise exception 'Passage not found' using errcode = 'P0002';
  end if;

  reading_ms := greatest(
    0,
    (extract(epoch from (now() - current_match.race_start_at)) * 1000)::integer
  );

  min_ms := (passage_row.word_count::numeric / 700.0) * 60000.0;
  if reading_ms::numeric < min_ms then
    raise exception 'Finish too early' using errcode = 'P0012';
  end if;

  if reading_ms <= 0 then
    raise exception 'Finish too early' using errcode = 'P0012';
  end if;

  computed_wpm := round(passage_row.word_count::numeric / (reading_ms::numeric / 60000.0))::integer;

  update public.players
  set finished = true,
      finished_at = now(),
      reading_time = reading_ms,
      wpm = computed_wpm
  where id = p_player_id
  returning * into current_player;

  if current_match.status = 'countdown' then
    update public.matches
    set status = 'reading'
    where id = current_match.id
    returning * into current_match;
  end if;

  if current_room.status = 'countdown' then
    update public.rooms
    set status = 'reading'
    where id = current_room.id
    returning * into current_room;
  end if;

  select count(*)::integer into finished_count
  from public.players
  where room_id = current_match.room_id
    and finished = true;

  if finished_count >= 2 then
    update public.matches
    set status = 'quiz'
    where id = current_match.id
    returning * into current_match;

    update public.rooms
    set status = 'quiz'
    where id = current_room.id
    returning * into current_room;
  end if;

  return jsonb_build_object(
    'room', to_jsonb(current_room),
    'match', to_jsonb(current_match),
    'player', to_jsonb(current_player),
    'server_now', now()
  );
end;
$$;
