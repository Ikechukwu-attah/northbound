# Pedestrian passing and roadside rest

Based on Claude's merged Phase 3 (`147e472`) and the pending TTC bus update (`34f1a0c`). No phase progression changes.

- Pedestrians choose a clear passing lane in advance. Opposing walkers yield at a pinch point; swept collision checks retain personal space.
- Sidewalk passing space expands toward blocks, with matching paving and crosswalk paint. Destination collision footprints no longer occupy empty sidewalk space.
- Instanced roadside bench bays keep the seat and occupant outside the through lanes.
- Rest is a saved approach journey, available even at zero energy. Recovery is granted after arrival; cancelling the approach grants no recovery. The seated pose persists across reloads, and walking starts from the seat.
- UI actions now say “Rest at a bench” / “Find a nearby bench”.

Validation: 101 automated tests pass, including opposing walkers passing a stationary player at three lane positions on shoreline/inland sidewalks, occupied-seat clearance, approach/departure from every destination, exhaustion recovery, cancellation, persistence, and existing Phase 2/3 rules. TypeScript and the production build are release checks.

Visual QA remains required: the connected browser failed to initialize; the managed preview browser reports “Error creating WebGL context”, including after reload. No successful desktop or phone 3D playthrough is claimed.

UI review: stop among pedestrians, confirm both directions pass, select My life → Find a nearby bench, watch the approach and seated pose, reload while seated, then walk away. Repeat at 390px and on the waterfront. Check the bench pose for both models and all heights.
