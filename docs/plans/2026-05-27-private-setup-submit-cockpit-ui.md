# P18Z Guarded Product Private Setup Submit UI Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Wire the private setup submission route/client into the product head-to-head lobby while beginning the manager cockpit interface direction.

**Architecture:** Keep server rules in the existing API/repository layer. Add a thin browser flow helper that submits and refreshes, then wire the React product route last. Introduce cockpit section anchors and styling without building a premature tab state machine.

**Tech Stack:** TypeScript, React/Next app router, Vitest, existing replay-session API/client helpers.

---

## Task 1: Document interface direction

**Objective:** Capture the manager cockpit design direction before changing the product UI.

**Files:**
- Create: `docs/67-manager-cockpit-interface-direction.md`

**Steps:**
1. Document cockpit stations: Lobby desk, Team setup, Match controls, Report room.
2. State visual direction: dark dense football operations UI, modern dashboard discipline, no CM0102 asset copying.
3. Record interaction principles: one dominant action, explicit server authority, no auth claims, private-state visual language.

## Task 2: Document P18Z contract

**Objective:** Define exactly what submit UI is allowed to do.

**Files:**
- Create: `docs/68-production-private-setup-submit-ui-contract.md`

**Acceptance:**
- Includes scope/out-of-scope.
- Explicitly permits `Save setup draft` product UI.
- Explicitly keeps auth/permission/rematch/full-tabs out of scope.
- Records privacy and redaction rules.

## Task 3: RED/GREEN submit-and-refresh browser flow

**Objective:** Add a tested flow helper before wiring React.

**Files:**
- Create: `tests/web/headToHeadPrivateSetupSubmitFlow.test.ts`
- Create: `src/web/headToHeadPrivateSetupSubmitFlow.ts`

**RED:**
- Test that the helper submits `{ sessionId, side, draft }` through the injected submit function.
- Assert the draft sent to the API omits the local-only `side` field inside `draft`.
- Assert the helper refreshes via injected `getSummary` after submit.
- Test rejection copy is preserved and refresh is not called.

**GREEN:**
- Implement `submitHeadToHeadPrivateSetupDraftAndRefreshSummaryFromWeb` with injected `submit` and `getSummary` dependencies.

## Task 4: Update private setup copy from local-only to server-backed

**Objective:** Reflect that product setup can now save server-backed hidden drafts.

**Files:**
- Modify: `src/web/headToHeadPrivateSetupDraftControls.ts`
- Modify: `tests/web/headToHeadPrivateSetupDraftControls.test.ts`
- Modify: `src/web/headToHeadPrivateSetupReadinessBoundary.ts`
- Modify: `tests/web/headToHeadPrivateSetupReadinessBoundary.test.ts`

**Acceptance:**
- Controls say private setup draft controls are server-backed.
- Persistence copy states hidden side-scoped server draft and redaction until lock.
- Readiness copy states readiness can be saved but never gates server-owned lock.
- Pure view models remain free of direct network/storage calls.

## Task 5: Wire product route submit button and cockpit shell

**Objective:** Add product UI save control and first cockpit navigation structure.

**Files:**
- Modify: `src/web/HeadToHeadLobbyEntry.tsx`
- Modify: `tests/web/headToHeadLobbyEntry.test.ts`
- Modify: `app/globals.css`

**Acceptance:**
- Import and use `submitHeadToHeadPrivateSetupDraftAndRefreshSummaryFromWeb`.
- Add `submitPrivateSetupDraft` handler.
- Render `Save setup draft` inside private setup controls.
- Disable it with existing `privateSetupDraftControls.enabled` policy and pending state.
- Preserve server error copy.
- Change hero to `Manager cockpit` and add station anchors.
- Add lightweight cockpit CSS hooks.

## Task 6: Mission/docs updates

**Files:**
- Modify: `scripts/run-mission-tests.ts`
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`

**Acceptance:**
- Add MISSION 164 covering submit flow, draft controls, readiness boundary, and product entry route.
- Index both new docs and plan.
- Handoff latest slice becomes P18Z.
- Mark validation pending before final validation, then patch observed results.

## Task 7: Validation and browser smoke

Run:

```bash
npx vitest run tests/web/headToHeadPrivateSetupSubmitFlow.test.ts tests/web/headToHeadPrivateSetupDraftControls.test.ts tests/web/headToHeadPrivateSetupReadinessBoundary.test.ts tests/web/headToHeadLobbyEntry.test.ts
npm run test:missions
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Browser smoke:

1. Open `/head-to-head-lobby`.
2. Create lobby.
3. Join away manager.
4. Verify Manager cockpit station anchors are visible.
5. Save home setup draft and see saved-to-server copy.
6. Switch to away, edit draft, save away setup draft.
7. Verify no opponent private details leak pre-lock.
8. Lock, kickoff, complete.
9. Verify `/lobby-transition-harness` invalid transition and valid setup -> locked -> in_match still work.
10. Verify `/lobby-fixtures` remains button-free.
11. Check console errors.

## Task 8: Commit

After validation passes:

```bash
git add ...
git commit -m "feat: add private setup submit cockpit ui"
```
