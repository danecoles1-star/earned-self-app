# Earned Self — deployment runbook

This is the only current deployment document. Everything in `docs/archive/` is history and must not be followed.

| | |
| --- | --- |
| Production URL | https://earned-self.pages.dev |
| Hosting | Cloudflare Pages project `earned-self` (static `dist/`) |
| Database and sign-in | Supabase project `vovmkiuxmtnedfosoxds` |
| Access model | **Public.** No Cloudflare Access. Member data is protected by Supabase sign-in and row-level security. |
| Node | 24 (`.node-version`) |

## What this release changes

### The redesign (from the approved design canvas)

- **One design system, light and dark:** `src/earned.css` holds the single token set and follows the iPhone's dark-mode setting. Body text is 17px and scales with the phone's text size. Spacing respects safe areas. Reduce Motion turns off the Begin pulse and transitions.
- **Fonts:** Figtree (interface) and Newsreader (display) are self-hosted through `@fontsource-variable` packages, so they look the same on every device and the CSP stays `font-src 'self'`.
- **Floating tab bar:** Now / Plan / Proof with drawn icons. It appears only on those top-level screens and Settings; flows and focus screens are full-screen.
- **Now is for getting ready:** greeting, the prepared-step card with **Begin centered in the halo**, and *Get ready* (Where, When, Done when). Two links sit below: **Can't make it today?** opens check-in with *Not yet* selected, and **Add to calendar**.
- **Begin opens the focus session:** an ink screen with *How it goes* (step, where, done when), the timer, and **Finish and check in**. The screen stays awake while the timer runs, where the browser allows it.
- **Two-part check-in:** part 1 is *Tell it as it happened* (Done / Partly / Not yet, plus your words). When a plan step is done, part 2 asks for the **next step and its date and time** before returning to Now. Repeating steps already carry their schedule, and misses still go to recovery.
- **Proof:** the milestone tracker sits on top (gold badge when earned, dashed numbered circles ahead, with steps and comebacks totals). Below it, a **weekly journal** of entries quotes the member's words with Done / Partly / Not yet chips. Earned milestones appear with a gold outline.
- **Milestone earned:** a full ink screen with the gold badge, the milestone, the member's words, totals, and buttons for Proof, lock screen and what comes next.
- **Fix:** links to schedule a prepared step (`/commitment/<goal>/<step>`, `/add-step/<goal>/<step>`) were rejected by the route list. They work now.

No database migration. Data and commands are unchanged; the redesign is presentation plus navigation. The AI that writes each step's segments and examples is the next workstream (see `docs/REDESIGN_BRIEF.md`). Until it ships, How it goes shows the member's own step, place and finish line.

### Cleanup and public-launch settings

- **Cloudflare Access removed from the plan.** Nothing in the repo configures it, and the build audit fails if Access references appear. The dashboard steps below turn off what is currently enabled.
- **Public-launch headers** (`public/_headers`):
  - **Assets:** fingerprinted `/assets/*` are cached for a year, and HTML always revalidates.
  - **CSP:** connections are limited to the exact Supabase project.
  - **Previews:** preview deployments send `noindex`.
- **Search:** `robots.txt` allows only the homepage, and the old site-wide `noindex` meta tag is gone.
- **Build guard:** `scripts/check-env.mjs` stops any build that is missing the Supabase URL or publishable key, points at the wrong project, contains secret-looking variables or has the development AI flag on.
- **CI and deploy:** `.github/workflows/ci.yml` tests every PR. `.github/workflows/deploy.yml` deploys by hand from GitHub.
- **Fixes:**
  - The "Agreements and revisions" button led to a not-found page and has been removed. History remains in Proof.
  - The leftover Guided/On request selector is gone.
  - Error messages no longer say "development" or "private test."
- **Repo cleanup:** stale QA screenshots removed (12 MB). Old runbooks moved to `docs/archive/`.

No database migration is included. Hosted Supabase should already have every migration through `202610070001_workshop_areas.sql`. Step 3 confirms this.

---

## 1. One-time setup (account owner, in dashboards)

### 1a. Turn off Cloudflare Access

1. Cloudflare dashboard → **Zero Trust** → **Access** → **Applications**. Delete every application whose domain covers `earned-self.pages.dev` or `*.earned-self.pages.dev`.
2. Cloudflare dashboard → **Workers & Pages** → `earned-self` → **Settings** → **General**. If **Access policy** is enabled for preview deployments, disable it.
3. Verify from a terminal (no browser cookies involved):

   ```sh
   curl -sI https://earned-self.pages.dev/ | head -20
   curl -sI https://earned-self.pages.dev/app | head -20
   ```

   Each must return `HTTP/2 200`. A `302` with a `location:` pointing at `*.cloudflareaccess.com` means Access is still on. Repeat in a private browser window: the Earned Self homepage should appear with no Cloudflare login.

### 1b. GitHub settings for CI and deploys

In the GitHub repository → **Settings**:

- **Secrets and variables → Actions → Variables:**
  - `VITE_SUPABASE_URL` = `https://vovmkiuxmtnedfosoxds.supabase.co`
  - `VITE_SUPABASE_PUBLISHABLE_KEY` = the project's `sb_publishable_…` key. It is public by design, since it ships inside the app.
- **Secrets and variables → Actions → Secrets:**
  - `CLOUDFLARE_API_TOKEN`: create it at Cloudflare → My Profile → API Tokens, with the permission **Account → Cloudflare Pages → Edit** only.
  - `CLOUDFLARE_ACCOUNT_ID`: shown on the Workers & Pages overview.
