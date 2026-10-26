# Earned Self: structured pursuit implementation

This document describes the new forward migration. The supplied a171da4 archive is the baseline; both original migrations remain byte-for-byte unchanged. No remote service was accessed or activated.

## Migration order

1. `202609130001_private_slice.sql`
2. `202609130002_atomic_commands.sql`
3. `202609150001_structured_pursuits.sql`

Use the CLI activation addendum. The read-only installed-schema artifact is `Earned_Self_Supabase_Verification_v2.sql`. The old external v1 verifier is not in the supplied repository and must not be assumed compatible.

## Model and command boundary

All writes still use `es_command(expected owner, operation UUID, kind, payload)`. The guarded SECURITY DEFINER command has a fixed search path, member-scoped advisory serialization, ownership checks, field allowlists, expected versions and transactional idempotency receipts. Browsers have owner-only SELECT and no direct INSERT/UPDATE/DELETE. `es_read_state` remains SECURITY INVOKER. RLS is enabled and forced on all ten private tables. Helper functions are not browser RPCs.

Goal revisions now preserve vision, major accomplishment (`words`), observable outcome, why now, constraints, capabilities, unknowns, member affirmation and ordered milestone definitions. Milestones have stable UUIDs inside the immutable plan revision; commands validate their membership, current order and completion status. Commitments pin a milestone and plan revision. Draft plan edits append goal revisions. Activated plan definitions are fixed; explicit milestone deadline changes append a new plan revision and reason event.

Schedules and commitment definitions retain every original agreement. Rescheduling before an action is due appends a definition/schedule revision and reason; due unreported actions must be reported before a new commitment. Evidence pins the actual agreement being reported. Misses and partial results require what prevented the work and what will change; deliberate return choices include recommit, change approach and address blocker. Detail edits append evidence revisions and preserve the reported result and accountability answers.

`es_pursuit_events` stores immutable milestone completions, deadline changes, state transitions and next decisions. Preparation results never complete a milestone or major accomplishment automatically. Completion of the major accomplishment is explicit, requires actual outcome, member reflection and next choice, and rejects outstanding unreported action work. Unfinished milestones can remain visible if the real major accomplishment happened by a different route.

## Command kinds

- `goal`: create an incomplete account draft with foundation fields and milestone array.
- `plan`: edit an uncommitted draft with expected pursuit version.
- `commitment`: validate the full plan and member affirmation; create a scheduled action for the current milestone and activate/resume the pursuit atomically.
- `reschedule`: retain the earlier action and schedule; require expected action version and reason.
- `milestone_schedule`: revise an unfinished milestone deadline with expected pursuit version and reason; retain the original plan and chronological deadline order.
- `outcome`: done, partly, or did_not_happen, with expected action version; partial/missed results require prevented and adjustment.
- `detail`: revise factual detail/reflection with expected evidence version.
- `milestone`: explicitly complete the current milestone with actual completion detail; current action must be reported first.
- `status`: pause, resume, change direction, abandon or complete; require expected pursuit version and member explanation. Changed direction/completed/abandoned are terminal; a new direction starts a separate pursuit.
- `select`, `support`: existing owner-scoped preferences.

The TypeScript command union, domain validation and SQL allowlists define exact payload fields. Text is limited to 10,000 characters without truncation. Plans support up to 30 ordered milestones. Dates, times and IANA zones are mandatory for every milestone and next action before activation. Action times cannot exceed their milestone deadline. Both local preview and SQL reject nonexistent/repeated DST times. Preview uses browser Intl timezone data; PostgreSQL uses its installed timezone data.

## Existing data

Earlier goals are retained as drafts needing deliberate planning; no vision or ambition is invented. Historical commitments, optional schedules, evidence, report revisions and operation receipts remain unchanged. Report any pre-upgrade active commitment before editing its pursuit draft. Existing reports can still receive reflection revisions. The new frontend is required after migration; the old command payloads are intentionally no longer accepted for new writes.

## Required account-specific checks

Before real tester access, verify exact development project identity and schema inventory, migration history, trusted function owner, installed verifier PASS, real email/PKCE callbacks, session switching, expired links and two real accounts. Check all private tables and command kinds using real A/B JWTs and an unsigned client: no cross-account reads/writes, no direct browser DML, no receipt reads, no anonymous helper/RPC access. Exercise concurrent saves, lost acknowledgements, stale edits and account deletion cascade in disposable accounts. Check mobile Safari and deployed preview boundary behavior. Local PGlite uses simulated auth roles and cannot validate hosted Auth or provider configuration.

No AI, billing, uploads, notifications, outreach, social features or production changes were added. Snapshot reads remain unpaginated for this private test. Browser drafts remain device-local and persist after sign-out under account-bound keys; preview and real pending operations use separate namespaces.
