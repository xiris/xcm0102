# Formation Geometry Foundation Implementation Plan

> **For Hermes:** Use test-driven-development skill to implement this plan task-by-task.

**Goal:** Make formations produce distinct pitch geometry and movement-load profiles while preserving the server-authoritative simulation boundary.

**Architecture:** Add a pure formation geometry module that maps each supported formation to 11 slot coordinates plus width/depth metadata. Wire the sample tactic-book builder to generate WIB/WOB maps from those formation slots and movement presets. Add a browser view model that previews formation shape without duplicating simulation rules.

**Tech Stack:** TypeScript, Vitest, Next.js/React, existing simulation/domain modules.

---

## Acceptance Criteria

- Each supported formation returns 11 named slots with normalized pitch coordinates.
- Formation profiles expose width and depth ratings for browser/documentation use.
- Sample tactic books use formation geometry to create distinct WIB/WOB maps.
- Different formations produce different movement-load profiles in simulation stats.
- Browser Match Lab displays a simple formation profile/shape preview for the selected formations.
- Docs describe the formation geometry contract and current limits.
- Mission tests include formation slot counts, formation-specific map geometry, simulation impact, and web preview formatting.

## Task 1: TDD Formation Geometry Module

**Objective:** Define formation geometry as a pure, reusable simulation module.

**Files:**
- Create: `tests/simulation/formationGeometry.test.ts`
- Create: `src/simulation/formationGeometry.ts`

**Steps:**
1. Add failing tests that:
   - `getFormationGeometry('4-4-2')` returns 11 slots.
   - `getFormationGeometry('4-1-3-2')` includes a DM slot and two forwards.
   - `getFormationGeometry('5-3-2')` is deeper/narrower than `4-3-3`.
2. Run `npx vitest run tests/simulation/formationGeometry.test.ts` and verify RED.
3. Implement minimal formation geometry definitions and helper functions.
4. Run the same test and verify GREEN.

## Task 2: TDD Tactic Map Integration

**Objective:** Use formation geometry when creating WIB/WOB maps.

**Files:**
- Modify: `tests/simulation/sampleData.test.ts`
- Modify: `src/simulation/sampleData.ts`

**Steps:**
1. Add failing tests that:
   - 4-1-3-2 and 5-3-2 produce different MID_CENTER points.
   - compact movement has smaller average recovery distance than extreme movement for the same formation.
2. Run `npx vitest run tests/simulation/sampleData.test.ts -t 'formation'` and verify RED.
3. Replace index-only point generation with formation-slot based point generation.
4. Run the same test and verify GREEN.

## Task 3: TDD Formation Simulation Impact

**Objective:** Prove formation geometry affects server-owned simulation stats.

**Files:**
- Modify: `tests/simulation/simulateMatch.test.ts`

**Steps:**
1. Add a failing test that two otherwise identical matches with different formations produce different home `movementLoad` or `transitionDelay`.
2. Run `npx vitest run tests/simulation/simulateMatch.test.ts -t 'formation geometry'` and verify RED.
3. Adjust geometry integration only if Task 2 does not already satisfy the test.
4. Run the same test and verify GREEN.

## Task 4: TDD Browser Formation Preview

**Objective:** Expose formation shape in the browser without owning match logic.

**Files:**
- Create: `tests/web/formationPreview.test.ts`
- Create: `src/web/formationPreview.ts`
- Modify: `src/web/MatchLab.tsx`
- Modify: `app/globals.css`

**Steps:**
1. Add failing tests that:
   - preview for 4-1-3-2 reports 11 slots and includes width/depth labels.
   - preview labels include GK, DM, and F lines where appropriate.
2. Run `npx vitest run tests/web/formationPreview.test.ts` and verify RED.
3. Implement web preview formatting using the simulation geometry module.
4. Render a compact preview for home and away selections in Match Lab.
5. Run test, typecheck, and build.

## Task 5: Mission Coverage and Docs

**Objective:** Preserve mission validation and documentation-as-you-go.

**Files:**
- Modify: `scripts/run-mission-tests.ts`
- Create: `docs/15-production-formation-geometry-contract.md`
- Modify: `docs/README.md`

**Steps:**
1. Add missions for formation geometry, tactic-map integration, simulation impact, and web preview.
2. Document supported formation profiles, coordinate model, server-authoritative limits, and next steps.
3. Link the docs file and plan from `docs/README.md`.
4. Verify docs links with a script.

## Task 6: Final Verification and Commit

**Objective:** Verify and checkpoint P4.

**Commands:**
- `npm run test:missions`
- `npm test`
- `npx tsc --noEmit`
- `npm run build`
- `git status --short`
- `git add .`
- `git commit -m "feat: add formation geometry foundation"`

**Expected:** All checks pass and git status is clean after commit.
