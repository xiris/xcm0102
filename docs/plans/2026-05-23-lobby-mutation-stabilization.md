# P18I Lobby Mutation Stabilization Implementation Plan

> **For Hermes:** Use test-driven-development and systematic-debugging to implement this plan task-by-task.

**Goal:** Stabilize lobby read-only guardrails and server/client rejection-copy contracts before any visible lobby mutation controls are introduced.

**Architecture:** Add lightweight source/contract tests that lock Match Lab and the fixture gallery out of the browser transition helper, keep the existing lobby transition client as the only browser-facing mutation adapter, and tighten explicit rejection-copy coverage for invalid transitions. Keep behavior read-only in UI surfaces and document the mutation-control acceptance gate.

**Tech Stack:** TypeScript, Vitest, Node fs/path helpers, Next app router.

---

## Audit Findings Before Changes

- Repo starts clean on `main...origin/main [ahead 8]` at `80becc1 feat: add read-only lobby fixture gallery`.
- Recent read-only slices added route-shaped fixtures and `/lobby-fixtures` browser smoke coverage.
- `src/web/replaySessionClient.ts` intentionally exports `transitionReplaySessionLobbyStateFromWeb` as the tested future mutation adapter.
- `src/web/MatchLab.tsx` imports only create/get/append/sync/resume replay-session client helpers and still has non-lobby buttons for simulation/replay/assignments.
- `src/web/LobbyFixtureGallery.tsx` renders fixture summaries through the lobby status card and has no transition helper import.
- Existing API/web tests cover some invalid transition errors, but there is no explicit guard test preventing read-only UI files from importing the transition helper.

## Acceptance Criteria

1. A guard test fails if `MatchLab.tsx`, `LobbyFixtureGallery.tsx`, or `app/lobby-fixtures/page.tsx` imports/calls `transitionReplaySessionLobbyStateFromWeb`.
2. The same guard test fails if the fixture gallery source renders `<button>` controls.
3. Web client tests explicitly prove invalid lobby transition server payloads preserve setup/in-match/complete rejection copy.
4. Fastify route tests explicitly prove the lobby-state route rejects invalid direct setup-to-in-match transitions with stable copy.
5. Docs record the stabilization root cause, guardrails, validation, and the acceptance gate before future visible mutation controls.
6. Mission runner includes named P18I stabilization coverage.
7. Full validation and browser smoke remain green.

## Task 1: RED read-only UI mutation guard

**Objective:** Add a regression guard that enforces the current read-only UI policy.

**Files:**
- Create: `tests/web/lobbyReadOnlyMutationGuards.test.ts`

**Steps:**
1. Use `node:fs` and `node:path` to read:
   - `src/web/MatchLab.tsx`
   - `src/web/LobbyFixtureGallery.tsx`
   - `app/lobby-fixtures/page.tsx`
2. Assert none contain `transitionReplaySessionLobbyStateFromWeb`.
3. Assert `LobbyFixtureGallery.tsx` does not contain `<button`.
4. Add a second source assertion for `MatchLab.tsx` that forbids future lobby action labels inside button JSX.
5. Run: `npx vitest run tests/web/lobbyReadOnlyMutationGuards.test.ts`.
6. Expected RED: missing test file/module before creation or a deliberate failure against an unimplemented helper if extracted.

## Task 2: GREEN read-only UI mutation guard

**Objective:** Implement the minimal test-only source guard.

**Files:**
- Create: `tests/web/lobbyReadOnlyMutationGuards.test.ts`

**Steps:**
1. Implement helper `readProjectFile(relativePath)`.
2. Implement helper `extractButtonBlocks(source)` to inspect `<button ... </button>` blocks in Match Lab.
3. Assert no Match Lab button block contains `Lock setup`, `Kick off match`, `Complete match`, `Ready`, `Invite`, `Join`, or `Rematch`.
4. Run the focused guard test until GREEN.

## Task 3: RED/GREEN tightened rejection-copy coverage

**Objective:** Stabilize invalid transition copy across browser client and Fastify route boundaries.

**Files:**
- Modify: `tests/web/replaySessionClient.test.ts`
- Modify: `tests/api/server.test.ts`

**Steps:**
1. Add a web-client table test for invalid transition payloads:
   - `Invalid replay session lobby transition: setup -> in_match`
   - `Invalid replay session lobby transition: in_match -> locked`
   - `Invalid replay session lobby transition: complete -> in_match`
2. Run the focused web-client test and verify RED if current test coverage is too narrow.
3. Add a Fastify route test that creates a setup head-to-head lobby and PATCHes directly to `in_match`, expecting `400` and exact error copy.
4. Run focused server route test and verify RED if missing coverage is exposed.
5. Implement only if required; these may pass because route/client logic already supports the contract, which is acceptable for a stabilization coverage slice after observing the test behavior.

## Task 4: Docs and mission runner

**Objective:** Document stabilization and add named mission coverage.

**Files:**
- Create: `docs/50-production-lobby-mutation-stabilization-contract.md`
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`
- Modify: `scripts/run-mission-tests.ts`

**Steps:**
1. Add `MISSION 141: lobby read-only mutation guards` for the new guard test.
2. Add `MISSION 142: lobby invalid transition rejection copy` for focused web/API rejection-copy tests if practical, or include the relevant existing files if a combined mission is simpler.
3. Document the acceptance gate before future visible mutation controls.
4. Update handoff with P18I validation evidence and recommended next slice.

## Task 5: Full validation, browser smoke, commit

**Objective:** Complete stabilization with full project validation.

**Commands:**

```bash
npx vitest run tests/web/lobbyReadOnlyMutationGuards.test.ts
npx vitest run tests/web/replaySessionClient.test.ts -t 'preserves invalid lobby transition rejection copy'
npx vitest run tests/api/server.test.ts -t 'lobby-state route rejects direct setup to in-match transitions'
npm run test:missions
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Browser smoke:

1. Visit `http://localhost:3000/lobby-fixtures`.
2. Confirm all fixture states still render.
3. Confirm no mutating lobby buttons appear.
4. Check browser console errors.

Commit locally with a conventional commit message after validation passes.
