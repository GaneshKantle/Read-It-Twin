-- Phase 08 race: authoritative race_start_at, finish/quiz RPCs, tighter results writes

do $$ begin if not exists (select 1 from pg_type where typname = 'match_status') then create type public.match_status as enum ('countdown', 'reading', 'quiz', 'results', 'cancelled'); end if; end $$;

alter table public.matches add column if not exists race_start_at timestamptz;
alter table public.matches add column if not exists status public.match_status;

update public.matches set status = case when completed_at is not null then 'results'::public.match_status else 'countdown'::public.match_status end where status is null;

alter table public.matches alter column status set default 'countdown'::public.match_status;
alter table public.matches alter column status set not null;

alter table public.players add column if not exists finished_at timestamptz;
alter table public.results add column if not exists submitted_at timestamptz;
update public.results set submitted_at = coalesce(submitted_at, now()) where submitted_at is null;
alter table public.results alter column submitted_at set default now();
alter table public.results alter column submitted_at set not null;

-- Close any pre-existing incomplete matches so the unique index can apply
update public.matches set status = 'cancelled', completed_at = coalesce(completed_at, now()) where completed_at is null;

create unique index if not exists matches_one_active_per_room_idx on public.matches (room_id) where completed_at is null;
