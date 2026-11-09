# Supporting-screen design completion

Source: uploaded development archive for `65fc17138f59762c3377d39a22d5308448910626`.
Working branch: `redesign/complete-app-surfaces`.

## Design decisions

Keep the approved Now Halo composition, circular Begin, supplied artwork, and main Plan/Proof compositions. Extend their Proof Ivory (#F6F1E8), Summit Ink (#101A20), mineral and ember palette into the remaining application surfaces. Use existing graphite artwork, an understated circle, mineral primary actions, clear secondary actions, and consistent form hierarchy. No replacement artwork or new fonts.

On desktop, supporting flows use an editorial introduction at left and the task at right. Mobile uses a single column with controls sized for touch. Decorative side artwork is omitted on mobile so the task stays prominent. Artwork is contextual to the selected growth area and is decorative, never evidence of achievement.

## Coverage

| Surface | Treatment | Verification scope |
| --- | --- | --- |
| Now / Begin / Halo | Preserved | Existing fidelity and journey checks |
| Main Plan and Proof lists | Preserved | Existing milestones, area isolation and Proof checks |
| Challenge/discovery intake | Shared flow typography, spacing, fields, progress and mineral actions | Both paths rendered at 320, 390, 1440; discovery advanced through review; unit behavior checks |
| Existing onboarding and preparation | Shared flow layout | Existing first-action and preparation journeys |
| Step / milestone editors and scheduling | Shared flow layout and consistent fields | Route captures plus existing recurring-step journeys |
| Check-in / recovery / Proof entry and revision | Shared flow layout and record sections | Existing reflection/recovery journeys |
| Pause / resume / accomplishment | Shared flow layout, completed-record palette and responsive record columns | Existing pause, resume and completion journeys |
| Account | Separate identity, photo, support, and data/challenge sections | Route captures at all three widths; existing support-mode checks |
| Calendar | Step summary with ember marker; clear export actions | Captures and existing calendar-download journey |
| Wallpaper | Shared flow and updated label palette; export logic unchanged | Existing sheet/preview/download journeys |
| Sign-in / signup / password recovery | Shared flow and consistent form styling | Local signed-out visual checks at all three widths; existing Auth unit tests |
| Other Auth states | Inherit shared flow; logic unchanged | Unit coverage; hosted email behavior still requires development verification |
| Saved-draft transfer, loading/load failure, unavailable/not-found | Replace bare utility markup with shared Page where applicable | Unit checks, draft-access journey and unavailable/not-found captures |
| Legacy history | Updated utility palette and hierarchy | Route capture; record logic unchanged |

## Boundaries

This is a visual implementation for review, not new AI functionality. No domain logic, database migrations, provider credentials, dependencies, API contracts, or remote settings changed. Existing onboarding intake remains device-local with its current disclosure. Email templates/SMTP are not reconciled by this patch. The approved development deployment must still be checked after upload; local checks do not establish hosted Auth or RLS correctness.

The connected-onboarding AI package was prepared separately against the earlier baseline. Rebase/reconcile it onto this design branch before applying it; do not overwrite these supporting-screen changes with an older source tree.

## Validation

Run unit tests, the Chromium journey suite with intake disabled (legacy flow coverage), and the normal production build/boundary audit. Supporting-surface tests explicitly wait for loading to finish before screenshots, then check page overflow and image loading at 320, 390 and 1440. The intake-enabled visual check is separate from the legacy journey suite. No database re-run is needed for this presentation-only patch.

Two existing wallpaper label assertions were updated from the former palette to the approved Ink/Ivory values. Their color/contrast checks remain in place. No failing behavior assertion was removed.

Final local results (2026-10-27): **132 unit/component tests passed; 35 Chromium journeys passed; production build and boundary audit passed; git diff --check passed.** Separate signed-out Auth and intake visual checks passed at 320, 390 and 1440. The first development run overlapped source edits and was discarded; the final complete suite ran against stable source. Hosted verification remains the deployment account's step.
