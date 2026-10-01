# Pilot preparation update, October 1, 2026

Baseline: `3f5006531519006cbdeb19def09caa8315901516`, branch `redesign/app-experience`.
This source package updates the existing app. It is not a Cloudflare upload bundle.

## Changes

- Basecamp visually separates challenge, milestone and current step; management and check-in controls are recognizable buttons.
- Plan shows numbered current/upcoming/completed milestones, active sessions and completed check-in counts.
- Add step collects date/time before saving to the queue. Basecamp chooses the earliest unresolved schedule; overdue work is not discarded. A locally started/paused timer keeps its occurrence selected until reported. Timer preference is device-local.
- One-time is default. Repetition, weekdays and end date are explicit choices. Each occurrence has its own check-in/timer; report and next occurrence save atomically. Morning/evening are separate steps. No milestone auto-completion or inferred recurrence.
- Readiness allows early milestone review. Attempt does not advance. Completion asks to end or carry remaining work. Ending work does not invent completion Proof.
- MM/DD/YYYY and AM/PM input/display; named timezone retained. A clock-change gap/fold saves the completed report and keeps the next session visible with a request to choose a valid time.
- Finish session pauses the timer and opens check-in; readiness choices lead to preparation or milestone review.
- New independent steps no longer inherit unrelated missed-step recommitment requirements.
- Edit vision in Plan creates a revision, preserving the challenge, Proof and earlier wording. It does not silently replace saved text.
- Proof uses compact factual statuses/dates; historical entries return to Basecamp. Missed attempts and history are retained.
- Calendar has neutral Return to Basecamp, recurring Google export and the agreed Apple .ics fallback. No claim that an event was added. Exports are snapshots, not synchronization: members must update external calendars when changing/stopping a routine. Explicit timezone observances use the browser timezone database for 100 years, without inferred annual rules.
- Mountain wallpaper preserves approved artwork proportions. Ink/Mineral/Light styles use subtle textures. Preview/export share one image. Save to phone uses file sharing where supported; cancellation never downloads. Full-size image and explicit download are fallbacks.

## Verification

75 unit/component tests; 44 embedded PostgreSQL checks; TypeScript/Vite/boundary audit passed. 14 Chromium journeys passed across existing and new suites, including 390px/1440px review journeys. Tests cover recurring sessions, timer reload, check-in, Vision save/reload, Proof, calendar file, wallpaper, share cancellation and overflow. Screenshots visually reviewed. The Vision browser test waits for save completion before testing reload.

Production environment values were unavailable in this workspace. The build proves compilation and boundary audit, not hosted connectivity; rebuild with the user's validated environment. Chromium used Playwright with Chromium 153, not physical iPhone Chrome/Safari.

No dependencies, lockfiles, environment files, previous migrations, login templates or SMTP settings changed. No GitHub push, hosted Supabase operation or Cloudflare deployment performed.

## Deployment order

1. Apply in a clean checkout at the exact baseline. Test, build, commit/push existing branch, update draft PR #2 preserving unfinished-feature documentation.
2. On linked project `vovmkiuxmtnedfosoxds`, inspect migration list and dry-run. Only new migration: `202610010001_preparation_queue.sql`, following `202609300001_basecamp.sql`.
3. Apply and verify migration, then rebuild with production configuration and upload fresh dist to Cloudflare Production.
4. Do not roll back to the old single-active-step app after creating queued data without reviewing compatibility. The new migration removes that index restriction. No existing progress is deleted.
5. Hosted smoke tests: two-account isolation, recurring/one-time queue, report retries, early readiness/attempt/carry, timer, Vision persistence, calendar imports, physical iPhone wallpaper Save Image.

## Unresolved, do not mark complete

- Unexpected essay/example Proof and original Vision mismatch require hosted diagnosis. Current source does not contain the exact reported essay text. `Inspect_My_Records.sql` is read-only, scoped to the founder's account, and retrieves IDs/revisions. No deletion or concealment is included. A scoped repair requires those results. Do not claim contamination investigation complete before inviting pilots.
- Native Save Image availability must be tested on physical iPhone Chrome and Safari. The web app does not silently write to Photos or guarantee a Files-free flow.
- Hosted migration/RLS, multi-device queue refresh, and external calendar imports are post-deployment checks.
- Email inbox placement remains the separate Resend support issue.
