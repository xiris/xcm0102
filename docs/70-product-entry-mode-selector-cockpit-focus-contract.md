# Product Entry Mode Selector and Cockpit Focus Contract

## Purpose

P19B fixes the visibility mismatch discovered after P19A: the new manager cockpit exists on `/head-to-head-lobby`, but the default `/` route still opens the legacy Match Lab stack with labels such as Tactical board and Live desk. A user loading the product naturally sees the old lab first and reasonably concludes the cockpit redesign did not land.

This slice makes the product entry route explicit and makes the cockpit workspace visibly focused instead of another all-at-once stack.

## Routes

- `/` becomes a product mode selector.
  - Primary action: Head-to-head manager cockpit at `/head-to-head-lobby`.
  - Secondary action: Single-player simulation lab at `/match-lab`.
- `/match-lab` preserves the existing Match Lab without changing simulation, replay, lobby-status, or authoritative-resume behavior.
- `/head-to-head-lobby` remains the multiplayer product cockpit route.

## Root Entry Requirements

The root route must not immediately render the old Match Lab form stack. It should show:

- title: `XCM0102 Manager Console`;
- primary card: `Head-to-head manager cockpit`;
- secondary card: `Single-player simulation lab`;
- explicit copy explaining that the lab is a sandbox and the cockpit is the product multiplayer loop;
- links to `/head-to-head-lobby` and `/match-lab`.

The root route must not expose Match Lab implementation labels such as `Live desk` or `Tactical board` in its initial render.

## Cockpit Focus Requirements

The head-to-head cockpit should display one dominant station at a time:

1. `Lobby desk`
2. `Team setup`
3. `Match controls`
4. `Report room`

The station selector is local browser state only. It must not call server mutation helpers, alter privacy/redaction rules, or change lobby transition semantics.

The cockpit must preserve stable station IDs and controls so browser smoke can still exercise the full create -> join -> save setup -> lock -> kickoff -> complete loop by switching stations.

## Non-Goals

- No auth changes.
- No rematch/restart/new-match controls.
- No real lineup editor inside private setup yet.
- No changes to simulation math or replay persistence.
- No route deletion for the existing Match Lab.

## Acceptance

- Root `/` shows the product mode selector and not the old lab stack.
- `/match-lab` shows the existing Match Lab.
- `/head-to-head-lobby` shows active station focus; inactive stations are not visually stacked as full panels.
- Existing multiplayer server flow and redaction behavior remain unchanged.
