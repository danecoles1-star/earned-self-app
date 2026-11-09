# Earned Self: test results v1

Local validation on 13 September 2026. No remote account access, deployment or production migration. The current files were rendered after implementation fixes. This is a private-test build, not production sign-off.

## Results

| Layer | Result | What it establishes |
| --- | --- | --- |
| TypeScript + normal Vite build | PASS | Strict type check and compiled frontend |
| Configured build using a deliberately nonfunctional publishable placeholder | PASS | Real Supabase SDK path compiles and build audit runs; no network request or account connection |
| Unit, adapter and component tests | 20 PASS | State invariants, draft ownership, mocked email/RPC contract, complete loop and explicit saving/failure behavior |
| Ephemeral PostgreSQL tests | 21 PASS | Both migrations execute in local PGlite; simulated role isolation, constraints, atomic commands, revisions, retries and account cascade |
| Chromium Playwright suite | 10 PASS | Six-width full loops, dialog keyboard behavior, long Unicode wrapping, CTA states, empty account/Record and vision entry |
| Normal compiled build browser check | 6 width scenarios PASS | Six sections, ceramics composition, retained pre-auth draft, disabled unconnected email saving, no query-parameter preview bypass |
| Deployment-mode preview rejection | PASS | `vite build --mode preview-local` fails intentionally before output generation |
| Build boundary scan | PASS | No local adapter, local preview identity, failure-injection UI or detected service credentials in normal output |
| Connected Supabase authorization and email | PENDING | Real configuration and two real development accounts required |
| Protected Cloudflare preview | PENDING | Access enforcement, deployed headers, redirects and hostname coverage require configuration |
| Firefox and real-device Safari | PENDING | Not executed successfully here; required before external release |

## Test environment and reproduction

Node 24.19.0, Vite 6.4.3, Vitest 3.2.7, Playwright 1.63.0, headless Chromium 153.0.8010.0. Exact dependency resolutions are recorded in `package-lock.json`.

The managed browser could not navigate localhost (`ERR_BLOCKED_BY_CLIENT`). The ordinary Playwright browser downloader also timed out. Local Playwright was run with an independently installed Chromium executable from the `@sparticuz/chromium` package. The executable and temporary browser dependencies are not part of the delivery. No web-security-disabling flag was used. The restricted runtime required no-sandbox, shared-memory and software-renderer launch arguments. That is test infrastructure, not a deployment setting.

Commands:

```sh
npm ci
npm test
npm run test:db
npm run build
npx playwright install chromium firefox
npm run test:e2e
node scripts/test-built-browser.mjs
```

The last script starts a loopback-only static server for an unconfigured normal build. The local run used `ES_BROWSER_EXECUTABLE` and an explicit screenshot directory. The E2E suite starts a separate development-only preview server. Neither command contacts Supabase. Firefox's project configuration is included, but its presence is not a passing Firefox result.

## Responsive and visual coverage

| CSS width | Homepage | Commitment and review | Pursuit | Evidence detail | Record index | Ceramics |
| --- | --- | --- | --- | --- | --- | --- |
| 375 | PASS | PASS | PASS | PASS | PASS | PASS |
| 390 | PASS | PASS | PASS | PASS | PASS | PASS |
| 430 | PASS | PASS | PASS | PASS | PASS | PASS |
| 768 | PASS | PASS | PASS | PASS | PASS | PASS |
| 1024 | PASS | PASS | PASS | PASS | PASS | PASS |
| 1440 | PASS | PASS | PASS | PASS | PASS | PASS |

The tests assert document scroll width does not exceed viewport width at the listed checkpoints. Controls used by the complete loop remain reachable by Playwright. Screenshots include the final homepage, editor, Pursuit Home, detail and Record at all six widths. A normal-build homepage and unconnected-auth screen were also captured at every width.

The approved ceramics asset retains `object-position: 72% 50%` and a 3:2 display ratio. Subject and work surface remain visible in desktop and mobile screenshots. The photograph and disclosure remain in a figure/caption unit. Dedicated image-only captures are included for each width. This is illustrative photography, not a portrait of Maya or a member.

The mark retains its transparent pixels and gradient. Dark backgrounds use the mineral circle; mineral surfaces use the mark alone. Existing approved assets are reused, with no visible square container or new generated mark.

Safe-area CSS uses the viewport-fit meta and bottom environment inset. Desktop Chromium cannot verify an actual iPhone notch, software keyboard, Safari viewport resizing, autofill or screen reader. These remain real-device checks, not local passes.

## CTA and keyboard

| State | Background | Foreground | Calculated contrast |
| --- | --- | --- | --- |
| Default | `#BD432D` | `#FFFFFF` | 5.24:1 |
| Hover | `#AF3E29` | `#FFFFFF` | 5.93:1 |
| Pressed | `#A63B28` | `#FFFFFF` | 6.41:1 |
| Disabled | `#756F6C` | `#FFFFFF` | 4.95:1 |

