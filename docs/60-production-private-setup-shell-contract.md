# Production Private Setup Shell Contract

## Purpose

P18S introduces the first product-facing private setup shell for `/head-to-head-lobby`. The shell names the future club/tactic selection boundary for each manager without storing hidden competitive state, changing server-owned lobby transitions, adding accounts/invites/websockets, or exposing rematch/full-report scope.

## Product Boundary

The private setup shell is deliberately read-only preview UI. It must:

- render a home setup card and an away setup card from the public replay-session lobby summary;
- identify Internazionale 2002 and Milan 2002 as sample fixture clubs for the current shell;
- explain that full lineup/tactic choices stay private until lock/reveal in a future slice;
- show only assignment and readiness copy derived from public summary state;
- avoid storing, submitting, or revealing hidden tactic/lineup payloads;
- keep setup lock, kickoff, completion, and report-preview behavior unchanged.

## State Contract

| Lobby state | Shell behavior |
| --- | --- |
| no selected lobby | no private setup shell is rendered |
| `setup`, missing away manager | home shell is assigned and waiting; away shell invites an opponent before private setup can be represented |
| `setup`, both managers assigned | both shells preview their future private setup spaces and indicate setup can be locked when ready |
| `locked` | shell copy says setup is frozen for kickoff and hidden choices would reveal together in a future slice |
| `in_match` | shell copy says pre-match setup is closed while live match decisions remain future work |
| `complete` | shell copy says setup is archived for report review only |

## Privacy Guardrails

P18S does not add a hidden-state store. Until a later persistence slice exists:

- no tactical payloads are persisted from the product lobby route;
- no opponent-specific tactic, lineup, set-piece, or bench choices are rendered;
- the public summary remains the only source for the shell;
- sample clubs are placeholders, not locked competitive selections;
- privacy copy must not imply real hidden choices already exist.

## UI Contract

`createHeadToHeadPrivateSetupShell(summary)` returns `null` when no lobby summary is selected. Otherwise it returns:

- `title: Private setup preview`
- `helperText` explaining this is a safe preview shell;
- two side cards, one for home and one for away;
- side-specific manager labels;
- side-specific sample club labels;
- state-aware readiness labels;
- notes that confirm no hidden state is stored yet and server transition rules remain unchanged.

`/head-to-head-lobby` renders the shell only after a lobby summary is loaded.

## Non-goals

P18S does not add:

- actual club selection mutation;
- hidden lineup/tactic persistence;
- account or invite permissions;
- websocket synchronization;
- durable database persistence;
- rematch/restart/new-match controls;
- full report pages;
- server transition rule changes.

## Validation

Required validation:

```bash
npx vitest run tests/web/headToHeadPrivateSetupShell.test.ts tests/web/headToHeadLobbyEntry.test.ts
npm run test:missions
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Browser smoke must verify:

- `/head-to-head-lobby` still completes create -> join -> lock -> kickoff -> complete -> report preview.
- The private setup shell appears after a lobby is loaded/created.
- The shell uses read-only preview copy and does not imply submitted hidden choices exist.
- No rematch/restart/new-match controls are present.
- `/lobby-transition-harness` still renders controlled harness actions.
- `/lobby-fixtures` remains button-free.
