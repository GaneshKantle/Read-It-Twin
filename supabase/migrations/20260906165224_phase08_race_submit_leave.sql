create or replace function public.submit_match_quiz(
  p_match_id uuid,
  p_player_id uuid,
  p_session_token uuid,
  p_answers jsonb
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
  existing_result public.results;
  grade jsonb;
  correct_count integer;
  total_count integer;
  comprehension_pct numeric(5, 2);
  final_score integer;
  result_row public.results;
  result_count integer;
  graded_answers jsonb;
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

  select * into current_player
  from public.players
  where id = p_player_id
  for update;

  if current_player is null or current_player.room_id <> current_match.room_id then
    raise exception 'Invalid session' using errcode = 'P0004';
  end if;

  if not current_player.finished then
    raise exception 'Match not active' using errcode = 'P0010';
  end if;

  select * into existing_result
  from public.results
  where match_id = p_match_id
    and player_id = p_player_id;

  if existing_result is not null then
    return jsonb_build_object(
      'room', to_jsonb(current_room),
      'match', to_jsonb(current_match),
      'player', to_jsonb(current_player),
      'result', to_jsonb(existing_result),
      'grade', null,
      'server_now', now()
    );
  end if;

  if current_match.status <> 'quiz' and current_room.status <> 'quiz' then
    raise exception 'Match not in quiz' using errcode = 'P0013';
  end if;

  if current_match.passage_id is null then
    raise exception 'Passage not found' using errcode = 'P0002';
  end if;

  grade := public.grade_passage_answers(current_match.passage_id, coalesce(p_answers, '[]'::jsonb));
  correct_count := (grade->>'correctAnswers')::integer;
  total_count := (grade->>'totalQuestions')::integer;
  graded_answers := grade->'answers';

  if total_count <= 0 then
    comprehension_pct := 0;
  else
    comprehension_pct := round(((correct_count::numeric / total_count::numeric) * 100)::numeric, 2);
  end if;

  final_score := round(
    coalesce(current_player.wpm, 0)::numeric * (comprehension_pct / 100.0)
  )::integer;

  insert into public.results (
    match_id, player_id, reading_time, wpm, correct_answers, total_questions, comprehension, final_score, submitted_at
  )
  values (
    p_match_id, p_player_id, coalesce(current_player.reading_time, 0), coalesce(current_player.wpm, 0),
    correct_count, total_count, comprehension_pct, final_score, now()
  )
  returning * into result_row;

  update public.players
  set correct_answers = correct_count,
      total_questions = total_count,
      comprehension = comprehension_pct,
      final_score = final_score
  where id = p_player_id
  returning * into current_player;

  select count(*)::integer into result_count
  from public.results
  where match_id = p_match_id;

  if result_count >= 2 then
    update public.matches
    set status = 'results', completed_at = now()
    where id = current_match.id
    returning * into current_match;

    update public.rooms
    set status = 'results'
    where id = current_room.id
    returning * into current_room;
  end if;

  return jsonb_build_object(
    'room', to_jsonb(current_room),
    'match', to_jsonb(current_match),
    'player', to_jsonb(current_player),
    'result', to_jsonb(result_row),
    'grade', jsonb_build_object(
      'answers', graded_answers,
      'correctAnswers', correct_count,
      'totalQuestions', total_count
    ),
    'server_now', now()
  );
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

  if current_room.status in ('countdown', 'reading', 'quiz', 'results') then
    return jsonb_build_object(
      'room', to_jsonb(current_room),
      'closed', false,
      'host_left', false,
      'kept_seat', true
    );
  end if;

  was_host := current_room.host_player_id is not distinct from p_player_id;

  delete from public.player_sessions where player_id = p_player_id;
  delete from public.players where id = p_player_id;

  if was_host and current_room.status in ('waiting', 'ready') then
    update public.rooms
    set status = 'closed', host_player_id = null
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
    update public.players set ready = false where room_id = current_room.id;
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

drop policy if exists results_insert_anon on public.results;
revoke insert, update, delete on public.results from anon, authenticated;
grant select on public.results to anon, authenticated;

grant execute on function public.get_server_time() to anon, authenticated;
grant execute on function public.ack_race_start(uuid, uuid, uuid) to anon, authenticated;
grant execute on function public.finish_reading(uuid, uuid, uuid) to anon, authenticated;
grant execute on function public.submit_match_quiz(uuid, uuid, uuid, jsonb) to anon, authenticated;
grant execute on function public.start_match(uuid, uuid, uuid) to anon, authenticated;
grant execute on function public.leave_room(uuid, uuid) to anon, authenticated;
