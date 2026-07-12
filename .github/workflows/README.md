# CI

Workflow: `.github/workflows/ci.yml`

| Job | What |
|-----|------|
| **unit** | `npm run test:unit` (Jest coverage ≥98%) |
| **e2e** | Playwright public + authenticated smoke; ephemeral Postgres; `E2E_BYPASS_AUTH=1` |
| **lint** | `npm run lint` |

## Auth bypass (CI / local only)

- `E2E_BYPASS_AUTH=1` is set **only** in the e2e job env and Playwright `webServer.env`.
- Blocked when `NODE_ENV=production` (`requireUser` / `proxy.ts`).
- Do **not** set this on Vercel/production.

## Local e2e (same as CI)

```bash
# needs a running Postgres matching DATABASE_URL
npx prisma db push
set E2E_BYPASS_AUTH=1   # Windows PowerShell: $env:E2E_BYPASS_AUTH='1'
npm run test:e2e
```

## Secrets

None required for default CI (uses service Postgres + dummy Kinde IDs).  
Optional later: real `DATABASE_URL` secret if you drop the service container.
