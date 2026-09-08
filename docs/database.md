# Database (Phase 06–10)

Supabase + PostgreSQL foundation for Read It Twin: lobby, synchronized race, results finalization, rematch, and Phase 10 production hardening.

## Environment

Copy `.env.example` to `.env.local` and fill in:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

If either value is empty, the solo app uses local passage seeds and does not call Supabase. Multiplayer routes require both values.

## Apply migrations

1. Open the Supabase SQL editor (or use the Supabase CLI).
2. Apply every file in [`supabase/migrations`](../supabase/migrations) in timestamp order (19 files; versions match remote `schema_migrations`).
3. Run [`supabase/seed.sql`](../supabase/seed.sql).

To regenerate the seed from local passages:

```bash
npx --yes tsx --tsconfig tsconfig.app.json scripts/generate-seed.ts
```

## Tables

| Table | Role |
|-------|------|
| `passages` | Reading content (`content` = paragraphs joined by blank lines) |
| `questions` | Quiz items + `correct_answer` (not exposed to clients directly) |
| `rooms` | Lobby container; unique 4-char `room_code`; `host_player_id`; expires after 24h |
| `players` | Anonymous nicknames in a room (max 2); race columns + `wants_rematch` |
| `player_sessions` | Private `(room_id, client_id)` → `session_token` (no anon SELECT) |
| `matches` | One row per race; `race_start_at`; `winner_player_id` (null = draw); `completed_at` |
| `results` | Immutable score snapshot per player per match (`submitted_at`) |

Relationships:

```
passages 1──* questions
rooms 1──* players
rooms 1──* player_sessions
rooms 1──* matches *──1 passages (optional)
matches 1──* results *──1 players
```

Partial unique index: one incomplete match per room (`matches_one_active_per_room_idx`). Rematch creates a **new** match row after the previous one has `completed_at`.

## Room lifecycle

Statuses (enum `room_status`):

`waiting` → `ready` → `countdown` → `reading` → `quiz` → `results` → (`waiting` via rematch) → … → `closed`

Match statuses (enum `match_status`):

`countdown` → `reading` → `quiz` → `results` (or `cancelled`)

TypeScript mirrors: `src/types/room.ts`, `src/types/match.ts`, `src/lib/rematch.ts`.

Phase 08–09 transitions:

- Host `start_match` creates a match with `race_start_at = now() + 2800ms`, resets player race columns, sets `countdown`
- Clients derive countdown digits from `race_start_at` (not local `setTimeout`)
- `ack_race_start` promotes `countdown` → `reading` after the start time
- `finish_reading` records authoritative reading time; both finished → `quiz`
- `submit_match_quiz` grades server-side, writes `results`; both submitted → match `results` + `winner_player_id` + `completed_at`, room → `results`
- `request_rematch` sets `wants_rematch`; when **both** players request, resets lobby (`waiting`), picks a new passage, clears race columns — does **not** insert a match
- Host `start_match` again creates Match N for the same room

## Lobby + race RPCs (SECURITY DEFINER)

| RPC | Purpose |
|-----|---------|
| `create_room_and_join(nickname, client_id)` | Create room + host player + session (rate limited) |
| `join_room(room_code, nickname, client_id)` | Join or restore the same session (idempotent; unique nicknames) |
| `set_player_ready(player_id, session_token, ready)` | Toggle ready; sync room status |
| `start_match(room_id, player_id, session_token)` | Host-only start; create match + `race_start_at` |
| `get_server_time()` | Server clock for client offset |
| `ack_race_start(room_id, player_id, session_token)` | Promote countdown → reading |
| `finish_reading(match_id, player_id, session_token)` | Record finish; advance to quiz when both done |
| `submit_match_quiz(match_id, player_id, session_token, answers)` | Grade + store result; set winner when both done |
| `request_rematch(player_id, session_token)` | Rematch negotiation; both ready → lobby + new passage |
| `leave_room(player_id, session_token)` | Leave lobby; mid-race keeps seat; results leave closes room |
| `get_room_by_code(room_code)` | Lookup with soft-expire |
| `grade_passage_answers(passage_id, answers)` | Solo grading only; blocked during active multiplayer matches |

**Revoked from anon/authenticated (Phase 10):** `expire_room`, `create_room_with_code`, `assert_room_active`, `generate_room_code`, `rls_auto_enable`.

Postgres error codes mapped in the client:

