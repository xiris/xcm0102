# P18W Private Setup Readiness Boundary Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Make local setup draft readiness explicitly advisory so browser-local `editing` / `ready_to_lock` state never appears to submit or gate server-owned setup lock.

**Architecture:** Add a pure browser view-model helper for readiness boundary copy, then wire it into `/head-to-head-lobby` as a read-only explainer beside the local draft controls. Keep server lock availability derived from existing action-copy/lobby summary and keep React as thin rendering.

**Tech Stack:** TypeScript, React/Next, Vitest, mission runner.

---

## Task 1: Add readiness-boundary contract tests

**Objective:** Prove the helper is absent with no lobby, treats `editing` as advisory while lock can remain available, handles `ready_to_lock` as non-submitted, handles unassigned local side, and has no persistence/API surface.

**Files:**
- Create: `tests/web/headToHeadPrivateSetupReadinessBoundary.test.ts`
- Create later: `src/web/headToHeadPrivateSetupReadinessBoundary.ts`

**Steps:**
1. Write tests importing `createHeadToHeadPrivateSetupReadinessBoundary` from the missing module.
2. Cover:
   - `summary: null` returns `null`.
   - setup with home+away assigned, local home draft `editing`, and `lockAvailable: true` returns title `Setup readiness boundary`, readiness `Still editing`, server label `Server lock remains available once both managers are assigned.`, advisory notice `Local readiness intent is advisory and never gates server-owned setup lock.`, and persistence notice `No private setup readiness is submitted, persisted, or synchronized yet.`
   - setup with draft `ready_to_lock` says `Ready to lock` and `Ready means local preview intent only; no setup has been submitted.`
   - selected unassigned away side says `Unassigned` and `Join this side before claiming local setup readiness.`
   - source lacks `fetch(`, replay-session API client imports, storage APIs, submit/save strings.
3. Run `npx vitest run tests/web/headToHeadPrivateSetupReadinessBoundary.test.ts` and verify RED because the module is missing.

## Task 2: Implement pure readiness-boundary helper

**Objective:** Make the new pure tests pass without adding API, repository, storage, or server mutation behavior.

**Files:**
- Create: `src/web/headToHeadPrivateSetupReadinessBoundary.ts`

**Steps:**
1. Define input type `{ summary, localSide, drafts, lockAvailable }`.
2. Reuse the draft shape from `headToHeadPrivateSetupSelectionState`.
3. Derive manager assignment from `summary.ownership.sides[localSide]`.
4. Derive default local draft when no draft exists.
5. Return copy for advisory readiness and server-owned lock status.
6. Run focused test and verify GREEN.

## Task 3: Wire the product route thinly

**Objective:** Render the read-only readiness boundary in `/head-to-head-lobby` without changing lock/kickoff/complete behavior.

**Files:**
- Modify: `src/web/HeadToHeadLobbyEntry.tsx`
- Modify: `tests/web/headToHeadLobbyEntry.test.ts`

**Steps:**
1. Extend the product route source-boundary test to require:
   - import/use of `createHeadToHeadPrivateSetupReadinessBoundary`;
   - wiring with `lockAvailable: actionCopy.lockSetup.enabled`;
   - rendered copy `Setup readiness boundary`, advisory notice, persistence notice;
   - no setup submit/save/storage/rematch controls.
2. Run route test and verify RED.
3. Import the helper, derive `privateSetupReadinessBoundary` with `useMemo`, and render a read-only article after draft controls.
4. Do not change existing lock button disabled logic.
5. Run route test and focused readiness tests; verify GREEN.

## Task 4: Update mission runner and docs

**Objective:** Add mission coverage and refresh the handoff/index docs.

**Files:**
- Modify: `scripts/run-mission-tests.ts`
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`

**Steps:**
1. Add MISSION 161 with readiness boundary, perspective switch, draft controls, selection state, shell, and product route tests.
2. Link `docs/64-production-private-setup-readiness-boundary-contract.md` and this plan in `docs/README.md`.
3. Update handoff latest slice to P18W, validation commands, expected mission count, observed validation placeholders, and recommended next slice.

## Task 5: Validate and browser smoke

**Objective:** Prove the slice is stable.

**Commands:**

```bash
npx vitest run tests/web/headToHeadPrivateSetupReadinessBoundary.test.ts tests/web/headToHeadPrivateSetupPerspectiveSwitch.test.ts tests/web/headToHeadPrivateSetupDraftControls.test.ts tests/web/headToHeadPrivateSetupSelectionState.test.ts tests/web/headToHeadPrivateSetupShell.test.ts tests/web/headToHeadLobbyEntry.test.ts
npm run test:missions
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Browser smoke:
- `/head-to-head-lobby`: create -> join -> keep readiness `Still editing` -> verify lock remains enabled -> switch/edit readiness -> lock -> kickoff -> complete -> report preview.
- `/lobby-transition-harness`: invalid direct kickoff rejection and setup -> locked -> in_match.
- `/lobby-fixtures`: button-free read-only gallery.
- Check browser console is clean.
- Check `git diff -- next-env.d.ts` before staging.

## Task 6: Commit locally

**Objective:** Save the completed local slice.

**Steps:**
1. Stage only intended source/docs/test/mission files.
2. Commit with `feat: add private setup readiness boundary`.
3. Verify `git status --short --branch` is clean apart from ahead count.
