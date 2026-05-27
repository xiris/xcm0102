# Production Private Setup Perspective Switch Contract

## Purpose

P18V stabilizes the local-only private setup draft controls by adding a component-local perspective switch. The switch lets browser smoke exercise either home or away as the local manager view without accounts, permissions, hidden persistence, or server-side setup submission.

## Product Boundary

The perspective switch is browser-local UI state only. It must:

- render only after a lobby summary exists;
- offer home and away perspective options with assignment-aware labels;
- feed the selected local side into existing draft controls and private setup shell state;
- preserve opponent pre-lock redaction by treating the non-selected assigned side as the opponent;
- disable draft editing when the selected side is unassigned, locked, in-match, or complete;
- avoid API/repository writes, browser storage, websocket sync, account permissions, and submit/save controls.

## View Model Contract

`createHeadToHeadPrivateSetupPerspectiveSwitch({ summary, localSide })` returns `null` when no summary exists. Otherwise it returns:

- title: `Local private setup perspective`;
- helper copy that switching only changes this browser preview;
- selected side;
- home/away options with labels, manager labels, assignment state, and selected state;
- privacy notice that the switch does not prove account identity or permissions.

The helper must consume only public lobby summary fields.

## State Behavior

- No lobby: perspective switch does not render.
- Setup with home assigned only: home option is assigned/selected by default; away option is visible as unassigned. Selecting away may show disabled away draft controls, but must not reveal any opponent setup detail.
- Setup with both assigned: selecting home shows home draft controls and redacts away setup details before lock; selecting away shows away draft controls and redacts home setup details before lock.
- Locked/in-match/complete: perspective can still change which local historical preview is emphasized, but all draft controls remain disabled/read-only.

## Privacy Guardrails

P18V must not:

- persist selected perspective or setup drafts;
- submit setup drafts to `/api/replay-sessions` or any route;
- create account, invite, auth, or ownership proof semantics;
- reveal the non-selected side's pre-lock club/tactic/readiness detail;
- change the server-owned lock/kickoff/complete transition rules;
- add rematch, restart, new-match, websocket, full report page, tournament, submit, or save controls.

The UI must explicitly say `Perspective only changes this browser preview` and `No account or permission claim is made by this switch`.

## Validation

Required validation:

```bash
npx vitest run tests/web/headToHeadPrivateSetupPerspectiveSwitch.test.ts tests/web/headToHeadPrivateSetupDraftControls.test.ts tests/web/headToHeadPrivateSetupSelectionState.test.ts tests/web/headToHeadPrivateSetupShell.test.ts tests/web/headToHeadLobbyEntry.test.ts
npm run test:missions
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Browser smoke must verify:

- `/head-to-head-lobby` create -> join -> switch local perspective to away -> edit away local draft controls -> switch home/away and confirm opposite-side pre-lock redaction -> lock -> kickoff -> complete -> report preview works.
- Selected local draft changes update the matching private setup shell labels only.
- The non-selected assigned side remains redacted before lock.
- Perspective and draft controls become or remain read-only after lock/in-match/complete.
- No setup submit/save, rematch, restart, or new-match controls appear.
- `/lobby-transition-harness` still rejects invalid direct kickoff and advances setup -> locked -> in_match.
- `/lobby-fixtures` remains button-free.
