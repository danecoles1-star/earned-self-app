# Now card and segmented session update

This is an incremental update based on merged PR #10, main `9947f4d0d15ee88d292a37205ff956fc5826ca86`. Branch: `release/now-card-session-ring`. Preserve PR #9 signup feedback and PR #10 audit changes. Do not replay the original PR #8 release handoff or overlay a stale full-repository copy onto newer main.

Read `DEPLOY.md` as the only deployment runbook, and `docs/now-card-review.md` for this update's results. Ignore `docs/archive/`. `docs/HANDOFF.md` contains product direction; future AI plans there are not implemented by this update.

## Integration

The delivery contains `now-card-session.bundle`, `now-card-session.patch`, `source.zip`, `START_HERE.md`, test logs and checksums. Use the bundle from an existing checkout containing the baseline:

```sh
git fetch origin
git fetch /absolute/path/now-card-session.bundle release/now-card-session-ring:release/now-card-session-ring
git switch release/now-card-session-ring
git merge-base --is-ancestor 9947f4d0d15ee88d292a37205ff956fc5826ca86 HEAD
```

Inspect an existing branch before changing it. If main has advanced, integrate the newer commits and rerun gates. Preserve ignored local environment files. The full source ZIP is a reference snapshot, not a replacement for newer history.

## Required before merge

This is NOT a fully verified release. Local Chromium journeys and visual review are blocked by this execution environment. Do not treat old screenshots under docs/release-review or docs/homepage-review as evidence of this update.

1. Run `npm ci`, `npm test`, `npm run test:db`, and `npm run build` using the configured production Supabase URL and real publishable key privately.
2. Run `npx playwright install --with-deps chromium`, `npx playwright test --project=chromium`, `npm run test:prod`, and `npm audit --omit=dev`. Do not use the local browser override in CI.
3. Review Now, Begin/session, check-in/schedule-next, Proof and milestone earned at 390px and 1440px in light/dark mode. Also inspect the prepared Now card and segmented timer at 320px. Tests use disposable local fixtures and write review screenshots.
4. Check both prepared and unprepared states. Production does not yet have an AI preparation pipeline: existing steps use the area illustration and a single timer ring. The homepage preview is illustrative.
5. Push and open a PR titled **Now card + segmented session timer**, attaching new screenshots and honest test results. Require green CI and owner review before merge.
6. Follow the existing protected production workflow only after authorization. Record the previous production SHA/deployment and resulting main SHA, obtain owner environment approval, verify deployed SHA, then run DEPLOY §4 hosted smoke checks.

No migrations, dependency updates, password-policy changes, paid-service activation, dashboard changes or AI integration are part of this update. Public invitations remain on hold. Physical iPhone/Android checks and fresh hosted authentication/account isolation remain separate checks.
