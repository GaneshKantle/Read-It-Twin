-- Phase 07 lobby: host pointer, player sessions, join/ready/start/leave RPCs, tighter RLS
-- Apply after 20260905143000_phase06_foundation.sql

-- ---------------------------------------------------------------------------
-- Schema additions
-- ---------------------------------------------------------------------------

alter table public.rooms
  add column if not exists host_player_id uuid;

-- Deferred FK so players can be inserted before host_player_id is set
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'rooms_host_player_id_fkey'
  ) then
    alter table public.rooms
      add constraint rooms_host_player_id_fkey
      foreign key (host_player_id) references public.players (id) on delete set null;
  end if;
end $$;

create table if not exists public.player_sessions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete cascade,
  client_id uuid not null,
  session_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  constraint player_sessions_room_client_unique unique (room_id, client_id),
  constraint player_sessions_player_unique unique (player_id)
);

create index if not exists player_sessions_token_idx on public.player_sessions (session_token);
create index if not exists player_sessions_room_id_idx on public.player_sessions (room_id);

-- ---------------------------------------------------------------------------
-- Room codes: 4 characters (alphabet already avoids O/0 I/1 S/5)
-- ---------------------------------------------------------------------------

create or replace function public.generate_room_code()
returns text
language plpgsql
set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  i integer;
begin
  loop
    candidate := '';
    for i in 1..4 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.rooms where room_code = candidate);
  end loop;
  return candidate;
end;
$$;

-- ---------------------------------------------------------------------------
-- Two-player cap (DB enforcement)
-- ---------------------------------------------------------------------------

create or replace function public.enforce_room_player_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  player_count integer;
begin
  -- Lock the room row so concurrent joins cannot both slip under the cap
  perform 1 from public.rooms where id = new.room_id for update;

  select count(*)::integer into player_count
  from public.players
  where room_id = new.room_id;

  if player_count >= 2 then
    raise exception 'Room full' using errcode = 'P0003';
  end if;

  return new;
end;
$$;

drop trigger if exists players_enforce_room_limit on public.players;
create trigger players_enforce_room_limit
  before insert on public.players
  for each row
  execute function public.enforce_room_player_limit();

-- ---------------------------------------------------------------------------
-- Session helpers
-- ---------------------------------------------------------------------------

create or replace function public.assert_player_session(
  p_player_id uuid,
  p_session_token uuid
)
returns public.player_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  session_row public.player_sessions;
begin
  select * into session_row
  from public.player_sessions
  where player_id = p_player_id
    and session_token = p_session_token;

  if session_row is null then
    raise exception 'Invalid session' using errcode = 'P0004';
  end if;

  return session_row;
end;
$$;

create or replace function public.sync_room_ready_status(p_room_id uuid)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  current_room public.rooms;
  player_count integer;
  ready_count integer;
  next_status public.room_status;
begin
  select * into current_room from public.rooms where id = p_room_id for update;

  if current_room is null then
    raise exception 'Room not found' using errcode = 'P0002';
  end if;

  -- Once the match is preparing or further, do not rewrite lobby status here
  if current_room.status not in ('waiting', 'ready') then
    return current_room;
  end if;

  select
    count(*)::integer,
    count(*) filter (where ready)::integer
  into player_count, ready_count
  from public.players
  where room_id = p_room_id;

  if player_count = 2 and ready_count = 2 then
    next_status := 'ready';
  else
    next_status := 'waiting';
  end if;

  if current_room.status is distinct from next_status then
    update public.rooms
    set status = next_status
    where id = p_room_id
    returning * into current_room;
  end if;

  return current_room;
end;
$$;

-- ---------------------------------------------------------------------------
-- Lobby RPCs
-- ---------------------------------------------------------------------------

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

  select * into current_room
  from public.rooms
  where room_code = code
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

  -- Idempotent rejoin for the same browser session
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

    -- Allow nickname refresh on restore only while still in lobby
    if current_room.status in ('waiting', 'ready')
       and trimmed is not null
       and char_length(trimmed) between 1 and 24
       and existing_player.nickname is distinct from trimmed then
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

  insert into public.players (room_id, nickname)
  values (current_room.id, trimmed)
  returning * into created_player;

  -- First player becomes host if somehow unset
  if current_room.host_player_id is null then
    update public.rooms
    set host_player_id = created_player.id
    where id = current_room.id
    returning * into current_room;
  end if;

  insert into public.player_sessions (player_id, room_id, client_id)
  values (created_player.id, current_room.id, p_client_id)
  returning * into created_session;

  -- Joining resets lobby readiness toward waiting until both ready again
  perform public.sync_room_ready_status(current_room.id);
  select * into current_room from public.rooms where id = current_room.id;

  return jsonb_build_object(
    'room', to_jsonb(current_room),
    'player', to_jsonb(created_player),
    'session_token', created_session.session_token
  );
