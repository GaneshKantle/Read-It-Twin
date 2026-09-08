alter table public.player_sessions enable row level security;

drop policy if exists rooms_insert_anon on public.rooms;
drop policy if exists rooms_update_anon on public.rooms;
drop policy if exists players_insert_anon on public.players;
drop policy if exists players_update_anon on public.players;
drop policy if exists players_delete_anon on public.players;
drop policy if exists matches_insert_anon on public.matches;
drop policy if exists matches_update_anon on public.matches;

drop policy if exists rooms_select_anon on public.rooms;
create policy rooms_select_anon on public.rooms for select to anon, authenticated using (true);

drop policy if exists players_select_anon on public.players;
create policy players_select_anon on public.players for select to anon, authenticated using (true);

drop policy if exists matches_select_anon on public.matches;
create policy matches_select_anon on public.matches for select to anon, authenticated using (true);

revoke insert, update, delete on public.rooms from anon, authenticated;
revoke insert, update, delete on public.players from anon, authenticated;
revoke insert, update, delete on public.matches from anon, authenticated;

grant select on public.rooms to anon, authenticated;
grant select on public.players to anon, authenticated;
grant select on public.matches to anon, authenticated;

grant execute on function public.create_room_and_join(text, uuid) to anon, authenticated;
grant execute on function public.join_room(text, text, uuid) to anon, authenticated;
grant execute on function public.set_player_ready(uuid, uuid, boolean) to anon, authenticated;
grant execute on function public.start_match(uuid, uuid, uuid) to anon, authenticated;
grant execute on function public.leave_room(uuid, uuid) to anon, authenticated;
grant execute on function public.get_room_by_code(text) to anon, authenticated;
grant execute on function public.generate_room_code() to anon, authenticated;

revoke all on function public.assert_player_session(uuid, uuid) from public, anon, authenticated;
revoke all on function public.sync_room_ready_status(uuid) from public, anon, authenticated;
revoke all on function public.enforce_room_player_limit() from public, anon, authenticated;
