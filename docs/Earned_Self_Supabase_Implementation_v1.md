# Earned Self: Supabase implementation v1

Status: implemented source, locally tested migrations, no remote project connection. Prepared 13 September 2026. These migrations target a new direct Supabase project. They do not contain the former Lovable schema or depend on any legacy data.

## Migration order

| Order | File | Purpose |
| --- | --- | --- |
| 1 | `supabase/migrations/202609130001_private_slice.sql` | Nine private tables, composite ownership relationships, deferred revision pointers, constraints, indexes, immutable revision triggers and RLS |
| 2 | `supabase/migrations/202609130002_atomic_commands.sql` | Narrow transactional write command, owner-scoped read projection and explicit function privileges |

Codex must review the files before linking a Supabase CLI to the intended development project. Verify project identity, migration history, PostgreSQL support and absence of name collisions first. Apply both files in order using the project's chosen versioned migration workflow. Do not paste them into a Live project. No real migrations were executed in this assignment.

Each file is transactional. If the second file fails, the first remains a private read-only schema with no browser mutation grant. Resolve the failure in development before enabling testing. Once member data exists, prefer a reviewed forward fix. Do not roll back by dropping the schema. Reverting the frontend to an earlier compatible commit is separate from database rollback.

## Core entities

| Table | Identity and purpose | History behavior |
| --- | --- | --- |
| `es_goals` | UUID goal, `owner_id`, revision pointer, optimistic version, creation time | Member goal/vision root; never reassigned across owners |
| `es_goal_revisions` | Owner + goal + revision; kind, exact words, optional meaning | Initial immutable authored definition; no edit command in this slice |
| `es_preferences` | One row per owner; selected goal and support preference | Selected goal is a pointer, not a transfer of any history |
| `es_commitments` | UUID attempt, owner + goal, definition pointer, version, active/reported | One active attempt per goal through a partial unique index |
| `es_commitment_revisions` | Owner + goal + attempt + revision; action, criterion, deliberate/quick | Evidence pins the definition that applied to its attempt |
| `es_schedules` | UUID, full parent identity, optional date/time/zone/location | Separate schedule snapshot; creating a schedule is not evidence |
| `es_evidence` | Stable UUID and unique attempt identity; pinned definition/schedule, version | One identity per attempt, regardless of later optional-detail edits |
| `es_evidence_revisions` | Owner + goal + evidence + revision; result, detail, reflection, optional occurrence date | Append a revision for detail edits; retain the original result and original entry identity |
| `es_operations` | Owner + operation UUID; command, salted request digest, target/version receipt | Atomically deduplicates retries; no stored private request JSON |

All private relations carry ownership. Child foreign keys include owner and goal, not only an unscoped record ID. Root account ownership references `auth.users` with cascading deletion. Deferred current-revision foreign keys permit creating a root and its first immutable definition in one transaction. Historical definitions reject UPDATE. Browser roles cannot DELETE them.

There is no duplicate Record table. `es_read_state()` returns the account's goals, definitions, schedules, attempts and evidence. The frontend groups the evidence by goal and joins original words, the pinned commitment and latest evidence revision. A detail revision is not a second accomplishment.

## Command contract

All durable writes use:

```text
es_command(p_expected_owner UUID, p_operation UUID, p_kind TEXT, p_payload JSONB)
  -> { id: UUID, version: integer }
```

| Kind | Required payload | Optional payload | Atomic effect |
| --- | --- | --- | --- |
| `goal` | id, kind (`goal`/`vision`), words | meaning | Goal + first definition + selected-goal preference + receipt |
| `commitment` | id, goalId, mode, action, criterion | localDate, localTime, timeZone, location | Attempt + definition + optional schedule + receipt |
| `outcome` | id, goalId, commitmentId, expected version, result | detail, reflection, occurredOn | Evidence + first report + attempt becomes reported + receipt |
| `detail` | goalId, evidenceId, expected version | detail, reflection | New immutable revision on the same evidence identity + receipt |
| `select` | goalId | None | Owner's current-goal pointer + receipt |
| `support` | mode (`guided`/`on_request`) | None | Owner's preference + receipt |

The actual JSON field for expected version is `version`. Empty optional strings become null. Action and criterion must contain meaningful non-whitespace text. Text length limits are 10,000, with rejection and retained input rather than silent truncation. Unsupported payload fields are rejected. The browser does not choose `owner_id`, timestamps or report revision numbers.

`detail` currently preserves the reported Done / Partly / Didn’t happen result. A result-status correction or retraction requires a future reviewed command and interface. The SQL's occurrence date field is nullable; the current one-tap outcome UI leaves it unknown. It does not infer occurrence from the save time or schedule. Exact occurrence timestamps are not represented by the current date-only field.

