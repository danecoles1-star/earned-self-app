# Hosted email setup and release

Project reference: vovmkiuxmtnedfosoxds.
Production app: https://earned-self.pages.dev.
These instructions are for the Supabase dashboard, not Terminal or the SQL Editor.

## Before pilots

The code change does not fix email delivery capacity. Supabase's default sender is restricted to project-team addresses and currently limited to two messages per hour projectwide. Use a verified sender with a custom SMTP provider for pilot signup and recovery. SMTP credentials belong only in Supabase settings, never in VITE variables, the repository or chat.

A website custom domain is not required for the app to keep running at pages.dev. The email provider may require a domain you control to verify its sender. No domain purchase or provider setup was performed in this package.

If you are still using the default sender, test only with an eligible team address and allow for the limit. A 60-second resend countdown in the app is not a guarantee the server will allow another email.

## Template changes

In Supabase, open this project, then Authentication > Emails > Templates.
Back up the current subject and HTML for these three templates before changing them.

| Dashboard template | Subject | File whose full HTML to paste |
| --- | --- | --- |
| Confirm sign up | Confirm your Earned Self account | email-templates/confirm-signup.html |
| Magic Link / Magic link or OTP | Your Earned Self sign-in code | email-templates/magic-link.html |
| Reset Password | Reset your Earned Self password | email-templates/reset-password.html |

Open each file as plain text in a code/text editor, select all its HTML, copy it, and replace the corresponding template body in Supabase. Do not copy a Terminal prompt or filename. Save each template.
Keep the literal template variable {{ .Token }} intact. Supabase substitutes the actual code. Do not put a sample code into the template.
Leave unrelated templates alone.

Keep email confirmation enabled. Keep email/password sign-in enabled. Do not enable anonymous sign-in or weaken database permissions.
Review the project's password policy; the app requires at least 12 characters for new passwords. Existing shorter passwords can still be used for login. No password policy is changed automatically.
The code accepts 6-10 digit codes, including the eight-digit setting shown earlier.

## URL configuration

Authentication > URL Configuration:
- Site URL should be the intended production app, https://earned-self.pages.dev.
- Retain https://earned-self.pages.dev/auth/callback as an allowed redirect for legacy links.
- Retain other deliberately used redirect URLs; do not delete them indiscriminately.
The new code flow stays on the requesting app page and does not need to open an email link.

## Release order

1. Integrate this package into GitHub and pass the tests.
2. Prepare custom SMTP, if needed, and verify the sender before inviting users.
3. Build the integrated source on the Mac with the existing production environment.
4. Deploy the built dist folder to Cloudflare Production and update the three Supabase templates during the same controlled release window.
5. Refresh the app before testing. An old open app still expects an email link, so do not leave old/new templates and clients mixed while onboarding pilots.
6. Run the checks below before inviting pilots. No migration or SQL script is needed for this update.
7. If rolling the frontend back, restore the prior email templates too. Do not delete accounts or reset data.

## Real-device acceptance

Use your own test accounts and keep passwords and codes out of screenshots, chat and logs.

1. Fresh visitor: create a vision, challenge and pending first step. Create an account with a new password, receive the signup code, enter it on the same app page. Expect Basecamp with the challenge and pending first step. No completed Proof should appear.
2. Existing member: log in with email/password. Expect their existing Basecamp data, with no repeated onboarding.
3. Existing magic-link-only member: choose Email me a code; verify; set a password. Sign out and confirm password login works.
4. Refresh/return in the same normal browser: expect Basecamp without another email. Private browsing can discard sessions and unsaved drafts when its session closes.
5. Forgot password: receive a recovery code, enter it, set a different password. Confirm the new password works and the old password no longer does.
6. Wrong/expired code: stay on verification with a clear error and retain the draft.
7. Interrupted account save: retain draft, Retry save, verify there is one challenge and one first step.
8. Check iPhone Chrome, Safari and desktop Chrome. Codes should be typed or autofilled in the original app tab; no browser switch is needed.
9. Separate account: confirm it cannot see the first account's data.

An unsaved draft created in an Incognito session cannot automatically appear in another browser. Return to the original tab while it remains open and complete sign-in there. This update prevents the email-link handoff from being required.

## Official references

https://supabase.com/docs/guides/auth/auth-email-templates
https://supabase.com/docs/guides/auth/auth-smtp
https://supabase.com/docs/guides/auth/auth-email-passwordless
https://supabase.com/docs/reference/javascript/auth-verifyotp
https://supabase.com/docs/guides/auth/sessions
