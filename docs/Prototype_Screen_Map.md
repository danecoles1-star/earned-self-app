# Prototype screen coverage

Numbers refer to the approved 60-screen map. Several screens are states within one route; they are not 60 separate URLs. This table distinguishes implementation from remaining service or illustration work.

| Screen | Prototype purpose | Implementation location | Status |
|---|---|---|---|
| 01 | Become You. | `/` | Implemented |
| 02 | What feels familiar? | `/start` | Implemented |
| 03 | Who will you become? | `/start` | Implemented |
| 04 | Where will you stretch? | `/start` | Implemented |
| 05 | Name your ambition. | `/start` | Implemented |
| 06 | Why this matters. | `/start` | Implemented |
| 07 | Make the ambition real. | `/start` | Implemented |
| 08 | What stands in the way? | `/start` | Implemented |
| 09 | Make your first move. | `/start` | Implemented |
| 10 | Give it your attention. | `/start` | Implemented |
| 11 | What actually happened? | `/start` | Implemented |
| 12 | You made a start. | `/start` | Implemented |
| 13 | Keep what you started. | `/auth` | Implemented |
| 14 | Check your email. | `/auth: sent state` | Implemented; mail artwork pending |
| 15 | Your link has expired. | `/auth/callback → /auth` | Error recovery; dedicated composition pending |
| 16 | Your ambition starts here. | `/import-first/:id` | Implemented |
| 17 | Support on your terms. | `/settings` | Implemented; reachable from member navigation |
| 18 | Start where you are. | `/plan/:id` | Implemented |
| 19 | What will it take? | `/plan/:id` | Implemented |
| 20 | What needs an answer? | `/plan/:id` | Implemented |
| 21 | Plan for the hard part. | `/plan/:id` | Implemented |
| 22 | Mark the turning points. | `/plan/:id` | Implemented |
| 23 | Choose your next move. | `/commitment/:id` | Implemented |
| 24 | Give it a place. | `/commitment/:id` | Implemented |
| 25 | Make room for it. | `/calendar/:id` | Event export implemented; calendar artwork pending |
| 26 | Finish in your calendar. | `/calendar/:id` | Apple event file only; subscription feed pending |
| 27 | Your time has changed. | `/commitment/:id → /calendar/:id` | Revision and manual export; auto-refresh pending |
| 28 | Ready to commit? | `/commitment/:id: review` | Implemented before calendar export |
| 29 | Your next move. | `/app` | Implemented; connected-path art pending |
| 30 | The bigger picture. | `/manage` | Implemented |
| 31 | This is your move. | `/focus/:id` | Implemented; shared corrected path asset |
| 32 | Tell it as it happened. | `/report/:id` | Implemented |
| 33 | This belongs in Proof. | `/proof/:id` | Implemented |
| 34 | Keep the record honest. | `/proof/:id: edit` | Implemented |
| 35 | Something got in the way. | `/report/:id: partial/not-yet` | Implemented |
| 36 | Choose your return. | `/commitment/:id: decision` | Implemented |
| 37 | Has this milestone changed? | `/history` | Existing milestone revision controls retained |
| 38 | You reached a turning point. | `/milestone-done/:id` | Implemented; shared path asset |
| 39 | See how far you have come. | `/proof` | History and events; dedicated composition pending |
| 40 | Make the ambition yours. | `/plan/:id and /history` | Existing versioned plan editing retained |
| 41 | Pause with purpose. | `/decision/:id` | Implemented |
| 42 | Begin from here. | `/decision/:id` | Implemented |
| 43 | Did you accomplish it? | `/decision/:id: completion` | Implemented |
| 44 | What do you know now? | `/decision/:id: reflection` | Implemented |
| 45 | You did the work. | `/app: completed` | Implemented with mountain art |
| 46 | This is your evidence. | `/proof` | Implemented |
| 47 | What is possible now? | `/app → /start` | Implemented; fresh blank ambition |
| 48 | Let it become part of you. | `/decision/:id: carry forward` | Reflection captured in completion |
| 49 | Take it with you. | `/wallpaper/:id` | Implemented as wording/options/preview/download states |
| 50 | Make it yours. | `/wallpaper/:id` | Implemented as wording/options/preview/download states |
| 51 | Words worth carrying. | `/wallpaper/:id` | Implemented as wording/options/preview/download states |
| 52 | Keep it in sight. | `/wallpaper/:id` | Implemented as wording/options/preview/download states |
| 53 | Set it on your phone. | `/wallpaper/:id` | Implemented as wording/options/preview/download states |
| 54 | Your Proof stays. | `/proof` | Implemented; book artwork pending |
| 55 | Find your own words. | `Shared Help control` | Context prompts and limited explicit examples |
| 56 | Help on your terms. | `/settings` | Implemented |
| 57 | Your words stay yours. | `/settings: data export` | Implemented; no public sharing |
| 58 | Your account. | `/settings` | Sign-out/export; email change and deletion pending |
| 59 | Not saved yet. | `Shared save state` | Implemented; persisted retry tested |
| 60 | Carry this further. | `No paid activation route` | Billing/entitlements pending; no simulated checkout |
