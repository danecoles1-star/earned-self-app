# Pilot review, October 1, 2026

Status: historical review notes. See `pilot-review/BUILD_NOTES.md` for the authorized implementation, verification and outstanding hosted/device checks. Nothing deployed from this workspace.

## Confirmed requirements
- Investigate identity mismatch: Basecamp renders goal.vision but user says original vision described climbing mountains into his 70s, while displayed value is Climb Kings Again! Trace saved data and recovery possibilities; do not assume cause or overwrite history.
- Subtle mineral challenge surface and restrained accent; current step remains primary on Basecamp.
- Dates MM/DD/YYYY and times 12-hour AM/PM throughout Basecamp, Plan, step forms and related summaries.
- One-time steps default. Explicit Repeat choice only; never infer recurrence from milestone dates or action text.
- Recurrence frequency/time/end configured by user. Separate occurrence completion, timer and check-in history; no automatic milestone completion.
- Readiness permits early milestone attempt after confirmation. Reflection follows attempted/completed milestone. Dates do not block readiness.
- On advancement ask whether to end remaining repetitions or carry routine forward; retain history.

## Screenshot review and proposed treatment
Sources: user supplied IMG_4230.jpg and Earned Self 2, 3, 4, 5.png.
1. Plan header: vision mismatch also visible here. Information exists but headings and large vertical spacing obscure hierarchy. Compact header; distinct challenge summary and separate identity line.
2. Milestone list: current/upcoming/completed lack visual distinction. Propose numbered vertical progression; current expanded with explicit Current label, readiness outcome and steps. Future milestones compact and expandable; completed history accessible. Use labels plus styling, not color alone. No percentage implying equivalent milestone effort.
3. Bottom management actions: plain rows obscure clickability. Propose bounded icon/label/chevron navigation rows and real Add step / Add milestone buttons. Relocate milestone action into relevant card. Keep calendar/wallpaper accessible with clearer labels. Avoid duplicate Basecamp/Proof links already in bottom navigation. Preserve all capabilities.
4. Add step: retain action and definition-of-done. Add explicit One-time / Repeat control, expose recurrence scheduling only if Repeat. For repeats label definition as Each session is done when. Show occurrence-level status such as Today’s check-in recorded, not series completion. Date/time formatting applies here too.

Limits: screenshot review only. No interaction, contrast measurement, keyboard/screen-reader verification or hosted data diagnosis performed. Proposed layout details pending user review.

## Scheduling screenshots 6–7: proposed details
- Same scheduling screen shown at top and bottom. Excess vertical spacing, blank date/time controls without visible affordances, faint helper copy, disabled Continue with no visible explanation.
- Proposed heading Make time for it. Preserve location question and shorten labels to Date, Time, Where.
- One-time / Repeat is selected on action-definition screen; scheduling shows that choice with Change, not a second independent choice. Repeating step completion definition applies per session.
- One-time: date/time/location. Repeat: start date, daily or chosen weekdays, time, end condition (on chosen date or until stopped). Do not use milestone date as automatic end.
- Show human-readable summary before Continue. Morning/evening routines can remain two separately tracked steps.
- Compact timezone row with understandable label and Change; preserve named timezone internally and keep recurring time consistent with that zone through daylight-saving changes.
- Visible MM/DD/YYYY date and AM/PM time controls with calendar/clock affordances; inspect device pickers during implementation rather than promise native picker format.
- Stronger helper contrast, less empty space, visible missing-field guidance for unavailable Continue; scrolling and keyboard must keep inputs/actions reachable above bottom navigation.

## Commitment review screenshot 8
- Review content is useful but lacks grouping and repeats raw ISO date / 24-hour time / technical timezone. Propose concise review card with Step, Milestone, Session complete when, Schedule, Where and Edit actions; retain Make it a commitment heading; primary Save step, or Save changes for edit.
- Screenshot shows Recommit with a revised plan plus What will change in this plan while adding a new step. Local Actions.tsx derives prior report from last evidence for entire goal and uses it to restrict continue option. Needs scoped investigation: do not force a new independent step into a previous action's recommitment/recovery flow. Preserve explicit revise/recommit paths and server requirements.
- User's session completion criterion is seeing improved flexibility week over week. Propose guidance distinguishing performing/recording the weekly assessment (session completion) from improved flexibility (milestone readiness). Never silently rewrite user text or make improvement mandatory to record honest effort.
- Repeat summary must show explicit user-selected frequency, start/end and timezone; do not infer weekly recurrence from action title.
- Screenshot does not show final save control; do not claim it is absent.

