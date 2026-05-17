# Interactive Assignment UI Implementation Plan

> **For Hermes:** Use test-driven-development skill to implement this plan task-by-task.

**Goal:** Let users change player-slot assignments from the browser instead of only seeing static generated slot labels.

**Architecture:** Keep match outcomes server-authoritative. The browser owns local assignment UI state and sends explicit assignment maps to the API. The API validates assignment shapes against formation slots and generated sample team player ids, then passes valid assignments into the simulation tactic books.

**Tech Stack:** TypeScript, Vitest, Next.js/React, existing simulation/domain modules.

---

## Acceptance Criteria

- Match Lab shows a dropdown selector for each visible formation slot.
- Changing a slot selector updates the formation preview immediately.
- Browser payload includes home and away assignment maps.
- API accepts valid explicit assignment maps and applies them to tactic books.
- API rejects unknown slot ids, unknown player ids, missing slot assignments, and duplicate player assignments.
- Role mismatch warnings are visible before running the match.
- Mission tests cover assignment state, payload mapping, API validation/application, and web preview labels.
- Docs describe the UI/API contract and current drag/drop limit.

## Task 1: Assignment state helpers

**Files:**
- Create: `src/web/assignmentState.ts`
- Create: `tests/web/assignmentState.test.ts`

**Steps:**
1. Write failing tests for creating default assignment state from a formation and side.
2. Write failing tests for resetting assignments when formation changes.
3. Implement pure helpers: `createSamplePlayers`, `createDefaultAssignments`, `createAssignmentState`, `replaceAssignment`.
4. Run targeted tests.

## Task 2: Browser payload mapping

**Files:**
- Modify: `src/web/simulationClient.ts`
- Modify: `src/web/tacticalPayload.ts`
- Modify: `tests/web/tacticalPayload.test.ts`

**Steps:**
1. Write failing tests proving homeAssignments and awayAssignments are carried in the request payload.
2. Extend request type and default payload.
3. Run targeted tests.

## Task 3: API assignment validation and application

**Files:**
- Modify: `src/api/simulationEndpoint.ts`
- Modify: `tests/api/server.test.ts`

**Steps:**
1. Write failing tests for API accepting valid assignments and producing mismatch diagnostics.
2. Write failing tests for rejecting duplicate/unknown/missing assignment maps.
3. Implement validation against generated team players and selected formation geometry.
4. Pass valid assignments into `createSampleTacticBook`.
5. Run targeted tests.

## Task 4: Slot dropdown UI and mismatch warnings

**Files:**
- Modify: `src/web/MatchLab.tsx`
- Modify: `src/web/formationPreview.ts`
- Add/modify tests as pure helper coverage permits.

**Steps:**
1. Render assignment selectors per formation slot.
2. Update local assignment state on change.
3. Pass assignments into `createFormationPreview` and simulation payload.
4. Add visible role mismatch warning text using existing role suitability scoring.
5. Verify in browser with hard refresh.

## Task 5: Docs, missions, final verification

**Files:**
- Modify: `scripts/run-mission-tests.ts`
- Create: `docs/17-production-interactive-assignment-contract.md`
- Modify: `docs/README.md`

**Commands:**
- `npm run test:missions`
- `npm test`
- `npx tsc --noEmit`
- `npm run build`
- browser verification at `http://127.0.0.1:3000`
- `git add . && git commit -m "feat: add interactive slot assignments"`
