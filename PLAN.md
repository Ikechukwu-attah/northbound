# Northbound implementation plan

Source: the full NORTHBOUND_SPEC.md supplied on 14 October 2026.

## Working agreement

Implement **one phase at a time**. Check that phase, commit and publish it, then report the changes and provide a UI test checklist. **Wait for the user's test results and explicit go-ahead before the next phase.** Ask before deleting a large system. Keep existing guest saves and the current public, no-sign-in experience unless a later approved phase changes it.

## Phase-to-system map

| Phase | Files and systems | Exit check |
| --- | --- | --- |
| 0 — Quick UI fixes (completed; leftovers included in Phase 1) | `components/game/Game.tsx`, `components/game/City.tsx`, `app/globals.css`; extract notification, keyboard and screen-label helpers; `lib/game/engine.ts` reward notifications; targeted regressions in `tests/` | Notifications never cover modal content and expire after ~4s; label collision handling protects the player tag; phone HUD defaults collapsed at 390px; each reward is visible; help matches available controls; WASD/arrows work after UI clicks. Publish and pause for the user's UI test. |
| 1 — Continuous Toronto (implemented; UI review pending) | New city geography/chunk/transit data and rendering modules; replace district scene assembly in `City.tsx`; extend `navigation.ts`, game state, server movement/location rules, Explore and Home controls; append save migrations if needed | Correct district geography, nearby chunk rendering and follow camera; walking/station-based travel consumes distance-based time; activities and home actions enforce location. Original scene retained as LegacyCity; old teleport command explicitly rejected. |
| 2 — Real-life systems (implemented; UI review pending) | New dated `config/economy.json`, calendar/opening-hour and weather configs, starting-path data, job/housing/payroll/bill/credit systems; `engine.ts`, API, state migrations, creation and finance screens | Research authoritative current values before coding; reconcile any stale/conflicting spec values explicitly. Four paths work; monthly rent/bills and fortnightly gross/net pay; all prices come from config. |
| 3 — District activities (not started) | New places/activities/NPC schedule and conversation data; city scene locations; activity requirements, errands/gigs and unlocks in engine/API/UI | At least 8 places and 20 activities per district; at least 25% depend on date/time/season; activities and conversations require proximity. |
| 4 — Multiplayer (not started) | Verify hosting/auth/realtime capabilities first; add compatible account, presence/chunk subscriptions, chat/friends/shared activity/housing/marketplace and moderation systems; offline guest storage and synchronization design | Two browsers see each other move; balances remain server-authoritative; block/report work. Keep guest mode. Discuss hosting or auth constraints before committing to unsupported technology. |

## Phase 0 implementation checks

- [x] Notifications queue individually, auto-dismiss after ~4 seconds, and render in normal layout inside an open modal.
- [x] Project labels into screen space, avoid overlaps, and reserve space around the player tag.
- [x] Player status, place details and minimap can collapse; all default collapsed on phones.
- [x] Every new milestone reward has a distinct server-returned notification; no duplicate payout.
- [x] Help describes the real district selector and context-dependent place actions.
- [x] Keyboard input works with button focus and uppercase letters; pauses in dialogs/text inputs; no sticky keys after blur.
- [x] Phase 0 TypeScript, build and targeted regression checks passed.
- [x] User reviewed Phase 0, supplied three leftovers, and explicitly authorized proceeding directly to Phase 1.

