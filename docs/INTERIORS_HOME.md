# Interiors step 1: homes and player names

This change is stacked on `codex/phase4-multiplayer` so Claude's existing work is preserved. UI review is required before the next interiors step, following the project review workflow.

## Delivered
- Head-following names for nearby multiplayer avatars, including passing offsets and hidden/expired player visibility.
- A gold entry marker at the player's home; walk to the door to enter, and exit at that exact street entrance.
- Lazy-loaded home scene replacing the outdoor scene, with four housing layouts: room, basement, one-bedroom, two-bedroom.
- Original reusable low-poly furniture, instanced boxes/floors, and camera-facing wall cutaways. No third-party asset pack is bundled.
- Click/tap floor or use WASD to walk; furniture and walls share pathfinding footprints.
- Bed, stove, shower, toilet, sofa and laptop actions require physical arrival. Home-menu shortcuts are available only inside.
- Existing time, needs, pantry, resume and job eligibility rules remain authoritative. Interrupted and completed indoor walks advance time.
- Saved indoor position/movement, housing-change migration, and private/shared-household peer filtering.

## Validation
- Full automated suite: 130 passing tests. TypeScript passes.
- Ten interior tests cover every pair of interactive objects in every layout, collision, early-arrival rejection, interrupted movement, reloads, needs, failed actions, laptop eligibility, housing migration, and a home morning through physical object commands.
- Existing full-day engine tests at desktop/mobile viewport settings pass; these are logic checks, not visual browser playthroughs.
- Managed preview starts, but its browser reports `Error creating WebGL context.` before the world renders. Therefore rendered furniture, label overlap, mobile touch interaction, two-player name placement and frame rate remain unverified visually. Do not claim visual acceptance.

## UI review
1. Meet another player outdoors: verify their name follows their head.
2. Go home and use the gold door marker. Check enter/exit and exact street return.
3. Tap bed, toilet, stove, shower and sofa. Verify the player walks around furniture and the relevant needs/time change.
4. Use the laptop for resume/job actions; check that street home buttons cannot perform these remotely.
5. Reload indoors, rotate/zoom, and repeat at 390px width. Check name/object labels and controls do not obscure one another.
6. Repeat on upgraded housing tiers and, if applicable, with a shared-household player.

## Remaining requested sequence
2. Cafe/restaurant counter, payment, seating, eating, customers/staff and barista work.
3. Bus/streetcar boarding, fare reader, seats, moving city views, announcements, stop request and stop exit.
4. Subway station, gates, platform, train and carriage.
5. Bank/credit union queue, teller, ATM and advisor.
6. Interview reception, warehouse and retail workplace.
7. Library, Service Canada, grocery and clinic.

Scheduled interior NPCs/queues/opening hours belong to those public-interior steps. Buying custom furniture remains later. The complete wake/cook/streetcar/cafe acceptance journey is not implemented in this home-only release.
