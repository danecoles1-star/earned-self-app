# Final board update — October 29, 2026

## Baseline and authority

Apply to development commit `472c07319f783db76413a4fbfb6d6910740873aa`
(PR #5), not the handoff's historical October 9 production commit. All seven
existing changed files were compared by Git blob hash with that exact GitHub
commit. The local reconstruction is `b8f9908`; it is not the remote commit ID.
Use the package patch, not a cherry-pick of this workspace history.

Authority: `github-handoff (1).md`, especially its superseding October 29 board
update. The existing Statement stylesheet remains the presentation layer; the
obsolete instruction that presentation.css is the only stylesheet is not followed.
The existing functioning onboarding, saved data, routing and commands are preserved.
No sample records ship. The public homepage is excluded by the supplied handoff.
The old HTML reference in the previous asset package predates this board update;
its Ember-filled Begin is superseded by the new written specifications.

## Changes

- Round Begin keeps its 117px mobile / 118px desktop bounds and original halo
  geometry, now Mineral #5E7783 with Ivory #F6F1E8 label and 3px Ember border.
  Original faint fiber texture retained. Only the outer pseudo-element pulses,
  using the specified 2.6s keyframes and static shadows. Reduced motion disables it.
- Other primary app buttons use Mineral/Ivory and 2px Ember borders. Secondary
  controls stay quiet. The illustrative activity check-in is no longer Ember-filled.
- Shared Stage screens have a decorative 88px mobile / 96px desktop foot band,
  separated from controls by 48px of Ivory. It uses the original master top edge,
  cropped to at most rows 0–280 with uniform cover scaling, no halo or annotation.
  Now omits the extra band while its Halo is visible; its activity shell receives one.
- Desktop frames use the full viewport, including 1680px. Plan places preparation
  alongside milestones; Proof balances its statement with totals. On Now the
  original centre stays uniformly scaled. CSS nine-slice rendering extends only
  the halo-free outer field; no mirroring, generated asset or stretched halo.
- Removed assistance-mode selectors in both onboarding and Account. Their stored
  preference and command schemas remain untouched for compatibility. The six-step
  onboarding, manual preparation, and existing help content remain functional.
- Fixed bottom navigation and content clearance retained. Local screenshot captures
  use viewport images so the nav is not misleadingly drawn mid-page in tall captures.

## Scope reconciliation

The board explicitly requires zero assistance-mode selectors anywhere; that
supersedes its older blanket exclusion of Account/Onboarding presentation edits.
Only those selectors and now-inaccurate Account subtitle are removed. Existing
manual preparation remains until AI integration, as in the accepted development
baseline. No Add step/Add milestone controls are introduced on Now or Plan.
No View my plan or Why & obstacles controls exist in the current TSX source.

Existing test expectations for the retired button colors and assistance toggle
are updated narrowly; test flows are not deleted. Browser assertions are extended
for color, pulse/reduced motion, footer bounds, full frame width and fixed nav.

## Verification and limits

- 134 unit/component tests passed.
- 12 targeted Chromium journeys passed: supporting surfaces at 320/390/1440,
  Now/Plan/Proof/completed challenge at 320/390/1440, long titles, reduced motion,
  and Statement/wallpaper/foot-band/fixed-nav checks at 320/390/1440/1680.
- After final wide-field rendering refinement, the four Statement journeys rerun.
- Build and credential/build-boundary audit passed using a nonfunctional validation
  publishable key; no build artifacts or environment files are shipped.
- All source assets remain byte-identical. Changes are presentation, test assertions
  and this record only. No dependencies, migrations, model or Auth changes.

Screenshots contain labeled local test data, not the user's hosted activity.
Hosted saved-data journeys, actual iPhone/Safari behavior and latest Muse board
screenshot comparison are not claimed. Only the updated markdown was supplied this
turn; its exact numeric specifications and the previously supplied masters govern.

AI remains unconnected, both AI flags remain false, and the prepared activity is
still explicitly illustrative. The unknown /history route remains a known issue.
Nothing was pushed, merged or deployed from this workspace. This package is for
an isolated branch and draft PR, consistent with the supplied handoff's no-deploy rule.
