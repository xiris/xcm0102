# Manager Commands During Interactive Replay Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Let the user record manager decisions at interactive match pause points without changing the deterministic match outcome yet.

**Architecture:** Add a pure command-history module first. Commands are deterministic records tied to the current pause minute/event/action label. The browser renders manager action labels as buttons, records selected commands, and shows a command timeline. P14 remains non-mutating; P15 can make command history affect future simulation state.

**Tech Stack:** TypeScript, Vitest, Next.js App Router, React client component.

---

## Task 1: Manager command domain helper

**Objective:** Convert a selected pause action into a durable command-history record.

**Files:**
- Create: `src/simulation/managerCommands.ts`
- Create: `tests/simulation/managerCommands.test.ts`

**Steps:**
1. Write failing tests for deterministic command IDs, minute/event capture, no-op continue filtering, and command history append ordering.
2. Run the test and verify it fails because the module is missing.
3. Implement `createManagerCommand()` and `appendManagerCommand()`.
4. Run the test and verify it passes.

## Task 2: Interactive replay view model command formatting

**Objective:** Format command history for the replay panel.

**Files:**
- Modify: `src/web/interactiveReplayViewModel.ts`
- Modify: `tests/web/interactiveReplayViewModel.test.ts`

**Steps:**
1. Write failing test for command timeline formatting.
2. Run the test and verify it fails because the view model omits commands.
3. Add `commands` output to the view model.
4. Run the test and verify it passes.

## Task 3: Browser command recording

**Objective:** Render manager options as buttons that append command history.

**Files:**
- Modify: `src/web/MatchLab.tsx`

**Steps:**
1. Add `managerCommands` state.
2. Reset command history when running a new match or restarting interactive replay.
3. Render action labels as buttons.
4. On click, create/append a command unless the action is `Continue`.
5. Display command history in the result grid.

## Task 4: Documentation and missions

**Objective:** Document P14 and protect command behavior with missions.

**Files:**
- Create: `docs/26-production-manager-commands-contract.md`
- Modify: `docs/README.md`
- Modify: `scripts/run-mission-tests.ts`

**Steps:**
1. Document command records, current non-mutating limitation, and P15 transition.
2. Add mission tests for command creation, no-op filtering, append ordering, and web formatting.
3. Run mission tests, full suite, typecheck, build, and browser verification.
