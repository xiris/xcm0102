# Production Private Setup Draft Controls Contract

## Purpose

P18U adds local-only browser draft controls for the private setup shell. The controls let the current manager preview sample club, tactic-shell, and readiness-intent changes before setup lock, while preserving the existing server-owned lobby transitions and avoiding hidden setup persistence.

## Product Boundary

The draft controls are browser-local UI state only. They must:

- render only after a lobby summary exists;
- target one local manager side at a time;
- use the fixture-safe club options Internazionale 2002 and Milan 2002;
- use tactic-shell labels only, not full tactic payloads;
- update the existing private setup shell preview through component state;
- preserve opponent pre-lock redaction;
- avoid API/repository writes, storage, websocket sync, and submit/save controls.

## Control Contract

`createHeadToHeadPrivateSetupDraftControls({ summary, localSide, drafts })` returns `null` when no summary exists. Otherwise it returns a local control view model with:

- title and helper copy;
- local side and local manager label;
- enabled/disabled state;
- current local draft;
- club, tactic-shell, and readiness-intent option lists;
- persistence warning copy.

`applyHeadToHeadPrivateSetupDraftControlChange(draft, change)` returns a new draft for local component state. It must not call fetch, API helpers, repositories, or browser storage.

## State Behavior

- No lobby: controls do not render.
- Setup with local side assigned: controls are enabled and changing values updates only the local draft preview.
- Setup with local side unassigned: controls are disabled until that manager exists.
- Locked/in-match/complete: controls are disabled historical preview controls; existing draft labels can remain visible through the shell, but cannot be edited.
- Opponent side: no opponent draft controls render in this slice.

## Privacy Guardrails

P18U must not:

- persist private setup drafts;
- submit setup drafts to `/api/replay-sessions` or any route;
- reveal opponent pre-lock club/tactic/readiness detail;
- introduce lock readiness gates that differ from current server transition rules;
- add rematch, restart, new-match, websocket, account, invite, full report page, or tournament logic.

The UI must explicitly say the controls are "Local browser draft only" and "Not submitted to the server".

## Validation

Required validation:

```bash
npx vitest run tests/web/headToHeadPrivateSetupDraftControls.test.ts tests/web/headToHeadPrivateSetupSelectionState.test.ts tests/web/headToHeadPrivateSetupShell.test.ts tests/web/headToHeadLobbyEntry.test.ts
npm run test:missions
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Browser smoke must verify:

- `/head-to-head-lobby` create -> join -> edit local draft controls -> lock -> kickoff -> complete -> report preview works.
- Local draft control changes update the private setup shell labels.
- Opponent pre-lock detail remains hidden/redacted.
- No setup submit/save, rematch, restart, or new-match controls appear.
- `/lobby-transition-harness` still rejects invalid direct kickoff and advances setup -> locked -> in_match.
- `/lobby-fixtures` remains button-free.
