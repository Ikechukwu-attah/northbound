# Sequential player review

Base: GitHub main `a94b2ccb13256db3ec5efa0ff63491ca7b8c8388`, including Claude's transit review round 2 and Codex's production startup correction. The user requested these fixes one after another, with the established review between stages.

## First item: home entrance

- Replaced the standalone roadside door with a hinged door in the home facade, a frame, canopy, windows and a paved entrance path.
- A home destination is the landing in front of that door. Normal walking reaches the landing without automatically entering. Clicking the home door walks there and enters only on arrival; opening directly requires being within 0.65 units of the landing.
- Exiting returns to that landing. Roadside legacy saves stay outside and can walk to the door. Home paths join the existing sidewalk network and remain usable after cancellation/reload.
- Moved the rest bench beside the entrance path, sharing coordinates across rendering, navigation and saved seat migration.
- Fixed pedestrian passing look-ahead at corners so someone near the new turn cannot permanently block entry.

Review: approach home from the street, tap the facade door, watch the approach, enter and exit. Walk past home without tapping to confirm it does not automatically enter. Repeat at a rented listing, and stop/reload partway along the entrance path.

Browser visual acceptance remains pending: the managed browser reports `Error creating WebGL context`. Tests cover facade landing/paths at every home, delayed entry, cancellation, reload, exit and returning to the street. Production startup must also pass before publication.

## Second item: TTC bus boarding

- Pass the selected boarding stop to the authoritative command and validate proximity there; do not silently replace it with the nearest stop.
- Align the surface boarding target with the front curb-side door. The parked bus has an open doorway on arrival, a sidewalk approach, and a visible “Board bus” target.
- Preserve the bus cabin's red forward-facing seats, yellow rails, driver, PRESTO reader, request strip and moving city. Add the front windshield, steering wheel, instrument panel and driver screen. Door openings no longer contain a solid lower wall.
- A passenger can step back off before departure (including when unable to pay), return to the sidewalk or board again. Existing fares and transfers survive this without a duplicate charge.
- Keep the entire road edge outside the waiting area's walkable space. Old interior saves migrate away from newly blocked paths.

Review: choose Kennedy → Scarborough Centre, walk to Kennedy, enter the bus stop, tap the front door, tap PRESTO, choose a seat or stand, request the stop and exit. Try Inside view for the windshield/cabin, reload during the ride, and try stepping off before tapping. Also review the station → bus transfer. Browser visual review remains pending because the managed browser cannot create a WebGL context.

## Remaining items, in the requested order

1. Crossings: pedestrians/player wait for signals and passing vehicles before crossing.
2. Street cars: research references online and replace box-like cars with recognizable passenger-car bodies and wheels, preserving mobile performance.
3. House interior enclosure: replace the open dollhouse appearance shown in `image(3).png` with an enclosed interior view that keeps furniture and interactions visible. Screenshot was inspected from the supplied local attachment.

These three items remain pending the sequential player review.
