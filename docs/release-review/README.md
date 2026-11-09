# Redesign + public launch — review evidence

Based on current `main` at `c8dd4402e0f3f8b2f22c54b5c1d4509cf9790b84`, with the supplied release package overlaid. `DEPLOY.md` remains the only deployment runbook; archived documents were not used as instructions.

## Scope and narrow repairs

- Lockfile includes Figtree 5.3.0 and Newsreader 5.3.0 within the supplied ^5.1.1 ranges.
- Retained the package’s intentional deletions and archived documents.
- Centered Begin precisely on the artwork’s documented 50.06% / 56.9% halo center. Browser assertions allow less than 0.5px rounding error.
- Clipped the timer orbit’s invisible rotated corners without cutting off its visible marker, fixing horizontal overflow at 320px.
- Prevented background account reads from taking focus away from an active writing field; added a delayed-read regression test.
- Updated outdated tests to assert the 100px Begin, Not yet Proof chip, current vision location, and explicit back/recovery navigation in full-screen flows. Existing save, reload, isolation and recovery assertions remain.
- Added four complete local review journeys: two themes × two viewport widths. Each saves a check-in, schedules the next step, reloads it, and inspects Proof and milestone earned.

## Environment and limits

Node 24.22.1. Production build used the real production publishable key obtained from the existing public bundle, in an ignored `.env.production.local`. No private or service-role credentials were used.

The pinned Playwright 1.63.0 browser download returned invalid ZIP files for Chromium 153, including the headless-shell attempt. Local browser checks use official Chromium Headless Shell 140 (Playwright build 1187), selected through the existing `ES_BROWSER_EXECUTABLE` override. Playwright and dependency ranges were not downgraded. CI must still run its normal browser installation and pass before merge.

All browser review records are disposable local fixtures. No hosted member records were created or edited. No iPhone/physical-device, live email, live authorization or post-deployment smoke result is claimed.

All nine migration files are byte-identical to `origin/fix/center-area-tabs`. Seven are new relative to the older main branch, but are existing migration history, not newly authored migrations. Follow DEPLOY §3 to verify remote history; do not run a migration merely because Git shows those files as added.

No active external access gateway is configured. Literal removal instructions remain in DEPLOY §1a, the supplied handoff, and the negative build audit; this is the necessary exception to the request for zero mentions outside the archive. No login gate was added in front of the public site. Member data still requires Supabase authentication and RLS.

DEPLOY §6 lists additional public-invitation blockers (owner legal text, account deletion, outside-address SMTP verification and founder-record investigation). This release does not claim those are completed. AI preparation remains out of scope.

## Screenshots

Local preview banners deliberately identify synthetic records. Full-page screenshots show the fixed floating navigation at its viewport position; the page scrolls beneath it.

| Screen | Light 390 | Dark 390 | Light 1440 | Dark 1440 |
| --- | --- | --- | --- | --- |
| now | [View](light-390-now.png) | [View](dark-390-now.png) | [View](light-1440-now.png) | [View](dark-1440-now.png) |
| session | [View](light-390-session.png) | [View](dark-390-session.png) | [View](light-1440-session.png) | [View](dark-1440-session.png) |
| check-in | [View](light-390-check-in.png) | [View](dark-390-check-in.png) | [View](light-1440-check-in.png) | [View](dark-1440-check-in.png) |
| schedule-next | [View](light-390-schedule-next.png) | [View](dark-390-schedule-next.png) | [View](light-1440-schedule-next.png) | [View](dark-1440-schedule-next.png) |
| proof | [View](light-390-proof.png) | [View](dark-390-proof.png) | [View](light-1440-proof.png) | [View](dark-1440-proof.png) |
| milestone-earned | [View](light-390-milestone-earned.png) | [View](dark-390-milestone-earned.png) | [View](light-1440-milestone-earned.png) | [View](dark-1440-milestone-earned.png) |

## Verification results

- Unit/component: **135/135 passed** (22 files), including delayed-read focus regression.
- Database: **57 checks passed**, ephemeral PGlite only.
- Production build and boundary audit: **passed** with production project configuration.
- Chromium journeys: **48/48 passed**, including 24 release screenshots and save/reload scheduling checks.
- Production-header browser test: **1/1 passed** using the local built app with intercepted backend requests.
- Production dependency audit: **0 vulnerabilities** (`npm audit --omit=dev`).
- `git diff --check`: passed.
- Visual review: 390px and 1440px, light and dark, Now / session / check-in / schedule-next / Proof / milestone-earned. Additional automated no-overflow checks include 320px. Begin center is measured against the source artwork coordinates.

## Publication status

Prepared locally only. The available GitHub connections report `push: false`, and shell Git has no push credentials. No remote branch, PR, merge or deployment was created from this environment. A local commit and portable bundle are provided for an owner-authenticated checkout. CI status and hosted smoke tests remain pending.
