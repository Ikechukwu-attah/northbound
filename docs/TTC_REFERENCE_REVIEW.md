# TTC reference model review

Synced GitHub main at `dfcc8d5aadd7d02f11f30f98fcebdc49608d554c` before publication, preserving Claude's transit and café fixes. This branch updates the existing procedural low-poly models using the three supplied train interior, train/platform and bus interior references.

## Changes

- Subway cabins: red longitudinal seats with metal frames, silver rails and red grab loops, dark speckled flooring, sliding double doors, route boards, overhead lights and an open gangway.
- Bus cabins: red seating with forward-facing rear rows and priority side seats, yellow rails, driver partition, front PRESTO reader, window frames, vents and next-stop board. Streetcars share the modular cabin kit with an open gangway.
- Stations: silver/red train exterior, tiled platforms and columns, red trim, yellow tactile edge, tracks, lighting and directional signs. A stopped subway shows platform scenery; riding shows the tunnel. Surface vehicles show moving city scenery.
- Optional Inside view complements the default cutaway camera. The legacy automatic journey scene uses the same detailed cabin kit.
- Repeated fittings are instanced. Shared seat dimensions drive rendering and navigation; old saves stranded inside new furniture migrate to a safe aisle position without losing paid fares.

## Preserved interaction fixes

Claude's station and route expansion, tap-only transit prompts, visible interaction rings, mobile status layout, café fixes and paid-area transfers remain intact. Subway doors open automatically at the destination/transfer stop; stop requests apply to buses and streetcars. This supersedes the subway stop-request sequence in the older `INTERIORS_TRANSIT.md` review.

## Verification and review

154 automated tests, TypeScript and the production build pass after merging main. Tests cover the expanded cabin geometry, seat collision and navigation, save migration and the existing gameplay/fare regressions.

Managed browser QA stops at `Error creating WebGL context`. The appearance of the new models, Inside view camera, touch usability at 390px and phone performance still require visual review. No full browser playthrough is claimed.

Review subway, bus and streetcar rides in Cutaway and Inside view. Check seats, poles, doors and destination signs; tap/pay, sit/stand, ride and exit; repeat at 390px and reload an existing transit save. Banks and workplaces remain deferred until this interiors review is complete.
