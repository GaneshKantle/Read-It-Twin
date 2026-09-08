-- Phase 06 foundation: passages, questions, rooms, players, matches, results
-- Apply via Supabase SQL editor or: supabase db push / migration up

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.difficulty as enum ('easy', 'medium', 'hard', 'expert');

create type public.category as enum (
  'technology',
  'science',
  'history',
  'psychology',
  'business',
  'fiction',
  'nature',
  'culture',
  'philosophy'
);

create type public.room_status as enum (
  'waiting',
  'ready',
  'countdown',
  'reading',
  'quiz',
  'results',
  'closed'
);

create type public.question_type as enum (
  'main-idea',
  'detail',
  'inference',
  'sequence',
  'vocabulary',
  'fact'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.passages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category public.category not null,
  difficulty public.difficulty not null,
  word_count integer not null check (word_count > 0),
  created_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  passage_id uuid not null references public.passages (id) on delete cascade,
  question text not null,
  options text[] not null,
  correct_answer smallint not null check (correct_answer >= 0 and correct_answer <= 3),
  type public.question_type not null,
  created_at timestamptz not null default now(),
  constraint questions_options_length check (cardinality(options) = 4)
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text not null,
  status public.room_status not null default 'waiting',
  passage_id uuid references public.passages (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  constraint rooms_room_code_unique unique (room_code),
  constraint rooms_room_code_format check (room_code ~ '^[A-Z0-9]{4,8}$')
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  nickname text not null check (char_length(trim(nickname)) between 1 and 24),
  ready boolean not null default false,
  joined_at timestamptz not null default now(),
  finished boolean not null default false,
  reading_time integer,
  wpm integer,
  correct_answers integer,
  total_questions integer,
  comprehension numeric(5, 2),
  final_score integer
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  passage_id uuid references public.passages (id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.results (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  reading_time integer not null,
  wpm integer not null,
  correct_answers integer not null,
  total_questions integer not null,
  comprehension numeric(5, 2) not null,
  final_score integer not null,
  constraint results_match_player_unique unique (match_id, player_id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index passages_difficulty_category_idx on public.passages (difficulty, category);
create index questions_passage_id_idx on public.questions (passage_id);
create index rooms_room_code_idx on public.rooms (room_code);
create index rooms_status_idx on public.rooms (status);
create index rooms_expires_at_idx on public.rooms (expires_at);
create index players_room_id_idx on public.players (room_id);
create index matches_room_id_idx on public.matches (room_id);
create index results_match_id_idx on public.results (match_id);
create index results_player_id_idx on public.results (player_id);

-- ---------------------------------------------------------------------------
-- Public questions view (no correct_answer)
-- ---------------------------------------------------------------------------

create or replace view public.questions_public as
select
  id,
  passage_id,
  question,
  options,
  type,
  created_at
from public.questions;

-- ---------------------------------------------------------------------------
-- Helpers / RPCs
-- ---------------------------------------------------------------------------

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
    for i in 1..6 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.rooms where room_code = candidate);
  end loop;
  return candidate;
end;
$$;

create or replace function public.create_room_with_code(p_passage_id uuid default null)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  created public.rooms;
begin
  insert into public.rooms (room_code, passage_id)
  values (public.generate_room_code(), p_passage_id)
  returning * into created;

  return created;
end;
$$;

create or replace function public.expire_room(p_room_id uuid)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  updated public.rooms;
begin
  update public.rooms
  set status = 'closed'
  where id = p_room_id
  returning * into updated;

  if updated is null then
    raise exception 'Room not found' using errcode = 'P0002';
  end if;

  return updated;
end;
$$;

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
  is_correct boolean;
begin
  if not exists (select 1 from public.passages where id = p_passage_id) then
    raise exception 'Passage not found' using errcode = 'P0002';
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

    if selection is not null and selection->>'selectedIndex' is not null
       and selection->>'selectedIndex' <> 'null' then
      selected_index := (selection->>'selectedIndex')::integer;
    end if;

    is_correct := selected_index is not null and selected_index = q.correct_answer;
    if is_correct then
      correct_count := correct_count + 1;
    end if;

    answer_items := answer_items || jsonb_build_array(
      jsonb_build_object(
        'questionId', q.id,
        'selectedIndex', selected_index,
        'correct', is_correct,
        'correctAnswerIndex', q.correct_answer
      )
    );
  end loop;

  return jsonb_build_object(
    'answers', answer_items,
    'correctAnswers', correct_count,
    'totalQuestions', total_count
  );
end;
$$;

-- Auto-close expired rooms on read helpers (optional soft enforcement)
create or replace function public.assert_room_active(p_room_id uuid)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  current_room public.rooms;
begin
  select * into current_room from public.rooms where id = p_room_id;

  if current_room is null then
    raise exception 'Room not found' using errcode = 'P0002';
  end if;

  if current_room.expires_at <= now() or current_room.status = 'closed' then
    if current_room.status <> 'closed' then
      update public.rooms set status = 'closed' where id = p_room_id
      returning * into current_room;
    end if;
    raise exception 'Room expired' using errcode = 'P0001';
  end if;

  return current_room;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.passages enable row level security;
alter table public.questions enable row level security;
alter table public.rooms enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.results enable row level security;

-- Passages: public read
create policy passages_select_anon
  on public.passages for select
  to anon, authenticated
  using (true);

-- Questions: no direct anon/authenticated SELECT (use questions_public + grade RPC)
-- Service role bypasses RLS for seeding/admin.

-- Rooms
create policy rooms_select_anon
  on public.rooms for select
  to anon, authenticated
  using (true);

create policy rooms_insert_anon
  on public.rooms for insert
  to anon, authenticated
  with check (status = 'waiting');

create policy rooms_update_anon
  on public.rooms for update
  to anon, authenticated
  using (status <> 'closed' and expires_at > now())
  with check (status <> 'closed' or status = 'closed');

-- Players
create policy players_select_anon
  on public.players for select
  to anon, authenticated
  using (true);

create policy players_insert_anon
  on public.players for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from public.rooms r
      where r.id = room_id
        and r.status <> 'closed'
        and r.expires_at > now()
    )
  );

create policy players_update_anon
  on public.players for update
  to anon, authenticated
  using (true)
  with check (true);

create policy players_delete_anon
  on public.players for delete
  to anon, authenticated
  using (true);

-- Matches
create policy matches_select_anon
  on public.matches for select
  to anon, authenticated
  using (true);

create policy matches_insert_anon
  on public.matches for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from public.rooms r
      where r.id = room_id
        and r.status <> 'closed'
        and r.expires_at > now()
    )
  );

create policy matches_update_anon
  on public.matches for update
  to anon, authenticated
  using (true)
  with check (true);

-- Results: insert + select only (immutable after write)
create policy results_select_anon
  on public.results for select
  to anon, authenticated
  using (true);

create policy results_insert_anon
  on public.results for insert
  to anon, authenticated
  with check (true);

-- Grants
grant usage on schema public to anon, authenticated;

grant select on public.passages to anon, authenticated;
grant select on public.questions_public to anon, authenticated;

grant select, insert, update on public.rooms to anon, authenticated;
grant select, insert, update, delete on public.players to anon, authenticated;
grant select, insert, update on public.matches to anon, authenticated;
grant select, insert on public.results to anon, authenticated;

grant execute on function public.grade_passage_answers(uuid, jsonb) to anon, authenticated;
grant execute on function public.expire_room(uuid) to anon, authenticated;
grant execute on function public.create_room_with_code(uuid) to anon, authenticated;
grant execute on function public.generate_room_code() to anon, authenticated;
grant execute on function public.assert_room_active(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Realtime foundation (subscriptions wired in a later phase)
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.matches;
