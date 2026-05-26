# Production Product Completion Control Contract

## Purpose

P18P exposes product-facing result closure on `/head-to-head-lobby`. A head-to-head lobby can now move through create, away join, setup lock, kickoff, and match completion without exposing rematch. The server still owns every lobby-state transition.

## Browser Routes

- `/head-to-head-lobby`
  - Can create a setup head-to-head lobby.
  - Can read an existing lobby by session ID.
  - Can join the away side during setup.
  - Can lock setup once both managers are assigned.
  - Can request `Kick off match` once the current server summary is `locked`.
  - Can request `Complete match` only once the current server summary is `in_match`.
  - Does not expose rematch controls.
- `/lobby-transition-harness`
  - Remains the controlled smoke route for full transition sequences and invalid-transition copy.
- `/lobby-fixtures`
  - Remains read-only and button-free.

## Browser Flow Contract

The product route uses:

- `completeHeadToHeadMatchAndRefreshSummaryFromWeb({ sessionId })`

The helper must:

1. Call `transitionReplaySessionLobbyStateFromWeb({ sessionId, lobbyState: 'complete' })`.
2. Fetch the refreshed lobby summary with `getReplaySessionSummaryFromWeb(sessionId)`.
3. Return the refreshed summary.
4. Preserve thrown transition errors unchanged.

Premature completion rejection copy is preserved from the existing server transition contract. For a locked lobby, the browser-facing error remains:

`Replay session request failed: Invalid replay session lobby transition: locked -> complete`

## Product Route Status Copy

- Before kickoff: no `Complete match` product card is rendered.
- Ready: `The match is in progress. Complete it to close the authoritative result.`
- Pending: `Completing match for lobby <sessionId>...`
- Success: `Completed match for lobby <sessionId>.`
- Failure status: `Match completion failed.` plus the exact thrown error copy.

## UI Guardrails

- `Complete match` is rendered on `/head-to-head-lobby` only when the current summary is `in_match`.
- `Complete match` is not rendered for missing, setup, locked, or complete summaries.
- `Kick off match` remains visible, but disabled after the lobby leaves `locked`.
- The product route does not render `Rematch`.
- The product route does not import `LobbyMutationControls`.
- The product route does not import the generic `applyReplaySessionLobbyTransitionFromWeb` helper.
- This slice does not add authentication, real invite permissions, websockets, persistence migration, private tactic setup, club selection, rematch, or result report pages.

## Server Contract

P18P reuses the existing repository transition chain:

- `setup -> locked`
- `locked -> in_match`
- `in_match -> complete`

Successful completion keeps the existing transition audit entry:

- `type: 'lobby_state_transitioned'`
- `fromLobbyState: 'in_match'`
- `toLobbyState: 'complete'`

Invalid premature completion attempts must not alter lobby state or append transition audit entries.

## Validation

P18P validation includes:

- Product completion flow tests.
- Product route render/source guard tests.
- Head-to-head lobby read-model tests.
- Full mission suite.
- Full Vitest suite.
- TypeScript typecheck.
- Next build.
- `git diff --check`.
- Browser smoke for `/head-to-head-lobby`, `/lobby-transition-harness`, and `/lobby-fixtures`.
