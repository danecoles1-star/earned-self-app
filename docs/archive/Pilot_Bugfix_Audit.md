# Earned Self pilot bug audit

Prepared 28 September 2026 against deployment commit `fa9dec1b886814832137fd0bc6490ed1efdd8a0d` on `redesign/app-experience`.

Status: fixes validated locally. Not yet pushed or deployed. No hosted database or account records were changed. No database migration or dependency update is needed for this patch.

## Findings and fixes

| Finding | Fix and evidence |
|---|---|
| A draft ambition with an outstanding quick commitment offered Prepare my ambition, then failed at the final save. | Outstanding work now takes priority on Now. Direct preparation URLs show Report what happened before presenting a form. The Ambition menu no longer offers impossible preparation. Browser regression reports the legacy move, then successfully opens preparation. |
| Active, paused, or ended ambitions could open an invalid preparation flow. | Preparation checks both ambition status and outstanding work; existing local answers are preserved. |
| Legacy quick commitments could enter an unsupported reschedule flow. | Move editor routes these users to report the current move first. Calendar action appears only for a scheduled commitment. |
| Paused/ended ambitions and completion decisions led into late server rejections. | State-aware next actions; completion checks outstanding work/preparation before reflection; milestone submission requires active status. Ended ambitions offer a new ambition. |
| A successful write followed by a failed read could advance with stale state. | Explicit saved-but-reload recovery. Reload resumes the original navigation only after a successful read, without writing twice; changing account discards that continuation. Regression checks the exact write/read sequence. |
| A signed-out browser could reopen an account-bound onboarding draft. | Draft contents require the matching signed-in account. Separate drafts are archived locally, scoped to owner and preview/production mode, and can be restored from Begin another ambition. This is a UI boundary, not encryption of browser storage. |
| Starting another ambition could reuse an unfinished entry draft. | An explicit fresh-start screen opens blank inputs while preserving saved ambitions and Proof. An earlier entry draft can be restored. |
| Wallpaper/calendar links touched visually. | Spaced, wrapping controls with usable touch height. Inspected at 390px and 1440px. |
| Document title still said Private test. | Title is now Earned Self. Existing honest pilot/billing disclosures remain. |
| Deployed CSP disallowed the blob URL used by wallpaper preview. | Added blob: only to img-src. A production-build browser test enforces the actual headers and verifies a decoded 1170px preview and PNG download. Other security directives remain unchanged. |

## Synthetic saved text

The reported sentence, “Synthetic draft used to verify local draft retention before sign-in.”, was not found in application source. Preparation displays either a saved goal meaning or a device-local plan draft. The screenshots alone cannot distinguish those two sources. New entry drafts are blank in regression tests; the isolated local preview adapter starts with an empty snapshot. Production boundary checks confirm preview identities/adapter are absent from the build.

The patch deliberately does not delete account history, perform broad string replacement, or overwrite hosted writing. After deployment, use Begin my move > report what actually happened (including Did not happen if appropriate), then Prepare my ambition. Use Back to reach Give it a reason and replace the test sentence with your own words before saving preparation. Alternatively, Settings > Begin another ambition > Begin a fresh ambition starts blank and preserves the earlier record. Do not share one test account with pilots: each should sign in with their own email.

## Validation performed

| Check | Result |
|---|---|
| Unit/component suite | 44 passed, including 15 new regressions |
| Embedded PostgreSQL suite | 32 passed; atomic operations, retry receipts, required fields, owner isolation, anonymous denial and immutable history |
| Chromium app journeys | 6 passed: full first action to accomplishment/new ambition; required answers/keyboard/reload; responsive widths 375/390/430/768/1440; HTTP phone UUID fallback; legacy committed draft recovery; signed-out bound draft |
| Chromium production/header test | 1 passed; production adapter path with intercepted backend responses, actual CSP headers, wallpaper preview and download, no console/page errors |
| Build | TypeScript, Vite and production boundary audit passed |
| Dependency audit | npm audit and npm audit --omit=dev: zero reported vulnerabilities at audit time |
| Visual inspection | Mobile scheduled-action screen and desktop legacy-action screen; no horizontal overflow in tested journeys |
| Baseline | Modified existing files plus package/lockfile, Vite config, domain logic, Supabase adapter and database test runner matched upstream blob hashes |

The standard Playwright Chromium download failed in this workspace. Tests used a temporary Chromium 153 binary from @sparticuz/chromium, installed outside the repository. No dependency or lockfile change resulted. Browser plugin was unavailable, so regular Playwright was used. Production build used an explicitly fake publishable key to include the configured adapter code path; it is NOT a deployable artifact. Build again with the existing real local production environment before Cloudflare upload. No dist folder is included in the patch.

## Live pilot gates still open

1. **Email delivery:** the latest supplied SMTP screenshot has custom SMTP off. Supabase's default sender only emails organization team addresses and currently limits sending to two messages per hour. Configure a sender and test sign-in using a real external pilot email before invitations. Do not add pilots as Supabase administrators to work around this. Reference: https://supabase.com/docs/guides/auth/auth-smtp (checked 28 September 2026).
2. **Hosted account isolation:** with two separate test accounts, create distinct ambitions and Proof; verify neither appears in the other account, including a same-browser sign-out/sign-in. Embedded SQL and adapter tests passed, but they do not certify live grants, real JWTs or email delivery.
3. **Real device acceptance:** complete first action, login, save/reload, report, and wallpaper download on an actual iPhone/Safari. Chromium mobile viewports do not prove Safari behavior. Confirm actual Apple Calendar import and Google event saving; automated tests verify file/link generation, not external calendar acceptance.
4. **Deploy and check:** push this patch through the designated account, rebuild with actual production settings, upload dist to the existing public Cloudflare Production deployment, and repeat the original blocked case. Do not reenable Cloudflare Access.

The existing PR's unfinished-feature documentation still applies: not all approved artwork is implemented; broad personalized coaching, native calendar sync, billing, account deletion and other documented features are not added here. This is a targeted reliability patch, not a claim that every prototype feature is complete.

## Reproduce locally

```bash
npm ci
npm test
npm run test:db
npm run build
npx playwright test --project chromium
npx playwright test --config playwright.production.config.ts
npm audit
```

The production browser test expects VITE_SUPABASE_URL=https://vovmkiuxmtnedfosoxds.supabase.co in the built bundle. It intercepts Supabase requests and uses a fake browser session; it neither authenticates to nor writes to the hosted project. Install Playwright Chromium if needed. ES_BROWSER_EXECUTABLE can select an existing compatible Chromium binary.
