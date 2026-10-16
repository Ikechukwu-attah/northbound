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
| 3 — District activities (implemented; UI review pending) | New places/activities/NPC schedule and conversation data; city scene locations; activity requirements, errands/gigs and unlocks in engine/API/UI | At least 8 places and 20 activities per district; at least 25% depend on date/time/season; activities and conversations require proximity. |
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

## OSM hybrid layer — 15 October 2026

User-approved mini-phase to run **before** the next road/building visual polish, so the visuals are built on a corrected layout. Decision: keep the compressed 24-unit render grid; use OpenStreetMap only as an **offline data source** for street names/order, district shapes, shoreline, parks, landmarks and TTC stations; and drive **simulated travel time, distance and transit leg times from real-world OSM distances** even though the visible map stays compressed. Full true-scale was rejected (it would collapse the walkable six-district design). This is a dual-coordinate model: compressed geometry for rendering and the sidewalk-connectivity grid; real `[lon,lat]` anchors for durations.

- `scripts/bake-osm.mjs` fetches real coordinates from Overpass (mirror-failover) for every TTC stop and game place, plus former-municipality centres, and writes `data/osm/geo.json` with per-feature OSM provenance and a `meta` block (source, license, `fetchedAt`). Ambiguous/oversized features (two GO stations; Rouge Park's Markham centroid) use documented real Scarborough/GO fallbacks. Re-runnable; no runtime network.
- `lib/game/geo.ts` loads the baked data and exposes `placeGeo`/`stopGeo`/`haversineMetres` + `OSM_ATTRIBUTION`. `engine.ts` now times walking, cycling and fast-travel access walks from real metres (80 m/min walk, 250 bike), preserving the energy-penalty ×2 and the compressed path for geometry/animation. `transit.ts` derives every line's leg times from real station distances (subway 480, bus 320, streetcar 230 m/min), keeping `times.length === stops.length − 1`. `roads.ts` adds the missing University Ave to the N–S arterials.
- Licensing: `data/osm/LICENSE` (full ODbL 1.0) + `data/osm/README.md`; "© OpenStreetMap contributors" added to the README and the in-game help/credits.
- Verification: TypeScript clean; **57 automated tests pass** (52 existing + 5 new in `tests/osm.test.cjs`: attribution/ODbL present, every place & stop has an in-bbox real coordinate, distances symmetric and geographically ordered, transit leg times derived from real distance, journeys scale with real distance). The strict engine range (NY library → Harbourfront 40–70 min) still holds. Production build passes; `geo.json` bundles and loads in the Workers runtime (a live fast-travel returned a real-distance-derived time). No browser visual pass (control-browser skill unavailable here).

Next: resume the road/building visual polish (charcoal asphalt + wear, Toronto building kit, rooftop/window variety, day-night cycle, remove ball-head crowds) on top of this corrected layout.

## Visual polish + district review + hybrid map — 15 October 2026

Visual polish: charcoal asphalt (`#565b5f`) with wear patches; a Toronto building kit (brick shopfronts, stone, blue-green glass towers, suburban slabs, Victorian houses, strip plazas) with rooftop/window variety and night-lit windows; a continuous day-night cycle (season-aware sunrise/sunset — 8 pm mid-October now reads as night); crowds are all rigged glTF humans (the blocky instanced "ball-head" proxies are gone).

District review: `roadAt` is now a gated arterial table — real arterials only where that street actually runs (no "King St E" in Scarborough / "King St W" in Mimico), everything else a narrow 2-lane residential street; crosswalks + lights on arterials only, stop signs on residential corners. Trip planner defaults the exit stop to the one nearest the destination. Fare is $0 only within two hours of a real paid tap (or at the monthly cap). Critical needs escalate — a few sustained hours of starvation/urgent bathroom make you unwell. Walk estimates show real OSM distance ("21 min · ≈1.6 km"). Pearson relabelled as Mississauga (outside Toronto).

Hybrid finish: the Explore map is redrawn from OSM — real former-municipality bboxes (5 of 6 from OSM relations; Old Toronto has no relation), the Lake Ontario shoreline built from real waterfront features (Humber Bay, the Bluffs), and real TTC stop positions, all on a real lon/lat projection. `scripts/bake-osm.mjs` now also bakes the real **arterial street names per district** (all named primary/secondary/trunk ways, bucketed into each district's real OSM bbox — which drops neighbouring Vaughan/Markham — and ranked by length); `roads.ts` draws its in-world street signs from that baked data, selecting each street by identity and placing it on the compressed grid (core downtown/crosstown streets stay fixed for the pinned tests). So Scarborough shows Lawrence/Kennedy/Brimley, Etobicoke's lakeside is Lake Shore Blvd W, East York shows O'Connor/Pape, etc. The compressed grid *geometry* (which street sits on which block) remains a stylised design decision — the one part OSM cannot infer — and attribution says exactly that.

Validation: TypeScript clean; **63 automated tests pass** (added `tests/review.test.cjs` ×5 and an OSM districts/shoreline test). Production build passes; server serves and the geo bake writes only on a complete fetch. No browser visual pass (control-browser skill unavailable).


## Twelve-item fix pass + Claude branch integration — 15 October 2026

Built on all three commits through `d9b460d` on `osm-hybrid-layer`; `main` was still `f33999f`. Both GitHub branches and the absence of open PRs were checked before reconciliation. Preserve that branch; deliver the combined work on a separate integration branch for review.

1. Shared walkable sidewalk/crossing/forecourt mesh excludes water, carriageways outside crossings, buildings and prop footprints. Player routes and all crowd steps use it. Sidewalk-clearance tests cover the whole compressed city; suburban porches and strip plazas were inset to preserve the corridor.
2. All visible people use the same glTF human renderer. No primitive far-crowd replacement. Preserve Claude's 8-phone/16-desktop visible crowd cap.
3. Capsule clearance, keep-right passing lanes and swept movement prevent actor/prop penetration; NPCs yield, and player arrival waits for the visual journey. Cancellation records the actually completed walk fraction. Shelters stand off the walking corridor.
4. Player movement follows connected sidewalk paths and marked crossings, including local street crossings. There is no direct point-to-point road crossing.
5. Player and Maya/Dev/Amina portraits render the actual shared Human component and appearance; named world characters use those exact presets. Player has a brighter ground ring.
6. One `travelEstimate` feeds place details, Explore, station access walks and the engine. Retain Claude's OSM-distance timing, including exhausted pace; fictional housing uses clearly described neighbourhood approximations. Actual street routes/headways remain a game simulation.
7. NOAA/Meeus solar calculations use Toronto coordinates, each game date and America/Toronto DST. Dawn/dusk blend to night, with lit windows and lamp pools. October 15 sunset validates near 18:33, civil dusk near 19:02.
8. Zero energy blocks further activity/travel until free rest; urgency blocks nonessential actions. Recovery remains reachable. Realistic open cafe/library/mall/community washrooms and TTC's listed stations expose bathroom actions. Retain Claude's sustained-need illness consequences.
9. Preserve the geographic OSM overview and real TTC positions. Correct compressed North York/York regions and keep the Allen/University branch east of Humber through York University/Vaughan.
10. Version 4 migration resets obsolete skills/training to the starting path once; keeps cash, appearance, story and in-progress paid journeys.
11. Home type is capitalized; home navigation says Go home. Five fictional housing listings have distinct map addresses; view/apply/move require arrival there and moving updates the home destination.
12. Place labels stay below the entire header and inside viewport insets, clear of the HUD/recovery banner.

Validation: 77 automated tests, including all prior Claude OSM/review checks plus 13 fix-pass checks, two full 24-hour engine-day scenarios with desktop/390px layout constraints, swept collision simulation and city-wide mesh clearance. Run TypeScript and production build before packaging. These are automated domain/layout checks, not a browser playthrough. Managed browser QA remains unavailable: visual portrait framing, moving-crowd appearance, gestures and frame rate still require UI testing. Phase 3 remains paused for user review.

### GitHub collaboration follow-up — 15 October 2026

Workflow agreed with the user: fetch GitHub before editing, inspect Claude Code's branches and open PRs, make fixes on a GitHub-based checkout, and push them back for shared review. Re-fetch before pushing and use a non-forced update guarded by the expected branch head. Keep changes on the existing draft PR until UI review; Phase 3 remains paused.

Started this pass from GitHub `codex/phase2-fix-pass` at `96e7313`, after fetching every branch and reading PR #1 and its discussion. `main` remained `f33999f`; Claude's `osm-hybrid-layer` remained `d9b460d`, already included in the PR. No newer Claude commits or review comments were present.

Found and fixed two movement stalls in the shared navigation layer:
- A frame spanning a turn checked the straight chord across a block. Movement now advances in small steps along the route and stops at the last collision-free step.
- A passing lane returned to the centre only when an obstacle was already alongside the actor. Lane selection now leaves clearance ahead and behind footprints so the return does not clip a building edge.

Regression coverage includes both turn directions, multiple frame increments, collision yielding during a long frame, and every ordered pair of the 43 places (1,806 routes) at the renderer's 60 ms frame cap. Before the fix, 422 of those routes stalled; after it, none stalled in the obstacle-only simulation. This does not certify crowd deadlock behaviour or browser frame rate.

Handoff: this follow-up is GitHub-only, as requested. The hosted game still contains the prior fix-pass version until separately deployed. Desktop and 390px browser playthroughs, visual character/portrait checks, moving crowds, lighting and phone performance remain outstanding. Automated tests are not a replacement for that UI review.

Follow-up validation: all 79 automated tests pass, TypeScript passes, production build passes, and `git diff --check` is clean. Re-fetched all GitHub branches immediately before push; the three heads above were unchanged.


## Phase 3 — district activities, 15 October 2026

User explicitly authorized Phase 3 while Claude Code continues Phase 2 fixes. Before editing, fetched all GitHub branches, created `codex/phase3-district-activities` from Claude's `osm-hybrid-layer` at `61afaa5`, and ran `git pull --ff-only` against that branch. Its Phase 2 changes are retained. Deliver this phase on its own branch/PR; do not overwrite the shared working branch.

- Added 18 fictional community venues on unique, walkable block footprints. Each district now has at least eight destinations; the activity board uses eight venues per district. Approximate neighbourhood coordinates extend the OSM travel system without claiming invented venues are OSM features.
- Added 120 activities (20 per district). Nine per district have explicit time/day/season constraints, above the 25% requirement. Costs and delivery stipends live in `config/activities.json`; programmes, schedules and prices are fictional simulation content.
- Server validates presence, opening hours through activity completion, calendar restrictions, funds, needs and unlocks. Different activities earn permanent district stamps. Three unlock workshops; six unlock hosting. Repeats are allowed on later game days without duplicate stamps.
- Six two-stop community errands enforce physical collection and delivery, a 36-hour deadline, one delivery per district/day and single payout. Active bags persist; expired bags can be released. No deposit or lost-money penalty.
- Nine named neighbours use the existing human/portrait system. Public schedules determine both scene presence and conversation location, respecting venue hours/holidays. Three conversation topics unlock with friendship; friendship grows at most once per person/day. Scheduled NPCs use the same collision-position list as the scene.
- New saves and existing version 4 saves receive a separately versioned community state; cash, skills, appearance, Phase 2 life rules and active journeys are preserved. No Phase 2 skill reset is retriggered.
- Entry points: Explore → District activities & errands, every place panel, and the primary button at new community venues. Board supports district, place, free and available-now filters. People shows appointment windows and matching portraits.

Validation: all 94 automated checks pass, including 11 Phase 3 tests covering all 120 activity executions, six errand payout flows, remote-action rejection, calendar/closing-time/needs/unlock gates, scheduled world positions, dialogue limits and old-save compatibility. All prior Claude tests, city-wide walkability and ordered-place-pair movement tests pass. TypeScript passes; production build is required before publication.

Browser QA remains unavailable because the managed environment lacks the required control-browser capability. No desktop or 390px browser playthrough is claimed. Phase 4 must wait for the user's Phase 3 UI test and explicit approval.

### Phase 3 UI acceptance

1. Desktop and 390px: open Explore → District activities & errands. Switch all six districts, filter by place/free/available now, and scroll to the last card. Check compact text and reachable buttons.
2. Find a new venue and walk there. Complete three different activities in one district; verify stamps and workshop unlock. Try a closed or out-of-season activity and check its explanation.
3. Collect a delivery at an exchange, reload, walk to its makers room and deliver. Confirm the stipend is paid once. Release an expired delivery without a penalty.
4. Open People. Visit Maya or a district host during their displayed schedule; check the matching 3D person and portrait, topic unlocks, and once-per-day friendship growth. Return outside the appointment window.
5. Reload an existing save and continue its money, skills and journey. Check new place labels and crowd performance while Claude's Phase 2 road and camera fixes remain present.
