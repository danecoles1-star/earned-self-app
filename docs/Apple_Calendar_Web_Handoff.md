# Apple Calendar: web handoff candidate

## Purpose

Replace the forced blob download behind Apple Calendar with a same-origin form POST that returns an inline calendar response. The button now includes a calendar icon. The saved commitment and the Earned Self tab remain available while the user reviews the event.

This is a browser compatibility candidate, NOT a verified iPhone Chrome fix. Desktop Chromium checks cannot establish whether iPhone Chrome will show Apple's event preview. The browser may still choose to download an inline calendar response. Do not call this accepted or promise a native editor until the real-device checklist passes.

## Implementation

- `public/_worker.js` is a self-contained Cloudflare Pages advanced-mode worker. No additional packages, secrets, database access, auth tokens, storage, public event links or payload logging.
- `/calendar-event.ics` accepts submitted event fields via POST, validates them, escapes calendar text, folds Unicode lines and returns `text/calendar` with `Content-Disposition: inline` and `Cache-Control: no-store`.
- Event details stay in the request body, not the URL. Origin/Fetch Metadata reject cross-site browser submissions. This is a stateless converter, not an authenticated data endpoint; it returns only the caller's submitted fields.
- Validation caps the body at 300,000 bytes and text fields at 10,000 characters, permits only the UI's durations, and checks IDs, revision and timestamp. Errors do not echo private fields.
- `_routes.json` invokes the worker only for the exact calendar endpoint. Other paths remain static. Calendar responses set their own security headers because static `_headers` rules do not apply to worker responses.
- The existing Google Calendar link, wallpaper download, database schema and authentication flow are unchanged. The UI never claims an event was successfully added.
- Local Vite and production-test servers use the same handler through a Node bridge. They are not Cloudflare runtime emulators.

## Deployment

Cloudflare documents `_worker.js` support for dashboard drag-and-drop: https://developers.cloudflare.com/pages/get-started/direct-upload/#functions
Advanced mode: https://developers.cloudflare.com/pages/functions/advanced-mode/
Route scope: https://developers.cloudflare.com/pages/functions/routing/

Build normally on the Mac with its existing production environment. Upload the ENTIRE newly built `dist` folder to the existing Cloudflare Pages project, including `_worker.js`, `_routes.json`, `_headers` and `_redirects`. Uploading just `assets` will not work. No Supabase push, custom domain or Cloudflare Access signup is required by this change. This endpoint uses Pages Functions, so normal Cloudflare function quotas apply.

The patch ZIP is source code for the GitHub account, not a Cloudflare deployment ZIP. It contains no built site or environment files.

## Verification performed

- 58 unit/component tests, including 14 calendar-response checks.
- TypeScript, Vite production build and boundary audit.
- 4 Chromium first-loop/responsive scenarios; the full journey checks the real POST response and retains the app page.
- 2 production browser tests: calendar at 390px/1440px under deployed CSP, and existing wallpaper preview/download. Backend auth is mocked in these production tests.
- Event timestamps, duration, stable identity, line folding, escaping, invalid/cross-site/oversized submissions, inline/no-store headers and static fallback checked.
- Existing 116aab5 versions of all five modified files compared byte-for-byte with GitHub before preparing the patch.
- No hosted database checks, real iPhone Chrome checks, Cloudflare runtime checks or deployment performed here.

## Real iPhone Chrome acceptance

1. After deployment, open the public Earned Self production site in Chrome on the iPhone and refresh.
2. Open a saved, scheduled move, then its calendar screen. Note its date, time, time zone, location and selected duration.
3. Tap Apple Calendar. PASS only if an event preview opens with an Add action, without requiring the user to save a file and find it in Downloads/Files.
4. Confirm the event details and tap Add. Open Apple Calendar and check the event appears at the correct local time and duration. A device in another time zone can display a different clock time for the same instant.
5. Repeat with a different test move and cancel the preview. Return to Earned Self. It must remain usable and must not claim the cancelled event was added.
6. Check Google Calendar still opens its prefilled event. Changing a commitment does not automatically update an event already added to either calendar.

If Chrome instead shows Download, a blank tab, or an error, report the iOS version, Chrome version and what appears. This candidate has NOT met the acceptance requirement. Do not substitute a webcal subscription or a manual file-download workflow without discussing it with the user.

## Rollback

Redeploy the previous complete Cloudflare deployment if needed. No database rollback is necessary. Preserve PR #2's unfinished-feature documentation and other pilot work.
