# Northbound — A Toronto Life

A browser-based, single-player 3D life simulation. Built with React, TypeScript, Three.js, React Three Fiber, Drei, Vinext, and Cloudflare D1.

## First edition

- Six stylized districts: Old Toronto, North York, Scarborough, Etobicoke, York and East York.
- Walkable low-poly scenes, orbit/pan/zoom controls, animated TTC-inspired red/white/black buses and a downtown streetcar.
- Character creation; jobs, study and promotions; six daily needs; housing and weekly rent; fictional neighbours; exploration and milestone rewards.
- Server-authoritative commands and D1 saves. Anonymous guests receive a random HttpOnly browser cookie; only its SHA-256 hash identifies their save in D1. Existing authenticated players retain their account-linked saves. No sign-in is required. Money is stored in integer cents. Optimistic revisions prevent concurrent tabs from applying an action against stale state. Names are character display names, not account identifiers.
- Game time advances through actions, and pauses between actions and while away. Fares, wages, rents, elapsed times and geography are simplified game values.
- Responsive touch controls, collapsible player status, a city-focus mode, accessible panels, and a lower-detail graphics option.

This release does not implement real-player multiplayer or a street-by-street recreation of Toronto.

## Development

Use the Sites runtime helpers in the Sites skill for installation, building and publishing. Preserve `.openai/hosting.json` and the existing project ID. Database migrations live in `drizzle/` and are applied by the publishing workflow.

- `node node_modules/typescript/bin/tsc --noEmit`
- `node --test tests/engine.test.cjs`
- `node <sites-plugin-root>/scripts/build-site.mjs`

The test suite exercises purchases, wages, promotions, needs, rent, recovery from debt, one-time milestone rewards, all-district pathfinding and a multi-day save/reload progression loop.

## Source guide

- `components/game/City.tsx`: procedural 3D world, characters, transit, camera and walking.
- `components/game/Game.tsx`: game interface and action requests.
- `lib/game/data.ts`: districts, locations, jobs and fictional residents.
- `lib/game/engine.ts`: authoritative game rules.
- `lib/game/navigation.ts`: walkable grid and obstacle-avoiding routes.
- `app/api/game/route.ts`: save and action endpoints scoped to the current guest or platform account.
- `db/schema.ts`: D1 save records, keyed by the platform user ID or a guest-secret hash.

## Verification limits

TypeScript, production build and gameplay tests are checked. Automated visual browser QA is unavailable in this environment; desktop and mobile presentation and live authenticated gameplay still need a hands-on pass.

## Map data

TTC station and place positions, the six former-municipality **district shapes**,
the **Lake Ontario shoreline** (including the Scarborough Bluffs and Humber Bay), and
all simulated **travel distances and times** are derived from **OpenStreetMap**. The
rendered streets, their on-map names, and the 3D buildings are a compressed, stylised
interpretation — **not** a literal OpenStreetMap street layout. Data is baked offline
by `scripts/bake-osm.mjs` into `data/osm/` and is used under the Open Database License
(ODbL) v1.0 (`data/osm/LICENSE`).

> © OpenStreetMap contributors — https://www.openstreetmap.org/copyright

## City references

- https://www.destinationtoronto.com/neighbourhoods/
- https://www.ttc.ca/

An independent fictional game, not affiliated with the City of Toronto, the TTC, or
the OpenStreetMap Foundation.
