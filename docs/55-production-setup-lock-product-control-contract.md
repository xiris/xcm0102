# Production Setup Lock Product Control Contract

## Purpose

P18N exposes the first product-facing setup-lock action after create/read/join. The server remains authoritative: a head-to-head setup lobby can move to `locked` only after both home and away managers are assigned. Kickoff and completion remain isolated from the smoke harness until later slices.

## Browser Routes

- `/head-to-head-lobby`
  - Can create a setup head-to-head lobby.
  - Can read an existing lobby by session ID.
  - Can join the away side during setup.
  - Can request `Lock setup` only through the product-specific setup-lock flow.
  - Does not expose `Kick off match` or `Complete match` controls.
- `/lobby-transition-harness`
  - Remains the controlled write-capable smoke route for the full transition sequence and invalid transition copy.
- `/lobby-fixtures`
  - Remains read-only and button-free.

## Server Readiness Contract

The repository transition contract rejects `setup -> locked` for head-to-head lobbies unless both managers are assigned:

- `ownership.mode === 'head_to_head'`
- `ownership.lobbyState === 'setup'`
- `nextState === 'locked'`
- `ownership.sides.home` exists
- `ownership.sides.away` exists

Exact rejection copy:

`Cannot lock setup until both managers are assigned`

The API helper preserves that copy as a 400 error body. The browser client then surfaces it as:

`Replay session request failed: Cannot lock setup until both managers are assigned`

## Browser Flow Contract

The product route uses:

- `lockHeadToHeadSetupAndRefreshSummaryFromWeb({ sessionId })`

The helper must:

1. Call `transitionReplaySessionLobbyStateFromWeb({ sessionId, lobbyState: 'locked' })`.
2. Fetch the refreshed lobby summary with `getReplaySessionSummaryFromWeb(sessionId)`.
3. Return the refreshed summary.
4. Preserve thrown transition errors unchanged.

The product route updates status copy:

- success: `Locked setup for lobby <sessionId>.`
- failure: exact thrown error plus `Setup lock failed.` status copy

## UI Guardrails

- `Lock setup` is visible in the product route, but disabled unless the current summary is in `setup` and both managers are assigned.
- `Kick off match` and `Complete match` are not rendered in the product route.
- The product route does not import `LobbyMutationControls`.
- The product route does not import the generic `applyReplaySessionLobbyTransitionFromWeb` helper; it uses the product-specific setup-lock flow.
- This slice does not add authentication, real invite permissions, websockets, persistence migration, private tactic setup, club selection, kickoff, or rematch.

## Audit Contract

Successful setup lock keeps the existing transition audit entry:

- `type: 'lobby_state_transitioned'`
- `fromLobbyState: 'setup'`
- `toLobbyState: 'locked'`

Failed readiness checks must not alter lobby state or append transition audit entries.

## Validation

P18N validation includes:

- Repository readiness rejection tests.
- API helper readiness rejection tests.
- Product setup-lock flow tests.
- Product route render/source guard tests.
- Full mission suite.
- Full Vitest suite.
- TypeScript typecheck.
- Next build.
- `git diff --check`.
- Browser smoke for `/head-to-head-lobby`, `/lobby-transition-harness`, and `/lobby-fixtures`.
