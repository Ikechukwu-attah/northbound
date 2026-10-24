# Configurable building interiors

`lib/game/building-layouts.ts` supplies shared layouts for offices, residences,
retail, groceries, libraries, clinics, warehouses, service centres and community
spaces. It also reuses the existing home, café and bank layouts.
`components/game/interiors/HomeKit.tsx` renders their furniture with instanced
geometry; only the current interior is mounted in the lazy-loaded scene.

Use `buildingLayout` with design props rather than copying a room:

```ts
buildingLayout({
  style: 'office',
  seed: 24, // stable colour variation for this address
  palette: { floor: '#b4b9b3', wall: '#e3e9e4', accent: '#386b72' },
  omit: ['plant'],
  extras: [{
    id: 'local-display', kind: 'shelf', x: 9, z: 5,
    width: 1.2, depth: 1.2,
  }],
});
```

An extra with an existing ID replaces that piece. Others are appended. Residence
designs accept `tier: 'room' | 'basement' | 'apartment' | 'two-bedroom'`. Layout
objects carry the same footprints used by indoor pathfinding. Add reachable
`use` coordinates and a supported `action` for interactive pieces; verify them
with `interiorPath` before shipping a customized layout. Design props are code
configuration, not unchecked player-provided geometry or actions.

`building-catalog.ts` resolves named places and deterministic street addresses.
Its street-building recipe matches `roads.ts`: a single address per rendered
building, including four separate houses in residential blocks. Facade doors,
paved approaches, navigation and exit positions share that catalog. Outdoor
parks, squares without buildings and shoreline scenery remain outdoor places.
The catalog is cached by cell; doors and paths are instanced and only the four
nearest door labels are displayed.

`interiors.ts` owns entry, save migration, interaction and exit. Named venues
retain their opening hours. Libraries, markets, service desks, interviews and
assigned workplaces reuse the existing progression and eligibility rules.
Visiting an unowned residence does not grant a lease or access to its pantry.
Housing listings still require a viewing before an application. Existing cafés,
banks and owned homes keep their specialized flows.

For review: enter from an **Enter …** door marker or a named place panel; tap
furniture to see its action; use **Walk to exit** to return to the same door.
On a moving bus or streetcar, the red **Request stop** control works from a seat
or while walking. Terminal destinations display automatic door-opening guidance.

Validation: `node --test tests/*.test.cjs` and TypeScript. The building suite checks
all 856 generated addresses within the playable grid, all named entrances,
furniture reachability, save/reload, return paths and stop requests. Rendered
desktop/mobile QA still requires a WebGL-capable browser.
