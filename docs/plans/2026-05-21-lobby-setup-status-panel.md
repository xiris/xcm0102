# P18A Lobby Setup View Model and Read-Only Status Panel Plan

## Goal

Surface the replay-session lobby/ownership summary that P17C/P17D exposed through the API in a compact, read-only Match Lab status panel.

## Scope

In scope:

- Pure web view model for replay-session lobby summary display.
- Browser client GET helper for `/api/replay-sessions/:sessionId`.
- Match Lab status panel after session creation and after authoritative resume updates.
- Mission-labelled tests for the new pure view model and client route helper.
- Contract documentation for the read-only lobby panel.

Out of scope:

- Mutating lobby controls in the browser.
- Invite links, accounts, permissions, sockets, or private setup screens.
- Durable database persistence.
- Moving Match Lab out of single-manager home-default behavior.

## TDD Checkpoints

1. RED: view-model test proves owner labels, lobby-state copy, counts, visible events, seed, and optional signature formatting.
2. GREEN: implement `createReplaySessionLobbyStatusViewModel` as a pure helper.
3. RED: web-client test proves GET summary route and readable server errors.
4. GREEN: implement `getReplaySessionSummaryFromWeb` with shared response parsing.
5. RED/GREEN: wire Match Lab state to fetch and render the status panel without adding mutating controls.

## Files Likely To Change

- `src/web/replaySessionLobbyStatusViewModel.ts`
- `tests/web/replaySessionLobbyStatusViewModel.test.ts`
- `src/web/replaySessionClient.ts`
- `tests/web/replaySessionClient.test.ts`
- `src/web/MatchLab.tsx`
- `app/globals.css`
- `scripts/run-mission-tests.ts`
- `docs/42-production-lobby-status-panel-contract.md`
- `docs/README.md`
- `docs/30-project-handoff-status.md`

## Verification

- Run each new focused test first and verify RED before implementation.
- Run focused GREEN tests after implementation.
- Run mission tests with named labels.
- Run full validation: `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`.
- Browser-smoke the Match Lab if the dev server is available or can be started.

## Next-Phase Transition

After this read-only panel is stable, the next slice can add intentional lobby setup controls or side-aware read-only UI for a future head-to-head flow. Mutations should remain server-owned and tested through route helpers before browser controls are introduced.
