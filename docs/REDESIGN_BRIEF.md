# Earned Self redesign and AI preparation brief

The approved visual design lives in the owner's Claude design canvas, "Earned Self App Redesign," with a design-system board and screens 1–9 in light and dark. Ask the owner to share it or export screenshots into `docs/design/`. This brief is the written contract. Where it and older docs disagree, this brief wins.

**Status (public-launch release):** sections 1–3 are implemented for every screen that exists today: tokens, fonts, dark mode, tab bar, Now, focus session, two-part check-in, Proof journal and tracker, milestone earned. Still to build: the AI preparation and data contract (section 4); the AI onboarding conversation and plan reveal; an effort choice at check-in, which needs a new stored field; the native Live Activity and haptics; and a full redesign of Plan detail, sign-in and settings, which currently inherit the new tokens but keep their older layouts.

Build the rest in small PRs, each passing CI, behind no feature flags visible to members.

## 1. Product rules (decided by the owner)

1. **Onboarding gathers what the AI needs.** It is a short guided conversation (tap answers plus free text, with voice where supported). The AI suggests a challenge unless the member brings one, then designs the milestones and every step.
2. **Plan changes happen only in onboarding.** "Change something" exists only on the plan reveal, before the member accepts. After acceptance there is no plan editing and no guided/self-guided choice: the AI adapts the plan from check-ins and explains each change in one sentence.
3. **Steps are scheduled inside check-in.**
   - Check-in has two parts: (1) result, effort and the member's own words; (2) schedule the next step.
   - The AI proposes the next step, a day and the reason. The member confirms the day and time, with "Add to my calendar" and "Tell me when it's ready" switches.
   - The **only** step scheduled elsewhere is the first step, right after the plan is accepted, using the same scheduling screen.
4. **The AI prepares each step before it is due** (the evening before, or at scheduling time if sooner), so Now always shows a prepared step.
5. **Now is for getting ready. Begin is for doing the step.**
   - **Now** shows the prepared step, Begin, and *Get ready*: Where, Bring, Done when. It also has a "Can't make it today?" link, which opens check-in with **Not yet** selected and then schedules the step again.
   - **Begin** opens *How it goes* (segments with times and instructions, plus one example and an alternative), then *Start the timer* opens the focus session.
6. **Now uses the illustrated experience card (direction A).** The full-width ivory Begin button sits inside the card with an ember ring. The halo has been replaced. Prepared session parts appear as chips; the focus session uses a segmented ember ring (direction B) when those parts exist, and a single ring otherwise.
7. **Proof is a journal.** At the top is a compact milestone tracker on ink: gold badge for earned milestones, dashed numbered circles for the ones ahead, plus steps and time totals. Below it, entries are grouped by week, newest first, each quoting the member's words with a result chip (Done = filled, Partly = tinted, Not yet = dashed outline). Earned milestones appear in the journal with a gold outline and badge. Filters: All, Milestones, Reflections. No streaks, scores or percentages.
8. **Milestone earned** is a full ink screen with the gold badge, the milestone in the member's terms, totals (steps, comebacks, time) and one reflection prompt.
9. **Vocabulary:** Challenge → Milestones → Steps → Proof. Tabs: Now, Plan, Proof. Remove "pursuit," "ambition" and "Basecamp" from the interface.

## 2. Visual system

Replace the four competing `:root` token blocks in `presentation.css` and `statement.css` with one token file. Delete overridden legacy rules as screens move over.

| Token | Light | Dark |
| --- | --- | --- |
| ground | `#F6F1E8` | `#0B1216` |
| card | `#FFFDF8` | `#141F26` |
| text | `#101A20` | `#F2EDE4` |
| body | `#3A4A52` | `#C9D3D7` |
| muted | `#5A6B73` | `#A9B6BC` |
| mineral / link | `#4E6672` | `#9FC0CE` |
| ember (fills, rings, progress) | `#FF5B36` | `#FF5B36` |
| ember text | `#B8401F` | `#FF8A6B` |
| gold (earned only, always on ink) | `#F0B44C` | `#F0B44C` |
| chip | `#E4E9EA` | `#22323B` |
| primary button | ink bg, ivory text, ember arrow | ivory bg, ink text |

- **Fonts:** self-host **Newsreader** (display; identity, milestones and page titles only) and **Figtree** (interface), both SIL Open Font License from Google Fonts. Add `woff2` files under `src/assets/fonts/` with `font-display: swap`. The CSP already allows `font-src 'self'`.
- **Type scale (rem from a 17px body):** display 34/30, title 22, body 17, label 15, caption 13.
- **Radius and spacing:** radius 10 / 16 / 24 / round; spacing 4-pt grid; 20px phone gutters.
- **Tab bar:** floating pill with Now / Plan / Proof, active tab filled.
- **Focus screens:** How it goes, Session and Milestone earned stay ink in both modes.

## 3. iOS-quality requirements

