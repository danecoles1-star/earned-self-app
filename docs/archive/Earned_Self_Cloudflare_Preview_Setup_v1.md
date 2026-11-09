# Earned Self: protected Cloudflare preview setup v1

Prepared 13 September 2026. Configuration instructions only. No Cloudflare account, GitHub repository, domain or published environment was accessed or changed.

## Build settings

| Setting | Value |
| --- | --- |
| Project | New Pages project linked to the new repository, after Codex review |
| Root directory | Repository root |
| Install | `npm ci` using committed `package-lock.json` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Runtime | Node 24; `.node-version` records 24 |
| Preview environment values | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` for development only |
| Custom domain | None |
| Production release | Not authorized |

The normal build contains the real Supabase adapter, even for a protected private preview. It must never contain the local adapter. `preview:local` is a localhost development command and must never be used as a Cloudflare build command. `vite build --mode preview-local` is intentionally blocked. There is no deploy script or service credential in this package.

Codex should inspect the actual Pages dashboard before choosing Git integration versus a controlled preview upload. Do not trigger an unprotected initial production build merely to obtain a URL. Keep automatic production deployment disabled. A configured production branch is not approval to publish it.

## Protection before sharing

1. Create the preview project without publishing an unprotected application. Configure Cloudflare Access for the private preview with an explicit tester allowlist and an appropriate identity/session policy.
2. Determine the exact coverage of the Pages preview-access setting in this account. Protect every branch alias and deployment-hash hostname that can serve the build. The default `<project>.pages.dev` hostname is a separate exposure to verify, not assumed protected by the preview setting.
3. Do not deploy to that default production hostname during this phase. If any build is reachable there or through another alias, require equivalent Access enforcement or remove the exposure before sharing. Do not rely on an obscure URL, robots.txt or noindex as protection.
4. Test from an unsigned browser and `curl` without Access cookies. Root, assets and deep application paths must produce an Access challenge or deny response, never the frontend bytes. Test an unauthorized signed-in identity too.
5. Test an allowed member through Access, then the separate Supabase email login. Access grants entry to the frontend; Supabase grants access to that member's private records. Neither replaces the other.
6. Verify all exact email callback URLs in Supabase before sending test links. A branch alias can be a stable testing origin. Recheck protection and callbacks after every deployment/hostname change.

Cloudflare guidance: [Preview deployments and access policies](https://developers.cloudflare.com/pages/configuration/preview-deployments/). The current account settings and hostname coverage must still be verified by Codex. No assumed free-plan quota or protection configuration is baked into this source.

## SPA and response headers

`public/_redirects` provides `/* /index.html 200` for client-side routes. Verify direct `/app`, `/start`, `/record`, `/entry/<id>` and `/auth/callback` requests after deployment. Application routes do not contain member data in the static response.

`public/_headers` configures all static paths with:

- `X-Robots-Tag: noindex, nofollow, noarchive`
- `Cache-Control: no-store` for the private test
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'`
- no camera, microphone, geolocation or payment permissions
- CSP limiting scripts/assets to self, images to self/data, and connections to self plus HTTPS Supabase project origins

Inline styles are permitted for existing presentation. Inline scripts, object embeds and third-party frames are not. Narrow the `connect-src https://*.supabase.co` entry to the exact development project once Codex has its real origin. No WebSocket allowance is required because this slice does not use Realtime. No HSTS policy is added for an unowned/custom domain.

The HTML has a noindex meta tag and `robots.txt` disallows crawling. These are search instructions, not access controls. `vite preview` does not emulate Cloudflare's `_headers` processing, so local success cannot validate deployed headers. See [Cloudflare Pages headers](https://developers.cloudflare.com/pages/configuration/headers/).

## Verify the protected deployment

Codex should record actual responses without committing tokens or Access cookies:

| Check | Required result |
| --- | --- |
| Unsigned root, asset and deep link on every reachable hostname | Access challenge or denial |
| Allowed Access identity | Frontend loads; Supabase auth still required for account work |
| Authorized root, JS/CSS, `/record`, callback response | Expected noindex and security headers, no accidental public cache policy |
| Direct member route reload | SPA loads and authentication boundary holds |
| Email callback | Correct origin, Access session maintained, PKCE consumed in original browser |
| Browser console | No CSP-blocked required resources or callback errors |
| Unconfigured environment | Explicit saving-unavailable state; no preview-data fallback |
| Browser build inspection | No local adapter, mock identities, test controls or service credentials |
| `earnedself.com` and old Lovable application | Unchanged |

Use the actual preview origin in tests. Do not add it to public search listings, configure a custom domain, activate a trial, or promote to production in this assignment. The review branch, development schema and protected preview are all gates before a separate explicit launch decision.
