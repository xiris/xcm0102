# P18J Visible Lobby Mutation Controls Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Add the first guarded visible lobby mutation controls while preserving fixture-gallery read-only guarantees and server-owned lobby-state authority.

**Architecture:** Keep action policy in `createReplaySessionLobbyStatusViewModel`. Add a small presentational `LobbyMutationControls` component that renders buttons from that policy and delegates clicks to an injected transition callback. Add a thin `applyReplaySessionLobbyTransitionFromWeb` helper that calls the existing browser transition client and refreshes the server summary after success. Wire Match Lab to the helper only when a replay session summary exists; leave `/lobby-fixtures` read-only.

**Tech Stack:** TypeScript, React, Next app router, Vitest, existing replay-session client helpers.

---

## Audit Findings Before Changes

- Repo starts clean on `main...origin/main [ahead 9]` at `55be6e8 test: stabilize lobby mutation guardrails`.
- P18I forbids mutation helper imports/calls in read-only surfaces and documents the acceptance gate for visible controls.
- `transitionReplaySessionLobbyStateFromWeb` and `getReplaySessionSummaryFromWeb` already exist and are tested.
- `createReplaySessionLobbyStatusViewModel` already exposes action IDs, labels, target states, availability, and disabled reasons.
- Match Lab naturally creates a single-manager `in_match` session, so the first live browser mutation path can be `Complete match`.
- `/lobby-fixtures` must remain a static read-only gallery and must not gain buttons.

## Acceptance Criteria

1. `LobbyMutationControls` renders buttons from the lobby action availability model.
2. Available actions render enabled buttons; disabled actions render disabled buttons with existing disabled reason copy.
3. Completed/no-action states render no mutation buttons and retain no-transition copy.
4. The transition flow calls `transitionReplaySessionLobbyStateFromWeb` with the action target state, then refreshes the summary through `getReplaySessionSummaryFromWeb`.
5. Failed transitions preserve exact browser-client rejection copy for display.
6. Match Lab renders the mutation controls only beside the live lobby status panel and updates the summary/status after success.
7. `/lobby-fixtures` remains read-only and button-free.
8. Mission runner includes named P18J controls/flow coverage and the updated read-only guard remains green.

## Task 1: RED presentational mutation controls

**Objective:** Specify the visible controls contract before implementation.

**Files:**
- Create: `tests/web/lobbyMutationControls.test.ts`
- Create later: `src/web/LobbyMutationControls.tsx`

**Steps:**
1. Write a test that renders controls for the setup fixture view model and expects:
   - heading `Lobby transition controls`;
   - helper copy from action availability;
   - enabled `<button type="button">Lock setup</button>`;
   - target copy `Target: locked`.
2. Write a test that renders incomplete setup and expects disabled `Lock setup` plus `Assign both managers before locking setup.`.
3. Write a test that renders complete state and expects no `<button>` plus no-transition copy.
4. Run `npx vitest run tests/web/lobbyMutationControls.test.ts` and verify RED from missing module.

## Task 2: GREEN presentational mutation controls

**Objective:** Implement the minimal reusable component.

**Files:**
- Create: `src/web/LobbyMutationControls.tsx`

**Steps:**
1. Export `LobbyMutationControls` with props:
   - `status: ReplaySessionLobbyStatusViewModel`
   - `isPending?: boolean`
   - `error?: string | null`
   - `onTransition: (action: ReplaySessionLobbyAction) => void`
2. Render no buttons when `status.actionAvailability.actions` is empty.
3. Render enabled/disabled buttons from action availability.
4. Include target and disabled reason copy.
5. Run focused test until GREEN.

## Task 3: RED/GREEN transition flow helper

**Objective:** Keep browser mutation side effects in one tested helper.

**Files:**
- Modify: `tests/web/lobbyMutationControls.test.ts` or create `tests/web/lobbyMutationFlow.test.ts`
- Create: `src/web/replaySessionLobbyMutationFlow.ts`

**Steps:**
1. Write a RED test for `applyReplaySessionLobbyTransitionFromWeb` with injected `transition` and `getSummary` functions.
2. Assert it calls transition with `{ sessionId, lobbyState: action.targetLobbyState }`.
3. Assert it refreshes and returns the server summary after transition success.
4. Write a failure test that asserts exact thrown error copy is preserved.
5. Implement the minimal helper with default dependencies wired to existing browser client helpers.

## Task 4: RED/GREEN Match Lab integration

**Objective:** Add visible controls to Match Lab without duplicating policy.

**Files:**
- Modify: `src/web/MatchLab.tsx`
- Modify/Create: `tests/web/matchLabLobbyMutationControls.test.ts`

**Steps:**
1. Add a component-level static render test around `LobbyMutationControls` with Match Lab's live single-manager `in_match` summary if a full Match Lab interaction test is too heavy.
2. Update `MatchLab.tsx` to import `LobbyMutationControls` and `applyReplaySessionLobbyTransitionFromWeb`.
3. Add state for lobby transition pending/error.
4. Add `requestLobbyTransition(action)`:
   - require `replaySessionId`;
   - call `applyReplaySessionLobbyTransitionFromWeb({ sessionId: replaySessionId, action })`;
   - update `replaySessionSummary` with returned summary;
   - update `replaySessionStatus` with success copy;
   - display exact error copy on failure.
5. Render `LobbyMutationControls` beside the `LobbyStatusCard` when `lobbyStatus` exists.
6. Keep `/lobby-fixtures` unchanged.

## Task 5: Update guardrails, docs, missions, validation

**Objective:** Move the guard from pre-mutation to guarded-mutation rules.

**Files:**
- Modify: `tests/web/lobbyReadOnlyMutationGuards.test.ts`
- Modify: `scripts/run-mission-tests.ts`
- Create: `docs/51-production-visible-lobby-mutation-controls-contract.md`
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`

**Steps:**
1. Update guard tests so only fixture-gallery surfaces are forbidden from transition helper imports/buttons.
2. Add a positive guard asserting Match Lab uses `LobbyMutationControls` rather than inline lobby mutation button labels.
3. Add mission entries for mutation controls and transition flow.
4. Document P18J contract, validation, and next slice.
5. Run focused tests, mission suite, full suite, typecheck, build, browser smoke, and commit locally.
