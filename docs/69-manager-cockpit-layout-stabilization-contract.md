# Manager Cockpit Layout Stabilization Contract

## Purpose

P19A turns the product-facing `/head-to-head-lobby` route from a vertical card sequence into a clearer manager cockpit shell while preserving all server-owned head-to-head semantics.

The slice is layout/information architecture only. It must not change lobby transitions, private setup persistence rules, pre-lock redaction, auth assumptions, or rematch boundaries.

## Layout Contract

The product route should expose a two-column cockpit:

1. **Session rail**
   - Shows the current phase.
   - Shows the invite/session identity.
   - Shows home/away manager assignment.
   - Shows the next server-owned action.
   - Shows a status/error feed.
   - Is a summary and navigation rail, not a second mutation surface.

2. **Station workspace**
   - Contains the existing cockpit stations:
     - Lobby desk
     - Team setup
     - Match controls
     - Report room
   - Keeps the existing create/read/join/save/lock/kickoff/complete controls in their current authority boundaries.
   - Keeps private setup details redacted before setup lock and revealed only through the already-tested public summary contract after lock.

## UX Acceptance Criteria

- The page renders `Session rail` copy and a `Station workspace` region.
- The rail includes the phase, invite/session ID, home manager, away manager, and next action.
- The rail describes private setup state as hidden/server-owned without implying auth or permissions.
- The existing station anchors remain visible.
- The existing mutation controls remain in the station workspace, not duplicated in the rail.
- No rematch/restart/new-match controls appear.
- No generic lobby transition helper is introduced.
- Browser smoke can still exercise create -> join -> save private setup -> lock -> kickoff -> complete.

## Visual Direction

Use the existing dark football-operations palette with Linear-inspired discipline:

- near-black canvas;
- subtle translucent panels;
- precise borders;
- compact uppercase labels;
- restrained accent usage;
- dense scan-friendly rows.

This remains original UI. Do not copy Championship Manager screens, assets, logos, manual text, database content, or protected visual assets.

## Non-Goals

- No true tab state machine yet.
- No routing changes.
- No account/auth semantics.
- No match restart/rematch flow.
- No real lineup editor beyond the existing sample private setup controls.
