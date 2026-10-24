# Scarborough Busway and continuous train cutaway

Synced GitHub main b8727b9 before editing. Claude's banks branch was fetched but not merged or overwritten; this change is scoped to transit.

## Current route model

- 903 Kennedy Stn–Scarborough Express: Kennedy ↔ Scarborough Centre, shown as Scarborough Busway in the planner and exterior/interior destination signs.
- 38A Highland Creek: Kennedy ↔ Scarborough Centre ↔ Rouge Hill GO. Intermediate stops remain compressed to the game's selected-stop network. This route replaces the incorrect 116 Morningside continuation to Rouge Hill.
- Existing simulated travel-time calculations and estimated waits remain; these are not live TTC schedules.
- Current direction determines the destination sign. Older saved `scarborough` legs migrate to 903 or 38A without resetting fares or ride progress.

Verified on 2026-10-22 against TTC sources:

- https://www.ttc.ca/riding-the-ttc/Updates/Scarborough--Busway — opened September 30, 2026; 903 and 38 use the former Line 3 corridor.
- https://www.ttc.ca/about-the-ttc/projects-and-plans/Future-of-Line-3-Scarborough — opening date.
- https://www.ttc.ca/routes-and-schedules/38/1 — 38A Kennedy to Rouge Hill GO.
- https://www.ttc.ca/routes-and-schedules/38/0/16335 — destination sign via Scarborough Centre.
- https://www.ttc.ca/subway-stations/scarborough-centre-station — station fare-gate access.

## Boarding and terminal doors

- Bus trips starting at subway stations or Scarborough Centre enter through the station gate, then walk to the paid bus bay. The bus reader is not charged a second time.
- Existing active transfers and fare caps are honored at the gate.
- At a terminal, the renderer, status text and exit command share one automatic-door rule. Request buttons remain needed for ordinary street stops.
- Bus-to-subway transfers inside station paid areas skip a second gate. Exiting a station bus arrival requires walking out from the bay.
- Overnight replacement buses still board outside the closed station.

## Train cutaway

The subway cabin and platform train repeat in both directions past the cameras' far planes. The cabin has no end cap, and distant scenery fades into the background. Repeated furniture uses existing instanced batches. Interactions remain in the central carriage; this is visual continuity rather than an unbounded world or unlimited NPCs. Bus interiors stay finite.

## Review

1. Kennedy → Scarborough Centre: gate, bus bay, front door, seat/stand, automatic arrival doors, station exit.
2. Reverse within the transfer window: tap the gate for $0, board without another tap, automatic doors at Kennedy.
3. Scarborough Centre → Warden: bus-to-subway transfer within the paid area.
4. Rouge Hill GO → Scarborough Centre: 38A sign, onboard reader at the street stop, automatic doors at the terminal.
5. Broadview → Pape Ave at Cosburn Ave: gate at Broadview, request still needed at the ordinary street stop.
6. Rotate and zoom the subway cutaway and try Inside view: train and surrounding tunnel/platform should continue beyond view in both directions.

Visual acceptance remains pending while the managed browser cannot create a WebGL context. Automated coverage verifies both 903 directions, fares, timing, transfers, terminal/nonterminal doors, legacy-save migration, and bounded scenery extending beyond the supported camera range.
