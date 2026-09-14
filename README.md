# Earned Self: private test build v1

Repository-ready React, Vite and TypeScript source for the first private member loop. This is a new application, with direct Supabase integration. It has no connection to Lovable or any existing repository. No service has been connected or deployed.

## Run the isolated local preview

Use Node 24 (the tested runtime) and npm.

```sh
npm ci
npm run preview:local
```

Open the localhost URL printed by Vite. Choose a goal, retain the draft, then choose **Enter local preview**. No email is sent. The banner identifies browser-only preview data on every screen. Start empty and enter your own test writing. Maya appears only in the read-only homepage demonstration.

This mode is development-only. `vite build --mode preview-local` deliberately fails. A deployed build cannot turn preview mode on with a query parameter, localStorage value, or environment toggle. `npm run preview` serves a normal compiled build; it is not the local data adapter.

## Run with the Supabase development project

Read `docs/Earned_Self_Supabase_Implementation_v1.md` first. After the authorized operator configures the separate development project, create an ignored `.env.local` using the variable names in `.env.example`, then:

```sh
npm run dev
```

The normal application sends email sign-in links and uses narrow database RPCs. With no configuration, it retains the pre-auth draft and honestly reports that account saving is not connected. It never falls back to preview storage.

## Validate

```sh
npm test
npm run test:db
npm run build
npx playwright install chromium firefox
npm run test:e2e
```

`test:db` applies the two migrations only to a disposable in-memory PGlite PostgreSQL database with simulated authentication roles. It never reads Supabase connection variables. It is not a substitute for testing the real project's JWTs and RLS.

`test:e2e` starts the isolated local adapter. `ES_SCREENSHOTS_DIR` optionally selects an evidence-output directory. `ES_BROWSER_EXECUTABLE` optionally selects an existing local Chromium executable for restricted test environments; normal installations should use Playwright's managed browsers. Neither setting changes the shipped application.

## Included experience

Six-section homepage; member-authored goal or vision; draft before authentication; email sign-in; deliberate or quick commitment; required action and done criterion; optional date, time, IANA time zone and location; dominant goal; Done / Partly / Didn’t happen; optional factual detail and reflection revisions; private Record; next commitment; basic goal switching; sign-out and return.

The first implementation intentionally stops short of the broader MVP. It does not expose editing an existing commitment, rescheduling, result-status correction, targeted undo, pause, goal completion, account deletion or export controls. Immutable definitions and versioned reports leave room for reviewed follow-up commands. No feature is represented as implemented simply because its data could be extended.

No billing, trial activation, AI, patterns, Edge, uploads, calendar integration, wallpaper, notifications, outreach, sharing, public profile or program catalog is included. Homepage membership text describes planned pricing and clearly identifies this free private test.

## Source organization

- `src/components/Homepage.tsx`: approved homepage presentation and isolated public demonstration.
- `src/App.tsx`: small member route tree and first-loop screens. Shared form/save behavior stays here for this slice.
- `src/data/`: typed commands, member state, drafts and Supabase adapter.
- `src/preview/`: explicit development-only local adapter.
- `supabase/migrations/`: ordered new-project schema and atomic commands.
- `tests/` and `scripts/`: state, UI, SQL and build-boundary verification.
- `public/`: preview-wide headers, robots exclusion and SPA fallback.
- `docs/`: implementation, setup, limits and test evidence.

The Record is a projection over real definitions and reported evidence. There is no Record table, score, simulated accomplishment, or automatic inference of a missed action.

## Next step

Codex should add this source to the new empty repository in a reviewable branch, inspect the migration and tests, connect only the development project, then configure a protected Cloudflare preview. No production deployment, domain change, or account operation is authorized by running this source locally.
