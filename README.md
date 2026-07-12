# Ao Learner

Interactive English & German speaking practice with a 3D VRM tutor and Gemini evaluation.

## Stack

- Next.js 16 (App Router) + Tailwind
- Neon PostgreSQL + Prisma 7
- Kinde Auth
- UploadThing
- Gemini (speech evaluation)
- three.js / R3F / `@pixiv/three-vrm`

## Setup

1. Copy env:

```bash
cp .env.example .env
```

2. Fill:

- `DATABASE_URL` — Neon connection string
- Kinde keys (`KINDE_*`) — callback: `{SITE_URL}/api/auth/kinde_callback`
- `GOOGLE_AI_API_KEY`
- `UPLOADTHING_TOKEN` (optional until audio seed)

3. DB:

```bash
npx prisma db push
npm run db:seed
```

4. Run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Local dev |
| `npm run build` | Production build |
| `npm run db:seed` | Seed 5 EN + 5 DE stages |
| `npm run seed:audio` | Upload TTS audio (wire TTS first) |

## Product rules

- Sequential stage unlock per language
- Pass score ≥ 60
- Max 3 failed attempts → 3 hour cooldown
- Mobile-responsive UI

## Deploy (Vercel)

1. Import repo
2. Set env vars
3. Build command: `prisma generate && next build`
4. Add Kinde production callback URLs
