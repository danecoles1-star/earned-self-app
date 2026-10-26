# Earned Self app experience: implementation preview

Prepared against supplied archive commit `f0a9c14b8e39385a32b3792b1ffb00c402437a85`.

This is a working implementation of the central ambition loop, ready for local review. It is not a declaration that all 60 prototype compositions, external services, or production acceptance checks are finished. No remote database, GitHub repository, or deployed website was changed here.

## Implemented

- Exact “Become You.” home copy; smaller original brand assets; ink/mineral surfaces; white action buttons with ember borders; native, accessible text controls.
- Required identity, ambition, meaning, observable finish and stretch answers. Contextual prompts open on request; a small set of explicitly optional examples responds to writing, climbing, business and music ambitions. This is deterministic guidance, not an AI coaching service.
- A real first action and honest report before sign-in. Partial/not-yet reports require a blocker and adjustment. Editing the action clears its old report. Account-bound draft import preserves the account boundary.
- Required preparation, including an obstacle response, milestones and their evidence, then a scheduled commitment. “Nothing significant/unresolved right now” is an explicit answer where appropriate.
- Now, Ambition, Proof, report, correction history, milestone recognition, pause/change/resume decisions, accomplishment reflection and another ambition. Existing advanced revision controls remain accessible through Agreements and revisions.
- Google Calendar event creation link; Apple-compatible event file with stable UID, revision and UTC timestamps. Neither claims the user has added the event.
- A real downloadable 1170×2532 lock-screen PNG, with the same generated image used for its preview. User controls wording, reason, date, brand and background. Text that will not fit is rejected rather than silently truncated.
- Support preference, account data export, ambition selection, local draft recovery, retry receipts, disabled/inert saving UI and owner checks after asynchronous work.
- Three optimized metal-and-gold assets: balanced steps, supported pyramid path, faceted mountain. Their combined source size is about 197 KB. Original logo/wordmark bytes and dependency files are unchanged.

## Database change

`202609180001_first_move.sql` adds an authenticated `first_move` command to the existing atomic RPC. It writes a reported quick commitment, its immutable definition, and the honest report together. It does not activate the ambition or invent a calendar schedule. It uses the existing owner checks, idempotency receipt and row lock. All three earlier migrations are byte-for-byte unchanged.

The fourth migration is required before a hosted version can import a first report. It has only been exercised in local embedded PostgreSQL, not against the hosted Supabase project. The updated read-only verifier is `docs/Earned_Self_Supabase_Verification_v3.sql`; v2 intentionally remains the historical three-migration verifier.

The obstacle response is preserved in the existing constraints text under “My plan for the hard part”; no new preparation schema is introduced. Early onboarding pain/domain/stretch/barrier answers guide the local experience but are not separate durable account fields. Core identity, ambition, meaning, outcome, preparation and Proof are saved.

## Local validation

- 29 unit/component tests passed.
- 32 embedded PostgreSQL checks passed, including first-action atomicity, retry, required facts, duplicate rejection and cross-account isolation.
- 2 Chromium browser scenarios passed: 390px complete first-visit-to-accomplishment loop; 375px keyboard, required whitespace rejection and reload recovery. The first also checks 1440px home rendering, downloads, a forced failed-save retry and horizontal overflow. Screenshot fixture answers are test data only; the product starts blank.
- TypeScript, Vite production build and production boundary audit passed. No preview adapter, preview identities or detected service credentials were present in that bundle.
- No production environment credentials were supplied. Production build success does not establish a configured hosted login or production data connection. Browser journey uses the explicitly isolated local preview adapter.
- Real Supabase JWTs/two-account hosted checks, SMTP delivery, Safari/iOS behavior, Apple Calendar import and real Google event saving have not been verified. Firefox is configured but was not run in this environment.

## Still required before calling the redesign complete

1. Finish the remaining approved page-specific artwork and its placement. The first Proof and milestone screens currently reuse the path asset; the ribbon, open-question gap, mail, calendar, connected-path and book compositions from the approved boards are not all implemented. The original logo is used unmodified, on a light disc for legibility on ink; the mockups' recolored drawn mark is not substituted.
2. Visually refine the legacy history/editor views and review actual device typography, transitions and long answers. This build is a functional preview, not a pixel-identical transcription of all 60 mockups.
3. Apple subscription feed is not implemented. The delivered Apple action exports one event. A private revocable feed needs a server endpoint and lifecycle design. Existing events require manual updates; no background sync is claimed.
4. Account deletion/email-change and billing are not implemented in the supplied backend. Settings offers sign-out and data export, not simulated destructive actions or pretend checkout. Payment amounts, entitlements and provider integration remain unset.
5. Guided examples cover a few recognizable ambition types. Broader, genuinely specific coaching needs further content or a real service; no fabricated personalized suggestions are inserted into answers.
6. Milestone deadlines remain required by the existing database contract, despite some mockups depicting optional dates. Do not silently relax the contract at deployment.
7. Finish a hosted private review with the intended Supabase settings before production deployment. No Cloudflare Access or hosting settings were changed.

## Five-point visual fidelity review

| Area | Result |
|---|---|
| Home wording and app framing | Implemented; native one-column mobile layout and desktop reading width |
| Brand integrity and colors | Original logo assets retained; ink/mineral, metal/gold art, ember CTA borders |
| Corrected step and pyramid geometry | Implemented and visually inspected; broad bottom tread, pyramid base supported |
| Input/selection experience | Implemented; blank authored answers, required progression, focused headings and visible control focus |
| All approved individual compositions | Partial; see remaining artwork and legacy history views above |

## Run locally

From this repository in Mac Terminal:

```bash
npm ci
npm run preview:local
```

Open the local URL printed by Vite. The banner identifies browser-only preview data. Click Begin for a blank first visit. “Enter local preview” replaces email only in this local mode. Never deploy this mode as the real account application.

Production uses the existing Vite/Supabase environment variables and `npm run build`. Do not upload the whole source folder or a preview-local bundle to Cloudflare.
