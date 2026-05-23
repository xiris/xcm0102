# Production Read-Only Lobby Fixture Gallery Contract

## Purpose

P18H adds a browser-smokeable read-only fixture gallery for every route-shaped replay-session lobby state created in P18G. The live Match Lab still naturally creates the current single-manager in-match path; this gallery lets setup, locked, in-match, and complete preview states be inspected through the same browser UI contract before any lobby mutation controls are introduced.

## Scope

In scope:

- `LobbyFixtureGallery` under `src/web/`.
- Static Next route `/lobby-fixtures`.
- Rendering the existing P18G route-shaped fixtures through `createReplaySessionLobbyStatusViewModel` and `LobbyStatusCard`.
- Tests proving all four states render expected read-only preview copy.
- Tests proving the gallery and route render no `<button>` controls.
- Mission-runner coverage for the gallery contract.

Out of scope:

- Calling `transitionReplaySessionLobbyStateFromWeb`.
- Adding lock, kickoff, complete, ready, invite, join, rematch, or other mutating controls.
- Adding auth, presence, sockets, route mutation state, optimistic updates, or stale-summary recovery.
- Replacing server route tests; the gallery only consumes route-shaped fixture summaries.

## Route Contract

`GET /lobby-fixtures` renders a static page with:

- a `Lobby fixture gallery` heading;
- read-only explanatory copy;
- one fixture card each for setup, locked, in-match, and complete summaries;
- the existing replay-session lobby status rows, side readiness cards, and future-action preview panel for each fixture.

The gallery uses these source-of-truth steps:

1. `createReplaySessionLobbyRouteFixtures()` produces route-shaped summaries.
2. `createReplaySessionLobbyStatusViewModel(summary)` derives display state.
3. `LobbyStatusCard` renders the same panel used by Match Lab.

## Read-Only Safety Rules

- The gallery is a display harness only.
- It must not pass mutation callbacks to any child component.
- It must not import or call `transitionReplaySessionLobbyStateFromWeb`.
- Tests must assert no `<button>` markup appears in the gallery/route output.
- Browser smoke should check that setup/locked/in-match/complete copy is visible and that no invite, ready, lock setup, kickoff, join, complete match, rematch, or similar mutating lobby buttons appear.

## Acceptance Criteria

- The gallery renders setup, locked, in-match, and complete route fixtures.
- The setup fixture previews `Lock setup` with target `locked`.
- The locked fixture previews `Kick off match` with target `in_match`.
- The in-match fixture previews `Complete match` with target `complete`.
- The complete fixture renders no-transition copy.
- The static route renders the gallery.
- No mutation buttons render from the gallery or route.
- Mission runner includes named P18H coverage.
