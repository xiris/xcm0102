# Production Lobby Setup/Lock API Smoke Contract

## Purpose

P18C adds a server-first smoke path for replay sessions that start in `setup` rather than the current Match Lab default of `in_match`. P18B made read-only side readiness visible in the browser; this slice proves the route/API layer can create setup lobbies and advance them through `setup -> locked -> in_match` before any browser mutation controls are introduced.

## Scope

In scope:

- Optional replay-session creation ownership metadata for API/route smoke tests.
- Head-to-head setup session creation with home and away manager owners.
- Summary visibility for setup, locked, and in-match lobby states.
- Forward-only `setup -> locked -> in_match` transition proof through shared API helpers, Fastify routes, and Next route wrappers.
- Existing single-manager Match Lab compatibility: omitted ownership metadata still creates `in_match` sessions owned by the local home manager.

Out of scope:

- Browser invite, join, ready, lock, kickoff, complete, or transition buttons.
- Auth, accounts, permissions, sockets, presence, matchmaking, or private tactic setup.
- Durable database persistence.
- Replacing Match Lab's current post-simulation replay-session flow.

## Creation Contract

`createReplaySessionForApi(payload, repository)` accepts the existing simulation/session payload and may also accept:

```ts
{
  ownership?: {
    mode: 'single_manager' | 'head_to_head';
    lobbyState: 'setup' | 'locked' | 'in_match' | 'complete';
    sides: {
      home?: { managerId: string; displayName: string };
      away?: { managerId: string; displayName: string };
    };
  };
}
```

Rules:

- If `ownership` is omitted, creation behavior is unchanged: single-manager, home owned by `Local manager`, and `in_match` lobby state.
- If `ownership` is provided, it must include a valid mode, valid lobby state, a sides object, and non-empty `managerId` / `displayName` fields for any provided side owner.
- Invalid ownership metadata returns `400` with a readable ownership validation error.
- The creation response remains compatible with the existing Match Lab client and still returns session ID, score, visible event count, and replay metadata.

## Setup/Lock Smoke Contract

A head-to-head setup smoke session can be created with both sides assigned and `lobbyState: 'setup'`. After creation:

1. `GET /api/replay-sessions/:sessionId` returns a summary with `lobbyState: 'setup'`, both side owners, and zero command counts.
2. `PATCH /api/replay-sessions/:sessionId/lobby-state` with `{ lobbyState: 'locked' }` succeeds.
3. A second patch with `{ lobbyState: 'in_match' }` succeeds.
4. The summary then reflects `lobbyState: 'in_match'` and preserves ownership metadata.

The existing transition contract continues to reject skipped, repeated, or backward transitions.

## Route Contract

Fastify:

```http
POST /api/replay-sessions
GET /api/replay-sessions/:sessionId
PATCH /api/replay-sessions/:sessionId/lobby-state
```

Next app routes:

```http
POST /api/replay-sessions
GET /api/replay-sessions/[sessionId]
PATCH /api/replay-sessions/[sessionId]/lobby-state
```

Both route families remain thin wrappers around the shared API helper and repository.

## Browser Compatibility

Match Lab sends no ownership metadata during normal simulation-driven session creation. Therefore the browser remains read-only and continues to receive an `in_match` single-manager session summary after simulation.

## Acceptance Criteria

- API helper tests prove setup session creation and `setup -> locked -> in_match` transitions.
- Fastify route tests prove setup creation, summary visibility, and transition smoke behavior.
- Next route tests prove app-router parity for setup creation and transitions.
- Mission runner includes named P18C setup/lock readiness coverage.
- Existing Match Lab browser flow still renders the read-only lobby panel without mutation controls.
