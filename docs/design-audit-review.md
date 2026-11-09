# Homepage and app audit release review

Baseline: main `8f60ed5ca9bdb87572e3ae790b52b8a9304e067b` (PR #9 included).
Branch: `release/design-audit-update`.

The incoming November 9 package was integrated as a delta, not copied over newer production fixes. This includes the earlier homepage/Home Screen update and the new app audit. Signup validation, production configuration, lockfile and migrations are unchanged from current main.

## Validation

- Unit/component: 136 passed. One first-run timeout during a concurrent build; unchanged test passed on the subsequent full run.
- Ephemeral local database: 57 checks passed. No hosted database writes or migrations.
- Production build and boundary audit: passed against the configured production project and publishable key.
- Production dependency audit: zero vulnerabilities.
- Production headers/wallpaper preview and download: 1 browser test passed.
- Browser journeys: 55 unique cases passed across the full run and targeted reruns. The full run passed 52/54; two completion-record tests referenced the deliberately removed tab bar. After correcting their selectors, 18 targeted cases passed; the additional audit test passed after fixing its fixture route to use the actual evidence ID.
- Visual review: Now, session, check-in, schedule-next, Proof and milestone-earned at 390/1440 in light/dark mode; homepage examples reviewed at both widths in both modes. Begin center assertions pass at 320/390/1440. Default dark account icon is visible after the contrast fix.

Narrow review fixes: default account icon gains contrast in dark mode without affecting member photos; completion-record tests use the dedicated return button and assert the tab bar is absent. The new audit test checks vision text, SVG navigation, Proof-detail navigation and calendar chips.

Normal Playwright Chromium installation failed: the download returned a non-ZIP response. Local browser validation uses the available official Chromium 140 headless shell through `ES_BROWSER_EXECUTABLE`. CI must install and run normal Chromium without this override. No dependency versions were changed for this workaround.

Review screenshots in `docs/release-review/` and `docs/homepage-review/` use disposable local preview data. They do not demonstrate hosted signup, email delivery or account isolation. The preview-only banner is not included in the production build. Full-page homepage screenshots hide the fixed mobile CTA only for capture; viewport assertions separately verify its visibility before and after scrolling.

## Release boundaries

Git push preflight failed because no write credential is configured in this workspace. No remote branch, PR, merge or deployment was created here. Use the supplied bundle and CODEX_HANDOFF.md in the deployment account, require normal green CI and owner approval of the production environment.

There are no new migrations, password-policy changes, paid-service activations or AI integration. Keep public invitations on hold until AI and the existing launch blockers are ready. Physical iPhone/Android installation and hosted outside-email/account-isolation smoke checks remain required after deployment.
