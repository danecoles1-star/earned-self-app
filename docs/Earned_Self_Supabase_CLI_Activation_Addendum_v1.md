# Earned Self: Supabase CLI activation addendum v1

**Approved route: version-controlled Supabase CLI migrations into the empty development project.** This addendum supersedes the SQL Editor activation route, manual migration log and empty-history expectation after installation in the existing runbook. The verifier's `cli` mode already supports this route. The first two migrations remain unchanged. The structured-pursuit migration and v2 verifier are now required.

All commands below are instructions for the account owner, not actions performed for this addendum.

## 1. Confirm the target and local checkout

**Account owner:** Verify the exact development project reference in the Supabase dashboard. Confirm this project is development-only, with no data, Auth users, storage objects or application schema requiring preservation. Complete the existing schema inventory and preflight verifier using `phase := 'preflight'`, `migration_method := 'cli'`, and both identity/inventory confirmation flags set to `true` only after verification.

**Codex/local operator:** Use the approved repository checkout. Confirm the two original migration hashes match the existing runbook. Require reviewed CLI configuration in `supabase/config.toml` and an installed Supabase CLI. If configuration is missing, stop for Codex to prepare it separately; do not generate or overwrite repository configuration during activation.

**Stop:** Wrong or uncertain project, existing application data/schema, nonempty migration history, hash mismatch, or any failed preflight assertion.

## 2. Authenticate, link and inspect

**Account owner**, from the repository root:

```sh
supabase --version
supabase login
supabase link --project-ref <EXACT_DEVELOPMENT_PROJECT_REF>
supabase migration list --linked
supabase db push --linked --dry-run
```

Replace the project-reference placeholder before running. Enter credentials only through the owner's local secure authentication/prompts. Never put them in repository files or shared logs. Verify the linked reference matches the dashboard.

The migration list must show exactly these local versions, with neither recorded remotely. The dry run must propose exactly these migrations, in this order:

1. `202609130001_private_slice.sql`
2. `202609130002_atomic_commands.sql`
3. `202609150001_structured_pursuits.sql`

**Stop:** Any additional/missing migration, unexpectedly recorded remote version, changed repository file, history discrepancy, connection error, or dry-run failure. Do not use override flags or repair history to continue. A dry run previews pending work; it does not establish that SQL execution will succeed.

## 3. Apply and verify

**Account owner:** After all checks pass, without changing the checkout or linked project:

```sh
supabase db push --linked
supabase migration list --linked
```

Review the CLI confirmation before accepting. Require all three versions to appear locally and remotely. Confirm the recorded history with this read-only SQL:

```sql
SELECT version
FROM supabase_migrations.schema_migrations
ORDER BY version;
```

Require exactly `202609130001`, `202609130002` and `202609150001`, with no other rows.

Run the whole read-only `docs/Earned_Self_Supabase_Verification_v2.sql`. Require its explicit PASS before creating test accounts. It verifies the installed schema; it does not establish project identity. SQL Editor may run read-only inventory, history queries and verification only.

**Stop:** Push failure, partial application, unexpected history or any verifier failure. Preserve logs and current state for Codex review. Do not rerun blindly or delete schema/data; use a separately reviewed recovery or forward migration.

## 4. Remaining owner checks

Use the existing runbook procedures for local email/PKCE configuration, real email return and persisted sign-in, two real test accounts in separate browser sessions, and cross-account isolation. Complete its direct-write, anonymous-access, ownership-spoofing, duplicate-command and interrupted-save tests. Any failure blocks advancement. Cloudflare work remains deferred until these pass.

## Prohibited

No manual migration execution through SQL Editor; no sample-data seeding; no database reset; no migration repair or manual history edits; no production activation; no Cloudflare, publishing or DNS changes.

No activation commands were executed for this implementation.
