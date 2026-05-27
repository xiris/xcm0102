# P18V Private Setup Perspective Switch Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Add a local-only perspective switch for the private setup shell so home/away browser viewpoints can be exercised without persistence or account semantics.

**Architecture:** Add a pure perspective-switch view model, wire it thinly into `/head-to-head-lobby`, and pass the selected local side into the existing draft controls and shell. Keep server transitions and draft storage unchanged.

**Tech Stack:** TypeScript, React/Next.js app route, Vitest, existing mission runner.

---

## Task 1: Document the contract

**Objective:** Preserve the P18V boundary before code.

**Files:**
- Create: `docs/63-production-private-setup-perspective-switch-contract.md`
- Create: `docs/plans/2026-05-27-private-setup-perspective-switch.md`

**Steps:**
1. Define local-only perspective switch purpose.
2. List state behavior for no lobby, home-only setup, both assigned setup, locked, in-match, and complete.
3. List non-goals: no persistence, no accounts/auth, no server transition changes, no submit/save/rematch/restart/new-match controls.
4. Record validation commands and browser smoke expectations.

## Task 2: RED pure perspective helper tests

**Objective:** Specify the new local-only perspective switch helper before implementation.

**Files:**
- Create test: `tests/web/headToHeadPrivateSetupPerspectiveSwitch.test.ts`
- Create implementation later: `src/web/headToHeadPrivateSetupPerspectiveSwitch.ts`

**Steps:**
1. Write tests importing `createHeadToHeadPrivateSetupPerspectiveSwitch`.
2. Assert `summary: null` returns `null`.
3. Assert setup home-only summary returns assigned home and unassigned away options plus required privacy copy.
4. Assert both-assigned away perspective marks away selected and labels both managers.
5. Assert helper source has no fetch/storage/submit/save language.
6. Run: `npx vitest run tests/web/headToHeadPrivateSetupPerspectiveSwitch.test.ts`
7. Expected RED: module import fails because implementation does not exist.

## Task 3: GREEN pure perspective helper

**Objective:** Implement the minimal pure helper.

**Files:**
- Create: `src/web/headToHeadPrivateSetupPerspectiveSwitch.ts`

**Steps:**
1. Add exported input, option, and view-model types.
2. Implement `createHeadToHeadPrivateSetupPerspectiveSwitch` from `ReplaySessionLobbySummary | null` plus `localSide`.
3. Return home/away option rows with side, label, managerLabel, assigned, and selected.
4. Include exact copy:
   - `Perspective only changes this browser preview.`
   - `No account or permission claim is made by this switch.`
5. Run focused test and verify GREEN.

## Task 4: RED product route source tests

**Objective:** Specify route wiring and guardrails before React changes.

**Files:**
- Modify test: `tests/web/headToHeadLobbyEntry.test.ts`

**Steps:**
1. Assert `HeadToHeadLobbyEntry.tsx` imports `createHeadToHeadPrivateSetupPerspectiveSwitch`.
2. Assert it keeps selected local side in React state and passes it to both `createHeadToHeadPrivateSetupDraftControls` and `createHeadToHeadPrivateSetupShell`.
3. Assert the source contains `Local private setup perspective`, `Perspective only changes this browser preview`, and not `localStorage` / `sessionStorage` / `Submit setup` / `Save setup`.
4. Run: `npx vitest run tests/web/headToHeadLobbyEntry.test.ts`
5. Expected RED: missing route wiring strings.

## Task 5: GREEN product route wiring

**Objective:** Render a component-local perspective select and feed the selected side into existing helpers.

**Files:**
- Modify: `src/web/HeadToHeadLobbyEntry.tsx`

**Steps:**
1. Import `type MatchSide` from the API model if needed.
2. Add `const [localSetupSide, setLocalSetupSide] = useState<MatchSide>('home')`.
3. Derive `privateSetupPerspectiveSwitch` with `useMemo`.
4. Pass `localSetupSide` into `createHeadToHeadPrivateSetupDraftControls` and `createHeadToHeadPrivateSetupShell`.
5. Render a native select labeled `Local perspective` near the private setup shell.
6. Keep draft controls unchanged except they now target whichever local side is selected.
7. Run focused tests and verify GREEN.

## Task 6: Mission runner and docs update

**Objective:** Preserve mission-labelled validation and handoff accuracy.

**Files:**
- Modify: `scripts/run-mission-tests.ts`
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`

**Steps:**
1. Add MISSION 160 for perspective switch coverage.
2. Link the new contract and plan from docs README.
3. Update latest slice summary to P18V.
4. Set validation observations to pending before final validation, then replace with observed results.

## Task 7: Full validation and browser smoke

**Objective:** Prove correctness before commit.

**Commands:**
```bash
npx vitest run tests/web/headToHeadPrivateSetupPerspectiveSwitch.test.ts tests/web/headToHeadPrivateSetupDraftControls.test.ts tests/web/headToHeadPrivateSetupSelectionState.test.ts tests/web/headToHeadPrivateSetupShell.test.ts tests/web/headToHeadLobbyEntry.test.ts
npm run test:missions
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Browser smoke:
1. `/head-to-head-lobby`: create lobby, join away, switch perspective to away, edit away draft controls, verify away labels update and home is redacted before lock.
2. Switch back to home, verify home labels and away redaction.
3. Lock, kickoff, complete, verify controls are read-only and report preview appears.
4. `/lobby-transition-harness`: invalid direct kickoff rejection plus setup -> locked -> in_match.
5. `/lobby-fixtures`: zero buttons.
6. Browser console clean.

## Task 8: Commit

**Objective:** Save the completed slice locally.

**Steps:**
1. Revert generated-only `next-env.d.ts` churn if present.
2. Stage all P18V docs/tests/source/mission changes.
3. Commit: `git commit -m "feat: add private setup perspective switch"`.
4. Verify `git status --short --branch` is clean and ahead count increased.
