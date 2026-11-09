# Earned Self

React, Vite and TypeScript web app backed by Supabase (sign-in, Postgres with row-level security, private storage). Deployed as static files to Cloudflare Pages at https://earned-self.pages.dev. The app is public; there is no Cloudflare Access gate.

- **Deploying:** read [DEPLOY.md](DEPLOY.md). It is the only current runbook.
- **Design system and next product work (AI preparation):** [docs/REDESIGN_BRIEF.md](docs/REDESIGN_BRIEF.md). Styles live in `src/earned.css`, the single token set for light and dark.
- **History:** `docs/archive/` holds earlier handoffs and runbooks. They are superseded; do not follow them.

## Run locally

Node 24 and npm.

```sh
npm ci
npm run preview:local   # browser-only local data, no email, never deployable
npm run dev             # real Supabase; needs .env.local with the two VITE_ values from .env.example
```

## Verify

```sh
npm test            # unit and component tests
npm run test:db     # all migrations in an in-memory Postgres, ownership and isolation checks
npm run build       # environment check, TypeScript, Vite build, build-boundary audit
npx playwright install chromium
npx playwright test --project=chromium   # browser journeys on the local adapter
npm run test:prod   # built app with production headers
```

`npm run build` refuses to run without `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for project `vovmkiuxmtnedfosoxds`. Set `ES_EXPECTED_SUPABASE_REF` only if the production project ever changes.

## Source layout

- `src/experience/`: member screens. `src/components/`: homepage and shared pursuit screens.
- `src/data/`: typed commands, domain rules, drafts, Supabase adapter.
- `src/preview/`: development-only local adapter (excluded from production builds).
- `supabase/migrations/`: forward-only schema and atomic `es_command` RPC. Never edit an applied file.
- `public/`: `_headers`, `_redirects` (SPA fallback), `robots.txt`.
- `scripts/`: environment check, build audit, database tests, test server.
- `.github/workflows/`: CI on every PR; manual production deploy.
