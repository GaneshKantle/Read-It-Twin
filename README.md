# Read It Twin

Read It Twin is a polished multiplayer reading competition product. This repository includes the design-system foundation, solo reading/quiz/results flow, and the Phase 06 Supabase database foundation.

## Stack

- React
- Vite
- TypeScript
- Tailwind CSS v4
- Framer Motion
- Lucide React
- Supabase (PostgreSQL + Realtime foundation)

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

Copy them into `.env.local` for local verification. When unset, the solo flow uses bundled passage seeds.

Apply schema + seed and read security notes in [docs/database.md](docs/database.md).
