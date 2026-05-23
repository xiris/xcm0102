# P18H Read-Only Lobby Fixture Gallery Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Add a read-only browser fixture gallery that renders setup, locked, in-match, and complete lobby action-preview states from route-shaped summaries without adding mutation controls.

**Architecture:** Keep route-shaped fixtures in `src/web/replaySessionLobbyRouteFixtures.ts` as the data source, transform them through the existing `createReplaySessionLobbyStatusViewModel`, and render them with the existing `LobbyStatusCard`. Expose a small read-only gallery component and a static Next route so browser smoke can inspect every future lobby state before any transition button wiring.

**Tech Stack:** TypeScript, React/Next app router, Vitest, ReactDOMServer.

---

## Acceptance Criteria

1. A `LobbyFixtureGallery` component renders setup, locked, in-match, and complete fixture cards.
2. Each card uses the existing `LobbyStatusCard` component and status view-model path.
3. Gallery copy clearly labels itself read-only and says it performs no lobby mutations.
4. Tests prove the gallery renders expected state/action copy for all fixtures.
5. Tests prove the gallery renders no `<button>` controls.
6. A static Next route exposes the gallery for browser smoke.
7. Mission runner includes named P18H fixture-gallery coverage.
8. Docs, handoff, mission tests, full validation, browser smoke, and a local commit are completed.

## Task 1: RED gallery component contract

**Objective:** Prove a read-only gallery component is needed.

**Files:**
- Create test: `tests/web/lobbyFixtureGallery.test.ts`
- Create implementation later: `src/web/LobbyFixtureGallery.tsx`

**Steps:**
1. Write a test importing `LobbyFixtureGallery`.
2. Render it with `renderToStaticMarkup`.
3. Assert it includes `Lobby fixture gallery`, `Read-only route fixture gallery`, and all four state labels: setup open, locked for kickoff, in match, complete.
4. Assert it includes action preview copy for `Lock setup`, `Kick off match`, `Complete match`, and `No further lobby transitions available.`.
5. Assert the markup contains no `<button`.
6. Run: `npx vitest run tests/web/lobbyFixtureGallery.test.ts -t 'renders every read-only lobby fixture state'`.
7. Expected RED: missing module import.

## Task 2: GREEN gallery component

**Objective:** Implement the minimal gallery using the existing fixture/view-model/component path.

**Files:**
- Create: `src/web/LobbyFixtureGallery.tsx`

**Steps:**
1. Import `LobbyStatusCard`, `createReplaySessionLobbyRouteFixtures`, and `createReplaySessionLobbyStatusViewModel`.
2. Build an ordered array for setup, locked, inMatch, complete.
3. Render a `<main>` with a read-only heading/description and one `<article>` per fixture.
4. Use `LobbyStatusCard` inside each article.
5. Run the focused test until it passes.

## Task 3: RED/GREEN Next route smoke contract

**Objective:** Expose the gallery through a static route for browser smoke.

**Files:**
- Modify test: `tests/web/lobbyFixtureGallery.test.ts`
- Create: `app/lobby-fixtures/page.tsx`

**Steps:**
1. Add a test importing the route page and rendering it to static markup.
2. Assert it contains the gallery title and no `<button` controls.
3. Run the focused test and verify RED with missing route module.
4. Create `app/lobby-fixtures/page.tsx` returning `<LobbyFixtureGallery />`.
5. Re-run the focused test until GREEN.

## Task 4: Docs, mission runner, validation, browser smoke, commit

**Objective:** Finish the slice with documentation and full validation.

**Files:**
- Create: `docs/49-production-read-only-lobby-fixture-gallery-contract.md`
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`
- Modify: `scripts/run-mission-tests.ts`

**Steps:**
1. Add `MISSION 140: read-only lobby fixture gallery` to the mission runner.
2. Document the gallery route, read-only guarantees, and acceptance criteria.
3. Browser smoke `/lobby-fixtures` and confirm all states/actions appear with no lobby mutation buttons and no console errors.
4. Validate:
   - `npx vitest run tests/web/lobbyFixtureGallery.test.ts -t 'renders every read-only lobby fixture state'`
   - `npx vitest run tests/web/lobbyFixtureGallery.test.ts`
   - `npm run test:missions`
   - `npm test`
   - `npx tsc --noEmit`
   - `npm run build`
   - `git diff --check`
5. Commit locally with a conventional commit message.
