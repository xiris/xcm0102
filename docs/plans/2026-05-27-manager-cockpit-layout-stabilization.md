# P19A Manager Cockpit Layout Stabilization Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Convert `/head-to-head-lobby` into a clearer two-column manager cockpit with a session rail and station workspace while preserving all existing server/private setup semantics.

**Architecture:** Add a pure cockpit layout view model for rail/station copy, then wire it into the existing React route. Keep all mutation flows in their existing helpers and controls. Use CSS only for information architecture and scanability.

**Tech Stack:** TypeScript, React/Next app router, Vitest, existing docs/mission-runner workflow.

---

## Task 1: Add cockpit layout contract docs

**Objective:** Document the P19A UI contract before changing the product route.

**Files:**
- Create: `docs/69-manager-cockpit-layout-stabilization-contract.md`
- Create: `docs/plans/2026-05-27-manager-cockpit-layout-stabilization.md`
- Modify later: `docs/README.md`
- Modify later: `docs/30-project-handoff-status.md`

**Verification:** Docs should state that this is layout/IA only and does not change server authority, private setup redaction, auth boundaries, or rematch scope.

## Task 2: RED test the cockpit layout view model

**Objective:** Define rail/station copy in a pure module before JSX changes.

**Files:**
- Create test: `tests/web/headToHeadManagerCockpitLayout.test.ts`
- Create implementation after RED: `src/web/headToHeadManagerCockpitLayout.ts`

**Required behavior:**
- With no summary, rail title is `Session rail`, phase is `No lobby selected`, invite is `No invite code yet`, and next action is `Create or load a lobby`.
- With a setup summary and only home assigned, phase is `Awaiting opponent`, invite includes the session ID, away manager is `Unassigned`, next action is `Invite away manager`, and private setup state is `Hidden setup drafts unlock after both managers save and setup locks.`
- With complete summary, phase is `Result closed`, next action is `Review report`, and the station list includes `Report room`.

**RED command:**
`npx vitest run tests/web/headToHeadManagerCockpitLayout.test.ts`

Expected first failure: missing module or missing exported function.

## Task 3: GREEN implement the view model

**Objective:** Add the minimal pure layout model.

**Files:**
- Create: `src/web/headToHeadManagerCockpitLayout.ts`

**Implementation notes:**
- Accept `{ summary, stageLabel, statusCopy, errorCopy }`.
- Return rail rows for phase, invite, home manager, away manager, next action, private setup, and status feed.
- Return station anchors for lobby desk, team setup, match controls, report room.
- Do not call network/storage/browser APIs.

**GREEN command:**
`npx vitest run tests/web/headToHeadManagerCockpitLayout.test.ts`

## Task 4: RED test React source/markup contract

**Objective:** Prove the route uses the cockpit layout model and two-column shell.

**Files:**
- Modify: `tests/web/headToHeadLobbyEntry.test.ts`

**Assertions:**
- Markup/source contains `Session rail`, `Station workspace`, `cockpit-layout`, `cockpit-rail`, and `cockpit-workspace`.
- Source imports/calls `createHeadToHeadManagerCockpitLayout`.
- Source does not duplicate mutation buttons inside the rail.
- Existing no-rematch/no-generic-transition guardrails remain.

**RED command:**
`npx vitest run tests/web/headToHeadLobbyEntry.test.ts -t cockpit`

## Task 5: GREEN wire the two-column route shell

**Objective:** Render the session rail and wrap station sections in a workspace.

**Files:**
- Modify: `src/web/HeadToHeadLobbyEntry.tsx`
- Modify: `app/globals.css`

**Implementation notes:**
- Compute `cockpitLayout` via `useMemo`.
- Keep existing mutation controls in their existing sections.
- Add `<aside className="cockpit-rail" aria-label="Session rail">` with model rows.
- Add `<div className="cockpit-workspace" aria-label="Station workspace">` around station sections.
- Add responsive CSS: two columns on desktop, single column on smaller screens.

**GREEN command:**
`npx vitest run tests/web/headToHeadManagerCockpitLayout.test.ts tests/web/headToHeadLobbyEntry.test.ts`

## Task 6: Update docs and missions

**Objective:** Keep project handoff and mission runner current.

**Files:**
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`
- Modify: `scripts/run-mission-tests.ts`

**Mission:** Add MISSION 165 for manager cockpit layout stabilization.

## Task 7: Full validation and commit

**Commands:**

```bash
npx vitest run tests/web/headToHeadManagerCockpitLayout.test.ts tests/web/headToHeadLobbyEntry.test.ts
npm run test:missions
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Browser smoke:

- `/head-to-head-lobby`: create -> join -> save home setup -> save away setup -> lock -> kickoff -> complete; verify session rail/workspace visible, save read-only after lock, report visible, and no rematch/restart/new-match controls.
- `/lobby-transition-harness`: invalid kickoff rejection plus setup -> locked -> in_match.
- `/lobby-fixtures`: read-only gallery with zero buttons.

Commit message:

`feat: stabilize manager cockpit layout`
