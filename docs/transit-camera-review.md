# Transit camera and entry recovery

Home and transit dynamic imports now expose failures rather than leaving “Opening…” indefinitely. Scene downloads preload after city readiness, expire after 15 seconds, and can retry. Stale deployment assets allow one guarded refresh per two minutes. This does not clear the saved game.

Transit cameras have no rotation or free dragging. Cutaway zoom bounds depend on both viewport dimensions; inside zoom stays between the doors and faces an open gangway. Arrow controls shift the vehicle view at most two units along the car. The city camera retains its controls.

The subway has six 18-unit cars joined by five 2-unit gangways, with the third car playable. Tunnel/track/platform and surface street scenery extend 480 units. Camera limits keep end cabs outside cutaway framing; inside fog reaches full density before the far clip and before an end cab. Repeated furniture and scenery use instancing.

One platform-side resolver controls vehicle doors, platform scenery, station signs, exit rings, walking destinations, and the mirrored station platform. Island platforms use left doors, side platforms right doors; buses and streetcars use curb-side doors. Existing saves migrate walking destinations once. Station classifications are based on the TTC 2025 station design standard and TTC station pages:
- https://www.toronto.ca/legdocs/mmis/2025/ttc/bgrd/backgroundfile-256301.pdf
- https://www.ttc.ca/subway-stations/st-george-station
- https://www.ttc.ca/en/subway-stations/queen-station

Automated geometry checks cover 1440×900, 1024×768 and 390×844, narrow/wide zoom, both longitudinal pan limits, station/riding cameras, Line 1 Museum/Queen and Line 2 St George/Bathurst. Checks cover six cars/five open gangways, hidden end-cab bounding boxes, extended scenery, platform-side alignment and reachable exit targets. These are projection and gameplay tests, not a rendered visual certification. The managed test browser has WebGL disabled, so actual 3D review is still required on a WebGL-capable browser.
