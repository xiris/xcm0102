# P18R Product Lobby Stabilization + UX Copy Pass Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Tighten the product-facing `/head-to-head-lobby` loop after the first complete create → join → lock → kickoff → complete → report-preview path by consolidating state-specific copy, disabling no-op actions, and improving browser smoke clarity without adding new product scope.

**Architecture:** Keep the route thin by deriving product action copy and enabled/disabled policy in a pure web helper. React should render the helper output, while server-owned transition helpers remain unchanged. This is a stabilization pass, not a feature expansion.

**Tech Stack:** TypeScript, Next.js, React, Vitest, existing replay-session API/client helpers.

---

## Non-goals

- No rematch/restart/new-match branching.
- No durable database persistence.
- No accounts, invites, websockets, or private tactic setup.
- No full report page.
- No changes to server transition rules.

## Task 1: Add a product action-copy policy helper

**Objective:** Centralize state-specific button helper copy and disabled reasons for join, lock, kickoff, and completion.

**Files:**
- Create: `src/web/headToHeadLobbyActionCopy.ts`
- Test: `tests/web/headToHeadLobbyActionCopy.test.ts`

**TDD steps:**
1. Write a failing test proving:
   - setup with only home assigned allows away join but blocks lock/kickoff/complete with explicit reasons.
   - setup with both managers blocks duplicate away join and allows lock.
   - locked allows kickoff and blocks join/lock.
   - in-match allows completion and blocks kickoff.
   - complete blocks all match-transition actions and labels the report as closed.
2. Run `npx vitest run tests/web/headToHeadLobbyActionCopy.test.ts` and verify RED.
3. Implement the minimal helper.
4. Rerun the focused test and verify GREEN.

## Task 2: Wire the helper into `/head-to-head-lobby`

**Objective:** Replace scattered inline helper copy and button-disable logic with the new product policy helper.

**Files:**
- Modify: `src/web/HeadToHeadLobbyEntry.tsx`
- Modify: `tests/web/headToHeadLobbyEntry.test.ts`

**TDD steps:**
1. Add route tests/source assertions requiring the action-copy helper import and confirming no generic transition helpers/rematch controls are introduced.
2. Wire the helper output to section helper text and button disabled states.
3. Ensure duplicate join/late join, late lock, late kickoff, and post-completion complete controls are unavailable from the product route.
4. Run `npx vitest run tests/web/headToHeadLobbyActionCopy.test.ts tests/web/headToHeadLobbyEntry.test.ts`.

## Task 3: Clarify result-preview follow-up copy

**Objective:** Avoid visible copy that looks like a product rematch affordance while preserving the no-rematch guardrail.

**Files:**
- Modify: `src/web/headToHeadResultReportPreview.ts`
- Modify: `tests/web/headToHeadResultReportPreview.test.ts`
- Modify: `docs/58-production-result-report-preview-contract.md`

**TDD steps:**
1. Change the preview model test to expect follow-up copy that mentions a future "new match flow" instead of visible rematch wording.
2. Run the focused test and verify RED.
3. Update the helper and contract docs.
4. Rerun the focused test and verify GREEN.

## Task 4: Mission runner, docs, validation, browser smoke, commit

**Objective:** Record the stabilization contract, add the focused test to the mission runner, and validate the full project.

**Files:**
- Create: `docs/59-production-product-lobby-stabilization-contract.md`
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`
- Modify: `scripts/run-mission-tests.ts`

**Validation commands:**

```bash
npx vitest run tests/web/headToHeadLobbyActionCopy.test.ts tests/web/headToHeadLobbyEntry.test.ts tests/web/headToHeadResultReportPreview.test.ts
npm run test:missions
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Browser smoke:
- `/head-to-head-lobby`: create, join, lock, kickoff, complete, verify report preview and no rematch/restart/new-match buttons.
- Verify duplicate/late no-op buttons are disabled or hidden at the correct states.
- `/lobby-transition-harness`: still renders controlled harness actions.
- `/lobby-fixtures`: remains button-free.

Commit:

```bash
git add <changed files>
git commit -m "fix: stabilize product lobby copy"
```
