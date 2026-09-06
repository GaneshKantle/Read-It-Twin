-- Phase 08 race: authoritative race_start_at, finish/quiz RPCs, tighter results writes
-- Apply after 20260906120000_phase07_lobby.sql

-- ---------------------------------------------------------------------------
-- Schema additions
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'match_status') then
    create type public.match_status as enum (
      'countdown',
      'reading',
      'quiz',
      'results',
      'cancelled'
    );
  end if;
end $$;

alter table public.matches
  add column if not exists race_start_at timestamptz;

alter table public.matches
  add column if not exists status public.match_status;

-- Backfill existing rows so NOT NULL can be applied safely
update public.matches
set status = case
  when completed_at is not null then 'results'::public.match_status
  else 'countdown'::public.match_status
end
where status is null;

alter table public.matches
  alter column status set default 'countdown'::public.match_status;

alter table public.matches
  alter column status set not null;

alter table public.players
  add column if not exists finished_at timestamptz;

alter table public.results
  add column if not exists submitted_at timestamptz;

update public.results
set submitted_at = coalesce(submitted_at, now())
where submitted_at is null;

alter table public.results
  alter column submitted_at set default now();

alter table public.results
  alter column submitted_at set not null;

-- Close any pre-existing incomplete matches so the unique index can apply
update public.matches
set status = 'cancelled',
    completed_at = coalesce(completed_at, now())
where completed_at is null;

-- One incomplete match per room (rematch later creates a new row after complete)
create unique index if not exists matches_one_active_per_room_idx
  on public.matches (room_id)
  where completed_at is null;

-- ---------------------------------------------------------------------------
-- Constants: countdown length matches client STEP_MS * 4 = 2800ms
-- Anti-skim pace matches src/lib/reading.ts IMPLAUSIBLE_PACE = 700
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- get_server_time
-- ---------------------------------------------------------------------------

create or replace function public.get_server_time()
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select now();
$$;

-- ---------------------------------------------------------------------------
-- start_match (replace): set race_start_at, reset player race columns
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

  -- Cancel any leftover incomplete match (should be rare after unique index)
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

  -- Reset both players' race columns for a clean match
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

-- ---------------------------------------------------------------------------
-- ack_race_start: promote countdown → reading once race_start_at has passed
-- ---------------------------------------------------------------------------

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

  -- Idempotent: already past countdown
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

-- ---------------------------------------------------------------------------
-- finish_reading: server-authoritative reading time
-- ---------------------------------------------------------------------------

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

  -- Idempotent: already finished
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

  -- Same floor as minimumReadMs(wordCount) in src/lib/reading.ts
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

  -- Promote countdown → reading if needed
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

-- ---------------------------------------------------------------------------
-- submit_match_quiz: server grades + stores result; advances when both done
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
    update public.matches
    set status = 'results',
        completed_at = now()
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
-- leave_room: do not delete player mid-race (refresh recovery)
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

  -- Mid-race: keep player + session so refresh can restore. Clear local session only.
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
-- Security: revoke direct results inserts; grant new RPCs
-- ---------------------------------------------------------------------------

drop policy if exists results_insert_anon on public.results;

revoke insert, update, delete on public.results from anon, authenticated;
grant select on public.results to anon, authenticated;

grant execute on function public.get_server_time() to anon, authenticated;
grant execute on function public.ack_race_start(uuid, uuid, uuid) to anon, authenticated;
grant execute on function public.finish_reading(uuid, uuid, uuid) to anon, authenticated;
grant execute on function public.submit_match_quiz(uuid, uuid, uuid, jsonb) to anon, authenticated;
grant execute on function public.start_match(uuid, uuid, uuid) to anon, authenticated;
grant execute on function public.leave_room(uuid, uuid) to anon, authenticated;
