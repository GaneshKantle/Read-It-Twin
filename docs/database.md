# Database (Phase 06 + Phase 07 + Phase 08)

Supabase + PostgreSQL foundation for Read It Twin, the Phase 07 lobby RPCs, and the Phase 08 synchronized race RPCs.

## Environment

Copy `.env.example` to `.env.local` and fill in:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

If either value is empty, the solo app uses local passage seeds and does not call Supabase. Multiplayer routes require both values.

## Apply migrations

1. Open the Supabase SQL editor (or use the Supabase CLI).
2. Run [`supabase/migrations/20260905143000_phase06_foundation.sql`](../supabase/migrations/20260905143000_phase06_foundation.sql).
3. Run [`supabase/migrations/20260906120000_phase07_lobby.sql`](../supabase/migrations/20260906120000_phase07_lobby.sql).
4. Run [`supabase/migrations/20260906210000_phase08_race.sql`](../supabase/migrations/20260906210000_phase08_race.sql).
5. Run [`supabase/seed.sql`](../supabase/seed.sql).

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
| `players` | Anonymous nicknames in a room (max 2); `finished` / `finished_at` / score columns |
| `player_sessions` | Private `(room_id, client_id)` → `session_token` (no anon SELECT) |
| `matches` | One row per race; `race_start_at` is the authoritative reading clock; `status` enum |
| `results` | Immutable score snapshot per player per match (`submitted_at`) |

Relationships:

```
passages 1──* questions
rooms 1──* players
rooms 1──* player_sessions
rooms 1──* matches *──1 passages (optional)
matches 1──* results *──1 players
```

Partial unique index: one incomplete match per room (`matches_one_active_per_room_idx`).

## Room lifecycle

Statuses (enum `room_status`):

`waiting` → `ready` → `countdown` → `reading` → `quiz` → `results` → `closed`

Match statuses (enum `match_status`):

`countdown` → `reading` → `quiz` → `results` (or `cancelled`)

TypeScript mirrors: `src/types/room.ts`, `src/types/match.ts`.

Phase 08 transitions:

- Host `start_match` creates a match with `race_start_at = now() + 2800ms`, resets player race columns, sets `countdown`
- Clients derive countdown digits from `race_start_at` (not local `setTimeout`)
- `ack_race_start` promotes `countdown` → `reading` after the start time
- `finish_reading` records authoritative reading time; both finished → `quiz`
- `submit_match_quiz` grades server-side and writes `results`; both submitted → `results`

## Lobby + race RPCs (SECURITY DEFINER)

| RPC | Purpose |
|-----|---------|
| `create_room_and_join(nickname, client_id)` | Create room + host player + session |
| `join_room(room_code, nickname, client_id)` | Join or restore the same session (idempotent) |
| `set_player_ready(player_id, session_token, ready)` | Toggle ready; sync room status |
| `start_match(room_id, player_id, session_token)` | Host-only start; create match + `race_start_at` |
| `get_server_time()` | Server clock for client offset |
| `ack_race_start(room_id, player_id, session_token)` | Promote countdown → reading |
| `finish_reading(match_id, player_id, session_token)` | Record finish; advance to quiz when both done |
| `submit_match_quiz(match_id, player_id, session_token, answers)` | Grade + store result |
| `leave_room(player_id, session_token)` | Leave lobby; mid-race keeps seat for refresh |
| `get_room_by_code(room_code)` | Lookup with soft-expire |

Postgres error codes mapped in the client:

| Code | Meaning |
|------|---------|
| `P0001` | expired |
| `P0002` | not found |
| `P0003` | full |
| `P0004` | session |
| `P0006` | closed |
| `P0007` | not host |
| `P0008` | not ready |
| `P0009` | match not found |
| `P0010` | match not active |
| `P0011` | race not started |
| `P0012` | finish too early |
| `P0013` | match not in quiz |

## Question security

- Anon clients **cannot** `SELECT` from `questions` (no RLS policy).
- Public quiz data comes from view `questions_public` (no `correct_answer`).
- Solo grading: RPC `grade_passage_answers(passage_id, answers)`.
- Multiplayer grading: `submit_match_quiz` grades internally and stores the result.

## RLS notes (anonymous MVP)

- Passages: public read.
- Rooms / players / matches / results: **SELECT only** for anon. Writes go through SECURITY DEFINER RPCs that require a `session_token`.
- `player_sessions`: RLS enabled, no policies (deny).
- Results: immutable after write (no UPDATE policy; INSERT revoked for anon).

## Realtime

`rooms`, `players`, and `matches` are in `supabase_realtime`. The app subscribes via `subscribeToRoom(roomId, callbacks)` in `src/lib/services/realtime.ts`.

## Client services

| Module | Purpose |
|--------|---------|
| `src/lib/supabase/client.ts` | Shared client + `isSupabaseConfigured()` |
| `src/lib/supabase/errors.ts` | Typed `AppError` mapping |
| `src/lib/session/playerSession.ts` | Anonymous `client_id` + room session in localStorage |
| `src/lib/clockSync.ts` | Client/server clock offset |
| `src/lib/matchView.ts` | Pure match view resolver |
| `src/lib/services/passages.ts` | Passage queries |
| `src/lib/services/questions.ts` | Public questions + grade RPC |
| `src/lib/services/rooms.ts` | Room create/join helpers + lookups |
| `src/lib/services/players.ts` | Join / ready / leave RPCs + player reads |
| `src/lib/services/matches.ts` | Start / ack / finish / quiz RPCs + match reads |
| `src/lib/services/realtime.ts` | Room + player + match subscriptions |
| `src/lib/services/results.ts` | Fetch results (writes via RPC only) |
| `src/lib/services/passageRepository.ts` | Solo run bridge (Supabase or local) |

Word count for content must use `src/lib/reading.ts` / `src/lib/passageContent.ts` so WPM and `word_count` stay aligned.
