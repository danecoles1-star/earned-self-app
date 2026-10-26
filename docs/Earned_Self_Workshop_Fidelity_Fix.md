# Workshop fidelity correction

Baseline: b4875f7c3344088a8d7beb4597df52e7d9a29135. Branch: redesign/app-experience.

## Why
The Workshop release added illustrations over older presentation rules. Live inspection confirmed a hybrid design, overlapping Proof artwork, unreadable wallpaper labels and a buried legacy area prompt. Functional tests had not established mockup fidelity.

## Changes
- One stylesheet entry point places historical functional styles in a lower-priority foundation layer. Workshop owns current visual geometry, typography, controls and texture. Superseded forced visual rules lose their important priority; accessibility and reduced-motion safeguards remain.
- Now uses drawn dividers, a multi-stroke SVG timer and textured mineral controls. Current-step-to-timer clearance remains at least 40px. Clock persistence and animation logic are unchanged.
- Plan presents the actual challenge prominently beneath Your Plan, matching the approved Workshop composition. Its current milestone description joins the illustrated mineral surface. The illustrated milestone window stays visible; the duplicate vertical timeline moves into All milestones & steps. All milestones and planning controls remain reachable. This replaces the older large introductory sentence on Plan.
- Proof illustrations participate in normal layout. Legacy unassigned challenges do not receive unrelated door art. Recorded results and completed transformations retain their existing semantics.
- Existing unassigned challenges receive an explicit area choice near the area tabs, using the unchanged guarded area command. No automatic assignment or saved-data rewrite.
- Onboarding, sign-in and tools use a shared single-column prompt layout at desktop and mobile sizes, approved font stacks, paper texture, and mineral buttons with thin ember outlines. Wallpaper labels use explicit high-contrast colors.
- Logos and approved area, preparation, completion and navigation artwork are retained. Marketing and app timers share the new drawn ring.

## Verification
117 unit/component tests and 57 embedded PostgreSQL checks passed. Production build and boundary audit passed. npm audit reported zero vulnerabilities. All 32 Chromium journeys passed; a final five-scenario Workshop rerun also passed. Chromium coverage includes 320, 390 and 1440px, area isolation, completed and older Proof, timer persistence, recurring recovery, pause/resume, support modes and calendar/wallpaper journeys. Two new geometry/contrast/legacy-area scenarios cover 390 and 1440px.

The existing timeline tests now open All milestones & steps before asserting the complete path. The new ring is verified as a successfully loaded image, rather than assuming Vite preserves its filename instead of inlining it. One unrelated auth-callback unit assertion raced navigation on an intermediate run; the unchanged suite passed on rerun.

## Release scope
No dependency, lockfile, environment, migration, database command, account isolation, calendar export, photo processing or email change. Do not apply a Supabase migration for this patch. Do not merge or publish as part of the GitHub handoff.

Existing unfinished-feature notes remain authoritative. Physical iPhone gestures, native image saving, real email delivery and hosted two-account behavior are not re-certified by local browser tests. CSS cascade layers require a modern browser. Artwork remains illustrative. The three-door graphic shows a window of real milestone labels; complete history remains in planning details.
