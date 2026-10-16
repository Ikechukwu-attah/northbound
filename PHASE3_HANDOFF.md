# Phase 3 handoff for shared development

Base: `osm-hybrid-layer` at `61afaa5` (pulled before edits). Branch: `codex/phase3-district-activities`. Target the PR to `osm-hybrid-layer` so the diff contains only Phase 3. Claude continues Phase 2; this branch does not rewrite its road, waterfront, camera or collision-step changes.

## Ownership and integration points

New content/logic: `lib/game/district-content.ts`, `activities.ts`, `schedules.ts`, `config/activities.json`.
New UI: `DistrictActivities.tsx`, `NeighbourPanel.tsx`. New regressions: `tests/phase3.test.cjs`.

Small shared-file changes:

- `world.ts` appends community venues; `geo.ts` adds explicitly fictional approximate anchors.
- `engine.ts` initializes/migrates community state and dispatches community commands before life actions. The former static talk branch now lives in `activities.ts`.
- `navigation.ts`, `City.tsx`, `Crowds.tsx` share scheduled named-NPC positions. `advanceWalker` and existing Phase 2 collision policy are unchanged.
- `Game.tsx` adds the board entry points and scheduled People panel. `characters.ts` adds six deterministic appearance seeds. CSS additions are scoped to community classes.

If Claude changes any of these files, preserve both behavior sets and rerun `node --test --test-reporter=tap tests/*.test.cjs` and TypeScript. Do not restore the old static talk branch or separate NPC location lists. Fetch before merging; do not force-push another contributor's branch.

## Review status

94 automated tests and TypeScript pass. The production build is checked before publication. Browser QA is still outstanding: no supported browser capability is available here. `PLAN.md` contains the desktop/390px acceptance checklist. Keep Phase 4 paused for the user's UI review. The new locations, schedules, prices and stipends are fictional game content, not advertised real events.

## Citywide TTC follow-up — 16 October 2026

Branch `codex/ttc-citywide` starts from `codex/pedestrian-passing-rest` at `98249fd`, after pulling GitHub. Rest/pedestrian fixes and Claude's merged work are retained.

- Removed LegacyCity's duplicate box bus. Legacy and current district assets now share TTCBus.
- RoadNetwork's generic boxes render cars only. Buses and newly articulated streetcars use the shared merged/instanced TTC renderer in every district; two draw calls per transit type.
- `ttc-fleet.ts` is the common traffic factory. `ttc-streetcar.ts` supplies an original compact five-module model with bellows, rail wheels and pantograph. Reference: https://www.alstom.com/press-releases-news/2021/6/alstom-signs-contract-supply-60-new-flexity-streetcars-city-toronto . No third-party mesh is bundled.
- Transit journeys store an optional vehicleMode. Bus connections, night replacements and shuttles show the same exterior bus at boarding/in motion; subway trips keep the existing train scene. Mixed trips show one representative mode, not a scene for each transfer. Old in-progress saves derive a mode from their existing trip details.
- 105 automated checks pass, plus TypeScript. New regressions cover all six districts at desktop/phone quality/time budgets, geometry envelopes, bus/streetcar separation, old-renderer removal, bus connectors, subway/streetcar modes and night/shuttle replacements. Production build is required before publication.
- Visual review remains outstanding because the available preview browser cannot create a WebGL context. Check each district, Queen/King/Spadina streetcars, a bus connector and an overnight bus trip on desktop and at 390px.

Phase 4 remains unstarted. Its planned scope is multiplayer: nearby player presence, chat/friends, shared activities/housing/marketplace, moderation and server-authoritative state. Verify hosting/realtime support, guest/account identity and shared-time design before implementation; wait for the user's approval.