| Code | Meaning |
|------|---------|
| `P0001` | expired |
| `P0002` | not found |
| `P0003` | full |
| `P0004` | session |
| `P0005` | nickname required |
| `P0006` | closed |
| `P0007` | not host |
| `P0008` | not ready |
| `P0009` | match not found |
| `P0010` | match not active |
| `P0011` | race not started |
| `P0012` | finish too early |
| `P0013` | match not in quiz / multiplayer grade blocked |
| `P0014` | rematch not available |
| `P0015` | opponent left (rematch needs two players) |
| `P0016` | room create rate limited |
| `P0017` | nickname taken in room |

## Winner / draw

`final_score = round(wpm × comprehension/100)`. When both results exist, the server sets:

- `winner_player_id` = higher `final_score`
- `winner_player_id` = `NULL` on a draw

Clients never declare a winner. Comparison UI reads stored results + `winner_player_id`.

## Rematch

Rematch state is derived on the client from `players.wants_rematch` (host = player A):

`none` | `player_a_requested` | `player_b_requested` | `both_ready`

Both accepting returns the room to `waiting` with a different `passage_id` when available. Ready/start then creates the next match row. Historical matches and results are kept.

## Question security (Phase 10)

- Anon clients **cannot** select `questions.correct_answer` (column not granted).
- Public quiz data comes from view `questions_public` (`security_invoker = true`, no `correct_answer`).
- Anon/authenticated may `SELECT` only: `id`, `passage_id`, `question`, `options`, `type`, `created_at`.
- Solo grading: RPC `grade_passage_answers(passage_id, answers)`.
  - Refuses while an incomplete multiplayer match uses that passage.
  - Returns `correctAnswerIndex` only after every question has a submitted selection (answer review).
- Multiplayer grading: `submit_match_quiz` grades internally and stores the result.

## RLS notes (anonymous MVP)

- Passages: public read.
- Rooms / players / matches / results: **SELECT only** for anon. Writes go through SECURITY DEFINER RPCs that require a `session_token`.
- World-readable SELECT is intentional for Realtime without Auth. Treat room codes as weak capability tokens, not secrets.
- `player_sessions`: RLS enabled, no policies (deny).
- Results: immutable after write (no UPDATE policy; INSERT revoked for anon). `results.player_id` uses `ON DELETE RESTRICT` so history cannot be cascade-deleted.

## Realtime

`rooms`, `players`, and `matches` are in `supabase_realtime`. The app subscribes via `subscribeToRoom(roomId, callbacks)` in `src/lib/services/realtime.ts`. Results are fetched with a SELECT when the match/room reaches `results`. Clients refetch on subscribe / channel error / timeout and do not destroy the session solely because the websocket dropped.

## Abuse / rate limits

- `create_room_and_join`: max 8 rooms hosted by the same `client_id` in 10 minutes.
- Nicknames: 1–24 trimmed characters; unique per room (case-insensitive).
- No IP rate limiting at the database layer.

## Stale room cleanup

Rooms soft-close when `expires_at` passes (default 24h) or when host/results leave closes them. Historical `matches` / `results` are retained.

Optional manual cleanup:

```sql
-- Soft-close expired open rooms
update public.rooms
set status = 'closed'
where status <> 'closed'
  and expires_at <= now();
```

Scheduled cron is not required for the MVP. Do not delete completed match results unless you also archive history intentionally.

## Client services

| Module | Purpose |
|--------|---------|
| `src/lib/supabase/client.ts` | Shared client + `isSupabaseConfigured()` |
| `src/lib/supabase/errors.ts` | Typed `AppError` mapping |
| `src/lib/session/playerSession.ts` | Anonymous `client_id` + room session in localStorage |
| `src/lib/clockSync.ts` | Client/server clock offset |
| `src/lib/matchView.ts` | Pure match view resolver |
| `src/lib/rematch.ts` | Rematch state + outcome helpers |
| `src/lib/results.ts` | `compareMatchResults` + result row mapping |
| `src/lib/matchInsights.ts` | Deterministic head-to-head copy |
| `src/lib/services/passages.ts` | Passage queries |
| `src/lib/services/questions.ts` | Public questions + grade RPC |
| `src/lib/services/rooms.ts` | Room create/join helpers + lookups |
| `src/lib/services/players.ts` | Join / ready / leave / rematch RPCs + player reads |
| `src/lib/services/matches.ts` | Start / ack / finish / quiz RPCs + match reads |
| `src/lib/services/realtime.ts` | Room + player + match subscriptions |
| `src/lib/services/results.ts` | Fetch results (writes via RPC only) |
| `src/lib/services/passageRepository.ts` | Solo run bridge (Supabase or local) |

Word count for content must use `src/lib/reading.ts` / `src/lib/passageContent.ts` so WPM and `word_count` stay aligned.
