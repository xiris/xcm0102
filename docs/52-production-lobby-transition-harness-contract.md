# Production Lobby Transition Harness + Rejection UX Contract

## Purpose

P18K adds a small write-capable browser smoke route for the replay-session lobby state machine after P18J proved the first Match Lab completion mutation. The route exists to exercise setup and locked lobby transitions, plus visible rejection-copy handling, without turning the read-only fixture gallery into a mutation surface or prematurely adding full multiplayer lobby UX.

## Scope

In scope:

- A pure `createLobbyTransitionHarnessSetupRequest` helper that builds a head-to-head setup replay-session create request from default tactical state.
- A `/lobby-transition-harness` route that creates a real server-backed setup replay session through the existing browser client.
- Reuse of `LobbyMutationControls` and `applyReplaySessionLobbyTransitionFromWeb` for setup -> locked and locked -> in_match transitions.
- An explicit invalid kickoff smoke control that attempts setup -> in_match and displays exact server/browser-client rejection copy.
- Mission coverage for the helper and route/component wiring.

Out of scope:

- Auth, accounts, invites, sockets, presence, rematch, or durable database-backed lobby storage.
- Adding mutation buttons to `/lobby-fixtures`.
- Forking the lobby action availability policy into route-local React logic.
- Client-side simulation authority.

## Harness Request Contract

`createLobbyTransitionHarnessSetupRequest(seed = 211)` returns a `WebReplaySessionCreateRequest` with:

- default Match Lab tactical state;
- `currentMinute: 0`;
- `ownership.mode: 'head_to_head'`;
- `ownership.lobbyState: 'setup'`;
- both side owners assigned:
  - `Harness Home Manager`;
  - `Harness Away Manager`.

This gives the harness a setup-state session whose action availability exposes `Lock setup` immediately while still using the production replay-session creation route.

## Route Contract

`/lobby-transition-harness` renders `LobbyTransitionHarness`.

The harness must:

1. Render a `Create setup lobby` button before any session exists.
2. On create, call `createReplaySessionFromWeb(createLobbyTransitionHarnessSetupRequest())` and then `getReplaySessionSummaryFromWeb(sessionId)`.
3. Render `LobbyStatusCard` from the refreshed server summary.
4. Render `LobbyMutationControls` from `createReplaySessionLobbyStatusViewModel(summary)`.
5. Use `applyReplaySessionLobbyTransitionFromWeb` for normal mutation controls so transitions refresh the server summary.
6. Render `Try invalid kickoff` to attempt direct setup -> in_match before lock when a setup session exists.
7. Preserve exact rejection copy by displaying the thrown browser-client message and `Invalid kickoff rejected: <message>` status copy.

## Read-Only Boundary

The route is intentionally separate from `/lobby-fixtures`:

- `/lobby-fixtures` remains a route-shaped read-only story/smoke gallery.
- `LobbyFixtureGallery` must remain button-free and disconnected from `transitionReplaySessionLobbyStateFromWeb` and `applyReplaySessionLobbyTransitionFromWeb`.
- Future write-capable smoke routes should be named explicitly as harnesses or real product routes, not fixture galleries.

## Acceptance Criteria

- `tests/web/lobbyTransitionHarnessModel.test.ts` proves the setup-session request shape.
- `tests/web/lobbyTransitionHarness.test.ts` proves route shell and explicit wiring to existing mutation controls/flow helpers.
- `scripts/run-mission-tests.ts` includes P18K missions.
- Browser smoke proves:
  - create setup lobby;
  - direct invalid kickoff displays exact rejection copy;
  - lock setup succeeds and updates state;
  - kick off match succeeds and updates state;
  - `/lobby-fixtures` remains button-free.
- Full validation passes: mission tests, full Vitest suite, `tsc`, Next build, and `git diff --check`.