## Saving and retry guarantees

1. The UI binds each command to the initiating authenticated owner and a random operation ID. The server compares `p_expected_owner` to `auth.uid()` so a switched session cannot redirect an old command into another account.
2. The pending payload and operation ID are retained under an account-scoped browser key before dispatch. An unchanged retry reuses that operation ID. Changed input is a new operation, subject to entity uniqueness and version checks.
3. The server serializes commands for the owner with a transaction-scoped advisory lock. It checks an existing operation receipt before checking the now-advanced entity version.
4. An identical replay returns the original receipt. The same key with changed content is rejected. The salted SHA-256 digest is duplicate detection, not encryption or an audit of member truth.
5. Entity writes and receipt commit together. A rejected command leaves neither partial rows nor a success receipt. A different operation cannot bypass the unique evidence-per-attempt constraint.
6. The UI displays success only after a receipt. It then rereads saved state. A failed refresh displays a reload action, not an empty account. A lost acknowledgement is an uncertain save, not a claim that the server definitely did nothing.
7. Member navigation and submission controls are disabled during an in-flight save. A browser reload can still interrupt an unacknowledged operation. The persistent payload permits retry; acknowledged work remains on the server.

The initial goal draft is browser-only until the member explicitly saves after authentication. It is not a server draft. PKCE email sign-in must return to the same browser. Switching devices does not transfer an unsaved draft. After a save is initiated, the draft is bound to that account. A different account receives a separate-draft choice, never an automatic import.

## Authentication and environment assumptions

Only these frontend variables are read:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

`.env.example` includes names with empty values. Configure actual values only in ignored local environment files and Cloudflare's preview build settings. The URL must be an HTTPS `*.supabase.co` project origin. The browser accepts the new `sb_publishable_` key format, not service-role keys or legacy JWT keys. A publishable key is intentionally public and must be protected by RLS and command authorization.

Email passwordless authentication uses Supabase JS with PKCE, persisted session, automatic token refresh and callback detection. `signInWithOtp` currently permits account creation. Enable the email provider and verify the email confirmation/template, sender and delivery settings. Disable anonymous sign-ins. Anonymous JWT identities are additionally denied by the proposed RLS and write function. Supabase Auth is trusted to provide `auth.uid()` and the verified JWT claims.

For a strictly invited test cohort, Codex must decide whether to restrict signup server-side and use invitations. If signups are disabled, adapt the current `shouldCreateUser: true` behavior and test the invitation journey. Cloudflare Access controls the frontend, not the publicly reachable Supabase API; it is not an account-creation policy.

Do not log original words, actions, factual detail, reflection, pending JSON, email links, JWTs or local draft contents to analytics or exception services. The source includes no analytics provider. Browser-local drafts are not encrypted and can remain on a shared device after sign-out. Provide test guidance and a reviewed clear-draft/account-deletion process before enrolling members who will enter sensitive writing. Local sign-out clears the active session, not all other devices' sessions or all browser drafts.

## Redirect URLs Codex must configure

Use actual allowlisted origins, replacing the labels below with the assigned addresses. The code always requests `location.origin + '/auth/callback'`.

| Environment | Redirect URL |
| --- | --- |
| Default local development | `http://127.0.0.1:5173/auth/callback` |
| If intentionally using localhost instead | `http://localhost:5173/auth/callback` |
| Local compiled review on chosen port 4173 | `http://127.0.0.1:4173/auth/callback` |
| Stable protected Pages branch | `https://<preview-branch>.<pages-project>.pages.dev/auth/callback` |

Set the Auth Site URL to the intended protected testing origin. Add only the exact origins used. Do not use earnedself.com. Avoid broad wildcard redirect entries for unrelated deployments. If Codex needs a hash-specific preview, allowlist that exact protected URL and verify its callback. A protected preview may ask the member to pass Cloudflare Access before the application consumes the email link. Test that sequence with a real email on the same browser and on mobile.

