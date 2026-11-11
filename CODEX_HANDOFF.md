> CURRENT PACKAGE: Read START_HERE.md first. This is Workstream 1 plus plain brand-color wallpapers. Preserve current main changes; do not overwrite newer workstreams. No production merge/deployment has been authorized by supplying this package. The historical release wording below does not override this instruction.

# Prompt for the deployment Codex account

Attach `Earned-Self-Workstream-1-With-Brand-Wallpapers.zip`, then paste everything below the line.

---

You are deploying the Earned Self redesign and public-launch release to production. This package authorizes preparation and validation only; obtain owner approval before merge or protected deployment. The attached zip is a full copy of the repository with all changes applied. `DEPLOY.md` inside it is the only current runbook. Ignore everything in `docs/archive/`.

## 1. Prepare the branch

1. Create a branch `release/workstream-1-brand-wallpapers` from the current `main` of the existing earned-self repository. Copy the zip's files over the working tree. Keep ignored local `.env*` files.
   - Deletions are intentional: `qa/`, `tests/e2e/statement-fidelity.spec.ts` (replaced by `tests/e2e/redesign-fidelity.spec.ts`), and the docs moved to `docs/archive/`.
2. Run `npm install`. It adds `@fontsource-variable/figtree` and `@fontsource-variable/newsreader`. Commit the updated `package-lock.json`; CI uses `npm ci`. If those version ranges don't resolve, use the newest 5.x of each.

## 2. Pass every gate

Run, with `VITE_SUPABASE_URL=https://vovmkiuxmtnedfosoxds.supabase.co` and the real publishable key:

```sh
npm test
npm run test:db
npm run build
npx playwright install chromium
npx playwright test --project=chromium
npm run test:prod
npm audit --omit=dev
```

Fix failures narrowly. These intentional behavior changes may need test updates:

- **Now card (direction A):** the halo artwork is gone. The card is an experience preview: step image, status tag (Ready now / Starts 10:00 PM / Coming up / Still yours · from Monday), friendly time ("Today · 6:30 AM"), session-part chips when a prepared step exists, and a full-width Begin with an ember ring. The button always reads "Begin" (or "Prepare" with no step). `src/experience/NowCard.tsx` is shared by the app and the homepage preview. New unit test: `tests/now-card.test.tsx`.
- **Session timer (direction B):** when a prepared step has parts, the timer draws an ember ring split into those parts, fills it as time passes, labels the current part ("Six climbs · 13 min left") and highlights it in a parts list. Without parts it keeps the single ring.
- **Now:** Begin goes to `/focus/<goal>`, whose footer button is "Finish and check in". "Can't make it today?" goes to `/report/<goal>?result=did_not_happen`.
- **Check-in:** the third choice reads "Not yet". A done plan step continues to `/add-step/<goal>?after=checkin`.
- **Tab bar:** shows only on Now, Plan, Proof and Settings. The inline "prepared activity" panel and "Who I am becoming" on Now are gone.
- **Homepage** (`src/components/Homepage.tsx`):
  - Kept: "Become You.", "Build my challenge", "Log in", the "Choose an example" group and "Make it mine".
  - Removed: "Begin", "Build my plan" and "Take your first step".
  - Its phone previews are `inert` and `aria-hidden`.
- **Removed buttons:** "Agreements and revisions", the Guided/On request selector, "Revise this step" in Plan, and links on non-current Plan steps.
- **Audit changes:**
  - Now shows `.es-becoming` (the vision) instead of a challenge link.
  - Member-flow dropdowns became choice buttons or chips (milestone reflection, step milestone, calendar length, Settings challenges).
  - `resultLabel` reads Partly / Not yet.
  - Unmatched routes render Unavailable ("Return to Now") instead of the legacy workspace.
  - The tab bar is limited to `/app`, `/manage`, `/manage/why`, `/proof` and `/settings`.
- **Tab icons:** the Earned Self mark (Now), folded map (Plan) and cairn (Proof), drawn as inline SVG in `TabIcon`. The old `nav-*.png` files are no longer imported.
- **New files:** `src/earned.css` is the design system. `public/manifest.webmanifest` and its icons were added.

`tests/e2e/focus-stage.spec.ts` and `tests/e2e/redesign-fidelity.spec.ts` were updated from halo-centering checks to the new card. Replace any other old visual assertions about the October design (117px mineral Begin, foot band, nav PNG icons, mineral colors) with the new design's values. Never delete or weaken a behavior test.

## 3. Check it by eye

Run `npm run preview:local`. At 390px and 1440px, in light and dark mode, look at:

- **Homepage:** every example photo shows the main person's face.
- **Now:** the card image, tag and full-width Begin sit inside the card at 320px; chips wrap without overflow.
- **Begin → session.**
- **Check-in → schedule next.**
- **Proof.**
- **Milestone earned** (`/milestone-done/<goal>`).

Fix anything broken. Confirm nothing outside `docs/archive/` configures or mentions Cloudflare Access, and do not add any login gate in front of the site.

## 4. Pull request and merge

Commit, push, and open a PR titled "Redesign + public launch" with screenshots from step 3 and the test results. When CI is green, merge it into `main`.

## 5. Owner dashboard steps (confirm before deploying)

`DEPLOY.md` sections 1a–1d list them. If you have access to a dashboard, do its steps; otherwise ask the owner to do them and confirm. **Do not deploy until all four are confirmed:**

- **1a Cloudflare:** the Access application for `earned-self.pages.dev` is deleted and the Pages Access policy is off. `curl -sI https://earned-self.pages.dev/` returns 200 with no redirect to `cloudflareaccess.com`.
- **1b GitHub:**
  - Repository variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
  - Secrets `CLOUDFLARE_API_TOKEN` (Cloudflare Pages: Edit) and `CLOUDFLARE_ACCOUNT_ID`.
  - A `production` environment.
- **1c Cloudflare Pages:** the production branch is `main`. If the project builds from Git by itself, use its build settings (`npm run build`, output `dist`, the two `VITE_` values) and skip `.github/workflows/deploy.yml`, rather than deploying twice.
- **1d Supabase Auth:**
  - Site URL `https://earned-self.pages.dev` and redirect URL `https://earned-self.pages.dev/auth/callback`.
  - **Custom SMTP on and tested with an outside address.**
  - The three templates from `docs/email-templates/` pasted in.
  - Minimum password length 12.

## 6. Deploy

- There is no database migration in this release. Still run `npm run supabase:migrations` once against project `vovmkiuxmtnedfosoxds` and confirm all nine local versions show as applied remotely. Stop and report if any are missing.
- Start the deploy: GitHub → Actions → **Deploy to Cloudflare Pages** → Run workflow on `main` (or `gh workflow run deploy.yml --ref main`), then approve the `production` environment. If the project is Git-connected instead, the merge triggers the deploy.

## 7. Smoke test production and report

Run every check in `DEPLOY.md` section 4 against `https://earned-self.pages.dev`:

- **Headers:** no Access redirect, CSP names `vovmkiuxmtnedfosoxds.supabase.co`, `/assets/*` are cached immutable, and `robots.txt` is correct.
- **Routes:** `/app`, `/proof`, `/settings` and `/auth/callback` load directly.
- **New-visitor sign-up** with a non-team email.
- **Existing-member sign-in.**
- **Two-account isolation.**
- **Browser console:** no CSP errors.
- **The app on a phone:** Home Screen install, Begin, check-in → schedule next, Proof.

Report each result to the owner. If anything critical fails, roll back right away: Cloudflare → Workers & Pages → `earned-self` → Deployments → previous deployment → Rollback. Then report what failed.

## Addendum: workstream 1 (onboarding, Plan, sign-in), November 10

No deploy steps change and there is no migration. Run the same gates. The full vitest and Playwright suites were not run where this was built, so expect to fix selectors narrowly. Intentional behavior changes:

- **Onboarding** is a nine-question conversation, then "Building your plan." (about three seconds), a reveal with "Make it mine", then the first step. Labels kept: "Your future self", "My challenge", "Your reason", "Continue", "Do it now", "Check in", "Record what happened", "Sign in to save", "Save and exit", "Save and finish later". New labels: "What I love", "I have one" / "Help me craft one", "My starting point", the time chips, "Days or times that work best", "What I have", "My limits", "Build my plan".
- **Removed from onboarding on the owner's decision:** the first-step timer, and the "What will completion look like?" question (preparation asks "Done means" instead).
- **Plan** is one milestone path. The current milestone's heading is the `aria-current="step"` button inside the "Your milestone progression" region; "All milestones & steps" is nested inside it.
- **Tests changed:** `tests/complete-journey.test.tsx` (the onboarding timer test now asserts the timer is absent) and `tests/e2e/first-loop.spec.ts` (new question sequence; "Done means" filled in preparation). **Added:** `tests/onboarding-conversation.test.tsx`.
- **Check by eye as well:** `/start` through sign-up, `/auth`, and `/manage`, at 390px and 1440px in light and dark.