- **Environments:** create `production`, add yourself as a **required reviewer**, and limit it to the `main` branch.
- **Branches:** protect `main` and require the **CI / verify** check before merging.

Never put the Supabase secret key, a service-role key or an AI provider key in GitHub variables or any `VITE_` name.

### 1c. Cloudflare Pages project settings

Workers & Pages → `earned-self` → **Settings**:

- **Production branch:** `main`. The deploy workflow publishes with `--branch=main`.
- **If the project is Git-connected** (it builds by itself on push), choose one path and disable the other:
  - **Either keep Cloudflare's build:** build command `npm run build`, output `dist`, and the two `VITE_` values under **Variables → Production**. Then delete `.github/workflows/deploy.yml`.
  - **Or use the GitHub workflow:** turn off automatic production builds in Cloudflare.
- **If it is a Direct Upload project** (today's manual uploads), use the GitHub workflow. Manual `dist` uploads from a laptop should stop.

### 1d. Supabase settings (Authentication)

1. **URL Configuration:**
   - Site URL: `https://earned-self.pages.dev`
   - Redirect URLs: `https://earned-self.pages.dev/auth/callback`
2. **Email:** turn on **custom SMTP** with a verified sender. The default sender only emails project team members and is limited to 2 messages per hour, so the public cannot sign up without this.
3. **Templates:** paste `docs/email-templates/confirm-signup.html`, `magic-link.html` and `reset-password.html` into the matching templates. Keep `{{ .Token }}` intact.
4. **Passwords:** set the minimum length to **12** to match the app.
5. Keep email confirmation on and anonymous sign-ins off.

---

## 2. Every release

1. Work on a branch and open a PR. **CI must pass.** It runs unit tests, database tests, the production build with its audits, the browser journeys and the production-header test.
2. Merge to `main`.
3. **Migrations (only when the PR adds a file under `supabase/migrations/`).** From a checkout of `main`:

   ```sh
   npm ci
   npm exec -- supabase link --project-ref vovmkiuxmtnedfosoxds
   npm run supabase:migrations      # Local and Remote columns must match, except the new file(s)
   npm run supabase:dry-run         # must list only the new migration file(s)
   npm run supabase:push
   npm run supabase:migrations      # every row now matches
   ```

   Push migrations **before** deploying the app that needs them. Never edit an applied migration. Never use `db reset`, `migration repair` or `config push` against this project.
4. GitHub → **Actions** → **Deploy to Cloudflare Pages** → **Run workflow**, then approve the `production` environment.
5. Run the smoke tests in section 4.

### Building on a laptop (fallback only)

Put the two values in an ignored `.env.production.local` and run `npm run build`. The environment check refuses to build without them. Upload with `npx wrangler pages deploy dist --project-name=earned-self --branch=main`. Never upload a `dist` built by `npm run preview:local` or by a test run.

## 3. First release after this package: confirm the database

```sh
npm exec -- supabase link --project-ref vovmkiuxmtnedfosoxds
npm run supabase:migrations
```

All nine local versions, from `202609130001` through `202610070001`, must show in the Remote column. If any are missing, stop and review before deploying. The app needs them.

## 4. Smoke tests after every deploy

Use your own test accounts. Keep codes and passwords out of screenshots.

| Check | Expected |
| --- | --- |
| `curl -sI https://earned-self.pages.dev/` | `200`, no Access redirect, `content-security-policy` naming `vovmkiuxmtnedfosoxds.supabase.co` |
| `curl -sI https://earned-self.pages.dev/assets/<any js file from the page source>` | `cache-control: public, max-age=31536000, immutable` |
| `curl -s https://earned-self.pages.dev/robots.txt` | `Allow: /$` and `Disallow: /` |
| Preview URL, e.g. `curl -sI https://<hash>.earned-self.pages.dev/` | `x-robots-tag: noindex, nofollow` |
| Direct loads of `/app`, `/proof`, `/settings`, `/auth/callback` | App loads (SPA fallback), sign-in required for member data |
| New visitor: onboarding → create account → code email → verify | Email arrives within a minute; lands on Now with the draft saved |
| Existing member: password sign-in, refresh | Same data, no repeat onboarding |
| Second account in another browser | Cannot see the first account's data |
| iPhone Safari and Chrome | Sign-in, check-in, wallpaper Save Image, calendar file |
| Browser console | No CSP errors |

## 5. Rollback

Cloudflare → Workers & Pages → `earned-self` → **Deployments** → choose the previous deployment → **Rollback**. If the release included a migration, check the older app works with the newer schema before rolling back. Migrations are forward-only, so never delete data to undo one.

## 6. Before inviting the public (not done by this package)

These are launch blockers. They are product work for the next PRs:

1. **Privacy policy and terms:** public pages linked from the homepage and sign-up. The text must come from the owner, ideally reviewed by a lawyer.
2. **Account deletion:** a "Delete my account" control in Settings. It calls a Supabase Edge Function that verifies the caller's JWT, deletes their `es_*` rows and `profile-photos/<uid>/` object, then deletes the auth user with the service key, which is stored only as a Supabase secret. It needs a confirmation step and tests proving it cannot delete another user.
3. **Custom SMTP** (1d) tested with an outside email address.
4. **Unexplained records:** diagnose the essay entries and the mismatched vision in the founder account using `docs/pilot-review/Inspect_My_Records.sql`, and confirm new accounts start empty.
5. **The redesign and AI preparation:** see `docs/REDESIGN_BRIEF.md`. Until that ships, the public sees the current manual onboarding without AI.
