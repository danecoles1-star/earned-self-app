# Workshop release

Prepared against `18d90f9f7ede8d97405089f80f0101a3140dab82` on `redesign/app-experience`.

## Product changes

- Consistent illustrated Workshop treatment from How It Works through onboarding, Now, Plan, Proof, account, calendar and wallpaper tools.
- Georgia editorial headings and Avenir Next interface stack. Ink `#172329`, Mineral `#F1F3F1`, Mineral Blue `#537889`, Ember `#E45D3D`. Existing approved completion gold remains confined to completed evidence. The existing logo is unchanged.
- Mineral Blue primary actions with a thin Ember border, lightly textured surfaces, restrained sketch dividers and approved sunrise, folded-map and angular-stone navigation icons.
- User-selected Physical, Professional and Personal challenge areas. Each area can retain its own active challenge, preparation, timer and honest Proof. Other saved challenges remain available from Account. Switching areas never changes commitments or creates evidence.
- Existing unassigned challenges are not inferred from their writing. The owner explicitly assigns an area. Existing words, milestones, schedules, recurrence, results and history remain unchanged.
- Onboarding collects a completion criterion before the first small action. Detailed preparation remains after that action. Earlier numeric draft stages remain interpretable. Save-and-exit preserves an unfinished draft on the current device; signing in and explicitly saving is still required for account storage.
- Guide me and Help when I ask are available during onboarding and Account. Guidance never authors or accepts answers for the user.
- The Plan illustration highlights the actual current milestone. A restrained figure/Ember transition marks a recorded milestone completion when returning to Plan in the same tab. Longer plans use three-milestone windows; the full ordered path remains visible beneath the illustration. Reduced-motion preferences suppress transitions. There are no invented milestone records behind the decorative doors.
- Proof preserves the distinction between a step, an attempted milestone, a completed milestone and a completed challenge. Completed records show the original saved vision, criterion, observed result, the user's transformation statement, carry-forward answer and supporting history. Missing older answers are explicitly identified. The area artwork is labeled illustration, never presented as an actual participant photograph.
- Each assigned area has three illustrated wallpaper choices plus five textured brand/neutral backgrounds. Users can choose their own vision or saved reflection. Preview and export use the same generated blob. The approved share-sheet/full-size/download fallbacks remain.
- Google Calendar and Apple `.ics` export behavior is preserved. Exports do not become a synchronized calendar integration.
- Profile-photo cropping, account isolation, password/code login, recurring steps, missed-step recovery, pause/resume and revision history retain their existing behavior.

## Migration order

`202610070001_workshop_areas.sql` follows `202610060001_private_profile_photos.sql`.

This adds a nullable, constrained `es_goals.area` field and the owner-scoped `area` command/event. It extends the existing command allowlist and read-state payload. It does not guess or backfill an area, delete records, change RLS policies, create new public storage, or change recurrence semantics. Assignment is version-checked, recorded in history and idempotent. Existing clients can continue creating unassigned goals.

Apply the migration to the linked hosted project **before** deploying the new app. Review `npm run supabase:migrations` and `npm run supabase:dry-run`; the expected pending file is the one above. Verify project reference `vovmkiuxmtnedfosoxds`. After the approved push, confirm matching Local and Remote migration rows. Do not edit previously applied migrations.

## Release gates

Run `npm ci`, `npm test`, `npm run test:db`, `npm run build`, `npm audit`, `npm run test:e2e -- --project=chromium`, and `git diff --check`. The handoff's `verify-release.sh` runs these in order. Existing local environment files must remain untouched. Build the final Cloudflare `dist` using the user's real production configuration after the hosted migration.

The generated `dist` used for local CSP testing contains a deliberately fake browser-only test configuration. It is not included in the release package and must never be deployed. No environment files, dependencies, lockfiles or compiled assets are part of this update.

## Deployment-stage checks

- Real iPhone Chrome/Safari: pinch/drag photo crop, HEIC support, safe areas and keyboard entry, wallpaper Save Image and calendar import.
- Hosted two-account checks for the new area field and unchanged private photo storage, including switching away from and back to an existing unassigned challenge.
- Create an area challenge, save/reload it, switch areas, and confirm each keeps its own next step and Proof. Wait for save confirmation before closing the page.
- Complete a milestone and return to Plan. Confirm the marker advances only for completion, while an unsuccessful attempt stays in history.
- Complete a challenge and revisit the exact reflection and carry-forward answer through Proof.

No application can confirm that a wallpaper was actually applied, that an exported event was imported, or that a native share sheet saved a file. UI wording remains honest about these limits. Generated artwork is illustrative, not a testimonial or outcome claim.

Prepared changes are not hosted verification. This document does not supersede any existing unfinished-feature documentation in PR #2.
