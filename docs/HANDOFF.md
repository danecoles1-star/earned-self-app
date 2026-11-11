# Earned Self: handoff for a new chat

Read this first, then `docs/REDESIGN_BRIEF.md` (design and the AI data contract), `DEPLOY.md` (the only runbook) and `CODEX_HANDOFF.md` (the deploy prompt). Ignore `docs/archive/`.

Design canvas (light, dark and Now card boards): https://claude.ai/artifact/3Qzu9sREEZr85pdYWNmpzr

## Product in one paragraph

Earned Self helps people become who they want to be. An AI onboarding conversation gathers who they want to become. The AI suggests a challenge (unless they bring one), designs milestones and every step, and prepares each step's experience ahead of time once it's scheduled: image, session parts, guidance and tools. That prepared experience is the core product. The timer is secondary. Members should feel respected, proud and encouraged. It's a public web app now (Cloudflare Pages + Supabase), with a native iPhone app later.

## Decisions already made by the owner (don't reopen)

- **Tabs:** a floating tab bar with Now (the Earned Self logo mark), Plan (folded map) and Proof (cairn). It shows only on /app, /manage, /manage/why, /proof and /settings.
- **Now:**
  - Shows the "Becoming" vision, not a challenge link.
  - The Now card is direction A: an experience preview with the step image, status tag, plain time, part chips and a full-width Begin with an ember ring. The button always reads "Begin" (or "Prepare" if nothing is scheduled).
  - Get ready (Where/When/Done when) sits below the card. The how-to lives inside Begin.
- **Session:** the timer is direction B: a segmented ember ring split by the session's parts.
- **Check-in:** the result choices are Done / Partly / Not yet. Scheduling the next step happens inside check-in. The only exception is the first step after onboarding.
- **Onboarding (decided November 10):**
  - A fixed nine-question conversation. Members never chat with the AI; they answer, then the AI generates one plan. The earlier answers stay in the thread and move up as each question arrives.
  - No guided/self-guided choice anywhere. The AI decides when to push harder or back off from check-ins.
  - No plan changes by the member, on the reveal or later. The reveal says the plan adjusts as they grow.
  - The reveal is labelled "A person worth challenging", is shown unblurred before sign-up, and leaves the AI's parts blank until the plan service exists.
  - After "Make it mine" comes one two-minute first step with no timer, then a check-in, then account creation.
- **Proof:** a milestone tracker plus a weekly journal of entries. Keep the evidence.
- **Style:** no dropdowns anywhere (use choice buttons or chips). Uniform styling on every page, in light and dark. Most users run dark mode.
- **Homepage:** outcome- and emotion-led, focused on account creation. App previews must match the real app.
- **Analytics:** Cloudflare Web Analytics.
- **AI:** Meta Muse Spark 1.3 (text) and Muse Image Generation, called only from a Supabase Edge Function.

## Hard rules

- No Cloudflare Access or any login gate in front of the site.
- Never put Supabase secret or service keys, or AI provider keys, in `VITE_` variables or the repo. AI keys are Supabase secrets.
- Database changes are new forward-only migrations. Never run migrations, db reset, migration repair or config push. Codex does that through `DEPLOY.md` with the owner.
- Never weaken or delete a behavior test. Update visual assertions only when the design intentionally changed.
- Copy and numbers on member screens come from saved data, never invented.

## Design system

- **Where:** `src/earned.css`.
- **Light tokens:** ground #F6F1E8, card #FFFDF8, ink #101A20, mineral #4E6672, ember #FF5B36, ember text #B8401F, gold #F0B44C.
- **Dark tokens:** #0B1216, #141F26, #F2EDE4, #9FC0CE, ember text #FF8A6B.
- **Type:** Figtree for UI, Newsreader for display. Base size 17px.
- **Overriding legacy CSS:** use `html body .x:is(*, #es-legacy)`.
- **Shared pieces:**
  - `src/experience/Earned.tsx`: TabIcon, MilestoneTracker, FocusSession, MilestoneEarned.
  - `src/experience/NowCard.tsx`: the Now card, `preparedStep()`, `friendlyWhen()`.
  - `src/experience/StepTimer.tsx`: the segmented ring.

## What's done (in this zip)

