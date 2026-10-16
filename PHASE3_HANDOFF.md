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
