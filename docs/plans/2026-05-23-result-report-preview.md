# P18Q Head-to-Head Result Report Preview Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Render a read-only post-match result report preview on `/head-to-head-lobby` only after the server summary reaches `complete`.

**Architecture:** Extend the replay-session summary contract with a compact result preview derived from stored server session metadata (`baseInput` and `initialResult`). Add a pure browser view model for completed result copy, then render a thin read-only panel in the product route. Keep rematch, full report pages, durable persistence migration, and additional match simulation/resume mutations out of scope.

**Tech Stack:** TypeScript, Next.js app router, React, Vitest, existing replay-session API/client/view-model contracts.

---

## Guardrails

- TDD only: write RED tests before production code.
- `/head-to-head-lobby` may show a read-only report after `complete`; it must not add rematch or restart controls.
- `/lobby-fixtures` remains read-only and button-free.
- `/lobby-transition-harness` remains the transition smoke route.
- Use existing server-owned replay-session state. Do not add accounts, invites, websockets, persistent DB-backed sessions, or private tactic setup.

## Task 1: Extend summary API contract with result preview metadata

**Objective:** Add complete-state result preview data to the replay-session summary without exposing raw full reports or new mutation paths.

**Files:**
- Modify: `src/api/replaySessionEndpoint.ts`
- Modify: `src/web/replaySessionLobbyStatusViewModel.ts`
- Test: `tests/api/replaySessionEndpoint.test.ts`

**RED:** Add a test proving `getReplaySessionSummaryForApi` returns `resultPreview` with score, team names, stats, event count, and replay metadata for a stored session.

**GREEN:** Build `resultPreview` from `session.baseInput`, `session.initialResult`, and `session.initialResult.report.replay` in `getReplaySessionSummaryForApi`.

**Verification:**

```bash
npx vitest run tests/api/replaySessionEndpoint.test.ts
```

## Task 2: Add completed result preview view model

**Objective:** Convert summary `resultPreview` into display-safe copy for the product route.

**Files:**
- Create: `src/web/headToHeadResultReportPreview.ts`
- Create: `tests/web/headToHeadResultReportPreview.test.ts`

**RED:** Add tests for a completed summary with result metadata and a non-complete summary. Expect no preview unless `lobbyState === 'complete'` and result metadata exists.

**GREEN:** Implement `createHeadToHeadResultReportPreview` with scoreline, winner/draw label, stat rows, event/replay rows, and a no-controls note.

**Verification:**

```bash
npx vitest run tests/web/headToHeadResultReportPreview.test.ts
```

## Task 3: Render report preview on product route

**Objective:** Show the read-only report preview only after completion.

**Files:**
- Modify: `src/web/HeadToHeadLobbyEntry.tsx`
- Modify: `tests/web/headToHeadLobbyEntry.test.ts`

**RED:** Update source/render tests to require `createHeadToHeadResultReportPreview`, `Post-match report preview`, and absence of rematch/restart controls.

**GREEN:** Import the view model, derive preview from summary, and render a read-only panel when available.

**Verification:**

```bash
npx vitest run tests/web/headToHeadResultReportPreview.test.ts tests/web/headToHeadLobbyEntry.test.ts
```

## Task 4: Update mission runner and docs

**Objective:** Record the P18Q contract and validation path.

**Files:**
- Create: `docs/58-production-result-report-preview-contract.md`
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`
- Modify: `scripts/run-mission-tests.ts`

**Steps:**
1. Add MISSION 155 for result report preview tests.
2. Document API summary extension, product route guardrails, and browser smoke expectations.
3. Update handoff after validation.

## Task 5: Full validation, browser smoke, commit

**Commands:**

```bash
npx vitest run tests/api/replaySessionEndpoint.test.ts tests/web/headToHeadResultReportPreview.test.ts tests/web/headToHeadLobbyEntry.test.ts
npm run test:missions
npm test
npx tsc --noEmit
npm run build
git diff --check
```

**Browser smoke:**

1. Start `npm run dev`.
2. Visit `/head-to-head-lobby`.
3. Create lobby, join away manager, lock setup, kick off, complete.
4. Verify `Post-match report preview` appears only after `COMPLETE`.
5. Verify no rematch/restart buttons.
6. Visit `/lobby-transition-harness` and `/lobby-fixtures`; verify harness works and fixtures have zero buttons.
7. Verify console clean; stop dev server.

**Commit:**

```bash
git add docs/ scripts/ src/ tests/
git commit -m "feat: add result report preview"
```
