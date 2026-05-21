# Production Session Route Parity and Lobby State Smoke Contract

## Purpose

P17C closes the first route-boundary gap after replay sessions gained side ownership. P17B proved the pure API helpers, repository, and browser client can distinguish home and away command logs. P17C proves the server routes expose the same behavior and adds a small read-only session summary shape that future lobby screens can consume.

This remains an in-memory foundation. It does not add auth, accounts, sockets, durable database storage, invite links, or a lobby UI.

## Scope

In scope:

- Fastify route tests for away-side command append and invalid side rejection.
- Next app-route smoke tests for away-side command append.
- A read-only replay-session summary API helper and route.
- Lobby-state metadata visibility in the summary response.
- Docs for setup → locked → in_match → complete transition semantics.

Out of scope:

- Mutating lobby state through an endpoint.
- Real users, permissions, invites, matchmaking, or authorization.
- Persisting summaries to a database.
- Browser lobby UI.

## Route Contract

### Append command

Existing route:

```http
POST /api/replay-sessions/:sessionId/commands
```

Request body:

```ts
{
  command: ManagerCommand;
  side?: 'home' | 'away';
}
```

Rules:

- Omitted `side` defaults to `home`.
- `side: 'away'` appends only to the away command log.
- Invalid side values return `400` with `side must be home or away`.

Response:

```ts
{
  sessionId: string;
  commandCount: number;
  commandCounts: { home: number; away: number };
}
```

### Session summary

New route:

```http
GET /api/replay-sessions/:sessionId
```

Response:

```ts
{
  sessionId: string;
  seed: number;
  ownership: ReplaySessionOwnership;
  lobbyState: ReplaySessionLobbyState;
  commandCounts: { home: number; away: number };
  visibleEventCount: number;
  latestAuthoritativeSignature?: string;
}
```

Rules:

- The summary is read-only.
- It must not return full match input, full event history, command bodies, or audit logs.
- Missing sessions return `404` with the repository not-found message.

## Lobby State Semantics

The `ReplaySessionLobbyState` values mean:

- `setup`: managers can choose clubs/tactics/lineups; no kickoff yet.
- `locked`: pre-match setup is submitted and waiting for both sides to lock.
- `in_match`: match/replay is active and in-match commands may be recorded.
- `complete`: authoritative final result has been produced and further commands should be disabled by a future route/UI layer.

P17C only exposes and documents these states. It does not implement state transitions yet. Current single-manager Match Lab sessions default to `in_match` because the session is created after a match simulation already exists.

## Acceptance Criteria

- Fastify route tests prove `side: 'away'` reaches the away command log and affects authoritative resume diagnostics.
- Fastify route tests prove invalid side values return `400`.
- Next app-route smoke tests prove command append forwards `side: 'away'` and exposes `{ home, away }` counts.
- A session summary helper/route returns ownership, lobby state, command counts, visible event count, seed, and latest signature metadata.
- Summary responses intentionally omit command bodies, visible event arrays, base input, initial result, and audit log.
- Existing Match Lab browser flow remains unchanged and home-default.
