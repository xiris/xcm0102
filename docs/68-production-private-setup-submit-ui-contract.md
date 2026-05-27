# Production Private Setup Submit UI Contract

## Purpose

P18Z intentionally wires the private setup submission transport into the product-facing `/head-to-head-lobby` route. Earlier slices proved hidden server storage, redaction, simultaneous reveal, and the thin Next/browser client boundary. This slice adds the first guarded product UI control for saving the selected local perspective's private setup draft.

## Scope

In scope:

- A browser flow helper that submits a private setup draft and refreshes the authoritative public lobby summary.
- A `Save setup draft` product control in the private setup station.
- Guarding that control behind existing setup/editability state from `createHeadToHeadPrivateSetupDraftControls`.
- Status/error copy that preserves server rejection messages.
- Updated readiness/persistence copy reflecting server-backed hidden drafts.
- A first manager-cockpit shell: hero copy plus section navigation for Lobby desk, Team setup, Match controls, and Report room.

Out of scope:

- Accounts, auth, permission enforcement, or claims that the browser perspective equals the signed-in manager.
- Real lineups, benches, set pieces, or full tactic payloads.
- Rematch/restart/new-match controls.
- Replacing the route with a full tab state machine in this slice.
- Copying CM0102 screens, assets, logos, or proprietary UI.

## Product Behavior

When a setup lobby is loaded and the selected local perspective side is assigned:

1. The private setup draft controls are editable.
2. The user can click `Save setup draft`.
3. The UI posts the current local draft to `/api/replay-sessions/:sessionId/private-setup` through the browser client flow.
4. The UI refreshes the public lobby summary after save.
5. The status copy confirms the selected manager's setup was saved to the server.
6. The copy reiterates opponent setup remains redacted until setup lock.

When setup is not editable or the side is unassigned:

- The save button is disabled.
- The existing disabled reason remains visible.
- Server-owned lock/kickoff/completion behavior remains unchanged.

## Privacy / Authority Rules

- Private setup is server-backed after save, but public summaries still redact pre-lock details.
- Readiness intent is saved with the private draft but does not gate setup lock.
- Setup lock remains controlled by the server-owned lobby transition guard.
- Until auth exists, local perspective is still browser-local and cannot imply account permissions.

## Interface Direction

P18Z also starts the interface pivot from stacked forms to a manager cockpit.

The route now presents a cockpit frame with station anchors:

- Lobby desk
- Team setup
- Match controls
- Report room

This is intentionally lightweight. It creates design direction and CSS hooks without prematurely building a full tab/router abstraction.

## Acceptance Criteria

- `submitHeadToHeadPrivateSetupDraftAndRefreshSummaryFromWeb` submits then refreshes.
- Submission failure preserves the original readable server error and does not refresh.
- Product route source imports/wires the submit flow intentionally.
- Product route renders manager cockpit station navigation.
- Product route contains `Save setup draft` and server-backed setup copy.
- Product route still avoids direct repository storage, browser storage, rematch, restart, and generic lobby mutation components.
- Mission runner includes the new submit flow and updated product/private setup tests.
- Full validation passes.
- Browser smoke proves save works before lock and no console errors appear.
