# P18P Product Match Completion + Result Closure Control Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Expose a guarded product-facing `Complete match` action on `/head-to-head-lobby` only after kickoff has put the lobby in match.

**Architecture:** Reuse the existing server-owned lobby-state endpoint and repository transition chain. Add a product-specific browser completion flow that requests only `in_match -> complete`, refreshes the lobby summary, and preserves exact transition rejection copy. Keep rematch/private tactic setup/durable multiplayer persistence out of this slice.

**Tech Stack:** Next.js app router, React component state, TypeScript, Vitest, existing replay-session API/client helpers.

---

## Guardrails

- Do not add authentication, real invites, websockets, durable persistence migration, club selection, private tactic setup, or rematch.
- `/head-to-head-lobby` may render `Complete match`, but only when the current server summary is `in_match`.
- `/head-to-head-lobby` must not render rematch controls.
- `/head-to-head-lobby` must not import `LobbyMutationControls` or generic `applyReplaySessionLobbyTransitionFromWeb`.
- `/lobby-transition-harness` remains the full transition smoke harness.
- `/lobby-fixtures` remains read-only and button-free.

## Task 1: Product completion browser flow

**Objective:** Add a small product-specific helper for `in_match -> complete` and summary refresh.

**Files:**
- Create: `src/web/headToHeadLobbyCompletionFlow.ts`
- Create: `tests/web/headToHeadLobbyCompletionFlow.test.ts`

**TDD Steps:**
1. Write a failing test that calls `completeHeadToHeadMatchAndRefreshSummaryFromWeb` with injected transition/getSummary fakes.
2. Assert the transition is called with `{ sessionId, lobbyState: 'complete' }`.
3. Assert `getSummary(sessionId)` is called after the transition and the returned summary has `lobbyState: 'complete'`.
4. Add a rejection test proving exact premature-completion copy is preserved and no summary refresh happens.
5. Run RED: `npx vitest run tests/web/headToHeadLobbyCompletionFlow.test.ts`.
6. Implement the minimal helper.
7. Run GREEN with the same command.

## Task 2: Product route completion control

**Objective:** Render a guarded `Complete match` action in `/head-to-head-lobby` only when summary state is `in_match`.

**Files:**
- Modify: `src/web/HeadToHeadLobbyEntry.tsx`
- Modify: `tests/web/headToHeadLobbyEntry.test.ts`
- Modify: `src/web/headToHeadLobbyModel.ts`
- Modify: `tests/web/headToHeadLobbyModel.test.ts`

**TDD Steps:**
1. Update the route source guard test to require `completeHeadToHeadMatchAndRefreshSummaryFromWeb` import/use and to reject `Rematch`.
2. Keep source guards against `LobbyMutationControls` and `applyReplaySessionLobbyTransitionFromWeb`.
3. Run RED: `npx vitest run tests/web/headToHeadLobbyEntry.test.ts`.
4. Add `completionReady = summary?.lobbyState === 'in_match'`.
5. Add `completeMatch()` handler that validates session ID, calls the product-specific completion helper, refreshes summary state, and sets success/failure copy.
6. Render a `Complete match` card only when `completionReady` is true.
7. Update read-model copy to say completion is supported while rematch remains isolated.
8. Run GREEN for entry/model tests.

## Task 3: Mission runner and docs

**Objective:** Make P18P repeatable and document the contract.

**Files:**
- Create: `docs/57-production-product-completion-control-contract.md`
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`
- Modify: `scripts/run-mission-tests.ts`

**Steps:**
1. Add MISSION 154 for product completion browser flow.
2. Add/update docs with route behavior, exact transition copy preservation, UI guardrails, and validation.
3. Update handoff latest slice and recommended next slice.

## Task 4: Validation and commit

**Commands:**

```bash
npx vitest run tests/web/headToHeadLobbyCompletionFlow.test.ts tests/web/headToHeadLobbyModel.test.ts tests/web/headToHeadLobbyEntry.test.ts
npm run test:missions
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Browser smoke:

1. Start `npm run dev`.
2. Visit `/head-to-head-lobby`.
3. Create lobby, join away, lock setup, kick off.
4. Verify `Complete match` appears only once the lobby is `in_match`.
5. Complete match and verify the lobby reaches `COMPLETE`.
6. Verify no rematch control exists.
7. Visit `/lobby-transition-harness` and confirm it still renders.
8. Visit `/lobby-fixtures` and confirm zero buttons.

Commit after validation:

```bash
git add ...
git commit -m "feat: add product completion control"
```
