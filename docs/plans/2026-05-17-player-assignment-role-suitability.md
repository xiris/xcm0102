# Player Assignment and Role Suitability Implementation Plan

> **For Hermes:** Use test-driven-development skill to implement this plan task-by-task.

**Goal:** Make formation slots connect to actual players and introduce role-suitability consequences without building a full squad-management screen yet.

**Architecture:** Add a pure role-suitability module in the simulation layer. Extend tactic books with slot assignments generated from formation geometry and team player ids. The match engine evaluates assigned players against slot roles and applies an execution/fatigue/diagnostic effect. The browser preview formats assigned slot labels only; it does not own match logic.

**Tech Stack:** TypeScript, Vitest, Next.js/React, existing simulation/domain modules.

---

## Acceptance Criteria

- Tactic books include stable slot assignments from formation slot ids to player ids.
- Role suitability can score natural, adjacent, and mismatched player/slot combinations.
- Out-of-position assignments reduce team execution and can increase fatigue/transition risk.
- Diagnostics report meaningful role-mismatch warnings.
- Browser formation preview can show player names beside slot labels.
- Docs describe the assignment contract and current limits.
- Mission tests cover suitability scoring, assignment generation, simulation impact, web preview formatting, and docs links.

## Task 1: TDD Role Suitability Module

**Files:**
- Create: `tests/simulation/roleSuitability.test.ts`
- Create: `src/simulation/roleSuitability.ts`

**Steps:**
1. Write tests for natural, adjacent, and mismatch scores.
2. Run `npx vitest run tests/simulation/roleSuitability.test.ts` and verify RED.
3. Implement `scoreRoleSuitability()` and `summarizeRoleSuitability()`.
4. Run the test and verify GREEN.

## Task 2: TDD Tactic Assignments

**Files:**
- Modify: `src/simulation/domain.ts`
- Modify: `src/simulation/sampleData.ts`
- Modify: `tests/simulation/sampleData.test.ts`

**Steps:**
1. Add failing tests that sample tactics assign each formation slot to a real player id.
2. Add a test proving manual assignments are preserved.
3. Extend `TacticBook` with `assignments: Record<string, string>`.
4. Generate default assignments by formation slot order.
5. Run targeted tests and verify GREEN.

## Task 3: TDD Simulation Suitability Effects

**Files:**
- Modify: `src/simulation/simulateMatch.ts`
- Modify: `tests/simulation/simulateMatch.test.ts`

**Steps:**
1. Add failing tests proving role mismatches lower execution and add diagnostics.
2. Integrate role-suitability summary into team evaluation.
3. Run targeted tests and verify GREEN.

## Task 4: TDD Browser Assignment Preview

**Files:**
- Modify: `src/web/formationPreview.ts`
- Modify: `tests/web/formationPreview.test.ts`
- Modify: `src/web/MatchLab.tsx`

**Steps:**
1. Add failing tests for slot labels including player names when supplied.
2. Add a default browser sample roster/assignment display for selected formations.
3. Render assigned player names in the formation preview card.
4. Run targeted tests, typecheck, and build.

## Task 5: Mission Coverage and Docs

**Files:**
- Modify: `scripts/run-mission-tests.ts`
- Create: `docs/16-production-player-assignment-contract.md`
- Modify: `docs/README.md`

**Steps:**
1. Add missions 29+ for role suitability, assignment generation, mismatch simulation effect, and web preview assignments.
2. Document assignment ownership, scoring model, effects, and current limits.
3. Link the docs and plan from docs index.
4. Verify docs links with a script.

## Task 6: Final Verification and Commit

**Commands:**
- `npm run test:missions`
- `npm test`
- `npx tsc --noEmit`
- `npm run build`
- `git status --short`
- `git add .`
- `git commit -m "feat: add player assignment role suitability"`
