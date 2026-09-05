# Database (Phase 06)

Supabase + PostgreSQL foundation for Read It Twin. No multiplayer UI yet — this is schema, security, seed data, and typed services.

## Environment

Copy `.env.example` to `.env.local` and fill in:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

If either value is empty, the solo app uses local passage seeds and does not call Supabase.

## Apply migration

1. Open the Supabase SQL editor (or use the Supabase CLI).
2. Run [`supabase/migrations/20260905143000_phase06_foundation.sql`](../supabase/migrations/20260905143000_phase06_foundation.sql).
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
| `rooms` | Lobby container; unique `room_code`; expires after 24h by default |
| `players` | Anonymous nicknames in a room |
| `matches` | One row per race; a room can have many matches (rematch) |
| `results` | Immutable score snapshot per player per match |

Relationships:

```
passages 1──* questions
rooms 1──* players
rooms 1──* matches *──1 passages (optional)
matches 1──* results *──1 players
```

## Room lifecycle

Statuses (enum `room_status`):

`waiting` → `ready` → `countdown` → `reading` → `quiz` → `results` → `closed`

TypeScript mirror: `src/types/room.ts` (`ROOM_STATUSES`).

## Question security

- Anon clients **cannot** `SELECT` from `questions` (no RLS policy).
- Public quiz data comes from view `questions_public` (no `correct_answer`).
- After the quiz, call RPC `grade_passage_answers(passage_id, answers)` (SECURITY DEFINER). It returns graded rows including `correctAnswerIndex` only after submit.

Local fallback still grades in the browser because answers ship in the bundle. Answer protection applies when the run uses Supabase passage UUIDs.

## RLS notes (anonymous MVP)

- Passages: public read.
- Rooms / players / matches / results: insert + select for anon so lobby can work without accounts.
- Player updates are not cryptographically bound to a session (spoofable until auth). Treat as MVP soft security.
- Prefer future narrow RPCs for status transitions.

## Realtime

`rooms`, `players`, and `matches` are added to `supabase_realtime`. Do not subscribe from the app until Phase 07.

## Client services

| Module | Purpose |
|--------|---------|
| `src/lib/supabase/client.ts` | Shared client + `isSupabaseConfigured()` |
| `src/lib/supabase/errors.ts` | Typed `AppError` mapping |
| `src/lib/services/passages.ts` | Passage queries |
| `src/lib/services/questions.ts` | Public questions + grade RPC |
| `src/lib/services/rooms.ts` | Room CRUD / expire |
| `src/lib/services/players.ts` | Anonymous players |
| `src/lib/services/matches.ts` | Match create / complete |
| `src/lib/services/results.ts` | Persist / fetch results |
| `src/lib/services/passageRepository.ts` | Solo run bridge (Supabase or local) |

Word count for content must use `src/lib/reading.ts` / `src/lib/passageContent.ts` so WPM and `word_count` stay aligned.
