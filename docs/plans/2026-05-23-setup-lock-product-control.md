# P18N Setup Lock Readiness + Product Control Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Expose a guarded product-facing setup lock control on `/head-to-head-lobby` after both managers are assigned, while keeping kickoff and complete transitions isolated from the smoke harness.

**Architecture:** Tighten server authority first: setup-to-locked transitions for head-to-head lobbies require both home and away managers. Then add a product-specific browser flow that only requests `locked`, refreshes the summary, and preserves server rejection copy. Keep generic transition controls out of the product route.

**Tech Stack:** TypeScript, Next.js app router, React server/static render tests, Vitest, existing replay-session repository/API/client contracts.

---

## Task 1: Server readiness gate

**Objective:** Prevent setup lock when a head-to-head lobby is missing either manager.

**Files:**
- Modify: `tests/api/replaySessionRepository.test.ts`
- Modify: `src/api/replaySessionRepository.ts`

**Steps:**
1. Add a failing repository test that creates a setup head-to-head lobby with only home assigned and calls `transitionLobbyState(sessionId, 'locked')`.
2. Assert the error copy is exactly `Cannot lock setup until both managers are assigned`.
3. Run the focused test and verify RED.
4. Add the minimal guard inside `transitionLobbyState` before saving the transition.
5. Run the focused test and verify GREEN.

## Task 2: API helper rejection copy

**Objective:** Prove the API helper returns the readiness rejection without losing exact copy.

**Files:**
- Modify: `tests/api/replaySessionEndpoint.test.ts`
- Existing: `src/api/replaySessionEndpoint.ts`

**Steps:**
1. Add a failing API helper test for `transitionReplaySessionLobbyStateForApi` against an incomplete setup head-to-head lobby.
2. Assert `{ ok: false, status: 400, body.error: 'Cannot lock setup until both managers are assigned' }`.
3. Run focused test and verify RED if repository guard is missing from API path, then GREEN after Task 1.

## Task 3: Product lock flow helper

**Objective:** Add a product-specific browser flow that locks setup and refreshes summary.

**Files:**
- Create: `tests/web/headToHeadLobbyLockFlow.test.ts`
- Create: `src/web/headToHeadLobbyLockFlow.ts`

**Steps:**
1. Write a failing test that injects transition/getSummary functions and verifies the flow calls transition with `{ sessionId, lobbyState: 'locked' }`, then fetches and returns the refreshed summary.
2. Add a rejection-copy test proving transition errors propagate unchanged.
3. Implement minimal helper `lockHeadToHeadSetupAndRefreshSummaryFromWeb({ sessionId, transition?, getSummary? })`.
4. Run focused test and verify GREEN.

## Task 4: Product route lock control

**Objective:** Render and wire a product `Lock setup` button without exposing kickoff/complete.

**Files:**
- Modify: `tests/web/headToHeadLobbyEntry.test.ts`
- Modify: `src/web/HeadToHeadLobbyEntry.tsx`

**Steps:**
1. Update static render/source tests to expect `Lock setup` and the product lock flow helper.
2. Keep assertions that `Kick off match`, `Complete match`, `LobbyMutationControls`, and generic transition helper are absent.
3. Implement route state/action for `lockSetup`, calling the product lock flow and updating status/error copy.
4. Keep button disabled unless there is a selected summary in setup with both managers assigned.
5. Run focused route test and verify GREEN.

## Task 5: Mission runner and docs

**Objective:** Add the slice to mission validation and document the contract.

**Files:**
- Modify: `scripts/run-mission-tests.ts`
- Create: `docs/55-production-setup-lock-product-control-contract.md`
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`

**Steps:**
1. Add MISSION 151 for setup lock readiness repository/API contract.
2. Add MISSION 152 for product setup lock browser flow/route.
3. Create the production contract doc with purpose, routes, server rejection copy, browser behavior, guardrails, and validation.
4. Update docs index and handoff.

## Task 6: Full validation and local commit

**Objective:** Verify and commit the complete slice.

**Commands:**
- `npx vitest run tests/api/replaySessionRepository.test.ts tests/api/replaySessionEndpoint.test.ts`
- `npx vitest run tests/web/headToHeadLobbyLockFlow.test.ts tests/web/headToHeadLobbyEntry.test.ts`
- `npm run test:missions`
- `npm test`
- `npx tsc --noEmit`
- `npm run build`
- `git diff --check`

**Browser smoke:**
- `/head-to-head-lobby`: create lobby, verify lock disabled/incomplete copy, join away, lock setup, verify locked state and no kickoff/complete buttons, verify duplicate/invalid lock rejection where applicable.
- `/lobby-transition-harness`: still renders transition harness.
- `/lobby-fixtures`: remains button-free.

**Commit:**
- `feat: add product setup lock control`
