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

## Remaining items, in the requested order

1. TTC bus: review the available cabin and boarding flow, make it visibly accessible and ensure actual bus entry works. Train entry also needs user verification.
2. Crossings: pedestrians/player wait for signals and passing vehicles before crossing.
3. Street cars: research references online and replace box-like cars with recognizable passenger-car bodies and wheels, preserving mobile performance.
4. House interior enclosure: replace the open dollhouse appearance shown in `image(3).png` with an enclosed interior view that keeps furniture and interactions visible. Screenshot was inspected from the supplied local attachment.

Do not claim these four remaining items are implemented by the home-entrance change.