- **Text size:** rem units, so layouts grow with iPhone text size. Nothing clips at the largest accessibility size.
- **Dark mode:** `prefers-color-scheme` with the dark tokens. `theme-color` meta tags exist for both modes.
- **Safe areas:** `env(safe-area-inset-*)` for top and bottom spacing and the floating tab bar.
- **Session screen:** request a Screen Wake Lock while the timer runs, and release it on pause or exit.
- **Reduce Motion:** `prefers-reduced-motion` disables the Begin pulse and screen transitions.
- **Accessibility:**
  - Real buttons and links with labels, and 44pt minimum targets.
  - Progress paths announce "Milestone 1 of 4, earned."
  - Text contrast at least 4.5:1 in both modes. Results differ by shape, not color alone.
- **Home Screen app:** add a web app manifest with icons and an Apple touch icon. iPhone web push only works for Home Screen apps, so email is the dependable "your step is ready" channel until the native app.
- **Native app later:** Lock Screen Live Activity for the timer, and haptics on segment change and milestone earned.

## 4. AI preparation: architecture and data contract

- **Providers:** Meta Muse Spark 1.3 writes the step (text), and Muse Image Generation makes the step image. Both are called from the server behind one small adapter, so a provider can be swapped without touching the app.
- **Images:** the function generates the image once per step revision, in the Earned Self illustration style, and stores it in a private Supabase Storage bucket at `step-images/<uid>/<commitment>-<revision>.webp` (compressed to about 200 KB, 1200 px wide). The app shows it through a signed URL. When the image is not ready, or generation fails, the Now card uses the challenge's area illustration, so the card never shows a broken or odd picture. Add the project's storage origin (`https://vovmkiuxmtnedfosoxds.supabase.co`) to the CSP `img-src` when this ships.
- **Server-side only.** Use a Supabase Edge Function. The provider key is a Supabase secret, never a `VITE_` variable, and the browser never calls the AI provider directly.
- **Rate limits** per user and a daily cost ceiling. Log usage, but never log members' writing.
- **Validation:** the function validates AI output against the schema below before saving it. On failure it retries once, then marks the step "preparing" and tells the member honestly.
- **Records:** prepared content is saved as an immutable record linked to the scheduled step. Member answers are never rewritten by the AI.

Per prepared step:

```json
{
  "title": "Hill intervals: six climbs, steady breathing",
  "duration_minutes": 40,
  "why_today": "Builds climbing legs for Milestone 1.",
  "where": "A hill about 3 minutes to walk up, or a stairwell",
  "bring": ["Water", "Shoes with grip", "Phone for the timer"],
  "done_when": "Six climbs, or as many as you can safely do, and you note how they felt",
  "segments": [
    { "name": "Warm up", "minutes": 8, "instruction": "Easy walk on flat ground.", "cue": "Let your breathing settle." }
  ],
  "example": { "title": "The talk test", "levels": [["Too easy","Full sentences"],["Right here","Short phrases"],["Ease off","Can't speak"]] },
  "alternative": "No hill nearby? Three minutes of steady stairs counts the same.",
  "image": { "prompt": "Older hiker climbing a short grassy hill at dawn, watercolor-ink style", "alt": "A hiker climbing a short hill at dawn" }
}
```

**What the app reads today.** The Now card and the session timer already render a prepared step from `snapshot.prepared` (type `PreparedStep` in `src/data/types.ts`), matched to the step by `commitment_id` and `commitment_revision`:

```json
{ "commitment_id": "…", "commitment_revision": 1, "image_url": "https://…signed…", "image_alt": "A hiker climbing a short hill at dawn",
  "parts": [ { "label": "Warm up", "minutes": 8 }, { "label": "Six climbs", "minutes": 18 } ] }
```

`segments[].name` maps to `parts[].label`. `preparedStep()` drops empty or zero-minute parts and any image URL that isn't same-origin or `https://`. Until `es_read_state` returns `prepared`, the card shows the area illustration, no chips, and no "prepared for you" label.

After a check-in:

```json
{
  "adaptation": "Your next step will build calf strength, and next week stays at five climbs.",
  "next_step": { "title": "Leg strength, with calf work", "duration_minutes": 30, "reason": "Builds the calves that gave out today." },
  "suggested_day": { "date": "2026-11-12", "reason": "One rest day after today." }
}
```

Safety: physical plans must keep the "as many as you can safely do" framing, never push through pain, and recommend a professional when the member reports pain or injury.

## 5. Suggested PR order for the remaining work

1. ~~Token file, fonts, dark mode, safe areas and the floating tab bar.~~ Shipped.
2. ~~Now (prep) → How it goes → Session (with wake lock) → Check-in → Schedule next.~~ Shipped (without AI content).
3. ~~Proof journal with the milestone tracker, plus the Milestone earned screen.~~ Shipped.
4. Edge Function for AI preparation, plus scheduling persistence (new forward-only migration).
5. AI onboarding conversation and plan reveal.
6. Remaining screens: Plan detail, sign-in, settings, homepage. Then delete legacy CSS.
