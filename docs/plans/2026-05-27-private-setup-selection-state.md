# P18T Private Setup Selection State Contract Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Add a pure private setup selection-state contract that can preview local club/tactic/readiness intent without persisting hidden competitive setup or revealing opponent detail.

**Architecture:** Implement a typed pure view-model helper in `src/web/`, test it independently, then let the existing private setup shell surface safe selection labels. Keep React wiring read-only and keep server transition rules unchanged.

**Tech Stack:** TypeScript, Next.js, React, Vitest, existing replay-session lobby summary and private setup shell helpers.

---

## Scope

- Add `createHeadToHeadPrivateSetupSelectionState` as a pure helper.
- Model side-scoped draft inputs for sample club, tactic shell, and readiness intent.
- Redact opponent details before lock while allowing local side preview detail.
- Add selection labels to the existing private setup shell cards.
- Preserve existing create, join, lock, kickoff, complete, and report-preview behavior.

## Non-goals

- No actual club selection mutation.
- No hidden lineup/tactic persistence.
- No accounts, invite permissions, websockets, or durable DB persistence.
- No rematch/restart/new-match controls.
- No full report page.
- No server transition rule changes.

## Task 1: Add private setup selection-state tests

**Objective:** Define pure selection privacy/readiness behavior before production code exists.

**Files:**
- Create: `tests/web/headToHeadPrivateSetupSelectionState.test.ts`
- Create later: `src/web/headToHeadPrivateSetupSelectionState.ts`

**TDD steps:**
1. Test that `null` summary returns `null`.
2. Test that local home draft details are visible pre-lock while away opponent details are hidden.
3. Test that away local perspective mirrors privacy: away sees away draft detail and hides home detail.
4. Test that missing local draft falls back to safe sample defaults and `Not submitted`.
5. Test locked/in-match/complete status copy without exposing real hidden persistence.
6. Run `npx vitest run tests/web/headToHeadPrivateSetupSelectionState.test.ts` and verify RED from missing module.

## Task 2: Implement the pure selection helper

**Objective:** Add the minimal typed helper that satisfies the selection-state tests.

**Files:**
- Create: `src/web/headToHeadPrivateSetupSelectionState.ts`

**TDD steps:**
1. Implement sample club and tactic shell catalogs.
2. Implement draft input and view model types.
3. Derive two side cards from the public summary, local side, and optional drafts.
4. Redact opponent details before lock.
5. Rerun focused tests and verify GREEN.

## Task 3: Surface selection labels in the private setup shell

**Objective:** Reuse the selection-state helper from the existing shell without adding controls.

**Files:**
- Modify: `src/web/headToHeadPrivateSetupShell.ts`
- Modify: `src/web/HeadToHeadLobbyEntry.tsx`
- Modify: `tests/web/headToHeadPrivateSetupShell.test.ts`
- Modify: `tests/web/headToHeadLobbyEntry.test.ts`

**TDD steps:**
1. Extend shell tests to expect selection rows and hidden opponent copy before lock.
2. Run focused shell tests and verify RED.
3. Add optional selection state to shell cards.
4. Render selection rows in `/head-to-head-lobby`.
5. Rerun focused tests and verify GREEN.

## Task 4: Mission runner, docs, validation, browser smoke, commit

**Objective:** Record the contract, add mission coverage, and verify the complete slice.

**Files:**
- Create: `docs/61-production-private-setup-selection-state-contract.md`
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`
- Modify: `scripts/run-mission-tests.ts`

**Validation commands:**

```bash
npx vitest run tests/web/headToHeadPrivateSetupSelectionState.test.ts tests/web/headToHeadPrivateSetupShell.test.ts tests/web/headToHeadLobbyEntry.test.ts
npm run test:missions
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Browser smoke:
- `/head-to-head-lobby`: create, join, verify private setup selection preview labels and opponent hidden-state copy, then lock, kickoff, complete, and verify report preview.
- Verify no setup mutation/rematch/restart/new-match buttons are present.
- `/lobby-transition-harness`: still advances through guarded transitions.
- `/lobby-fixtures`: remains button-free.

Commit:

```bash
git add <changed files>
git commit -m "feat: add private setup selection state"
```
