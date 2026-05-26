# P18O Product Kickoff Readiness + Match Start Control Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Expose a product-facing `Kick off match` action on `/head-to-head-lobby` only after setup is locked, while keeping completion/rematch isolated for later slices.

**Architecture:** Reuse the existing server-owned lobby-state transition endpoint and repository transition contract. Add a product-specific browser kickoff flow that requests only `locked -> in_match`, refreshes the lobby summary, and preserves exact transition rejection copy.

**Tech Stack:** Next.js app router, React component state, TypeScript, Vitest, existing replay-session API/client helpers.

---

## Guardrails

- Do not add authentication, real invites, websockets, durable persistence migration, club selection, private tactic setup, match completion, or rematch.
- `/head-to-head-lobby` may render `Kick off match`, but only disabled/enabled according to the current server summary.
- `/head-to-head-lobby` must not render `Complete match`.
- `/head-to-head-lobby` must not import `LobbyMutationControls` or generic `applyReplaySessionLobbyTransitionFromWeb`.
- `/lobby-transition-harness` remains the full transition smoke harness.
- `/lobby-fixtures` remains read-only and button-free.

## Task 1: Product kickoff browser flow

**Objective:** Add a small product-specific helper for `locked -> in_match` and summary refresh.

**Files:**
- Create: `src/web/headToHeadLobbyKickoffFlow.ts`
- Create: `tests/web/headToHeadLobbyKickoffFlow.test.ts`

**TDD Steps:**
1. Write a failing test that calls `kickOffHeadToHeadMatchAndRefreshSummaryFromWeb` with injected transition/getSummary fakes.
2. Assert the transition is called with `{ sessionId, lobbyState: 'in_match' }`.
3. Assert `getSummary(sessionId)` is called after the transition and the returned summary has `lobbyState: 'in_match'`.
4. Add a rejection test proving exact thrown transition copy is preserved and no summary refresh happens.
5. Run RED: `npx vitest run tests/web/headToHeadLobbyKickoffFlow.test.ts`.
6. Implement the minimal helper.
7. Run GREEN with the same command.

## Task 2: Product route kickoff control

**Objective:** Render a guarded `Kick off match` button in `/head-to-head-lobby` only enabled when summary state is `locked`.

**Files:**
- Modify: `src/web/HeadToHeadLobbyEntry.tsx`
- Modify: `tests/web/headToHeadLobbyEntry.test.ts`

**TDD Steps:**
1. Update the render/source guard test to expect `Kick off match`, expect no `Complete match`, and require `kickOffHeadToHeadMatchAndRefreshSummaryFromWeb` import/use.
2. Keep source guards against `LobbyMutationControls` and `applyReplaySessionLobbyTransitionFromWeb`.
3. Run RED: `npx vitest run tests/web/headToHeadLobbyEntry.test.ts`.
4. Add `kickoffReady = summary?.lobbyState === 'locked'`.
5. Add `kickOffMatch()` handler that validates session ID, calls the product-specific kickoff helper, refreshes summary state, and sets success/failure copy.
6. Render a `Kick off match` card with disabled state unless `kickoffReady`.
7. Run GREEN with the same command.

## Task 3: Mission runner and docs

**Objective:** Make P18O part of repeatable validation and document the contract.

**Files:**
- Create: `docs/56-production-product-kickoff-control-contract.md`
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`
- Modify: `scripts/run-mission-tests.ts`

**Steps:**
1. Add MISSION 153 for product kickoff browser flow.
2. Add/update docs with route behavior, exact transition copy preservation, UI guardrails, and validation.
3. Update handoff latest slice and recommended next slice.

## Task 4: Validation and commit

**Commands:**

```bash
npx vitest run tests/web/headToHeadLobbyKickoffFlow.test.ts tests/web/headToHeadLobbyEntry.test.ts
npm run test:missions
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Browser smoke:

1. Start `npm run dev`.
2. Visit `/head-to-head-lobby`.
3. Create lobby, join away, verify `Kick off match` disabled before lock.
4. Lock setup, verify `Kick off match` enabled.
5. Kick off, verify state becomes in-match and `Complete match` is still absent.
6. Visit `/lobby-transition-harness` and confirm it still renders.
7. Visit `/lobby-fixtures` and confirm zero buttons.

Commit after validation:

```bash
git add ...
git commit -m "feat: add product kickoff control"
```
