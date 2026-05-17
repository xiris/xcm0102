# Visual Pitch Drag/Drop Assignment Implementation Plan

> **For Hermes:** Use test-driven-development skill to implement this plan task-by-task.

**Goal:** Turn the assignment UI into a football tactics board with pitch-positioned slots, drag/drop assignment, and Internazionale/Milan 2002 sample squads.

**Architecture:** Keep React thin. Add pure web helpers for squad fixtures, player swapping, duplicate prevention, and pitch view-model generation. The UI renders those helpers and keeps dropdowns as an accessible fallback.

**Tech Stack:** Next.js client component, TypeScript, Vitest, existing formation geometry.

---

## Task 1: Add Inter/Milan 2002 fixture squads

**Objective:** Replace generic Home/Away Player labels with historic sample names while preserving stable home-pN/away-pN ids required by the API.

**Files:**
- Modify: `src/web/assignmentState.ts`
- Test: `tests/web/assignmentState.test.ts`

**Steps:**
1. Write a failing test that `createSamplePlayers('home')` returns Internazionale 2002 names and `createSamplePlayers('away')` returns Milan 2002 names.
2. Run `npx vitest run tests/web/assignmentState.test.ts -t 'historic squad names'` and verify failure.
3. Add side-specific fixture arrays using stable ids.
4. Run the targeted test and verify pass.

## Task 2: Add swap assignment helper

**Objective:** Let drag/drop replace occupied slots by swapping the displaced player instead of creating duplicates.

**Files:**
- Modify: `src/web/assignmentState.ts`
- Test: `tests/web/assignmentState.test.ts`

**Steps:**
1. Write a failing test for `swapAssignment(state, sourceSlotId, targetSlotId)`.
2. Run targeted test and verify failure.
3. Implement pure helper by swapping assignment values.
4. Run targeted test and verify pass.

## Task 3: Add player-to-slot move helper

**Objective:** Allow dropping a roster player onto a slot while keeping assignments unique.

**Files:**
- Modify: `src/web/assignmentState.ts`
- Test: `tests/web/assignmentState.test.ts`

**Steps:**
1. Write failing tests for `movePlayerToSlot(state, playerId, targetSlotId)` with occupied and unoccupied source slots.
2. Verify failure.
3. Implement helper by finding the player’s current slot and swapping/replacing as needed.
4. Verify pass.

## Task 4: Add pitch board view model

**Objective:** Convert formation geometry plus assignment state into renderable positioned pitch markers.

**Files:**
- Create: `src/web/pitchAssignmentViewModel.ts`
- Create: `tests/web/pitchAssignmentViewModel.test.ts`

**Steps:**
1. Write failing tests that a 4-1-3-2 board has 11 markers with CSS left/top percentages, role labels, player names, and suitability state.
2. Verify failure.
3. Implement `createPitchAssignmentViewModel(state)`.
4. Verify pass.

## Task 5: Render visual pitch and drag/drop

**Objective:** Add a green pitch board above the dropdown list for each team.

**Files:**
- Modify: `src/web/MatchLab.tsx`
- Modify: `app/globals.css`

**Steps:**
1. Use existing helper tests to keep production behavior covered.
2. Render pitch markers using `draggable`, `onDragStart`, `onDragOver`, and `onDrop`.
3. Add a roster rail grouped by current sample squad order.
4. Keep dropdowns below the pitch as fallback.
5. Browser-verify markers are visible and dragging/swapping updates names and warnings.

## Task 6: Add docs and mission tests

**Objective:** Document the visual assignment contract and keep mission tests one-by-one.

**Files:**
- Create: `docs/18-production-visual-pitch-assignment-contract.md`
- Modify: `docs/README.md`
- Modify: `scripts/run-mission-tests.ts`

**Steps:**
1. Add mission entries for squad fixtures, swap helpers, move helper, and pitch board view model.
2. Add contract doc covering drag/drop, dropdown fallback, duplicate prevention, and Inter/Milan sample squads.
3. Run docs verification script.

## Final verification

Run:

```bash
npm run test:missions
npm test
npx tsc --noEmit
npm run build
```

Browser check:

- Open `http://localhost:3000`.
- Verify Inter/Milan names are visible.
- Verify pitch boards are visible.
- Drag one marker onto another slot and verify names swap.
- Use dropdown fallback and verify preview updates.
- Verify console has no JS errors.

Commit:

```bash
git add .
git commit -m "feat: add visual pitch assignment board"
```
