# Production Lobby Action Preview Route Fixtures Contract

## Purpose

P18G adds reusable route-shaped replay-session lobby summary fixtures for every server-owned lobby state. P18F already renders the read-only action preview from one current Match Lab summary plus direct component states; this slice gives future UI and smoke tests deterministic `GET /api/replay-sessions/:sessionId`-shaped data for setup, locked, in-match, and complete previews before any browser mutation controls are introduced.

## Scope

In scope:

- A typed `createReplaySessionLobbyRouteFixtures()` helper under `src/web/`.
- Route-shaped `ReplaySessionLobbySummary` fixtures for `setup`, `locked`, `in_match`, and `complete` states.
- Fixture-backed component coverage through `createReplaySessionLobbyStatusViewModel` and `LobbyStatusCard`.
- Mission-runner coverage for route-fixture preview rendering.

Out of scope:

- Calling `transitionReplaySessionLobbyStateFromWeb` from Match Lab.
- Rendering lock, kickoff, complete, ready, invite, join, or rematch controls as buttons.
- Mocking a full server repository, auth, presence, sockets, permissions, or durable persistence.

## Fixture Contract

`createReplaySessionLobbyRouteFixtures()` returns:

```ts
{
  setup: ReplaySessionLobbySummary;
  locked: ReplaySessionLobbySummary;
  inMatch: ReplaySessionLobbySummary;
  complete: ReplaySessionLobbySummary;
}
```

Each summary mirrors the public route response from `GET /api/replay-sessions/:sessionId`:

```ts
{
  sessionId: string;
  seed: number;
  ownership: {
    mode: 'head_to_head';
    lobbyState: 'setup' | 'locked' | 'in_match' | 'complete';
    sides: {
      home: { managerId: string; displayName: string };
      away: { managerId: string; displayName: string };
    };
  };
  lobbyState: 'setup' | 'locked' | 'in_match' | 'complete';
  commandCounts: { home: number; away: number };
  visibleEventCount: number;
  latestAuthoritativeSignature?: string;
}
```

The fixtures intentionally use assigned head-to-head managers so action preview copy can show available transitions for:

- setup -> `Lock setup` targeting `locked`;
- locked -> `Kick off match` targeting `in_match`;
- in-match -> `Complete match` targeting `complete`;
- complete -> no further lobby transitions.

## Read-Only Safety Rules

- Fixtures are data only; they do not expose mutation callbacks or transition helpers.
- Fixture-backed preview tests must assert no `<button>` markup is rendered.
- Match Lab remains read-only until a later explicit mutation-control slice adds fresh TDD coverage for click behavior, pending/error states, stale summary handling, and server rejection copy.
- The server route contract remains authoritative; fixtures are for preview, story/smoke setup, and future UI test data, not a substitute for route tests.

## Acceptance Criteria

- Tests prove fixture keys and summary state fields match route shape.
- Tests prove every fixture renders the expected read-only action preview copy.
- Tests prove completed fixtures render no-target/no-transition copy.
- Tests prove no fixture-backed preview renders mutation buttons.
- Mission runner includes named P18G route-fixture coverage.
