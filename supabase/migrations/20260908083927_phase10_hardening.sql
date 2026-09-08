-- Phase 10: production hardening
-- - Stop answer-key leak via grade_passage_answers
-- - Revoke dangerous anon RPCs
-- - Nickname uniqueness per room
-- - Lightweight create-room rate limit
-- - questions_public as security_invoker

drop view if exists public.questions_public;

create view public.questions_public
with (security_invoker = true)
as
select
  id,
  passage_id,
  question,
  options,
  type,
  created_at
from public.questions;

grant select on public.questions_public to anon, authenticated;

create or replace function public.grade_passage_answers(
  p_passage_id uuid,
  p_answers jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  q record;
  selection jsonb;
  selected_index integer;
  answer_items jsonb := '[]'::jsonb;
  correct_count integer := 0;
  total_count integer := 0;
  answered_count integer := 0;
  is_correct boolean;
  reveal_keys boolean := false;
  active_match_exists boolean := false;
begin
  if not exists (select 1 from public.passages where id = p_passage_id) then
    raise exception 'Passage not found' using errcode = 'P0002';
  end if;

  select exists (
    select 1
    from public.matches m
    where m.passage_id = p_passage_id
      and m.completed_at is null
      and m.status in ('countdown', 'reading', 'quiz')
  ) into active_match_exists;

  if active_match_exists then
    raise exception 'Match not in quiz' using errcode = 'P0013';
  end if;

  for q in
    select id, correct_answer
    from public.questions
    where passage_id = p_passage_id
    order by created_at, id
  loop
    total_count := total_count + 1;
    selected_index := null;

    select elem
    into selection
    from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) as elem
    where elem->>'questionId' = q.id::text
    limit 1;

    if selection is not null
       and selection->>'selectedIndex' is not null
       and selection->>'selectedIndex' <> 'null' then
      selected_index := (selection->>'selectedIndex')::integer;
      answered_count := answered_count + 1;
    end if;

    is_correct := selected_index is not null and selected_index = q.correct_answer;
    if is_correct then
      correct_count := correct_count + 1;
    end if;

    answer_items := answer_items || jsonb_build_array(
      jsonb_build_object(
        'questionId', q.id,
        'selectedIndex', selected_index,
        'correct', is_correct
      )
    );
  end loop;

  reveal_keys := total_count > 0 and answered_count = total_count;

  if reveal_keys then
    answer_items := '[]'::jsonb;
    for q in
      select id, correct_answer
      from public.questions
      where passage_id = p_passage_id
      order by created_at, id
    loop
      selected_index := null;
      select elem
      into selection
      from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) as elem
      where elem->>'questionId' = q.id::text
      limit 1;

      if selection is not null
         and selection->>'selectedIndex' is not null
         and selection->>'selectedIndex' <> 'null' then
        selected_index := (selection->>'selectedIndex')::integer;
      end if;

      is_correct := selected_index is not null and selected_index = q.correct_answer;

      answer_items := answer_items || jsonb_build_array(
        jsonb_build_object(
          'questionId', q.id,
          'selectedIndex', selected_index,
          'correct', is_correct,
          'correctAnswerIndex', q.correct_answer
        )
      );
    end loop;
  end if;

  return jsonb_build_object(
    'answers', answer_items,
    'correctAnswers', correct_count,
    'totalQuestions', total_count
  );
end;
$$;

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
  recent_count integer;
begin
  if p_client_id is null then
    raise exception 'Client id required' using errcode = 'P0004';
  end if;

  if trimmed is null or char_length(trimmed) < 1 or char_length(trimmed) > 24 then
    raise exception 'Nickname required' using errcode = 'P0005';
  end if;

  select count(*)::integer into recent_count
  from public.player_sessions ps
  join public.rooms r on r.id = ps.room_id
  where ps.client_id = p_client_id
    and r.host_player_id = ps.player_id
    and r.created_at > now() - interval '10 minutes';

  if recent_count >= 8 then
    raise exception 'Room create rate limited' using errcode = 'P0016';
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

  if current_room.host_player_id is null then
    update public.rooms
    set host_player_id = created_player.id
    where id = current_room.id
    returning * into current_room;
  end if;

  insert into public.player_sessions (player_id, room_id, client_id)
  values (created_player.id, current_room.id, p_client_id)
  returning * into created_session;

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

revoke all on function public.expire_room(uuid) from public, anon, authenticated;
revoke all on function public.create_room_with_code(uuid) from public, anon, authenticated;
revoke all on function public.assert_room_active(uuid) from public, anon, authenticated;
revoke all on function public.generate_room_code() from public, anon, authenticated;
