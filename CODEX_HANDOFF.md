# Homepage and app design audit update — deployment handoff

This update follows PR #8 and signup-validation PR #9, both already merged. Do not recreate the old redesign release branch. `DEPLOY.md` remains the deployment runbook; ignore `docs/archive/`.

## Integrate this incremental release

- Repository: `danecoles1-star/earned-self-app`.
- Baseline: `main` at `8f60ed5ca9bdb87572e3ae790b52b8a9304e067b`.
- Branch: `release/design-audit-update`.
- Scope: supplied homepage, interactive examples, mobile CTA, manifest and logo icons, plus the supplied app audit: vision on Now, inline SVG tab icons, choice controls, simplified Plan, detail-page navigation and consistent result labels. Includes matching browser assertions. PR #8 fixes and PR #9 signup-validation feedback are preserved. Dependencies and the database are unchanged.
- Keep the approved AI-focused homepage copy. The owner is holding public invitations until AI is ready. This release does not connect or build AI.

The delivery ZIP contains a Git bundle, a patch, a source snapshot, review screenshots and checksums. Prefer the Git bundle over copying the source snapshot onto a newer main:

```sh
git fetch origin
git fetch /absolute/path/design-audit.bundle release/design-audit-update:release/design-audit-update
git switch release/design-audit-update
git merge-base --is-ancestor 8f60ed5ca9bdb87572e3ae790b52b8a9304e067b HEAD
```

If the branch already exists, inspect it before changing it. If main has advanced, integrate those changes and rerun the gates. Preserve ignored local environment files. The source ZIP is a reference snapshot, not permission to overwrite newer work. No package or lockfile changes are needed.

## Verification and release

1. Read `docs/design-audit-review.md` for local results and browser limitations.
2. Run `npm ci`, `npm test`, `npm run test:db`, and `npm run build` with the existing production Supabase URL and real publishable key configured privately. Do not print credentials.
3. Install normal Chromium with `npx playwright install --with-deps chromium`. Run `npx playwright test --project=chromium`, `npm run test:prod`, and `npm audit --omit=dev`. Do not set a browser executable override in CI.
4. Review homepage examples at 390px and 1440px in light/dark mode, and confirm Now, focus, check-in, scheduling, Proof and milestone screens still match the approved design. Review screenshots are local disposable-data previews, not proof of hosted authentication.
5. Push the branch and open a PR titled **Homepage + app design audit**, including results and screenshots. Require green CI. Follow the owner's merge/deploy authorization; never bypass branch protection or the production reviewer.
6. Reuse the existing dashboard configuration. Do not activate paid services, reconfigure authentication, change development protection, or run Supabase migrations. There is no new migration.
7. For an authorized deployment, record the previous production deployment for rollback, merge after green CI, record the main SHA, and run **Deploy to Cloudflare Pages** on main. The owner approves the protected production environment. Verify the deployed SHA and follow `DEPLOY.md` §4.
8. Check `/manifest.webmanifest` and all four icon URLs, then physically test Home Screen installation and launching `/app` on iPhone and Android. A manifest is not evidence of offline support; no service worker was added.
9. Keep public invitations on hold. Fresh outside-email signup, account isolation, physical-device checks and the existing launch blockers must be recorded honestly; local tests do not prove those hosted outcomes.

Do not start the AI workstream as part of this update.
