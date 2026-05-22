# P18F Read-Only Lobby Action Preview Panel Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Render the existing lobby action-availability policy as read-only browser copy in Match Lab without wiring mutating lobby controls.

**Architecture:** Keep server-owned lobby transitions unchanged. Reuse the pure `actionAvailability` view-model field from P18E and add a presentational read-only preview inside the replay-session lobby status card. Do not call `transitionReplaySessionLobbyStateFromWeb` from `MatchLab.tsx` in this slice.

**Tech Stack:** TypeScript, React/Next, Vitest, ReactDOMServer for component contract inspection.

---

## Acceptance Criteria

1. The lobby status card renders the `actionAvailability.headline` and `helperText`.
2. Future action rows show action label, target lobby state, availability state, and disabled reason when present.
3. Complete/no-action summaries render read-only no-transition copy.
4. The rendered preview uses no mutating buttons or transition client calls.
5. Mission runner includes a focused P18F mission.
6. Docs and handoff are updated, mission tests and full validation pass, and the slice is committed locally.

## Task 1: RED component contract for read-only action preview

**Objective:** Prove the lobby status card must render action-availability preview copy without buttons.

**Files:**
- Test: `tests/web/matchLabLobbyActionPreview.test.ts`
- Modify later: `src/web/MatchLab.tsx`

**Steps:**
1. Export `LobbyStatusCard` from `src/web/MatchLab.tsx` so a pure presentational component can be inspected.
2. Add a Vitest test that renders `LobbyStatusCard` to static markup with an `in_match` single-manager status view model.
3. Assert the markup includes `Future lobby actions`, the helper text, `Complete match`, `Target: complete`, `Available`, and no `<button`.
4. Run: `npx vitest run tests/web/matchLabLobbyActionPreview.test.ts -t 'read-only future action preview'`
5. Expected RED: fails because the preview is not rendered yet.

## Task 2: GREEN render preview rows

**Objective:** Add minimal read-only preview markup inside `LobbyStatusCard`.

**Files:**
- Modify: `src/web/MatchLab.tsx`

**Steps:**
1. Add a `Future lobby action preview` section under the side readiness cards.
2. Render each action as text/list content, not a button.
3. Include disabled reason copy only when present.
4. Render `No further lobby transitions available.` when no actions exist.
5. Run the focused RED test until it passes.

## Task 3: Disabled/no-action coverage and mission runner

**Objective:** Cover disabled and complete states, then add mission-runner coverage.

**Files:**
- Modify: `tests/web/matchLabLobbyActionPreview.test.ts`
- Modify: `scripts/run-mission-tests.ts`

**Steps:**
1. Add tests for setup missing-manager disabled copy and complete no-transition copy.
2. Run the focused test file.
3. Add `MISSION 138: lobby action preview panel` to the mission runner.
4. Run the mission runner.

## Task 4: Docs, browser smoke, validation, commit

**Objective:** Record the contract and verify the browser remains read-only.

**Files:**
- Create: `docs/47-production-read-only-lobby-action-preview-panel-contract.md`
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`

**Steps:**
1. Document scope, contract, out-of-scope mutation behavior, and future control conversion rules.
2. Browser smoke Match Lab: submit form, confirm lobby panel and future-action preview appear, confirm no lock/kickoff/complete lobby buttons are rendered, check console.
3. Run validation:
   - `npx vitest run tests/web/matchLabLobbyActionPreview.test.ts -t 'read-only future action preview'`
   - `npx vitest run tests/web/matchLabLobbyActionPreview.test.ts`
   - `npm run test:missions`
   - `npm test`
   - `npx tsc --noEmit`
   - `npm run build`
   - `git diff --check`
4. Commit locally with a conventional commit message.