- Cleanup and public launch: Access removed, CSP, headers, robots, manifest and icons, CI and deploy workflows, env checks.
- The redesign of Now, session, check-in, schedule-next, Proof and milestone earned, plus the homepage.
- The new Now card and session ring.
- Workstream 1: the onboarding conversation, plan reveal and first step; the Plan milestone path; sign-in and sign-up with the draft card; shared toasts, kept-on-device line and empty states; compressed wallpapers and illustrations; a light/dark audit of every route.

## What's left, by workstream

1. **Onboarding, Plan and sign-in:** done, apart from what waits on other workstreams:
   - The reveal's challenge headline (when the member asks for one to be crafted) and its milestones are blank until workstream 3 fills them. A crafted-challenge member is saved with empty challenge words; Plan shows "Your challenge will appear here."
   - `ResumeEntry` ("Save this plan?") and the legacy `Page` screens still use their older layout with the new tokens.
   - `src/experience/AIOnboarding.tsx` (the earlier flag-gated preview) is unchanged and unused in production; delete it with its tests once workstream 3 no longer needs the reference.
2. **Legal and professional:**
   - Privacy policy and terms pages, with placeholders until the owner supplies business name, entity type, state, contact email and minimum age.
   - Footer and sign-up links to them.
   - Account deletion: an Edge Function that verifies the JWT, deletes es_* rows and `profile-photos/<uid>/`, then the auth user. Settings UI with confirmation, plus tests.
   - Cloudflare Web Analytics: add `static.cloudflareinsights.com` to script-src and `cloudflareinsights.com` to connect-src, and update `scripts/audit-build.mjs`.
3. **Muse integration:**
   - Prepared-step table and migration.
   - An Edge Function with a provider-agnostic adapter that turns the owner's step instructions into the `PreparedStep` contract in `REDESIGN_BRIEF.md` §4, with the image stored in private Storage.
   - `es_read_state` returns `prepared`.
   - A session screen that renders the guidance and tools.
   - Add the effort check-in (Comfortable/Challenging/Too much) here, since it feeds adaptation.
   - **Onboarding answers need a home.** Interests, starting point, weekly time, schedule, resources and limits live in the draft (`aiIntake`). At save, time and limits are copied into `constraints`, and starting point and resources into `capabilities`; the full answers are kept only on the device (`keptIntake()` in `src/data/drafts.ts`). Add a migration that stores them with the challenge, and send them to the plan function.
   - Generate exactly one plan per challenge. Members cannot regenerate or edit it; adaptation comes from check-ins. Because sign-up comes after the reveal, the function must rate-limit anonymous generation (one plan per draft id, per-address limits, the daily cost ceiling).
   - Optionally polish a long member-written challenge into a shorter headline for display, keeping the original saved.
   - Onboarding no longer asks "What will completion look like?"; the plan should set `outcome`. Until then preparation asks for it.

## Design system additions (workstream 1)

- **Where:** `src/entry.css`, imported after `earned.css`. Onboarding and sign-in render inside `#es-entry`; the Plan path inside `#es-plan`.
- **Shared pieces:** `src/experience/Notice.tsx` has `Notices` (the one save/error toast), `DraftKept` and `EmptyState`. Use them instead of ad hoc status text.

## Working environment notes

The sandbox usually has no network for npm. Build-check with esbuild, type-check with tsc, and screenshot with Playwright against a local static server using the local preview adapter (`__LOCAL_PREVIEW__`). Codex runs the full vitest and Playwright suites.

## Delivering

End with an updated full-repo zip plus a short list of the files you changed and any test changes. Add a note for `CODEX_HANDOFF.md` if deploy steps change. Workstreams may run in parallel, so keep changes scoped to your workstream and say clearly if you had to touch shared files (`earned.css`, `types.ts`, `App.tsx`, `Settings`).

## Wallpaper decision — November 10

Use plain brand-color backgrounds only: Ink, Ivory, Mineral, Ember and Gold. Members choose their saved Challenge, an individual Milestone, or Becoming statement. Display wording edits do not modify saved records. No photographic gallery, sketch backgrounds or AI-generated personal images are included. See START_HERE.md and docs/WALLPAPER_STUDIO_REVIEW.md for combined validation.
