# P18K Lobby Transition Harness + Rejection UX Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Add a small browser-visible lobby transition harness that creates a server-backed head-to-head setup replay session, exercises setup -> locked -> in_match through existing mutation controls, and shows exact server rejection copy for an invalid direct setup -> in_match transition.

**Architecture:** Keep `/lobby-fixtures` read-only. Add a separate `/lobby-transition-harness` route and client component for write-capable smoke coverage. Use a pure helper to build the head-to-head setup-session create request, then reuse `LobbyMutationControls` and `applyReplaySessionLobbyTransitionFromWeb` for all server-owned transition attempts.

**Tech Stack:** Next.js app router, React client component, TypeScript, Vitest, existing replay-session API/client helpers.

---

## Task 1: Pure setup-session harness request

**Objective:** Create a typed helper that builds the server-backed head-to-head setup replay-session request used by the browser harness.

**Files:**
- Create: `src/web/lobbyTransitionHarnessModel.ts`
- Create: `tests/web/lobbyTransitionHarnessModel.test.ts`
- Modify: `src/web/replaySessionClient.ts`

**TDD:**
1. RED: test imports `createLobbyTransitionHarnessSetupRequest` and expects default tactical payload plus `ownership.mode = head_to_head`, `ownership.lobbyState = setup`, both manager sides, and `currentMinute = 0`.
2. GREEN: implement the helper using `defaultTacticalState` and allow `ownership` on `WebReplaySessionCreateRequest`.
3. Verify with focused Vitest.

## Task 2: Browser harness route and client component

**Objective:** Add `/lobby-transition-harness` that can create a real server-backed setup lobby, render lobby status and mutation controls, and expose an explicit invalid kickoff attempt for rejection UX.

**Files:**
- Create: `src/web/LobbyTransitionHarness.tsx`
- Create: `app/lobby-transition-harness/page.tsx`
- Create: `tests/web/lobbyTransitionHarness.test.ts`

**TDD:**
1. RED: source/markup test expects route/component wiring, `Create setup lobby`, `Try invalid kickoff`, `LobbyMutationControls`, and `applyReplaySessionLobbyTransitionFromWeb` usage.
2. GREEN: implement client component with state for summary, pending action, and exact status/error copy.
3. Verify focused Vitest.

## Task 3: Rejection copy and read-only guard preservation

**Objective:** Ensure the harness preserves exact server rejection copy while `/lobby-fixtures` stays read-only.

**Files:**
- Modify: `tests/web/lobbyMutationFlow.test.ts`
- Modify: `tests/web/lobbyReadOnlyMutationGuards.test.ts` if needed

**TDD:**
1. RED: add focused flow coverage for setup direct kickoff rejection copy if not already covered by equivalent invalid transition behavior.
2. GREEN: reuse existing mutation flow behavior; avoid broad wrapping.
3. Verify focused tests.

## Task 4: Mission runner + docs

**Objective:** Add mission coverage and document the P18K contract.

**Files:**
- Modify: `scripts/run-mission-tests.ts`
- Create: `docs/52-production-lobby-transition-harness-contract.md`
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`

**Validation:**
- Focused mission tests for new harness model/component/flow.
- `npm run test:missions`
- `npm test`
- `npx tsc --noEmit`
- `npm run build`
- Browser smoke:
  - `/lobby-transition-harness`: create setup lobby, click invalid kickoff and verify exact rejection copy, click lock setup, click kick off match.
  - `/lobby-fixtures`: verify button-free read-only gallery.
- `git diff --check`

## Acceptance Criteria

- `/lobby-transition-harness` is the only new write-capable route.
- `/lobby-fixtures` remains read-only and button-free.
- Setup -> locked and locked -> in_match success paths are browser-smokeable.
- Direct setup -> in_match rejection displays exact server/client error copy.
- Mission count increases and all validation passes.
