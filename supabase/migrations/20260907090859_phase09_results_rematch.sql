-- Phase 09: match winner finalization, rematch negotiation, leave-from-results

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

alter table public.results
  drop constraint if exists results_player_id_fkey;

alter table public.results
  add constraint results_player_id_fkey
  foreign key (player_id)
  references public.players (id)
  on delete restrict;
