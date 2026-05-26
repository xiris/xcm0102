# Production Product Kickoff Control Contract

## Purpose

P18O exposes the first product-facing match-start action on `/head-to-head-lobby`. A head-to-head lobby can now move through create, away join, setup lock, and kickoff without exposing match completion or rematch. The server still owns the lobby-state transition contract.

## Browser Routes

- `/head-to-head-lobby`
  - Can create a setup head-to-head lobby.
  - Can read an existing lobby by session ID.
  - Can join the away side during setup.
  - Can lock setup once both managers are assigned.
  - Can request `Kick off match` once the current server summary is `locked`.
  - Does not expose `Complete match` or rematch controls.
- `/lobby-transition-harness`
  - Remains the controlled smoke route for full transition sequences and invalid-transition copy.
- `/lobby-fixtures`
  - Remains read-only and button-free.

## Browser Flow Contract

The product route uses:

- `kickOffHeadToHeadMatchAndRefreshSummaryFromWeb({ sessionId })`

The helper must:

1. Call `transitionReplaySessionLobbyStateFromWeb({ sessionId, lobbyState: 'in_match' })`.
2. Fetch the refreshed lobby summary with `getReplaySessionSummaryFromWeb(sessionId)`.
3. Return the refreshed summary.
4. Preserve thrown transition errors unchanged.

Premature kickoff rejection copy is preserved from the existing server transition contract. For a setup lobby, the browser-facing error remains:

`Replay session request failed: Invalid replay session lobby transition: setup -> in_match`

## Product Route Status Copy

- Before lock: `Lock setup before kicking off the match.`
- Ready: `Setup is locked. Kick off when both managers are ready to start.`
- Pending: `Kicking off match for lobby <sessionId>...`
- Success: `Kicked off match for lobby <sessionId>.`
- Failure status: `Kickoff failed.` plus the exact thrown error copy.

## UI Guardrails

- `Kick off match` is visible on `/head-to-head-lobby`, but disabled unless the current summary is `locked`.
- `Lock setup` remains visible, but disabled after the lobby leaves `setup`.
- `Complete match` is not rendered on the product route.
- The product route does not import `LobbyMutationControls`.
- The product route does not import the generic `applyReplaySessionLobbyTransitionFromWeb` helper.
- This slice does not add authentication, real invite permissions, websockets, persistence migration, private tactic setup, club selection, completion, or rematch.

## Server Contract

P18O reuses the existing repository transition chain:

- `setup -> locked`
- `locked -> in_match`
- `in_match -> complete`

Successful kickoff keeps the existing transition audit entry:

- `type: 'lobby_state_transitioned'`
- `fromLobbyState: 'locked'`
- `toLobbyState: 'in_match'`

Invalid premature kickoff attempts must not alter lobby state or append transition audit entries.

## Validation

P18O validation includes:

- Product kickoff flow tests.
- Product route render/source guard tests.
- Head-to-head lobby read-model tests.
- Full mission suite.
- Full Vitest suite.
- TypeScript typecheck.
- Next build.
- `git diff --check`.
- Browser smoke for `/head-to-head-lobby`, `/lobby-transition-harness`, and `/lobby-fixtures`.
