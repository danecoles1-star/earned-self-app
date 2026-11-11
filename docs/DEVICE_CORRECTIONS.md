# PR 12 device review corrections — November 11, 2026

Based exactly on PR 12 head a9e9ad4fa23fe5916ac028f7b1292fac2966d12e.

Changes: one Save to phone action shares the pre-rendered PNG synchronously from the tap; unsupported iPhone/HTTP use gets an explicit message; unsupported Android/desktop sharing starts a PNG download. Cancellation is neutral, failure is visible, and completion never claims Photos saved. No separate full-size/download buttons.

Now status tags sit 14px from the bottom and left of their image. Exact curated challenge artwork maps ceramics business to new studio art, triathlon to swim art, keynote to speaking art, novella to writing art. Saved prepared-step images still win. No member area is silently reclassified. The local device fixture explicitly assigns the ceramics business to Professional; each browser loads its own fixture using the same button.

New illustration: src/assets/illustrations/illo-ceramics.webp. Generated using the built-in image tool, with illo-personal.webp as style reference: graphite and restrained watercolor on ivory, craftsperson inspecting six pieces in a ceramics studio, notebook and packing box, no labels or UI. This is example artwork, not the member's likeness or evidence of completion. No AI service was integrated.

Deployment workflow now refuses non-main runs and checks out github.sha instead of a moving main reference, so approval deploys the selected run commit.

Verified here: 158 unit/component tests, 57 ephemeral DB checks, TypeScript/build/boundary audit, git diff --check. Generated device-review.html is excluded from the normal build. No dependencies, migration, lockfile, auth policy, or paid services changed.

Chromium and production-header browser checks attempted but blocked by runtime: process_singleton_posix socket() failed: Operation not permitted. These are NOT passes. Run normal Playwright and CI on the Mac/GitHub. Fresh visual and physical iPhone/Android checks remain required. Existing PR12 CI does not verify this patch.

Acceptance: at 320/390/1440 light/dark, badge is inside image bottom-left without heading overlap; ceramics demo is Professional with studio illustration; Safari/Chrome each load demo; iPhone Save to phone exposes Save Image and resulting file opens in Photos; Android share/download output can be set as wallpaper; 1170x2532 PNG has full words/mark, clock space, no clipping. No open/download alternatives in normal UI. Record device, browser, result. Keep public invitations on hold.
