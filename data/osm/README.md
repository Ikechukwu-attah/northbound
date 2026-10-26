# OpenStreetMap-derived data

This folder holds geographic data **derived from OpenStreetMap** and baked offline
by [`scripts/bake-osm.mjs`](../../scripts/bake-osm.mjs). The game renders a
*compressed, stylised* map, but it uses these **real-world coordinates** to drive
simulated travel time, distances and transit leg times (fares are a flat value).

## Attribution

> © OpenStreetMap contributors

Map data from [OpenStreetMap](https://www.openstreetmap.org/copyright), available
under the **Open Database License (ODbL) v1.0** — see [`LICENSE`](./LICENSE).

- The rendered game is a *Produced Work*: it credits OpenStreetMap in-game and here.
- `geo.json` is a *Derived Database*. If distributed, it remains available under ODbL.

## Files

- `LICENSE` — full ODbL 1.0 text.
- `scarborough.json` — eight additional mall/campus anchors with OSM IDs, real coordinates and separately curated compressed game cells. Refresh using `node scripts/bake-scarborough.mjs`.
- `geo.json` — baked output: real `[lon, lat]` for every TTC stop and game place,
  former-municipality centres/bboxes, with per-feature OSM provenance and a
  `meta` block (source endpoint, license, `fetchedAt`).

## Regenerating

```
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
node scripts/bake-osm.mjs
```

Overpass mirrors are rate-limited and occasionally return 5xx; the script retries
across mirrors. Coordinates are a point-in-time snapshot of OSM; re-running may
shift a point by metres as OSM is edited.
