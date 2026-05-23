# P18G Lobby Action Preview Route Fixtures Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Add reusable route-shaped replay-session lobby summary fixtures for setup, locked, in-match, and complete preview states without wiring mutating Match Lab controls.

**Architecture:** Keep the route DTO shape as the source of truth by returning `ReplaySessionLobbySummary` objects that mirror `GET /api/replay-sessions/:sessionId`. Feed those fixtures through the existing pure `createReplaySessionLobbyStatusViewModel` and presentational `LobbyStatusCard` tests so future UI work can preview every server-owned lobby state from realistic data. Match Lab stays read-only and does not call the transition client helper.

**Tech Stack:** TypeScript, React/Next, Vitest, ReactDOMServer.

---

## Acceptance Criteria

1. A fixture helper exposes route-shaped summaries for `setup`, `locked`, `in_match`, and `complete` lobby states.
2. The fixtures use realistic head-to-head ownership, side command counts, visible event counts, and optional latest signature data.
3. Component tests render each fixture through `createReplaySessionLobbyStatusViewModel` and `LobbyStatusCard`.
4. Tests prove expected preview copy for lock, kickoff, complete, and no-transition states.
5. Tests prove fixture-backed preview markup contains no mutation buttons.
6. Mission runner includes named P18G route-fixture coverage.
7. Docs and handoff are updated, mission tests and full validation pass, and the slice is committed locally.

## Task 1: RED route-fixture helper contract

**Objective:** Prove a fixture helper is needed for route-shaped lobby summaries.

**Files:**
- Create test: `tests/web/replaySessionLobbyRouteFixtures.test.ts`
- Create implementation later: `src/web/replaySessionLobbyRouteFixtures.ts`

**Steps:**
1. Write a test importing `createReplaySessionLobbyRouteFixtures` from `src/web/replaySessionLobbyRouteFixtures`.
2. Assert returned fixture keys are `setup`, `locked`, `inMatch`, and `complete`.
3. Assert each fixture has matching `lobbyState`, `ownership.lobbyState`, `commandCounts`, `visibleEventCount`, and route-shaped `sessionId`/`seed` fields.
4. Run: `npx vitest run tests/web/replaySessionLobbyRouteFixtures.test.ts -t 'route-shaped lobby summary fixtures'`.
5. Expected RED: module import fails because the fixture helper does not exist.

## Task 2: GREEN minimal fixture helper

**Objective:** Add the typed fixture helper with route-shaped summaries.

**Files:**
- Create: `src/web/replaySessionLobbyRouteFixtures.ts`

**Steps:**
1. Export `type ReplaySessionLobbyRouteFixtures`.
2. Export `createReplaySessionLobbyRouteFixtures()` returning deterministic summaries:
   - `setup`: head-to-head, both managers assigned, zero commands, no signature.
   - `locked`: head-to-head, both managers assigned, no signature.
   - `inMatch`: head-to-head, both managers assigned, command counts and latest signature.
   - `complete`: head-to-head, both managers assigned, command counts and latest signature.
3. Run the focused RED test until it passes.

## Task 3: Preview matrix from fixtures

**Objective:** Prove every fixture renders the expected read-only preview copy.

**Files:**
- Modify: `tests/web/replaySessionLobbyRouteFixtures.test.ts`

**Steps:**
1. Render each fixture through `createReplaySessionLobbyStatusViewModel` and `LobbyStatusCard` using `renderToStaticMarkup`.
2. Assert:
   - setup includes `Lock setup`, `Target: locked`, `Available`
   - locked includes `Kick off match`, `Target: in_match`, `Available`
   - inMatch includes `Complete match`, `Target: complete`, `Available`
   - complete includes `No further lobby transitions available.` and no `Target:`
3. Assert no rendered fixture contains `<button`.
4. Run the focused file.

## Task 4: Mission runner, docs, browser smoke, validation, commit

**Objective:** Finish the slice with documented contract and full validation.

**Files:**
- Create: `docs/48-production-lobby-action-preview-route-fixtures-contract.md`
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`
- Modify: `scripts/run-mission-tests.ts`

**Steps:**
1. Add `MISSION 139: lobby action preview route fixtures` to the mission runner.
2. Document fixture shape, safety rules, and future use in docs/48.
3. Browser smoke existing Match Lab flow remains read-only and still shows current in-match preview.
4. Run validation:
   - `npx vitest run tests/web/replaySessionLobbyRouteFixtures.test.ts -t 'route-shaped lobby summary fixtures'`
   - `npx vitest run tests/web/replaySessionLobbyRouteFixtures.test.ts`
   - `npm run test:missions`
   - `npm test`
   - `npx tsc --noEmit`
   - `npm run build`
   - `git diff --check`
5. Commit locally with a conventional commit message.
