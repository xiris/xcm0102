# Production Away Manager Join Mutation Contract

## Purpose

P18M adds the first product-facing head-to-head lobby join mutation. The server remains the authority: a setup lobby created by a home manager can assign exactly one away manager before later setup-lock/kickoff UX is exposed.

## Browser Routes

- `/head-to-head-lobby`
  - Can create a head-to-head setup lobby for the home manager.
  - Can view an existing lobby by replay session ID.
  - Can join the away side by posting an away manager name against the currently selected session ID.
  - Still does not render setup-lock/kickoff/complete transition controls.
- `/lobby-transition-harness`
  - Remains the only write-capable browser harness for setup lock, kickoff, completion, and invalid transition smoke.
- `/lobby-fixtures`
  - Remains read-only and button-free.

## Server Join Contract

The away join mutation is exposed through:

- Repository: `joinAwayManager(sessionId, owner)`
- API helper: `joinAwayManagerForApi(payload, repository)`
- Next route: `POST /api/replay-sessions/[sessionId]/join-away`
- Browser client: `joinAwayManagerFromWeb(request)`
- Browser flow: `joinAwayManagerAndRefreshSummaryFromWeb(input)`

Request body for the Next route:

```json
{
  "managerId": "away-away-boss",
  "displayName": "Away Boss"
}
```

The `sessionId` is taken from the route segment, not trusted from the body.

Successful response shape:

```json
{
  "sessionId": "rs-000001",
  "lobbyState": "setup",
  "ownership": {
    "mode": "head_to_head",
    "lobbyState": "setup",
    "sides": {
      "home": { "managerId": "home-home-manager", "displayName": "Home Manager" },
      "away": { "managerId": "away-away-manager", "displayName": "Away Manager" }
    }
  }
}
```

## Rejection Contract

The server rejects:

- Missing/empty `sessionId`.
- Missing/empty `managerId`.
- Missing/empty `displayName`.
- Missing sessions.
- Non-head-to-head sessions.
- Lobbies that are not in `setup`.
- Lobbies that already have an away manager.

The browser client preserves exact rejection copy by throwing:

`Replay session request failed: <server error>`

The product route displays that copy directly in the error panel.

## Audit Contract

A successful away join appends an audit entry:

- `type: 'away_manager_joined'`
- `commandSide: 'away'`
- `managerId`
- `displayName`
- timestamp

The mutation must not rewrite match commands, visible events, or lobby state.

## Guardrails

- The join mutation assigns only away-side ownership.
- It does not lock setup.
- It does not kick off a match.
- It does not complete a match.
- It does not duplicate `LobbyMutationControls` labels or transition policy.
- It does not introduce accounts, authentication, invite permissions, persistence migration, or websockets.
- It keeps transition mutation smoke isolated in `/lobby-transition-harness`.

## Validation

P18M validation includes:

- Repository join tests.
- API helper join/rejection tests.
- Next route wrapper tests.
- Browser client rejection-copy tests.
- Browser join-and-refresh flow tests.
- Head-to-head route render guard tests.
- Full mission suite.
- Full Vitest suite.
- TypeScript typecheck.
- Next build.
- `git diff --check`.
- Browser smoke for `/head-to-head-lobby`, `/lobby-transition-harness`, and `/lobby-fixtures`.
