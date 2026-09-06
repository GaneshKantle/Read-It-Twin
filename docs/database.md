# Database (Phase 06 + Phase 07)

Supabase + PostgreSQL foundation for Read It Twin, plus the Phase 07 lobby RPCs (create / join / ready / start / leave).

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
4. Run [`supabase/seed.sql`](../supabase/seed.sql).

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
| `players` | Anonymous nicknames in a room (max 2, enforced by trigger) |
| `player_sessions` | Private `(room_id, client_id)` → `session_token` (no anon SELECT) |
| `matches` | One row per race; a room can have many matches (rematch) |
| `results` | Immutable score snapshot per player per match |

Relationships:

```
passages 1──* questions
rooms 1──* players
rooms 1──* player_sessions
rooms 1──* matches *──1 passages (optional)
matches 1──* results *──1 players
```

## Room lifecycle

Statuses (enum `room_status`):

`waiting` → `ready` → `countdown` → `reading` → `quiz` → `results` → `closed`

TypeScript mirror: `src/types/room.ts` (`ROOM_STATUSES`).

Phase 07 transitions:

- Join / ready toggles keep the room in `waiting` or flip to `ready` when both players are ready
- Host `start_match` creates a match, assigns one shared passage, and sets `countdown`
- Host leave before start closes the room

## Lobby RPCs (SECURITY DEFINER)

| RPC | Purpose |
|-----|---------|
| `create_room_and_join(nickname, client_id)` | Create room + host player + session |
| `join_room(room_code, nickname, client_id)` | Join or restore the same session (idempotent) |
| `set_player_ready(player_id, session_token, ready)` | Toggle ready; sync room status |
| `start_match(room_id, player_id, session_token)` | Host-only start; create match + assign passage |
| `leave_room(player_id, session_token)` | Leave; host leave closes lobby rooms |
| `get_room_by_code(room_code)` | Lookup with soft-expire |

Postgres error codes mapped in the client: `P0001` expired, `P0002` not found, `P0003` full, `P0004` session, `P0006` closed, `P0007` not host, `P0008` not ready.

## Question security

- Anon clients **cannot** `SELECT` from `questions` (no RLS policy).
- Public quiz data comes from view `questions_public` (no `correct_answer`).
- After the quiz, call RPC `grade_passage_answers(passage_id, answers)` (SECURITY DEFINER). It returns graded rows including `correctAnswerIndex` only after submit.

Local fallback still grades in the browser because answers ship in the bundle. Answer protection applies when the run uses Supabase passage UUIDs.

## RLS notes (anonymous MVP)

- Passages: public read.
- Rooms / players / matches: **SELECT only** for anon. Writes go through lobby RPCs that require a `session_token`.
- `player_sessions`: RLS enabled, no policies (deny).
- Results: insert + select (immutable after write).
- A stolen UUID is still theoretically spoofable without Auth, but a random client cannot ready another player or start a room without that player's session token.

## Realtime

`rooms`, `players`, and `matches` are in `supabase_realtime`. The app subscribes via `subscribeToRoom(roomId, callbacks)` in `src/lib/services/realtime.ts`.

## Client services

| Module | Purpose |
|--------|---------|
| `src/lib/supabase/client.ts` | Shared client + `isSupabaseConfigured()` |
| `src/lib/supabase/errors.ts` | Typed `AppError` mapping |
| `src/lib/session/playerSession.ts` | Anonymous `client_id` + room session in localStorage |
| `src/lib/services/passages.ts` | Passage queries |
| `src/lib/services/questions.ts` | Public questions + grade RPC |
| `src/lib/services/rooms.ts` | Room create/join helpers + lookups |
| `src/lib/services/players.ts` | Join / ready / leave RPCs + player reads |
| `src/lib/services/matches.ts` | `startMatch` RPC + match reads |
| `src/lib/services/realtime.ts` | Room + player subscriptions |
| `src/lib/services/results.ts` | Persist / fetch results |
| `src/lib/services/passageRepository.ts` | Solo run bridge (Supabase or local) |

Word count for content must use `src/lib/reading.ts` / `src/lib/passageContent.ts` so WPM and `word_count` stay aligned.
