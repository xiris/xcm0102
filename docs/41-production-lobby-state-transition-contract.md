# Production Lobby State Transition Contract

## Purpose

P17D turns the lobby-state values exposed in P17C into server-owned transition commands. Replay sessions already carry ownership metadata and a public summary; this slice adds the smallest mutation seam a future head-to-head lobby needs without adding accounts, sockets, invite flows, or browser lobby UI.

This remains in-memory and deterministic. The server repository is the source of truth for lobby state, and clients may request transitions only through a narrow validated command.

## State Machine

`ReplaySessionLobbyState` remains:

- `setup`: managers are choosing clubs, tactics, and lineups before lock.
- `locked`: submitted setup is locked and waiting for kickoff.
- `in_match`: match/replay is active and in-match commands may be recorded.
- `complete`: authoritative final result is complete and no further manager commands may be appended.

Allowed transitions:

```text
setup -> locked
locked -> in_match
in_match -> complete
```

Rules:

- Transitions must be forward-only and one step at a time.
- Repeating the current state is invalid.
- Skipping states is invalid, e.g. `setup -> in_match`.
- Reopening a completed session is invalid.
- Current Match Lab sessions still default to `in_match`; they may transition to `complete` through the new command.

## Repository Contract

Add a repository method:

```ts
transitionLobbyState(sessionId: string, nextState: ReplaySessionLobbyState): ReplaySession;
```

Behavior:

- Missing session errors remain `Replay session not found: <id>`.
- Invalid transitions throw a readable error:
  - `Invalid replay session lobby transition: <from> -> <to>`
- Successful transitions update `ownership.lobbyState`.
- Successful transitions update `updatedAt`.
- Successful transitions append an audit entry of type `lobby_state_transitioned` with `fromLobbyState` and `toLobbyState`.
- Storage export/hydration must preserve the resulting lobby state and audit entries.

Command guard:

- `appendManagerCommand` must reject completed sessions with:
  - `Replay session is complete and cannot accept manager commands`
- This prevents late command mutation after a server-owned complete transition.
- Earlier states are not fully enforced yet because setup/lock route flows are still not exposed to the Match Lab UI.

## API Contract

New helper:

```ts
transitionReplaySessionLobbyStateForApi(payload, repository)
```

Request shape:

```ts
{
  sessionId: string;
  lobbyState: 'setup' | 'locked' | 'in_match' | 'complete';
}
```

Responses:

Success:

```ts
{
  sessionId: string;
  lobbyState: ReplaySessionLobbyState;
  ownership: ReplaySessionOwnership;
}
```

Errors:

- malformed body: `400`
- invalid `lobbyState`: `400` with `lobbyState must be setup locked in_match or complete`
- invalid transition: `400` with repository transition error
- missing session: `404`

## Route Contract

Fastify route:

```http
PATCH /api/replay-sessions/:sessionId/lobby-state
```

Next app route:

```http
PATCH /api/replay-sessions/[sessionId]/lobby-state
```

Both are thin wrappers around the shared API helper and the shared in-process replay-session repository.

## Out of Scope

- Auth, accounts, manager permissions, or side-specific transition authorization.
- WebSocket/SSE lobby updates.
- Browser lobby UI.
- Durable database persistence.
- Club choice or private tactic setup flows.

## Acceptance Criteria

- Repository tests prove valid transitions mutate ownership and append audit metadata.
- Repository tests prove invalid/skipped/backward transitions fail with readable errors.
- Repository tests prove completed sessions reject manager commands.
- API helper tests prove request parsing, success body, invalid state rejection, invalid transition rejection, and not-found behavior.
- Fastify route tests prove transition success and completed-command rejection through HTTP.
- Next route smoke tests prove transition success through app-router handlers.
- Existing Match Lab browser flow remains unchanged until lobby UI is intentionally added.
