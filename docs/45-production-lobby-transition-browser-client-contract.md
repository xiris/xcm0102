# Production Lobby Transition Browser Client Contract

## Purpose

P18D adds the browser-facing client boundary for the existing server-owned replay-session lobby-state transition route. P18C proved setup/lock/in-match transitions at the API and route layers; this slice lets future browser controls call that route through a tested helper without adding visible mutation controls to Match Lab yet.

## Scope

In scope:

- A typed web-client helper for `PATCH /api/replay-sessions/:sessionId/lobby-state`.
- Exact request-shape coverage with an injected fetch implementation.
- Readable server error propagation for invalid lobby transitions.
- Mission-runner coverage for the browser client boundary.

Out of scope:

- Rendering invite, join, ready, lock, kickoff, complete, or transition buttons.
- Calling the helper from `MatchLab.tsx`.
- Auth, accounts, manager permissions, sockets, presence, matchmaking, or private tactic setup.
- Durable database persistence.

## Web Client Contract

`transitionReplaySessionLobbyStateFromWeb(request, fetcher?)` accepts:

```ts
{
  sessionId: string;
  lobbyState: 'setup' | 'locked' | 'in_match' | 'complete';
}
```

It sends:

```http
PATCH /api/replay-sessions/:sessionId/lobby-state
content-type: application/json

{ "lobbyState": "locked" }
```

It returns the server transition DTO:

```ts
{
  sessionId: string;
  lobbyState: ReplaySessionLobbyState;
  ownership: ReplaySessionOwnership;
}
```

The helper is deliberately route-shaped rather than UI-action-shaped. Future UI can decide whether a control means ready, lock, kickoff, or complete, then map that action to the narrow server-owned `lobbyState` transition request.

## Error Contract

The helper reuses the existing replay-session response parser. Non-OK server responses throw readable errors with the existing prefix:

```text
Replay session request failed: <server error>
```

For example, an invalid skipped transition from setup directly to in-match surfaces as:

```text
Replay session request failed: Invalid replay session lobby transition: setup -> in_match
```

## Browser Compatibility

Match Lab remains read-only for lobby state in P18D. It creates sessions with the existing simulation-driven flow, fetches summaries, and renders the lobby status panel. No browser-visible lobby controls call this helper yet.

## Acceptance Criteria

- Web-client tests prove exact `PATCH /api/replay-sessions/:sessionId/lobby-state` URL, method, headers, and body.
- Web-client tests prove returned `lobbyState` and ownership metadata are exposed to callers.
- Web-client tests prove invalid transition server payloads throw readable errors.
- Mission runner includes named P18D lobby-transition web-client coverage.
- Existing Match Lab browser flow remains read-only with no mutating lobby controls rendered.
