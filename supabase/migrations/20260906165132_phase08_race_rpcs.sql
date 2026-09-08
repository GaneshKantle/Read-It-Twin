create or replace function public.get_server_time()
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select now();
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
  race_at timestamptz;
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
      update public.rooms set status = 'closed' where id = current_room.id
      returning * into current_room;
    end if;
    raise exception 'Room expired' using errcode = 'P0001';
  end if;

  if current_room.status in ('countdown', 'reading', 'quiz', 'results') then
    select * into existing_match
    from public.matches
    where room_id = p_room_id
      and completed_at is null
    order by started_at desc
    limit 1;

    if existing_match is null then
      select * into existing_match
      from public.matches
      where room_id = p_room_id
      order by started_at desc
      limit 1;
    end if;

    return jsonb_build_object(
      'room', to_jsonb(current_room),
      'match', to_jsonb(existing_match),
      'server_now', now()
    );
  end if;

  if current_room.status not in ('waiting', 'ready') then
    raise exception 'Room closed' using errcode = 'P0006';
  end if;

  if current_room.host_player_id is distinct from p_player_id then
    raise exception 'Not host' using errcode = 'P0007';
  end if;

  select
    count(*)::integer,
    count(*) filter (where ready)::integer
  into player_count, ready_count
  from public.players
  where room_id = p_room_id;

  if player_count <> 2 or ready_count <> 2 then
    raise exception 'Players not ready' using errcode = 'P0008';
  end if;

  update public.matches
  set status = 'cancelled',
      completed_at = coalesce(completed_at, now())
  where room_id = p_room_id
    and completed_at is null;

  passage := current_room.passage_id;
  if passage is null then
    select id into passage
    from public.passages
    order by random()
    limit 1;

    if passage is null then
      raise exception 'Passage not found' using errcode = 'P0002';
    end if;
  end if;

  race_at := now() + interval '2800 milliseconds';

  update public.players
  set finished = false,
      finished_at = null,
      reading_time = null,
      wpm = null,
      correct_answers = null,
      total_questions = null,
      comprehension = null,
      final_score = null
  where room_id = p_room_id;

  insert into public.matches (room_id, passage_id, race_start_at, status)
  values (p_room_id, passage, race_at, 'countdown')
  returning * into created_match;

  update public.rooms
  set status = 'countdown',
      passage_id = passage
  where id = p_room_id
  returning * into current_room;

  return jsonb_build_object(
    'room', to_jsonb(current_room),
    'match', to_jsonb(created_match),
    'server_now', now()
  );
end;
$$;
