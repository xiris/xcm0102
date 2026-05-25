# Production Head-to-Head Lobby Entry Contract

## Purpose

P18L starts turning the tested replay-session lobby spine into a product-facing 1v1 lobby entry surface. It adds a route that can create a head-to-head setup lobby for a named home manager and read an existing lobby by session ID, while deliberately deferring away-side join mutation, auth, sockets, durable storage, and transition controls.

## Scope

In scope:

- A pure `createHeadToHeadLobbyRequest` helper that creates a valid setup replay-session request with a named home manager and an unassigned away side.
- A pure `createHeadToHeadLobbyReadModel` helper that formats invite/session, manager, and readiness copy for a read-only product entry panel.
- A `/head-to-head-lobby` route that can create a setup lobby and fetch the server-owned summary.
- A read-only lookup path that can load an existing replay-session summary by session ID.
- Reuse of `LobbyStatusCard` and existing replay-session summary view-model behavior.

Out of scope:

- Away manager join mutation.
- Auth/accounts/session identity.
- Invite delivery.
- WebSockets/presence.
- Durable database-backed lobby storage.
- Product-route lobby transition buttons.

## Request Contract

`createHeadToHeadLobbyRequest({ homeManagerName, seed = 311 })` returns a `WebReplaySessionCreateRequest` with:

- default Match Lab tactical state;
- full default assignment maps for Inter/Milan sample formations;
- `currentMinute: 0`;
- `ownership.mode: 'head_to_head'`;
- `ownership.lobbyState: 'setup'`;
- `ownership.sides.home` assigned from the normalized home manager display name;
- no `ownership.sides.away`, leaving the away side waiting for a future join mutation.

The manager id is deterministic from the normalized display name, e.g. `Chris Silva` -> `home-chris-silva`.

## Read Model Contract

`createHeadToHeadLobbyReadModel(summary)` returns product copy for:

- `Head-to-head lobby` title;
- invite/session label;
- home manager label;
- away manager label;
- setup readiness label;
- read-only notice explaining that joining and transitions remain server-owned follow-up actions.

The read model does not define transition actions. Transition availability remains derived from `createReplaySessionLobbyStatusViewModel(summary)`.

## Route Contract

`/head-to-head-lobby` renders `HeadToHeadLobbyEntry`.

The route must:

1. Render a home manager name field and `Create lobby` button.
2. Render an existing lobby session ID field and `View lobby` button.
3. Create lobbies by calling `createReplaySessionFromWeb(createHeadToHeadLobbyRequest(...))`.
4. Refresh/read summaries with `getReplaySessionSummaryFromWeb(sessionId)`.
5. Render the product read model and shared `LobbyStatusCard` after summary load.
6. Avoid importing or rendering `LobbyMutationControls`.
7. Avoid importing `applyReplaySessionLobbyTransitionFromWeb`.

## Boundary With Other Routes

- `/head-to-head-lobby` is the first product entry/read route.
- `/lobby-transition-harness` remains the write-capable smoke route for setup/locked/in-match transition validation.
- `/lobby-fixtures` remains a read-only story/fixture gallery and must stay button-free.

## Acceptance Criteria

- `tests/web/headToHeadLobbyModel.test.ts` proves request shape and read-model copy.
- `tests/web/headToHeadLobbyEntry.test.ts` proves route shell and source-level read-only transition boundary.
- Mission runner includes P18L missions.
- Browser smoke proves:
  - `/head-to-head-lobby` can create a lobby from a home manager name;
  - summary shows the home manager assigned and away manager waiting/unassigned;
  - the route has no lobby transition buttons;
  - `/lobby-transition-harness` remains available for transition smoke;
  - `/lobby-fixtures` remains button-free.
- Full validation passes: mission tests, full Vitest suite, TypeScript, Next build, and `git diff --check`.
