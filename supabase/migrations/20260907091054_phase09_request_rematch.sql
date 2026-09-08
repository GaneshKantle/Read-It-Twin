create or replace function public.request_rematch(
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
  player_count integer;
  rematch_count integer;
  last_match public.matches;
  previous_passage uuid;
  next_passage uuid;
  players_json jsonb;
begin
  session_row := public.assert_player_session(p_player_id, p_session_token);

  select * into current_player
  from public.players
  where id = p_player_id
  for update;

  if current_player is null then
    raise exception 'Room not found' using errcode = 'P0002';
  end if;

  if session_row.room_id <> current_player.room_id then
    raise exception 'Invalid session' using errcode = 'P0004';
  end if;

  select * into current_room
  from public.rooms
  where id = current_player.room_id
  for update;

  if current_room is null then
    raise exception 'Room not found' using errcode = 'P0002';
  end if;

  if current_room.expires_at <= now() then
    if current_room.status <> 'closed' then
      update public.rooms set status = 'closed' where id = current_room.id
      returning * into current_room;
    end if;
    raise exception 'Room expired' using errcode = 'P0001';
  end if;

  if current_room.status = 'closed' then
    raise exception 'Room closed' using errcode = 'P0006';
  end if;

  if current_room.status in ('waiting', 'ready') then
    select coalesce(jsonb_agg(to_jsonb(p) order by p.joined_at), '[]'::jsonb)
    into players_json
    from public.players p
    where p.room_id = current_room.id;

    return jsonb_build_object(
      'room', to_jsonb(current_room),
      'players', players_json,
      'rematch_ready', true,
      'server_now', now()
    );
  end if;

  if current_room.status <> 'results' then
    raise exception 'Rematch not available' using errcode = 'P0014';
  end if;

  select count(*)::integer into player_count
  from public.players
  where room_id = current_room.id;

  if player_count <> 2 then
    raise exception 'Opponent left' using errcode = 'P0015';
  end if;

  update public.players
  set wants_rematch = true
  where id = p_player_id
  returning * into current_player;

  select count(*)::integer into rematch_count
  from public.players
  where room_id = current_room.id
    and wants_rematch = true;

  if rematch_count < 2 then
    select coalesce(jsonb_agg(to_jsonb(p) order by p.joined_at), '[]'::jsonb)
    into players_json
    from public.players p
    where p.room_id = current_room.id;

    return jsonb_build_object(
      'room', to_jsonb(current_room),
      'players', players_json,
      'rematch_ready', false,
      'server_now', now()
    );
  end if;

  select * into last_match
  from public.matches
  where room_id = current_room.id
    and completed_at is not null
  order by completed_at desc, started_at desc
  limit 1;

  previous_passage := coalesce(last_match.passage_id, current_room.passage_id);

  select id into next_passage
  from public.passages
  where previous_passage is null or id is distinct from previous_passage
  order by random()
  limit 1;

  if next_passage is null then
    next_passage := previous_passage;
  end if;

  if next_passage is null then
    select id into next_passage
    from public.passages
    order by random()
    limit 1;
  end if;

  if next_passage is null then
    raise exception 'Passage not found' using errcode = 'P0002';
  end if;

  update public.players
  set ready = false,
      wants_rematch = false,
      finished = false,
      finished_at = null,
      reading_time = null,
      wpm = null,
      correct_answers = null,
      total_questions = null,
      comprehension = null,
      final_score = null
  where room_id = current_room.id;

  update public.rooms
  set status = 'waiting',
      passage_id = next_passage
  where id = current_room.id
  returning * into current_room;

  select coalesce(jsonb_agg(to_jsonb(p) order by p.joined_at), '[]'::jsonb)
  into players_json
  from public.players p
  where p.room_id = current_room.id;

  return jsonb_build_object(
    'room', to_jsonb(current_room),
    'players', players_json,
    'rematch_ready', true,
    'server_now', now()
  );
end;
$$;

grant execute on function public.request_rematch(uuid, uuid) to anon, authenticated;
