# Read It Twin

Read It Twin is a polished multiplayer reading competition product. This repository includes the design-system foundation, solo reading/quiz/results flow, the Phase 06 Supabase database foundation, and the Phase 07 room lobby (create, invite, join, ready, start match).

## Stack

- React
- Vite
- TypeScript
- Tailwind CSS v4
- Framer Motion
- Lucide React
- Supabase (PostgreSQL + Realtime)

## Development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Supabase

Environment variables (see `.env.example`):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Copy them into `.env.local` for local verification. When unset, the solo flow uses bundled passage seeds. Multiplayer requires Supabase.

Apply schema + seed and read security notes in [docs/database.md](docs/database.md). Phase 07 needs both foundation and lobby migrations.