## User confirmation, 09:54 America/Denver
- User independently confirms the new-step/recommitment flow issue.
- Approved: session completion measures performing and recording the agreed action; milestone readiness evaluates the resulting progress. An honest completed assessment may show no improvement and still count as a completed step.
- Include separation of new-step creation from deliberate revision/recommitment in the collected fix scope. Root cause still needs end-to-end tracing before implementation.

## Scheduling and automatic Basecamp selection, 10:01 America/Denver
User correction supersedes the assistant's suggested Make next step / Add to plan split:
- Every step creation path, including Add Step from Basecamp, must ask for its planned date and time before saving a ready-to-act step. No detour through Plan to schedule it.
- Save places the step in the scheduled queue. Basecamp automatically surfaces the next step according to the user's schedule and shows upcoming work before it is due, with timer/check-in available from that card.
- No manual Make next step choice is required for ordinary scheduling. Recurring occurrences participate in the same queue.
- Implementation must preserve active timer/progress and unresolved past occurrences; do not silently overwrite, complete, or discard them when later steps become due. Exact overdue/tie behavior needs coherent implementation and verification.
- Audit all create-step entry points for equivalent action, completion criteria, scheduling, review, save and Basecamp selection behavior.

## Timer and step check-in screenshots 10–11, 10:10 America/Denver
- User confirms timer works when leaving app and returning on tested device. Preserve this behavior; no claim of cross-device sync or pause/refresh coverage beyond report.
- Timer screenshot: ink focus card and visible Pause timer are strong. Check-in is only a small upper-corner link. Propose adjacent Finish session action near Pause/Resume; opens check-in and pauses time without marking work complete. Preserve direct check-in for work done without timer.
- Check-in screenshot: honest Done / Partly / Did not happen choices retained. Proposed short action/session date context so repeated occurrences are distinguishable. Status is per occurrence, not full recurrence or milestone.
- Propose warmer subtitle What did this step teach you? and short factual prompt Tell us what you did or what got in the way. Keep required meaningful input concise; do not make required preparation/reflection skippable.
- Readiness question is currently open-ended every session. Propose compact readiness choice (Keep preparing / Ready to review my milestone), with brief follow-up as needed; defer major milestone reflection to milestone flow. This is a proposal awaiting user approval, not implemented.
- Save check-in persists report once, then returns to next scheduled action. Readiness review remains explicit and cannot auto-complete milestone. Keep time attached to correct occurrence, including repeated sessions.
- Date/time format updates apply. Verify safe-area scrolling and bottom-nav clearance; screenshots alone do not prove controls absent or inaccessible.

## User approval and additional findings, 10:20 America/Denver
- User approves quick readiness choices replacing per-step written readiness question; retain honest outcome and concise factual account.
- Apply consistent recognizable secondary button treatment to Why & obstacles, Review milestone, Add milestone and Step check-in. Keep hierarchy; not all actions primary.
- Replace tiny Take your vision with you link with visual wallpaper card/phone preview and explicit Create wallpaper action.
- User reports wallpaper choices unattractive and some broken, and Files-first download flow poor. Inspect actual wallpaper screen/choices and reproduce failures before specifying asset fixes. Desired mobile outcome is save image to Photos without Files detour.
- Proposed mobile export: generate image file and use native file share sheet where supported; test actual Save Image availability on iPhone Chrome and Safari. Web app cannot silently save to Photos or select system target. Full-size image preview with device-supported save interaction as fallback; keep download secondary for unsupported/desktop. Do not promise no-Files success until real-device test; cancellation must not trigger download or false success.
- Calendar screenshot IMG_4239.PNG: only exit says Continue without adding even after calendar handoff. Replace with always-available neutral Return to Basecamp button (or destination-accurate Continue). Do not infer event added merely from provider click/return/file generation. Preserve calendar options, duration, existing Apple .ics fallback and manual-confirmation caveat. Recurring calendar export needs same explicit recurrence/timezone/end condition as app.
- Calendar date/time and button styling included in global update. No live changes made.

