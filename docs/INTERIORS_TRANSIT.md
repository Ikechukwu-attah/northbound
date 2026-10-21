# Café corrections and playable transit review

Based on `codex/cafe-interiors` at `799e8bc40ff136331e85707f09d11402a9da677e`. Fetched all GitHub branches and pulled that branch before editing; fetched again before publication. No Claude branches were merged or overwritten.

## Delivered

- Dismissed café prompts stay dismissed until you leave the object's proximity or tap it again. Escape works even when focus is inside a prompt. Popups choose a HUD-safe position clear of the projected player and scroll on short screens.
- Café status derives from order, payment, seat and eating state. The player remains seated after the eating animation. A cashier stays at the register while serving, including an outstanding order after closing.
- Explore's normal TTC action enters the physical transit flow. Subway gate → platform wait and vehicle arrival → board → seat/standing rail → next-stop announcements → stop request → exit door → arrival station exit. Bus and streetcar flows board first and tap at their own reader. Transfers board the next mode individually; every surface boarding requires a reader tap without duplicating a journey's fare.
- Transit navigation is authoritative and saved, with obstacles for seats, poles, the driver and platform benches. Departure, movement completion, fare payment and exit conditions are server checked. Clock/needs advance per route segment; transfer and monthly fare-cap rules remain in use.
- Vehicle interiors have red seats, rails, a reader, a stop-request button, moving scenery, the player's actual human model and overhead name. All vehicle humans use sheltered clothing with no open umbrellas. Surface stop exteriors reuse the existing TTC fleet models. One lazy-loaded interior is mounted at a time; repetitive furniture uses instancing.
- The CN Tower's adjacent dome now fits inside its block. The player visibility overlay uses the rigged human model and renders above world geometry, independent of building type.

## Verification

149 automated tests pass, including all existing suites and nine new transit/café/layout regressions. TypeScript and the production build pass. Tests cover multi-line journeys, all three modes, fare transfer/cap/debt cases, early-arrival rejection, reloads, station gate barriers, navigation between interactive objects, popup geometry at 390px/1440px, café status progression and landmark footprint clearance.

The managed browser preview returned `Error creating WebGL context`. Visual playthrough, animation appearance, real phone performance, popup X/Escape interaction and tall-building occlusion therefore remain **unverified in browser QA**, despite the source fixes and logic checks. Do not label these visually accepted before the user tests them.

## Review sequence

1. Café: order, pay, sit, eat; close the prompt with X and Escape; rotate/zoom and test at 390px. Confirm status and cashier placement.
2. Subway: North York Centre → Sheppard–Yonge. Tap the gate, wait, board, sit or stand, enable announcements, request exit, use the vehicle door and walk out of the station.
3. Streetcar: Queen West → Queen; bus: Kennedy → Scarborough Centre. Tap the reader after boarding, try the seats, request stop and use the door. Repeat during rain.
4. Transfer: Queen West → Don Mills; check streetcar → Line 1 → Line 4, one initial eligible fare, and saved progress after reload.
5. Walk around St Andrew/CN Tower and behind tall buildings at North York Centre. Confirm clearance and human-shaped visibility overlay.

Previously unlocked **Fast travel** and old in-flight journeys retain their automatic compatibility scene. The primary TTC flow in Explore uses `mode: 'playable'`. Banks/credit unions and offices/workplaces are intentionally deferred to the next reviewed interiors stages.
