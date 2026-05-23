# Production Lobby Mutation Stabilization Contract

## Purpose

P18I stabilizes the lobby/read-only UI boundary before the project introduces visible lobby mutation controls. P18F-P18H deliberately proved policy, route fixtures, and browser smoke without exposing lock/kickoff/complete buttons. This contract records the guardrails that must stay green until a later explicit mutation-control slice.

## Scope

In scope:

- Source-level guard tests for read-only lobby browser surfaces.
- Tightened invalid lobby-transition rejection-copy tests at web-client and Fastify route boundaries.
- Mission-labelled stabilization coverage.
- Documentation of the acceptance gate required before future mutation buttons are allowed.

Out of scope:

- Adding visible lock setup, kickoff, complete, ready, invite, join, or rematch controls.
- Calling `transitionReplaySessionLobbyStateFromWeb` from `MatchLab`, `LobbyFixtureGallery`, or `/lobby-fixtures`.
- Optimistic UI, retries, stale-summary recovery, presence, auth, sockets, or route mutation state.

## Read-Only Mutation Guard

These browser surfaces remain read-only for lobby state transitions:

- `src/web/MatchLab.tsx`
- `src/web/LobbyFixtureGallery.tsx`
- `app/lobby-fixtures/page.tsx`

Until a future mutation-control slice explicitly changes the contract, those files must not import or call:

```ts
transitionReplaySessionLobbyStateFromWeb
```

`LobbyFixtureGallery` must also remain free of `<button>` markup. Match Lab may keep its existing non-lobby buttons for simulation, interactive replay, authoritative resume, manager commands, and player assignments, but it must not render lobby mutation labels inside button blocks.

Forbidden lobby mutation control labels before the mutation-control slice:

- `Lock setup`
- `Kick off match`
- `Complete match`
- `Ready`
- `Invite`
- `Join`
- `Rematch`

## Rejection-Copy Contract

The client and route boundaries must preserve exact server error copy for invalid lobby transitions so future UI controls can display stable messages instead of generic failures.

Explicitly covered messages:

- `Invalid replay session lobby transition: setup -> in_match`
- `Invalid replay session lobby transition: in_match -> locked`
- `Invalid replay session lobby transition: complete -> in_match`

Browser client failures should surface as:

```text
Replay session request failed: <server error>
```

Fastify lobby-state route failures should return `400` with:

```json
{ "error": "Invalid replay session lobby transition: setup -> in_match" }
```

## Acceptance Gate Before Visible Mutation Controls

Future visible lobby mutation controls may be added only after a new slice updates this contract and proves all of the following:

1. Controls are derived from `createReplaySessionLobbyStatusViewModel` action availability, not duplicated React-only policy.
2. Disabled controls preserve the existing manager-assignment and no-transition copy.
3. Calls go through `transitionReplaySessionLobbyStateFromWeb` only from the explicit mutation-control component/surface.
4. Successful transitions refresh the read-only lobby summary from the server.
5. Failed transitions display exact rejection copy from the server payload.
6. Tests cover setup lock, locked kickoff, in-match completion, invalid direct transitions, completed-session no-op/rollback protection, and no accidental fixture-gallery mutation controls.
7. Browser smoke proves the mutation path and confirms `/lobby-fixtures` remains read-only.

## Acceptance Criteria

- `tests/web/lobbyReadOnlyMutationGuards.test.ts` prevents read-only UI files from importing/calling the transition helper.
- The guard test prevents the fixture gallery from rendering buttons and prevents lobby mutation labels inside Match Lab buttons.
- `tests/web/replaySessionClient.test.ts` preserves invalid transition rejection copy across setup, in-match, and complete cases.
- `tests/api/server.test.ts` proves the lobby-state route rejects direct setup-to-in-match transitions with stable copy.
- Mission runner includes P18I guard and rejection-copy coverage.