## Wallpaper screenshots 12–13, 10:29 America/Denver
- User confirms Mineral turns nearly white while keeping dark rectangular steps artwork; screenshot shows visible hard image boundary, tiny centered words and oversized checkbox rows.
- Requested direction: use existing approved mountain graphic instead of steps for illustrated wallpaper, plus plain subtle textures in brand colors. Minimal composition, no added scenery/clutter.
- Propose visual thumbnail style selector: Mountain, Ink texture, Mineral texture, light brand-neutral texture. Mineral must use actual brand mineral, not near-white canvas. Texture choices contain no forced steps/mountain graphic.
- Full-bleed coherent artwork/background; no pasted rectangular image boundary. Reuse approved mountain source, preserve proportion/quality, blend into compatible background. Inspect both preview and exported image at target phone dimensions.
- Improve text scale/line wrapping and clock/widget/bottom-control breathing room; accurate small optional brand mark. Retain editable words and reason/date/brand toggles but compact controls; avoid hidden export CTA beneath fixed nav.
- Wallpaper vision source participates in existing identity mismatch investigation; never substitute challenge for identity or silently rewrite wording.
- New visual concepts not generated or implemented in this screenshot review. User requested mountain/texture direction; exact options need visual review during implementation.

## Proof screenshots 14–15, 10:36 America/Denver
- Screenshot observations: Proof index has large introductory/header copy, large challenge heading, blank Who I am becoming label, uniformly styled Done/Did not happen entries, and unpadded numeric dates. Detail has large generic heading, result, step/done definition and user's account, tiny View history/correction links, and Choose what comes next CTA when opened from historical Proof.
- Proposed review direction (pending user approval): compact Your Proof heading with short identity-centered subtitle; compact challenge grouping/filter; dated, clearly tappable cards with explicit Step check-in versus Milestone reflection labels and distinct factual result badges. Preserve attempts/missed sessions without presenting them as completed achievements. No invented growth claims, inferred identity, or artificial score/streak.
- Blank vision: hide empty label and investigate legacy missing data separately from known overwritten/mismatched vision; do not fill with challenge text or invent identity. First screenshot contains essay/practice entries; ask user whether these are their earlier test records before classifying as fixture leakage or deleting anything.
- Detail proposed hierarchy: Back to Proof, step title, challenge/milestone context, actual recorded date/time and result, What happened (user's words), reflection/readiness where recorded, and recorded focus time if available. Show completion criterion as secondary detail. Preserve original user wording/history and avoid relabeling a step check-in as milestone reflection.
- Historical entry main action should Return to Basecamp, not prompt creation/choice of a new action; retain next-action flow only when appropriate after a fresh check-in and coordinate with automatic scheduled queue. Turn View history and Add reflection or correct this entry into clear secondary controls, preserving revision history.
- Apply MM/DD/YYYY and AM/PM presentation. For recurring steps, each session remains its own dated record; avoid counting series as completed because one session is done. Screenshot-only review; no implementation/deployment or claim about clicked CTA behavior.

## Unexpected Proof records: user confirmation, 10:42 America/Denver
- User explicitly did not create the essay entries in screenshots 14–15 and believes they came from an earlier example version. Treat these as unexpected records requiring investigation, not legitimate user-created history. Earlier-example origin is plausible but unconfirmed.
- Targeted search of local src, supabase and scripts found no exact displayed essay strings. A database test contains a generic opening-paragraph action; this does not establish source or hosted contamination.
- Before pilots: trace displayed record IDs, account ownership, hosted versus local source, legacy seed/import behavior and authentication/draft synchronization. Confirm new accounts start without fabricated Proof and real records remain account-isolated.
- Fix the insertion/import path if present and remove only positively identified example records through a scoped, reviewable cleanup. Preserve genuine progress, check-ins and revision history. Do not purge by vague text matching or hide all older entries; no hosted data has been changed.