Supabase guidance: [Passwordless email authentication](https://supabase.com/docs/guides/auth/auth-email-passwordless). This explains the provider behavior; successful delivery and callback handling still require testing the configured project.

## Authorization and privacy

| Resource | Member reads | Member creates/updates | Direct browser deletes | Anonymous access |
| --- | --- | --- | --- | --- |
| Goals, definitions, preferences, commitments, schedules, evidence and report revisions | Own rows only, including through invoker read function | Allowlisted commands only | Denied | Denied |
| Operation receipts | No direct SELECT | Internal to write transaction only | Denied | Denied |
| Auth account | Supabase Auth session boundary | Supabase Auth flow | No UI deletion in this slice | No member rows |

RLS is enabled and forced on all nine tables. Authenticated members receive owner-only SELECT policies on eight; receipts receive no member read policy. No anonymous table grants and no member INSERT/UPDATE/DELETE grants exist. Knowing an ID does not grant access. `es_read_state` is SECURITY INVOKER. The write function is SECURITY DEFINER with a fixed `pg_catalog` search path, fully qualified application objects, explicit actor checks, allowlisted commands, ownership-constrained lookups and no dynamic SQL from user input. PUBLIC and anonymous execution are revoked; only the two intended RPCs are granted to authenticated members. The text helper and immutable trigger function are not member RPCs.

Codex must inspect the real function owner and effective privileges. The migration executor must have the expected trusted rights to run the guarded commands through forced RLS. Do not weaken RLS or grant table DML to fix an incorrectly owned function. No browser service credential is needed.

Deleting an Auth user through a future authorized server-side account workflow cascades this schema's private content and operation receipts. That does not promise deletion from provider backups or operational logs. No external artifact storage exists. Future uploads need private buckets, owner-bound metadata, storage policies and an explicit deletion workflow; none are prebuilt here.

## Time and state

PostgreSQL writes `timestamptz` recorded/created times. A planned date remains a local date with its IANA zone. A specific time is resolved by the database to an instant, with DST gap/repeated-time rejection asking for an unambiguous choice. Location-only planning is allowed. No schedule is manufactured when both timing and location are absent. The preview adapter demonstrates the inputs but is not a full timezone-validation engine.

An active attempt with a past planned date remains unreported. Only a member result creates evidence. Done closes the action attempt, not the goal. Partly and Didn’t happen also finish reporting that attempt, allowing a new attempt without erasing the previous one. Goal switching changes only a preference. Goal completion, pause and rescheduling are deferred, not inferred from inactivity.

## Post-connection tests: required before tester access

Run with two real email accounts, A and B, separate browser profiles, and an unsigned client. Never use a service-role client for member authorization tests.

1. Apply migrations to the development project. Inspect RLS enabled/forced, SELECT policies, grants and both RPC security attributes. Confirm no seed rows.
2. New A and B each see an empty snapshot. Open `?demo=maya`, `?fixture=sam`, localStorage test flags and direct `/entry/<A-id>` as B; none import fixtures or expose A.
3. A creates a goal, current commitment and outcome through `es_command`. Query each private table and `es_read_state` as B: no A rows. Attempt every command with A's goal/evidence IDs as B: reject. Set `p_expected_owner=A` while authenticated as B: reject.
4. Attempt direct REST INSERT, PATCH and DELETE against every table as A, B and anon: deny. Attempt SELECT on receipts: deny. Attempt anonymous RPCs: deny. If anonymous Auth is available in a disposable test configuration, its authenticated-role JWT must still read no rows and fail commands.
5. Submit identical commands concurrently with the same operation UUID. Expect one target and the same receipt. Retry the same key with changed content: reject. Submit an outcome twice using different operation UUIDs: one evidence identity. Submit two different active commitments concurrently: one wins, the other gets a clear conflict.
6. Lose the HTTP response after a committed write, reload, and retry the retained command. It must resolve to the original target. Interrupt before commit: no partial rows or receipt. Failed writes must retain input and never show false success.
7. Make Goal A, Goal B, then switch A → B → A. Each retains its own commitment and Record. Schedule yesterday; it remains unreported. Record a miss, then a return commitment: the miss remains.
8. Edit facts and reflection. Expect one evidence root, two report revisions, unchanged attempt/result identity. A stale concurrent edit must reject and expose reload. Check record ordering and exact multiline Unicode words.
9. Send a real email link, follow it through Access, explicitly save the retained draft, refresh, sign out, and sign back in. Confirm acknowledged data persists. Repeat expired/used link, incorrect browser, rejected email delivery, token expiry and refresh, and account switching during a pending write. None may claim a saved goal without a receipt.
10. Confirm A cannot see B's old in-memory state after session change. Check back/forward navigation and direct bookmarked Record routes after reauthentication.
11. In a disposable account only, execute the authorized account-deletion path and verify all nine tables have no owned rows. Document backup/log retention separately.
12. Run the browser suite in Chromium and Firefox against a suitable real-adapter test configuration, plus real-device Safari. The included Playwright suite itself uses local preview; do not mistake it for these remote checks.

## Deliberate limits

No pagination yet: `es_read_state` returns the small private-test history in one owner-scoped snapshot. Establish a measured history-size ceiling before broader use. No Realtime subscription, offline sync queue, generalized event sourcing, artifact storage, AI provider, billing, social graph or speculative extension tables. The initial revision architecture is intentionally narrower than the full previous blueprint. Any later command must preserve owner/goal identity, expected version, idempotent receipt and immutable prior evidence.
