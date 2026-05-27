# P18U Private Setup Draft Controls Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Add local-only browser controls for private setup draft previews without server persistence, opponent reveal, or lobby transition changes.

**Architecture:** Add a pure draft-controls helper that exposes option lists, enabled state, and immutable draft updates. Wire it into `HeadToHeadLobbyEntry` with React component state and pass the resulting local draft into the existing private setup shell. Keep server/API/repository behavior untouched.

**Tech Stack:** TypeScript, React/Next client component, Vitest, existing mission runner.

---

## Task 1: Add pure draft-control contract tests

**Objective:** Define the local-only setup draft controls before production code.

**Files:**
- Create: `tests/web/headToHeadPrivateSetupDraftControls.test.ts`
- Create later: `src/web/headToHeadPrivateSetupDraftControls.ts`

**Steps:**
1. Write tests for null summary, enabled setup controls, disabled locked controls, immutable local draft changes, and source-safety guardrails.
2. Run `npx vitest run tests/web/headToHeadPrivateSetupDraftControls.test.ts` and verify RED from missing module.
3. Implement the minimal helper and option lists.
4. Re-run the focused test and verify GREEN.

## Task 2: Wire product route state without server writes

**Objective:** Render local-only controls in `/head-to-head-lobby` and feed draft changes into the private setup shell.

**Files:**
- Modify: `src/web/HeadToHeadLobbyEntry.tsx`
- Modify: `tests/web/headToHeadLobbyEntry.test.ts`

**Steps:**
1. Extend the product-route source test to require the draft controls helper and local browser draft copy, and forbid submit/save/persistence helpers.
2. Run focused tests and verify RED.
3. Add React `useState` for local setup drafts, derive controls with `useMemo`, pass drafts into `createHeadToHeadPrivateSetupShell`, and render select controls only from the pure view model.
4. Re-run focused tests and verify GREEN.

## Task 3: Update docs and missions

**Objective:** Make the new slice discoverable and mission-validated.

**Files:**
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`
- Modify: `scripts/run-mission-tests.ts`

**Steps:**
1. Link `docs/62-production-private-setup-draft-controls-contract.md` and this plan from the docs index.
2. Update handoff latest-slice notes and validation expectations.
3. Add `MISSION 159: private setup draft controls`.
4. Run `npm run test:missions` after focused tests.

## Task 4: Full validation and browser smoke

**Objective:** Prove the product loop and guardrails still hold.

**Commands:**
```bash
npx vitest run tests/web/headToHeadPrivateSetupDraftControls.test.ts tests/web/headToHeadPrivateSetupSelectionState.test.ts tests/web/headToHeadPrivateSetupShell.test.ts tests/web/headToHeadLobbyEntry.test.ts
npm run test:missions
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Browser smoke:
1. Start `npm run dev`.
2. `/head-to-head-lobby`: create, join, change local draft club/tactic/readiness, verify shell updates, lock, kickoff, complete, report preview.
3. Verify opponent details stay hidden before lock and no setup submit/save/rematch/restart/new-match buttons exist.
4. `/lobby-transition-harness`: invalid kickoff rejection, lock, kickoff.
5. `/lobby-fixtures`: zero buttons.
6. Revert generated `next-env.d.ts` if dev/build rewrites it.

## Task 5: Commit

**Objective:** Save the completed slice locally.

**Commands:**
```bash
git status --short --branch
git add docs/ scripts/ src/web/ tests/web/
git commit -m "feat: add private setup draft controls"
git status --short --branch
```

Do not push.
