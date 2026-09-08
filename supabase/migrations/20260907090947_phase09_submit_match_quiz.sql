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
  scored_final integer;
  result_row public.results;
  result_count integer;
  graded_answers jsonb;
  score_a integer;
  score_b integer;
  player_a uuid;
  player_b uuid;
  decided_winner uuid;
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

  scored_final := round(
    coalesce(current_player.wpm, 0)::numeric * (comprehension_pct / 100.0)
  )::integer;

  insert into public.results (
    match_id,
    player_id,
    reading_time,
    wpm,
    correct_answers,
    total_questions,
    comprehension,
    final_score,
    submitted_at
  )
  values (
    p_match_id,
    p_player_id,
    coalesce(current_player.reading_time, 0),
    coalesce(current_player.wpm, 0),
    correct_count,
    total_count,
    comprehension_pct,
    scored_final,
    now()
  )
  returning * into result_row;

  update public.players
  set correct_answers = correct_count,
      total_questions = total_count,
      comprehension = comprehension_pct,
      final_score = scored_final
  where id = p_player_id
  returning * into current_player;

  select count(*)::integer into result_count
  from public.results
  where match_id = p_match_id;

  if result_count >= 2 then
    select
      r.player_id,
      r.final_score
    into player_a, score_a
    from public.results r
    where r.match_id = p_match_id
    order by r.submitted_at asc, r.player_id asc
    limit 1;

    select
      r.player_id,
      r.final_score
    into player_b, score_b
    from public.results r
    where r.match_id = p_match_id
      and r.player_id <> player_a
    order by r.submitted_at asc, r.player_id asc
    limit 1;

    if score_a > score_b then
      decided_winner := player_a;
    elsif score_b > score_a then
      decided_winner := player_b;
    else
      decided_winner := null;
    end if;

    update public.matches
    set status = 'results',
        completed_at = coalesce(completed_at, now()),
        winner_player_id = decided_winner
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
