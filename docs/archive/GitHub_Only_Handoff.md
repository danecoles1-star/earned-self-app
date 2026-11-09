# Minimal GitHub handoff

Apply `earned-self-app-experience.patch` to the existing repository at the exact baseline commit `f0a9c14b8e39385a32b3792b1ffb00c402437a85`. Work on a new branch. Preserve ignored local environment files. The companion source directory is a full reference copy, not a replacement for your Git history.

The provided apply script checks the baseline, clean tracked/untracked working tree and patch applicability before creating a local branch and applying the patch. It does not commit, push, contact Supabase, merge or deploy. If any check fails, inspect the reason; do not force/reset the user's checkout.

For the other Codex account:

> Apply the attached patch to earned-self-app on a new branch from f0a9c14b8e39385a32b3792b1ffb00c402437a85. Read docs/App_Experience_Handoff.md and docs/Prototype_Screen_Map.md. Preserve local env files and all prior migrations. Run npm test, npm run test:db, npm run build and the Chromium E2E suite. Inspect the diff, commit the implementation preview, push the branch and open a draft PR that includes the documented gaps. Do not merge, run hosted migrations, or deploy. Do not regenerate artwork or reimplement this patch. If the checkout has advanced, report the exact conflict instead of resetting it.

Suggested PR title: `App experience: identity-led onboarding and first Proof`

Suggested PR summary:

The existing onboarding presents a large optional form before users experience value. This change introduces required, guided preparation and a real first action/report before sign-in, then carries the user through a scheduled commitment, Proof, milestone and accomplishment. It preserves the existing owner-bound command architecture and adds one forward-only migration for first-report import. Calendar export and lock-screen creation are connected. This is an implementation preview: remaining approved artwork, Apple subscription, billing/account lifecycle services and hosted validation are documented explicitly.
