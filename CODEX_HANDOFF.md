# Prompt for the deployment Codex account

Paste everything below the line into Codex with this package attached.

---

You are shipping the Earned Self redesign and public-launch cleanup as one release. The attached package is a full copy of the repository with both applied. Read `DEPLOY.md` first. It is the only current runbook. Ignore everything in `docs/archive/`.

Do this, in order:

1. Create a branch `release/redesign-public-launch` from the current `main` of the existing earned-self repository. Copy this package's files over the working tree. Keep any ignored local `.env*` files.
   - Deletions are intentional: `qa/`, `tests/e2e/statement-fidelity.spec.ts` (replaced by `tests/e2e/redesign-fidelity.spec.ts`), and the docs moved to `docs/archive/`.
2. Run `npm install`. Two font packages were added to `package.json` (`@fontsource-variable/figtree`, `@fontsource-variable/newsreader`). Commit the updated `package-lock.json`, because CI uses `npm ci`. If those exact version ranges don't resolve, use the newest 5.x of each.
3. Run the gates:
   - `npm test`
   - `npm run test:db`
   - `npm run build`, with `VITE_SUPABASE_URL=https://vovmkiuxmtnedfosoxds.supabase.co` and the real publishable key
   - `npx playwright install chromium`
   - `npx playwright test --project=chromium`
   - `npm run test:prod`
4. Fix failures narrowly:
   - These tests were already updated for the redesign and could not be run where the package was prepared: `tests/focus-stage.test.tsx`, `tests/pilot-regressions.test.tsx`, `tests/loop.test.tsx`, and the e2e specs `focus-stage`, `first-loop`, `pilot-review`, `pilot-regressions`, `reflection-recovery`, `workshop`, `redesign-fidelity`.
   - Expected behavior changes:
     - Begin navigates to `/focus/<goal>`, and that screen's footer button is "Finish and check in".
     - Check-in's third choice reads "Not yet".
     - A done plan step's check-in continues to `/add-step/<goal>?after=checkin`.
     - The tab bar shows only on Now, Plan, Proof and Settings.
     - The old inline "prepared activity" panel and "Who I am becoming" on Now are gone.
   - Old visual assertions about the October design (117px mineral Begin, foot band, nav PNG icons, mineral colors) should be replaced with the new design values, not deleted. Never weaken a behavior test.
5. Check the design by eye. Run `npm run preview:local` and look at Now, Begin → session, check-in → schedule next, Proof and milestone earned, at 390px and 1440px, in light and dark mode. Begin must sit exactly in the center of the halo.
6. Confirm nothing configures or mentions Cloudflare Access outside `docs/archive/`. Do not add any login gate in front of the site.
7. Commit, push and open a PR titled "Redesign + public launch". Include screenshots of the screens in step 5 and the test results. List the owner's dashboard steps from DEPLOY.md sections 1a–1d.
8. Do **not** merge, deploy, run Supabase migrations or change dashboard settings. The owner does those. There is no new migration in this release. After the owner merges and finishes 1a–1d, walk them through DEPLOY.md sections 2–4 and record the smoke-test results.

The next workstream after launch is AI preparation: `docs/REDESIGN_BRIEF.md` section 4. Start it only when the owner asks.