Default, hover and pressed computed styles were checked in Chromium. The normal build's disabled email CTA style was checked at all six widths; pending-save disabling was also asserted in the component test. Focus uses the approved 3 px white outline with the ink outer treatment. Keyboard tests cover Enter to open, Tab cycling within the example dialog, Escape to close and focus returning to its opener, plus Tab movement through member-entry fields. Native controls and semantic headings/labels remain in use. This is not a full independent WCAG audit or a screen-reader certification.

## Durable-loop scenarios

- Goal/vision uses exact member-authored Unicode words. Empty and whitespace-only required text is rejected. Oversized text is rejected with retained input, not silently shortened.
- Local draft survives reload before authentication. A bound draft cannot be imported by a different account. Authentication does not automatically save a goal.
- Deliberate mode adds an explicit review; quick mode saves the same required action and criterion without that review.
- A past-due schedule remains unreported. No scheduler converts silence into a miss.
- A deliberately failed outcome retains the current commitment and shows no success. Retry then creates one result. A return commitment leaves the earlier miss in the Record.
- Optional facts/reflection add a report revision to the same evidence. Reload after acknowledgement retains the revision. The test explicitly waits for saved presentation before reloading.
- A duplicate operation returns the same receipt. Changed content with the same key rejects. A different operation cannot create a second evidence root for the same attempt.
- A real-adapter mock verifies the captured initiating owner, stable operation ID, PKCE and exact callback path. It also verifies failed writes do not resolve as success.
- A deferred component test separately holds the read and write promises open: loading, saving, disabled navigation, failure, retained text, retry and acknowledged success are asserted.
- PostgreSQL tests cover cross-owner reads, parent-ID spoofing, actor mismatch, direct table mutation denial, receipt denial, anonymous role denial and anonymous-authenticated JWT denial using simulated claims.
- PostgreSQL tests cover stale detail edits, unknown payload fields, a Denver DST gap and repeated time, rejected-command rollback, goal selection and account deletion cascade. They do not exhaustively validate every historical timezone transition or real parallel HTTP transactions.
- Maya is static public demonstration content in `Homepage.tsx`. Member source has no fixture loader, copied journey state or automatic seed operation. Sam and Alex are not imported into the application. A test-only URL containing demo/fixture parameters starts an empty preview account; a compiled build cannot activate that adapter at all.

## Issues found and addressed

| Finding | Resolution |
| --- | --- |
| Preview failure-control text initially remained in normal output | Compile-time preview branches replace runtime-only conditions; normal build audit passes |
| Account could change between initiation and command dispatch | Captured expected owner is passed to the guarded database function |
| Navigation during a pending outcome could race the post-save destination | Relevant navigation is disabled during the command and refresh |
| Native dialog Tab could leave document focus on this browser | Explicit first/last focus containment, Escape and opener restoration |
| Reflection reload check could match unsaved textarea text and reload too early | Wait for the saved detail presentation; then reload and assert the stored revision |
| A criterion label could imply a missed commitment had completed | Neutral `Done means` label preserves the distinction between criterion and actual outcome |

Final automated suites listed above have no unresolved failures. Initial infrastructure/browser failures are recorded rather than counted as passes.

## Pending gates and known limits

1. Codex must run the numbered post-connection checks in the Supabase implementation document. Simulated local roles are not real JWT/RLS, PostgREST, email or multi-device validation.
2. Cloudflare must protect every reachable preview hostname before sharing. `_headers`, redirects and noindex are source files until verified on the deployed service.
3. Run Firefox and real-device Safari, screen-reader checks, mobile keyboard/focus, email callback and interrupted network tests in the protected environment.
4. Result-status correction, targeted undo, existing-plan edits, rescheduling, pause, goal completion, export and account-deletion UI are outside this first implemented boundary. Testers must be told that a mistaken result cannot yet be retracted in the interface. Optional factual detail and reflection can be revised.
5. Unsaved drafts are device-local and not encrypted. No automatic cross-device draft transfer, offline sync queue or deletion of all local drafts on sign-out is implemented. Acknowledged work is designed to persist in Supabase; this requires the real project test to confirm end to end.
6. Read state loads the account's small history at once. No pagination, performance claim for two-year production histories, AI, or observed change in user confidence is claimed.
7. The review HTML is a screenshot review, not the account-backed application. The ZIP must be installed and run, then connected and protected by Codex before remote testing.

## Scope confirmation

No GitHub push, Supabase account access, Cloudflare account access, DNS change, custom domain connection, Lovable modification or public deployment. SQL execution was confined to disposable local PostgreSQL. No production code or production data was changed.
