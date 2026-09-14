# Vitest dependency QA

Validated 14 September 2026. Development-tool dependency maintenance only.

## Versions and scope

- Vitest: locked `3.2.7` with range `^3.2.4` → pinned `4.1.11`.
- `@vitest/mocker` and the associated Vitest packages: `3.2.7` → `4.1.11`.
- Vite stays `6.4.3`. Runtime: Node `24.19.0`, npm `11.9.0`.
- The npm advisory feed identified GHSA-82fw-gwwq-j7x9 in `vitest` and `@vitest/mocker`: two moderate package findings for the same path-traversal issue, affecting versions below `4.1.11`. Registry metadata confirms 4.1.11 supports the existing Vite 6 and Node versions. No GitHub page or account was accessed.
- `package-lock.json` was regenerated with the compatible patched version. Associated development-only dependencies changed as required. Production dependency declarations and all 12 production package lock records are unchanged.
- No application, interface, copy, styling, test source, schema, migration or production dependency was modified.

## Commands and results

| Command/check | Result |
| --- | --- |
| `npm audit --json` before update | 2 moderate findings; no other vulnerabilities |
| `npm view vitest@4.1.11 engines peerDependencies dependencies --json` | Compatible with existing Node and Vite |
| `npm install --save-dev --save-exact vitest@4.1.11 --ignore-scripts` | Patched dependency installed; lockfile regenerated |
| `npm test` | 20/20 unit/component tests pass across 4 files |
| `npm run test:db` | 21/21 local PostgreSQL and simulated authorization checks pass |
| `npm run build` | Strict TypeScript and production Vite build pass; included boundary audit passes |
| `npm audit --json` and `npm audit` after update | 0 info, 0 low, 0 moderate, 0 high, 0 critical: **0 total** |
| Source integrity and scope comparison | Existing unrelated source bytes unchanged; refreshed SHA-256 entries include this note |
| Patch check and application against the delivered v1 package | Applies cleanly; resulting files match the updated integrity manifest |

Database tests execute only in disposable local PGlite, using simulated authentication roles. The production build audit finds no local-preview adapter, test identities, failure-injection controls or detected service credentials. This is not a new remote-service security review. Vulnerability counts reflect the npm audit feed at validation time, not a guarantee against future advisories.

## Codex integration

This patch targets the previously delivered `Earned_Self_Private_Test_Build_v1.zip`. It changes only `package.json`, `package-lock.json`, `qa/source-sha256.txt` and adds `qa/Vitest_Dependency_QA.md`. From that repository's root, with the patch saved outside the source tree:

```sh
git apply --check /path/to/Earned_Self_Vitest_4_1_11.patch
git apply /path/to/Earned_Self_Vitest_4_1_11.patch
npm ci
npm test
npm run test:db
npm run build
npm audit
```

If the check reports a conflict, reconcile it against the four intended files; do not force an overwrite of newer repository work. `qa/source-sha256.txt` intentionally excludes its own digest. Historical screenshots and earlier QA reports remain unchanged; this note supersedes their dependency-version and audit-count statements only. Browser visual QA was not rerun because no application or presentation files changed.

No GitHub, Supabase, Cloudflare, DNS or production service was accessed. Nothing was published or deployed.
