# Interactive Match Timeline Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Add the first interactive matchday loop so the user can reveal a deterministic match in key-event chunks instead of only reading the full report.

**Architecture:** Keep the match engine server-authoritative and deterministic. P13 introduces a pure timeline slicer that can reveal events to the next pause-worthy moment, compute score so far, and expose available manager actions. The first UI layer replays the already-simulated deterministic match progressively; future P14/P15 work can make actions alter the remaining simulation.

**Tech Stack:** TypeScript, Vitest, Next.js App Router, React client component.

---

## Task 1: Pure interactive timeline engine

**Objective:** Reveal a full deterministic `MatchResult` up to the next key event.

**Files:**
- Create: `src/simulation/interactiveTimeline.ts`
- Create: `tests/simulation/interactiveTimeline.test.ts`

**Steps:**
1. Write tests for `createInteractiveMatchState()` starting at minute 0 and stopping at the first pause event.
2. Write tests for continuing from a paused minute to the next pause event.
3. Write tests for score-so-far being derived only from revealed goal events.
4. Write tests for available actions at fatigue/injury/substitution/card events.
5. Implement minimal pure functions.

## Task 2: Web view-model helper

**Objective:** Format interactive replay state for browser rendering.

**Files:**
- Create: `src/web/interactiveReplayViewModel.ts`
- Create: `tests/web/interactiveReplayViewModel.test.ts`

**Steps:**
1. Write tests for title, score, status, action labels, and event formatting.
2. Implement formatting helper.

## Task 3: Browser integration

**Objective:** Add buttons to start/continue/show full interactive replay after a match is run.

**Files:**
- Modify: `src/web/MatchLab.tsx`

**Steps:**
1. Add local state for interactive minute and mode.
2. After `Run match`, reset interactive mode.
3. Render full Events by default to preserve current behavior.
4. Add `Start interactive replay`, `Continue to next key event`, and `Show full match` controls.
5. Render interactive events and available manager actions when interactive mode is active.

## Task 4: Documentation and missions

**Objective:** Document the P13 contract and add mission coverage.

**Files:**
- Create: `docs/25-production-interactive-match-timeline-contract.md`
- Modify: `docs/README.md`
- Modify: `scripts/run-mission-tests.ts`

**Steps:**
1. Document the current progressive replay model and limitations.
2. Add mission tests for timeline pause, continue, score-so-far, available actions, and web formatting.
3. Run mission tests, full suite, typecheck, build, and browser verification.