Automated browser QA is currently unavailable (the managed environment's required control-browser skill is absent). Do not claim a visual pass. Check pure layout/input logic and production build, then hand off the explicit 390px UI acceptance check to the user.

## Phase 0 review record

Implementation complete; publish for user review, then stop. No Phase 1–4 systems have been implemented in this pass.

- All 20 automated regressions passed (including the 7 new Phase 0 cases). TypeScript passed. The production build is the final packaging gate.
- Labels are projected to screen space; lower-priority labels move or hide when space is tight. The place selector remains available. The player tag has reserved space and a higher label layer.
- Notifications queue individually for four seconds each. Open dialogs keep them in a separate non-overlapping layout row above a scrollable body.
- Existing progress, no-sign-in guest access and current art are retained.
- **Awaiting user UI acceptance:** refresh at 390px; expand/collapse each HUD panel; open/scroll a modal and trigger an action; trigger an unearned milestone; rotate/zoom around labels; close a modal then use WASD/arrows.
- Still intentionally deferred: geography, continuous map, physical transit, real economy and calendar, location-gated actions, deeper life systems, expanded content, multiplayer.

## Phase 1 implementation contract — 14 October 2026

The user authorized fixing the three Phase 0 leftovers and proceeding directly to Phase 1. Stop after publishing Phase 1 for their UI test.

- Reserve visible HUD rectangles in label placement; wrap long names. Phone place/status panels open exclusively; use a compact custom place picker.
- Add `world.ts` for continuous compressed geography, sidewalk routing and deterministic chunks, and `transit.ts` for a connected, explicitly simplified TTC network.
- Preserve the original scene in `LegacyCity.tsx`, reuse its art primitives, and implement nearby chunks and a bounded follow camera in `City.tsx`.
- Migrate existing JSON saves in `engine.ts`; server owns journey paths, time, fares, arrivals and proximity. Block activities during travel and away from their place, including home, jobs and people.
- Add a geographic Explore map, stop selection, visible travel progress and previously visited destination travel. Bike access unlocks after exploring three districts.
- Verify migration, all-place reachability, transit connections/fares, interrupted journeys, off-site action rejection, chunk bounds, panel and label policies. Preserve existing guest identity checks.
- TTC adult tap fare $3.30, 120-minute transfers and 47 paid fares/calendar month verified at https://www.ttc.ca/Fares-and-passes on 14 October 2026. Service start/end vary by station: this game uses approximate 06:00–02:00 (Sunday 08:00–02:00), from https://www.ttc.ca/riding-the-ttc/Updates/Holiday-Service . Routes, waits, disruptions and durations are game estimates, not live TTC information. Detailed non-transit economics remain Phase 2.

## Phase 1 review record

Implementation is complete. Publish for UI review and **stop before Phase 2**.

- All 31 automated regressions pass, including every place-to-place / stop sidewalk connection, every stop-to-stop transit connection, legacy-save migration, fare transfers and calendar-month caps, refusal of early arrivals, interruption/reload, remote-action rejection, camera-area chunk bounds, panel exclusivity and HUD label exclusion.
- The continuous city renders at most 25 nearby chunks, follows the player, and caps the view to roughly two blocks at the default zoom. Existing art primitives are reused. Six district palettes, density differences, waterfront cliffs, parks, parking and river crossings distinguish the geography.
- Travel has a persisted server-authored path and timer. Completion or interruption charges distance-based game time. Only the server can complete arrivals. Station boarding, $3.30 fares, transfers, fare caps and occasional simulated shuttle delays are enforced server-side. Fast travel unlocks per visited place and includes access walking and travel time. A community loan bicycle unlocks after three districts.
- Work, applications, home actions, activities, community meals and conversations enforce proximity. Menus route the user to the place when away.
- Three leftovers addressed: visible HUD rectangles reserve label space; long labels wrap; mobile status/place panels open exclusively; Find a place uses compact custom buttons rather than the oversized native dropdown.
- Guest identities, progress and public no-sign-in access are preserved. Existing state migrates to the correct world entrance. The original diorama remains in source for reference; no large legacy system was deleted.
- Verification limit: the required control-browser skill is unavailable in this managed environment. No browser visual/performance pass is claimed. Production build is the remaining packaging gate.

### User UI acceptance checklist

1. Desktop: visit North York Central Library; expand the right HUD. Read the complete visible label, or use the always-available place picker when the viewport is crowded. Labels must not overlap HUD panels or the player tag.
2. At 390px: expand place details, then character status, then place details. Only one stays expanded. Find a place text must match the compact UI scale.
3. Hide panels and zoom out: only the nearby streets are visible. Walk with taps and WASD; rotate, reload and confirm the saved position. Interrupt a walk and check position/time.
4. Use Explore to walk to a TTC stop, ride to North York Centre, visit the library, then travel via Union to Harbourfront. Check walking, waiting, fare and game-time changes; inspect all six district environments.
5. Try Home/Work/People away from their locations; actual actions remain unavailable until arrival. Reload during and after a journey; the trip/save should resume correctly.

Remaining phases: real-life economics, starting paths and long-term progression (2); expanded activities/schedules (3); multiplayer (4). None implemented in this pass.

## Phase 2 authorization and implementation plan — 14 October 2026

User reviewed Phase 1, requested six fixes plus a complete character upgrade, and explicitly authorized proceeding directly into Phase 2. Publish the completed phase for review and stop before Phase 3.

1. Fix block density (`City.tsx` / new block assets), Line 1 U and Line 4 (`transit.ts`), use an onboard scene instead of camera gliding, refresh destination details on arrival (`Game.tsx`), and move desktop movement controls clear of navigation.
2. Add locally hosted, licensed rigged glTF humans, skeletal clip animation, saved character creation choices, seasonal/weather accessories, close camera range, varied crowd routines and a phone render cap/LOD (`Human.tsx`, `characters.ts`, `public/characters`).
3. Add dated `config/economy.json` (verified facts distinguished from representative simulation prices), calendar/hours/weather, four data-driven starting paths, document errands, job applications/interviews/schedules, fortnightly pay stubs, monthly housing/bills, credit/debt/taxes and events. Migrate prior guest saves without erasing earned money or identity.
4. Needs become human-readable states with consequences at exhaustion, hunger and urgent comfort; preserve recovery paths. Skill training takes repeated sessions over weeks.
5. Check regression routes, new state migration, every starting path, payroll/tax deductions, bills and rent boundaries, location/hours requirements, exhaustion and recovery, glTF bones/animations and bounded crowds. Browser QA remains unavailable unless the managed control-browser skill becomes available.

Sites skill permits bounded asset/research delegation: asset acquisition/license inspection and authoritative economy/transit verification are delegated. Application changes and publication remain owned by the primary agent.

## Phase 2 review record

Implemented the six review fixes and character upgrade together with Phase 2. Publish this version and stop before Phase 3 for the user's UI acceptance.

- Added deterministic filler houses, shops, towers and parks; Line 1 now follows both arms of its U, and all five Line 4 stations connect through Sheppard–Yonge. Kensington uses a University-side stop in this compressed map. Transit swaps into a train interior; city/player name labels do not float above rooftops during a ride. Arrival resets place details. Desktop Walk/Bike sits alongside camera controls, clear of the bottom bar.
- Locally hosted Quaternius CC0 rigged glTF humans replace player and nearby NPC primitives. Eleven everyday action states use skeletal clips, including seven newly authored clips. Creator stores skin, face, hair, colour, body, height and outfit. Weather layers and rain/snow visuals follow the calendar. Nearby pedestrians route along sidewalks to stops and building doors, with randomized appearances; distant crowds are instanced. Crowd budgets are 12 on phones / 24 desktop at high quality, fewer at night and lower quality, plus named characters.
- Four starting paths, simulated document errands, hourly jobs, applications/replies/interviews, attendance penalties, fortnightly net pay and itemized stubs; monthly rent/bills, housing viewings/applications, credit, taxes, tuition and life events. Published wage, fare and tax parameters are separated from representative game rents/prices in dated config. No real personal documents are collected.
- Exhaustion slows walking and blocks cycling/work/study. Hunger and urgent bathroom needs block concentration; bathroom urgency affects hygiene and mood. Rest, home recovery and community meals remain available. Skills take repeated hours over game weeks.
- Existing version 1/2 guest saves migrate without resetting earned cash, skills, position or achievements. Public no-sign-in access remains unchanged.
- Validation: all 43 automated regressions passed, covering route connectivity, input/label policies, identity, migration, starting paths, paydays, deduction caps, month-end billing, applications, attendance, housing, needs, calendar, crowd caps and glTF skeleton/clip presence. TypeScript passed. Character asset task also loaded every track and sampled animated skeleton matrices. Production build is the packaging gate.
- Verification limit: no supported browser QA tool is available here; visual appearance, phone frame rate and gesture behavior require the user's review. No browser visual/performance pass is claimed.

### Phase 2 UI acceptance

1. Existing save: reload, open Settings → edit appearance, change hair/body/clothes, save and reload. New guest/private window: try the full creator and a starting path.
2. Inspect streets on desktop and phone; zoom close to the player. Check walking, crowds, faces, labels and Walk/Bike visibility.
3. Ride Line 1's University side and Line 4; inspect the onboard scene. On arrival, check the right panel shows a nearby place without reloading.
4. Use My life → Work/Home/Money/Settle in/Learning. Attend a scheduled shift; wages accrue until payday. Inspect deductions, rent, bills and application replies.
5. At low needs, confirm work/cycling restrictions and slower walking; recover with sleep, food and a bathroom. On a phone, expand status and place details in turn and verify only one remains open.

Phase 3 remains unstarted and requires the user's UI review and go-ahead.

## Road readability review fix — 14 October 2026

User requested a focused road/street/traffic overhaul after Phase 2. Phase 3 remains paused.

- Replaced identical road strips and independently rendered filler buildings with a deterministic instanced street-tile system (`roads.ts`, `RoadNetwork.tsx`). Named arterials have four or six narrow game-scale lanes, yellow centre lines and white lane dividers; local roads have two lanes. Downtown service laneways are narrow and unmarked. All carriageways remain narrower than their surrounding block interiors.
- Dark asphalt, raised pale curbs, concrete sidewalks, green verges, paved destination forecourts and occupied building/park/marked-parking interiors have distinct materials. Existing destination buildings and shoreline landmarks remain.
- Crosswalks, approach stop lines, curb ramps/tactile pads, coordinated arterial signals and octagonal local stop signs mark intersections. Street-name boards use a locally generated shared texture atlas. Queen, King and downtown Spadina have twin streetcar tracks; selected four-lane corridors have green cycle tracks.
- Instanced lamp posts, bins, hydrants, sidewalk trees and park benches supplement existing TTC poles and shelters. Filler building bodies, roofs and windows now share the road/prop instance batch instead of creating many individual meshes.
- Replaced the old unconstrained oscillating bus with bounded lane-following cars, red/white TTC buses and streetcars. Shared signal timing controls both the visible heads and vehicle decisions. Stop signs require a pause; junction reservations prevent simultaneous conflicting entry; queues keep a gap; player and visible crowd positions cause yielding. Vehicles are decorative local simulation, not live TTC traffic.
- Traffic caps: high-quality rush hour 18 phone / 36 desktop; midday 12 / 24; night 5 / 8. Low-quality mode further reduces daytime traffic. Static street geometry uses six batches (boxes, trees, stop signs, sign atlas, lights and traffic) plus existing destination/crowd rendering.
- All 52 automated checks and TypeScript pass. Nine road tests cover lane hierarchy, track/bike corridors, occupied blocks and instance bounds across six districts, mutually exclusive greens, lane placement, red-light stopping, pedestrian yielding, queues, stop signs and time/device traffic caps. A top-down projection of the actual tile data was inspected for road/block separation. This is not a browser visual/performance pass; supported browser QA remains unavailable. Production build is the final packaging gate.

UI review: inspect Queen/Spadina and Yonge/Bloor at default and close zoom; watch a full traffic-light cycle, walk across a zebra and confirm yielding; compare local streets with six-lane Eglinton/Sheppard; inspect parking stalls, laneways and block fill; check phone rotation/zoom/frame rate and low-quality mode. Publish this fix and await user feedback before Phase 3.
