# Home refinement and café review

Stacked on `codex/home-interiors`, after the user confirmed the first home interior worked. Stop for UI review before vehicle interiors.

## Home changes
- Real framed, hinged doors replace the interior floor patch. Entry markers also use upright door geometry.
- One context prompt at a time: selected/hovered furniture or the nearest usable object. Prompts stay within the viewport margins.
- Sleep lies on the bed; cooking faces the stove with arm motion; sofa relaxation sits; laptop work uses typing arm motion. Shower/toilet actions close the bathroom door and hide the occupant behind an opaque enclosure for privacy.
- Interior status/footer sits above the measured bottom navigation edge, including resize and phone layouts.
- Shared room contains only bed, desk and wardrobe. A hall leads to common kitchen, lounge and bathroom; housemates appear during waking hours. Basement, one-bedroom and two-bedroom retain private kitchens and enclosed bathrooms.
- Old layout saves return once to a safe interior entry position without resetting money, appearance, needs or skills.

## Café changes
- All existing café locations use the reusable interior, named menu board, counter, till, tables, chairs, staff and customer scene.
- Order at the counter, pay at the till, sit, then eat. Each stage is saved. No food reward before eating and no duplicate payment.
- Open 7:00–20:00. Peak visits have a small queue and elapsed queue time; the counter closes, but seated meals, rest, washrooms and exit remain usable.
- Unaffordable unpaid orders can be cancelled at the till. Leaving before eating refunds a paid order to avoid trapping the player or silently losing it.
- Café food and bathroom menu actions are replaced by physical interactions. Barista work uses the staff station at its assigned café with existing payroll/attendance rules.
- Public café occupants can see one another; homes retain household privacy. Indoor routes avoid reserved staff/queue footprints.

## Validation
140 automated tests pass, including all existing game tests and new layout migration, room separation, café routes, closed-hour entry, saved orders, payment, eating, refund, barista-work and public/private presence checks. TypeScript passes. Existing full-day desktop/390px tests exercise game logic and safe-area calculations, not rendered browser gameplay.

Managed preview starts, but the cloud browser reports `Error creating WebGL context.` and cannot render the scene. Visual desktop/phone inspection, animation polish and frame rate remain unverified. User review is still needed; do not describe visual acceptance as passed.

## Review route
1. Enter home, hover/tap furniture, rotate the camera and confirm only one object prompt is shown.
2. Sleep, cook, sit, type and use the bathroom. Confirm the bathroom door closes and the footer stays above navigation.
3. Review a shared-room lease and a self-contained housing tier.
4. Visit a café during opening hours: enter, order, pay, sit and eat. Reload between payment and eating to verify persistence.
5. Repeat at 390px; check the action card, menu board and footer readability.

Next after review: bus/streetcar boarding and riding; subway entrance/platform/train; bank/credit union; offices and workplaces. The complete streetcar-to-café journey is still pending vehicle interiors.
