# Statement + locked Halo correction

## Authority and scope

Visual authority: the supplied `github-handoff.md`, exported Muse
`earned-self-production-redesign.html`, and Brand Guide v2.0 (54 pages).
The 23-entry supplied manifest verified. All 21 raster assets match existing
repository assets byte-for-byte; no image was generated or altered.

Implementation base: deployed development source
`ba38f53cb02abf79b7baace14060f51b8dceac22`. This workspace reconstructs that tree
as local commit `ff1620d3e720703b3d202b0b4bcfc4126c94a69b`; these are not the same
commit ID. Apply the file patch to the deployed base, not a cherry-pick of local
history.

The handoff's historical production base and three-screen restriction are
superseded by Dane's later instruction to preserve the working development
application and extend the design across supporting app screens. Public
marketing/How It Works pages remain outside this app-screen correction.
Production, schema, migrations, dependencies, authentication logic and AI
integration are unchanged. Both AI onboarding flags must remain false.

## What was actually wrong

The earlier implementation retained a mineral-colored identity/header surface,
oversized type, left-aligned desktop Halo copy, and the wrong mobile asset
scaling. Supporting pages used a different desktop two-column layout. Having
assets in the bundle and passing behavior tests did not establish visual fidelity.

The correction removes the old mineral surface from Stage and introduces
`src/statement.css` after the legacy stylesheet. It owns the Statement geometry
and tokens without rewriting unrelated public-page styles.

## Visual fidelity ledger

| Reference anchor | Implementation and verification |
| --- | --- |
| Ivory statement | Ink identity on #F6F1E8; compact centered Georgia text, quiet challenge link; no teal hero/header backdrop. |
| Halo artwork | Original master at mobile, original desktop crop at desktop; uniform `auto 100%` sizing; 530px / 434px panel heights. |
| Begin | 117px mobile / 118px desktop; centered at 56.9% / 56%; Ember fill, Ink label, exact supplied faint fibers; no generated texture. Browser geometry assertions pass. |
| Typography | Georgia display and Avenir Next interface stacks. System fallback on platforms without Avenir Next; no unlicensed font binary added. Linux review uses the same available fallback fonts for reference and application. |
| Supporting content | Quiet Next Step, featured supplied artwork with the user's vision, full-width wallpaper control. Empty next-step state does not invent a sample step. |
| Plan | Ivory surface, compact numbered milestone rows, real completion counts, visible preparation, saved schedules and working review controls. |
| Proof | Ivory surface, three real totals, wrapping filter pills, real evidence and reflections; no fabricated achievements. Zero totals use neutral rules. |
| Shared flows | Compact header, restrained type, single reading column and consistent controls for onboarding, Auth, account, preparation, scheduling, check-in, recovery, completion and unavailable routes. |
| New account | Same ivory/header/typography and supplied artwork; both existing functional entry paths preserved. AI discovery remains explicitly unavailable. |
| After Begin | Focused ivory activity view, quiet metadata and check-in action; returns via Close prepared activity. The existing illustrative guidance remains labeled. No live AI claim. |

Reference review used rendered mobile and desktop frames, not source inspection
alone. The reference's review-board border, sample records and mock-only labels
are not app content. Persistent bottom navigation is retained from the working
app, rather than the reference board's static footer. The interactive challenge
link keeps its underline. Long step titles use smaller type and an overflow region
rather than overlapping Begin. Reference content is confined to local tests.

## Functional corrections needed by this presentation

- Removed unlabeled sample challenge/step fallbacks from MemberHome. Artwork stays
  area-specific; missing saved content is honestly described.
- Calendar access remains available for the saved current commitment when there
  is no prepared next step.
- All 14 wallpaper tiles now carry their selection into the export editor through
  a bounded `/wallpaper/:goal/tile/0..13` route. Export uses the selected supplied
  image, with the existing wording and download controls. No data migration.
- Existing manual preparation remains usable until AI is connected. The historical
  handoff's request to remove every authoring control cannot be extended to the
  working six-step preparation flow without breaking it. No Add step / Add
  milestone controls were added to Now or Plan.

## Coverage and practical limits

Browser review: 320, 390, 1440px. Tests cover new-account entry, onboarding,
refresh/recovery, Now, all three areas, Plan, milestone states, recurring steps,
Proof/check-in, completion, account, calendar and wallpaper export. Desktop and
mobile renderings were inspected. No horizontal overflow or broken image failures
in the supporting-screen checks.

The local preview adapter is used only in tests; its banner identifies local test
data. No disposable progress was written to the user's hosted account. Hosted
email delivery, Access login and Supabase sessions require a post-deployment smoke
check. The package does not claim those were exercised here.

AI onboarding, plan generation, prepared-session generation and durable AI
scheduling remain the next workstream. The existing illustrative activity shell
is not a personalized session. Nothing here connects a provider or charges an API.
