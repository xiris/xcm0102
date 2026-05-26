# Production Product Lobby Stabilization Contract

## Purpose

P18R stabilizes the first product-facing head-to-head loop after create, join, lock, kickoff, completion, and report preview became available. The slice tightens copy and no-op action policy without expanding scope into rematch, persistence, accounts, invites, websockets, private tactic setup, or full report pages.

## Product Route Policy

`/head-to-head-lobby` now derives state-specific product action copy through `createHeadToHeadLobbyActionCopy` instead of scattering one-off helper strings across the React route.

The helper returns:

- `stageLabel` — compact current-stage copy for the product hero.
- `joinAway` — enabled/disabled state plus helper copy for away assignment.
- `lockSetup` — enabled/disabled state plus helper copy for setup locking.
- `kickOff` — enabled/disabled state plus helper copy for kickoff.
- `completeMatch` — enabled/disabled state plus helper copy for result closure.

## State Matrix

| Lobby state | Join away | Lock setup | Kick off | Complete match |
| --- | --- | --- | --- | --- |
| no selected summary | enabled only when a session ID is present | disabled | disabled | disabled |
| `setup`, home only | enabled | disabled | disabled | disabled |
| `setup`, home + away | disabled to prevent duplicate away assignment | enabled | disabled | disabled |
| `locked` | disabled | disabled | enabled | disabled |
| `in_match` | disabled | disabled | disabled | enabled |
| `complete` | disabled | disabled | disabled | hidden/disabled |

## Stabilized Copy Decisions

- Duplicate away joins are now represented as a disabled product action once the loaded summary already has an away manager.
- Late joins, late setup locks, late kickoffs, and post-completion completion attempts are blocked at the product route in addition to server validation.
- The report-preview note no longer uses visible "Rematch" wording. It says that a future new-match flow and full report pages remain follow-up slices, avoiding UI copy that looks like an available rematch affordance.
- Source guardrails still assert that `/head-to-head-lobby` does not import `LobbyMutationControls` or `applyReplaySessionLobbyTransitionFromWeb`.

## Non-goals

P18R does not add:

- rematch/restart/new-match branching controls;
- durable session persistence;
- account or invite permissions;
- websocket synchronization;
- private tactical setup;
- full report pages;
- server transition rule changes.

## Validation

Required validation:

```bash
npx vitest run tests/web/headToHeadLobbyActionCopy.test.ts tests/web/headToHeadLobbyEntry.test.ts tests/web/headToHeadResultReportPreview.test.ts
npm run test:missions
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Browser smoke must verify:

- `/head-to-head-lobby` still completes create -> join -> lock -> kickoff -> complete -> report preview.
- Duplicate/late no-op action buttons are disabled or hidden at the correct states.
- No rematch/restart/new-match buttons are present.
- `/lobby-transition-harness` still renders controlled harness actions.
- `/lobby-fixtures` remains button-free.
