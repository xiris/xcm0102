# Production Private Setup Readiness Boundary Contract

## Purpose

P18W stabilizes the private setup draft UX before hidden-state persistence by making the readiness boundary explicit. Local draft readiness is advisory browser state only. It must not submit setup, persist setup, prove authority, or gate the server-owned setup lock transition.

## Product Boundary

The readiness boundary panel is a local preview/explainer derived from public lobby summary state and browser-local draft controls. It must:

- render only after a lobby summary exists;
- read the selected local side and local browser draft;
- show whether the local draft intent is `Still editing` or `Ready to lock`;
- state that the local readiness intent is advisory only;
- state that lock/kickoff/complete remain server-owned transitions;
- keep setup lock availability derived from the existing product action-copy/lobby summary, not from the local draft readiness intent;
- avoid API/repository writes, browser storage, websocket sync, accounts, submit/save controls, and hidden persistence.

## View Model Contract

`createHeadToHeadPrivateSetupReadinessBoundary({ summary, localSide, drafts, lockAvailable })` returns `null` when no summary exists. Otherwise it returns:

- title: `Setup readiness boundary`;
- side and manager labels for the selected local perspective;
- draft readiness label;
- server lock label;
- advisory notice: `Local readiness intent is advisory and never gates server-owned setup lock.`;
- persistence notice: `No private setup readiness is submitted, persisted, or synchronized yet.`;
- state-specific helper copy.

The helper must consume only public lobby summary fields plus browser-local draft state. It must not import API clients or repositories.

## State Behavior

- No lobby: readiness boundary does not render.
- Setup with selected side assigned and draft `editing`: panel shows `Still editing` while lock availability can still show `Server lock remains available once both managers are assigned.` when the server summary/action copy allows lock.
- Setup with selected side assigned and draft `ready_to_lock`: panel shows `Ready to lock` but still says nothing has been submitted.
- Setup with selected side unassigned: panel says the local side is unassigned and no readiness can be claimed.
- Locked/in-match/complete: panel treats local readiness as archived preview/history; draft controls remain read-only and server-owned transitions remain the source of truth.

## Guardrails

P18W must not:

- make `readinessIntent: editing` disable the product `Lock setup` button;
- make `readinessIntent: ready_to_lock` enable lock unless the server summary/action copy already allows it;
- submit setup or readiness to `/api/replay-sessions` or any route;
- use `localStorage`, `sessionStorage`, cookies, websocket sync, API clients, repositories, accounts, or permissions;
- reveal opponent pre-lock club/tactic/readiness detail;
- add rematch, restart, new-match, full report page, tournament, submit, or save controls.

## Validation

Required validation:

```bash
npx vitest run tests/web/headToHeadPrivateSetupReadinessBoundary.test.ts tests/web/headToHeadPrivateSetupPerspectiveSwitch.test.ts tests/web/headToHeadPrivateSetupDraftControls.test.ts tests/web/headToHeadPrivateSetupSelectionState.test.ts tests/web/headToHeadPrivateSetupShell.test.ts tests/web/headToHeadLobbyEntry.test.ts
npm run test:missions
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Browser smoke must verify:

- `/head-to-head-lobby` create -> join -> keep local readiness as `Still editing` -> verify `Lock setup` remains enabled -> switch perspective -> edit local readiness -> lock -> kickoff -> complete -> report preview works.
- The readiness boundary says local readiness is advisory and not submitted/persisted.
- Opponent pre-lock setup detail remains redacted.
- Draft controls become read-only after lock/in-match/complete.
- No setup submit/save, rematch, restart, or new-match controls appear.
- `/lobby-transition-harness` still rejects invalid direct kickoff and advances setup -> locked -> in_match.
- `/lobby-fixtures` remains button-free.
