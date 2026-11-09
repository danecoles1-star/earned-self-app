# Earned Self: repository manifest v1

Target: the new empty GitHub repository. All listed files are **ADD**. **REPLACE: none.** No old repository or Lovable files are included. Preserve the new repository identity and work in a reviewable branch.

Recommended review sequence: (1) toolchain, static assets and guarded schema; (2) auth, adapters and member flow; (3) tests, protected-preview configuration and QA evidence. Applying a migration, merging and deploying are separate decisions.

## Add to the new repository

### Root

- `.env.example`
- `.gitignore`
- `.node-version`
- `README.md`
- `index.html`
- `package-lock.json`
- `package.json`
- `playwright.config.ts`
- `tsconfig.json`
- `vite.config.ts`

### src

- `src/App.tsx`
- `src/assets/business.webp`
- `src/assets/mark-transparent.png`
- `src/assets/wordmark-dark.png`
- `src/assets/wordmark.png`
- `src/components/Brand.tsx`
- `src/components/Homepage.tsx`
- `src/data/domain.ts`
- `src/data/drafts.ts`
- `src/data/supabase.ts`
- `src/data/types.ts`
- `src/env.d.ts`
- `src/logo.css`
- `src/main.tsx`
- `src/marketing.css`
- `src/preview/adapter.ts`
- `src/styles.css`

### public

- `public/_headers`
- `public/_redirects`
- `public/robots.txt`

### supabase

- `supabase/migrations/202609130001_private_slice.sql`
- `supabase/migrations/202609130002_atomic_commands.sql`

### scripts

- `scripts/audit-build.mjs`
- `scripts/test-built-browser.mjs`
- `scripts/test-database.mjs`

### tests

- `tests/e2e/first-loop.spec.ts`
- `tests/loop.test.tsx`
- `tests/save-states.test.tsx`
- `tests/setup.ts`
- `tests/supabase-adapter.test.ts`
- `tests/unit.test.ts`

### docs

- `docs/Earned_Self_Cloudflare_Preview_Setup_v1.md`
- `docs/Earned_Self_Supabase_Implementation_v1.md`
- `docs/Earned_Self_Test_Results_v1.md`
- `docs/Source_Reference_Map.md`

### qa

- `qa/source-sha256.txt`
- `qa/browser-results.json`
- `qa/screenshots/built-homepage-1024.png`
- `qa/screenshots/built-homepage-1440.png`
- `qa/screenshots/built-homepage-375.png`
- `qa/screenshots/built-homepage-390.png`
- `qa/screenshots/built-homepage-430.png`
- `qa/screenshots/built-homepage-768.png`
- `qa/screenshots/ceramics-1024.png`
- `qa/screenshots/ceramics-1440.png`
- `qa/screenshots/ceramics-375.png`
- `qa/screenshots/ceramics-390.png`
- `qa/screenshots/ceramics-430.png`
- `qa/screenshots/ceramics-768.png`
- `qa/screenshots/commitment-1024.png`
- `qa/screenshots/commitment-1440.png`
- `qa/screenshots/commitment-375.png`
- `qa/screenshots/commitment-390.png`
- `qa/screenshots/commitment-430.png`
- `qa/screenshots/commitment-768.png`
- `qa/screenshots/empty-home-390.png`
- `qa/screenshots/empty-record-390.png`
- `qa/screenshots/failed-save-390.png`
- `qa/screenshots/homepage-1024.png`
- `qa/screenshots/homepage-1440.png`
- `qa/screenshots/homepage-375.png`
- `qa/screenshots/homepage-390.png`
- `qa/screenshots/homepage-430.png`
- `qa/screenshots/homepage-768.png`
- `qa/screenshots/preview-auth-390.png`
- `qa/screenshots/pursuit-1024.png`
- `qa/screenshots/pursuit-1440.png`
- `qa/screenshots/pursuit-375.png`
- `qa/screenshots/pursuit-390.png`
- `qa/screenshots/pursuit-430.png`
- `qa/screenshots/pursuit-768.png`
- `qa/screenshots/record-detail-1024.png`
- `qa/screenshots/record-detail-1440.png`
- `qa/screenshots/record-detail-375.png`
- `qa/screenshots/record-detail-390.png`
- `qa/screenshots/record-detail-430.png`
- `qa/screenshots/record-detail-768.png`
- `qa/screenshots/record-index-1024.png`
- `qa/screenshots/record-index-1440.png`
- `qa/screenshots/record-index-375.png`
- `qa/screenshots/record-index-390.png`
- `qa/screenshots/record-index-430.png`
- `qa/screenshots/record-index-768.png`
- `qa/screenshots/unconnected-auth-1024.png`
- `qa/screenshots/unconnected-auth-1440.png`
- `qa/screenshots/unconnected-auth-375.png`
- `qa/screenshots/unconnected-auth-390.png`
- `qa/screenshots/unconnected-auth-430.png`
- `qa/screenshots/unconnected-auth-768.png`
- `qa/screenshots/vision-entry-390.png`

## Exclude

- `node_modules/`, `dist/`, coverage, Playwright traces/reports, transient `test-results/`, `.tsbuildinfo` and build caches.
- Actual `.env`, `.env.local`, provider tokens, service-role credentials and secrets. Only `.env.example` with empty values is included.
- Temporary browser executable, test-runner runtime libraries and packaging scripts outside this source tree.
- Old Lovable code, old Cloud schema, existing repository metadata, obsolete prototypes and demo seeds.
- The standalone delivery ZIP and review HTML need not be committed. QA screenshots live outside `public/` and are never bundled as member assets.

`qa/` contains synthetic testing evidence only. It is review material, not database seed data. The application has no path that reads that directory. Public Maya content lives only in the read-only homepage component.

This manifest is itself included at `docs/Earned_Self_Repository_Manifest_v1.md`.