end;
$$;

create or replace function public.set_player_ready(
  p_player_id uuid,
  p_session_token uuid,
  p_ready boolean
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
begin
  session_row := public.assert_player_session(p_player_id, p_session_token);

  select * into current_player from public.players where id = p_player_id for update;
  if current_player is null then
    raise exception 'Room not found' using errcode = 'P0002';
  end if;

  select * into current_room from public.rooms where id = current_player.room_id for update;
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

  if current_room.status not in ('waiting', 'ready') then
    raise exception 'Room closed' using errcode = 'P0006';
  end if;

  update public.players
  set ready = coalesce(p_ready, false)
  where id = p_player_id
  returning * into current_player;

  current_room := public.sync_room_ready_status(current_room.id);

  return jsonb_build_object(
    'room', to_jsonb(current_room),
    'player', to_jsonb(current_player)
  );
end;
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
  if current_room.status = 'countdown' then
    select * into existing_match
    from public.matches
    where room_id = p_room_id
      and completed_at is null
    order by started_at desc
    limit 1;

    return jsonb_build_object(
      'room', to_jsonb(current_room),
      'match', to_jsonb(existing_match)
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

  insert into public.matches (room_id, passage_id)
  values (p_room_id, passage)
  returning * into created_match;

  update public.rooms
  set status = 'countdown',
      passage_id = passage
  where id = p_room_id
  returning * into current_room;

  return jsonb_build_object(
    'room', to_jsonb(current_room),
    'match', to_jsonb(created_match)
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
      'host_left', true
    );
  end if;

  -- Guest left (or host left after start — still remove player; do not force-close mid-race in Phase 07)
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
    'host_left', false
  );
end;
$$;

-- Soft-close helper used by client reads
create or replace function public.get_room_by_code(p_room_code text)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  code text := upper(trim(p_room_code));
  current_room public.rooms;
begin
  if code is null or code = '' then
    raise exception 'Room not found' using errcode = 'P0002';
  end if;

  select * into current_room from public.rooms where room_code = code;

  if current_room is null then
    raise exception 'Room not found' using errcode = 'P0002';
  end if;

  if current_room.expires_at <= now() and current_room.status <> 'closed' then
    update public.rooms set status = 'closed' where id = current_room.id
    returning * into current_room;
  end if;

  return current_room;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS: keep SELECT; revoke direct writes (RPCs are SECURITY DEFINER)
-- ---------------------------------------------------------------------------

alter table public.player_sessions enable row level security;

-- No policies on player_sessions → deny for anon/authenticated

drop policy if exists rooms_insert_anon on public.rooms;
drop policy if exists rooms_update_anon on public.rooms;

drop policy if exists players_insert_anon on public.players;
drop policy if exists players_update_anon on public.players;
drop policy if exists players_delete_anon on public.players;

drop policy if exists matches_insert_anon on public.matches;
drop policy if exists matches_update_anon on public.matches;

-- Keep select policies from Phase 06; ensure they exist
drop policy if exists rooms_select_anon on public.rooms;
create policy rooms_select_anon
  on public.rooms for select
  to anon, authenticated
  using (true);

drop policy if exists players_select_anon on public.players;
create policy players_select_anon
  on public.players for select
  to anon, authenticated
  using (true);

drop policy if exists matches_select_anon on public.matches;
create policy matches_select_anon
  on public.matches for select
  to anon, authenticated
  using (true);

revoke insert, update, delete on public.rooms from anon, authenticated;
revoke insert, update, delete on public.players from anon, authenticated;
revoke insert, update, delete on public.matches from anon, authenticated;

grant select on public.rooms to anon, authenticated;
grant select on public.players to anon, authenticated;
grant select on public.matches to anon, authenticated;

-- No grants on player_sessions to anon

grant execute on function public.create_room_and_join(text, uuid) to anon, authenticated;
grant execute on function public.join_room(text, text, uuid) to anon, authenticated;
grant execute on function public.set_player_ready(uuid, uuid, boolean) to anon, authenticated;
grant execute on function public.start_match(uuid, uuid, uuid) to anon, authenticated;
grant execute on function public.leave_room(uuid, uuid) to anon, authenticated;
grant execute on function public.get_room_by_code(text) to anon, authenticated;
grant execute on function public.generate_room_code() to anon, authenticated;

-- Internal helpers stay callable only by SECURITY DEFINER peers / owner
revoke all on function public.assert_player_session(uuid, uuid) from public, anon, authenticated;
revoke all on function public.sync_room_ready_status(uuid) from public, anon, authenticated;
revoke all on function public.enforce_room_player_limit() from public, anon, authenticated;
