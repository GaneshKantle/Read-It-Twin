-- Phase 09: match winner finalization, rematch negotiation, leave-from-results
-- Apply via Supabase SQL editor / MCP apply_migration / CLI migration up

-- ---------------------------------------------------------------------------
-- Schema: winner on matches, rematch flag on players, protect result history
-- ---------------------------------------------------------------------------

alter table public.matches
  add column if not exists winner_player_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'matches_winner_player_id_fkey'
  ) then
    alter table public.matches
      add constraint matches_winner_player_id_fkey
      foreign key (winner_player_id)
      references public.players (id)
      on delete set null;
  end if;
end $$;

alter table public.players
  add column if not exists wants_rematch boolean not null default false;

-- Preserve historical results when a player seat is later removed
alter table public.results
  drop constraint if exists results_player_id_fkey;

alter table public.results
  add constraint results_player_id_fkey
  foreign key (player_id)
  references public.players (id)
  on delete restrict;

-- ---------------------------------------------------------------------------
-- submit_match_quiz: set winner_player_id when both results exist
-- ---------------------------------------------------------------------------

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

  -- Idempotent: already submitted
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
    -- Authoritative winner from stored final scores (draw => null)
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

-- ---------------------------------------------------------------------------
-- request_rematch: negotiate rematch; both ready => reset lobby + new passage
-- ---------------------------------------------------------------------------

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

  -- Already returned to lobby by a concurrent both-ready rematch
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

  -- Idempotent request
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

  -- Both ready: pick a different passage when possible, then return to lobby.
  -- Do NOT insert a match row — start_match creates Match N after ready/start.
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

-- ---------------------------------------------------------------------------
-- leave_room: mid-race keeps seat; results leave closes room, keeps history
-- ---------------------------------------------------------------------------

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

  -- Mid-race: keep player + session so refresh can restore.
  if current_room.status in ('countdown', 'reading', 'quiz') then
    return jsonb_build_object(
      'room', to_jsonb(current_room),
      'closed', false,
      'host_left', false,
      'kept_seat', true
    );
  end if;

  was_host := current_room.host_player_id is not distinct from p_player_id;

  -- Results: end rematch negotiation, keep player + match history, close room.
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

  -- Players with stored results cannot be deleted (RESTRICT). Keep the seat.
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

-- ---------------------------------------------------------------------------
-- start_match: also clear wants_rematch when starting a fresh race
-- ---------------------------------------------------------------------------

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

  -- Idempotent: already started
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
      final_score = null,
      wants_rematch = false
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

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant execute on function public.request_rematch(uuid, uuid) to anon, authenticated;
grant execute on function public.submit_match_quiz(uuid, uuid, uuid, jsonb) to anon, authenticated;
grant execute on function public.leave_room(uuid, uuid) to anon, authenticated;
grant execute on function public.start_match(uuid, uuid, uuid) to anon, authenticated;

revoke insert, update, delete on public.results from anon, authenticated;
grant select on public.results to anon, authenticated;
