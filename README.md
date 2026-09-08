# Read It Twin

Read It Twin is a polished multiplayer reading competition product: solo runs, synchronized two-player races, authoritative scoring, rematch, and a production-hardened anonymous Supabase backend.

## Stack

- React 19
- Vite
- TypeScript
- Tailwind CSS v4
- Framer Motion
- Lucide React
- Supabase (PostgreSQL + Realtime)
- Vitest (unit tests)

## Development

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run test
npm run lint
npm run build
```

## Environment variables

Copy [`.env.example`](.env.example) to `.env.local`:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Frontend-safe only. Never put a service-role key, database password, or other secret in `VITE_` variables.

When unset, the solo flow uses bundled passage seeds. Multiplayer requires both values.

### Production (Vercel)

Set the same two variables in the Vercel project environment. Hosting uses [`vercel.json`](vercel.json) for SPA rewrites and security headers (CSP allows Supabase HTTPS/WSS and Google Fonts).

## Supabase

Apply schema + seed and read security notes in [docs/database.md](docs/database.md).

Migration order (repo files):

1. `20260905143000_phase06_foundation.sql`
2. `20260906120000_phase07_lobby.sql`
3. `20260906210000_phase08_race.sql`
4. `20260907140000_phase09_results_rematch.sql`
5. `20260908120000_phase10_hardening.sql`
6. `20260908121000_phase10_revoke_rls_auto_enable.sql`
7. `20260908122000_phase10_questions_public_access.sql`
8. `supabase/seed.sql`

## Product routes

| Route | Purpose |
|-------|---------|
| `/` | Landing |
| `/play` | Solo setup → read → quiz → results |
| `/challenge` | Create multiplayer room |
| `/room/:code` | Join / lobby / race |
| `/join/:code` | Invite alias → `/room/:code` |

## Known limitations

- Anonymous MVP: `rooms`, `players`, `matches`, and `results` remain world-readable via SELECT so Realtime postgres_changes works without Auth.
- Room codes are 4 characters (not sequential IDs). Enumeration is theoretically possible; do not treat codes as secrets.
- No IP-level rate limiting. Create-room is capped lightly per client id (8 / 10 minutes).
- Stale rooms soft-close after 24h; rows are retained so historical results stay intact. Optional cleanup SQL is documented in `docs/database.md`.
- Solo scoring with local seeds is client-trusted. Multiplayer WPM, comprehension, and winner are server-authoritative.
- Result sharing is text-only (Web Share / clipboard). There is no public `/results/:id` page and no dynamic Open Graph previews — Vercel SPA hosting cannot generate per-result social cards without a separate backend.
- Analytics is a local `track()` abstraction only (dev console in development). No third-party analytics vendor is bundled.
- PWA / offline install is intentionally not implemented; multiplayer requires a live network.
