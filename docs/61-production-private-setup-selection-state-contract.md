# Production Private Setup Selection State Contract

## Purpose

P18T adds the first pure, server-safe selection-state contract behind the private setup shell. It lets the product name a local manager's future club/tactic readiness intent without storing hidden competitive state, adding product mutations, changing lobby transition rules, or exposing opponent details.

## Product Boundary

The private setup selection state is a typed browser/domain contract, not a persisted setup system. It must:

- model side-scoped setup draft state for home and away;
- keep sample club selections limited to the current fixture clubs, Internazionale 2002 and Milan 2002;
- model tactic shell choices as safe labels only, not full tactical payloads;
- expose public readiness/status labels that do not reveal opponent hidden details;
- distinguish local side detail from opponent redacted/hidden state;
- remain derived from explicit inputs and the public lobby summary only.

## State Contract

`createHeadToHeadPrivateSetupSelectionState({ summary, localSide, drafts })` returns `null` when no lobby summary is loaded. Otherwise it returns a view model with two side cards.

Each side card includes:

- side and title;
- manager label;
- public setup status;
- sample club label;
- tactic shell label;
- readiness intent label;
- whether details are visible to the current viewer;
- privacy note.

## Draft Inputs

Draft inputs are optional and side-scoped:

```ts
type HeadToHeadPrivateSetupDraft = {
  side: 'home' | 'away';
  clubId: 'internazionale-2002' | 'milan-2002';
  tacticShellId: 'balanced-442' | 'attacking-4231' | 'compact-451';
  readinessIntent: 'editing' | 'ready_to_lock';
};
```

If a side has no draft:

- local side shows safe defaults and `Not submitted` intent;
- opponent side remains redacted as `Hidden until lock` before lock;
- locked/in-match/complete states can show public sample labels because P18T is still preview-only and not a real reveal payload.

## Privacy Guardrails

P18T must not:

- persist setup drafts to the replay-session repository;
- submit setup drafts through product routes;
- add mutation controls to `/head-to-head-lobby`;
- reveal opponent tactic, lineup, bench, or set-piece details before lock;
- imply the preview state is authoritative match setup;
- change setup lock, kickoff, completion, or report-preview behavior.

## UI Contract

`/head-to-head-lobby` may render selection-state labels inside the existing private setup shell, but only as preview/readiness copy. It must keep action controls unchanged.

Before lock:

- local side details can be visible from local inputs/defaults;
- opponent details must be hidden/redacted;
- public copy can say the opponent has a private setup space, not what it contains.

After lock:

- P18T can show sample fixture labels, but it must still say authoritative hidden setup persistence is future work.

## Non-goals

P18T does not add:

- real club selection mutation;
- real lineup/tactic editor state;
- repository persistence for hidden setup;
- accounts/auth/invites;
- websocket synchronization;
- rematch/restart/new-match controls;
- full report pages;
- server transition rule changes.

## Validation

Required validation:

```bash
npx vitest run tests/web/headToHeadPrivateSetupSelectionState.test.ts tests/web/headToHeadPrivateSetupShell.test.ts tests/web/headToHeadLobbyEntry.test.ts
npm run test:missions
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Browser smoke must verify:

- `/head-to-head-lobby` still completes create -> join -> lock -> kickoff -> complete -> report preview.
- Private setup shell renders selection-state preview labels.
- Opponent pre-lock setup details are hidden/redacted.
- No new setup mutation, rematch, restart, or new-match buttons are present.
- `/lobby-transition-harness` still advances setup -> locked -> in_match.
- `/lobby-fixtures` remains button-free.
