# Phase 4 — shared city

Entry: **People → Shared city → Join shared city**. No sign-in is required.
Existing version-4 saves retain their money, career, needs and game clock.
Fictional neighbours remain available in the adjacent People tab.

## Delivered

- Opt-in nearby presence, public friend codes and existing rigged human avatars.
- Approximately two-second HTTP updates, route interpolation, 15-second stale-presence expiry, hidden-tab pause, request timeout and reconnect backoff. Up to 12 rendered visitors on desktop / 6 on phones. Visitors yield visually and cannot hard-block the local player's movement.
- Neighbourhood chat, mutual friend acceptance, bilateral blocking, recorded reports and message hiding after three distinct reports. No live moderation team or moderation dashboard is supplied.
- Two-player meetups at parks, cafés and libraries. Both players consent by hosting/joining and must be present, connected and able to act. The host completes a 10-game-minute social activity for both; one reward per UTC real-world day.
- One open grocery offer per seller. One portion is held in escrow, cancellation restores it, and purchase transfers game money and inventory atomically. Buyer must be at the market. Sellers can receive proceeds while offline.
- Friend-only shared apartments. Acceptance requires both players at the address. Rent is split on their existing personal billing dates; deposits remain unchanged. Either player can leave, even while private or blocked, restoring both original housing arrangements without generating refunds. Other bills remain individual.

## Architecture and coordination

React/Three.js client, same guest/account identity as `/api/game`, Cloudflare Worker HTTP route `/api/community`, D1 tables from migration `0001_absurd_iron_patriot.sql`. No additional external service or account is needed. This release uses HTTP polling, not a WebSocket service; it has not been load-tested as an MMO.

Public projections omit wallets, careers, journals, internal account IDs and cookie credentials. Position comes from saved journeys; API clients cannot submit arbitrary coordinates, balances or inventory to shared-city actions. Display names may match; public codes distinguish people.

Cross-player changes use a D1 transactional batch. Its first statement inserts a receipt only when all game revisions and resource versions match. Every subsequent write is gated on that receipt. Concurrent sales, replayed actions and regular `/api/game` save conflicts cannot partially debit or duplicate a portion. The client accepts only equal-or-newer save revisions. After uncertainty it reloads saved state rather than blindly replaying a purchase.

Personal clocks are deliberately separate. Invites expire after ten real minutes; rent and careers use each player's existing game clock. A shared housing guest's former lease is restored on leaving, including its original deposit and temporary-stay rules. Existing rent deadlines are retained so leaving cannot repeatedly defer bills.

GitHub base: `codex/ttc-citywide` (`e1f8c77`), above the existing stacked Phase 3 / TTC / pedestrian fixes. No Claude branch was overwritten or merged. The new D1 migration is additive; do not edit the original migration.

## Verification

- TypeScript check and production build passed.
- 118 automated tests passed: 105 existing tests and 13 new SQLite-backed multiplayer integration tests.
- New coverage includes consent, privacy, stale presence/reconnect, bilateral blocking, chat validation/cooldown/district scope, report deduplication, escrow cancellation, simultaneous buyers, revision conflicts, insufficient funds, meetup completion/expiry, shared lease acceptance/exit, deposit conservation and old-save preservation.
- Local D1 migration applied successfully.
- Browser QA is **not verified**. The managed browser could not create a WebGL context; desktop/390px layout, two-device visual synchronization and mobile frame rate still require human testing.

## UI review before the next phase

Use two separate browsers or devices (tabs in one browser share the same guest save).

1. Create or resume both lives, open People, join the shared city, and meet at the same address. Check cyan visitor rings, walking, sitting, cycling and appearance. Refresh one browser and verify save recovery. Leave the shared city and verify disappearance.
2. Copy one friend code to the other browser. Send and accept a request; exchange neighbourhood chat. Block, check disappearance on both sides, and unblock. Use a test message to check the report form.
3. Meet at an open park/café/library, host, join, then start together. Check both needs and clocks, and verify repeated completion is rejected.
4. Meet at a market, list one grocery portion, buy it from the other browser, and check both balances/pantries. Create another offer and cancel it to recover the portion.
5. With an apartment lease and accepted friendship, meet at the host's home. Invite/accept, inspect both rent shares, then leave and verify original rent/deposits.
6. Repeat People panel navigation at 390px, checking wrapped tabs, readable controls, scrolling, and that gameplay keys do not fire while typing.
