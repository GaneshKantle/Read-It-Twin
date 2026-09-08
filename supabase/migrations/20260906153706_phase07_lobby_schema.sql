-- Phase 07 lobby schema
alter table public.rooms add column if not exists host_player_id uuid;

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

create or replace function public.generate_room_code()
returns text
language plpgsql
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

create or replace function public.enforce_room_player_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  player_count integer;
begin
  perform 1 from public.rooms where id = new.room_id for update;
  select count(*)::integer into player_count from public.players where room_id = new.room_id;
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
  where player_id = p_player_id and session_token = p_session_token;
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
  if current_room.status not in ('waiting', 'ready') then
    return current_room;
  end if;
  select count(*)::integer, count(*) filter (where ready)::integer
  into player_count, ready_count
  from public.players where room_id = p_room_id;
  if player_count = 2 and ready_count = 2 then
    next_status := 'ready';
  else
    next_status := 'waiting';
  end if;
  if current_room.status is distinct from next_status then
    update public.rooms set status = next_status where id = p_room_id returning * into current_room;
  end if;
  return current_room;
end;
$$;
