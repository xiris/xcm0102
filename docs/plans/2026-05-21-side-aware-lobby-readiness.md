# P18B Side-Aware Lobby Readiness View Model Plan

## Goal

Make the read-only replay-session lobby panel easier to understand for future head-to-head play by splitting the server-owned summary into home and away side readiness cards.

## Scope

In scope:

- Add a pure side-aware lobby readiness view model derived from the existing replay-session summary response.
- Represent each side with manager assignment, command-count, readiness copy, and read-only status tone.
- Render the two side cards in the Match Lab lobby panel.
- Keep the current single-manager Match Lab compatible: home is local/assigned, away is unassigned.
- Update mission tests and production contract docs.

Out of scope:

- Invite links, auth, accounts, permissions, sockets, or presence.
- Ready/lock/kickoff buttons in the browser.
- Away-side command controls in Match Lab.
- Durable database persistence.

## TDD Checkpoints

1. RED: Add pure view-model tests proving side cards for head-to-head locked sessions and single-manager in-match compatibility.
2. GREEN: Extend `replaySessionLobbyStatusViewModel.ts` with side-card output and readiness copy.
3. RED/GREEN: Render side cards in `MatchLab.tsx` through the existing lobby status panel.
4. Update `scripts/run-mission-tests.ts` with the side-card mission coverage.
5. Update docs: contract doc, docs index, and handoff status.

## Verification

- `npx vitest run tests/web/replaySessionLobbyStatusViewModel.test.ts -t 'side readiness cards'`
- `npx vitest run tests/web/replaySessionLobbyStatusViewModel.test.ts`
- `npm run test:missions`
- `npm test`
- `npx tsc --noEmit`
- `npm run build`
- `git diff --check`
- Browser smoke: run the Match Lab flow and verify the lobby panel shows Home/Away side readiness cards and no console errors.

## Next-Phase Transition

After this slice, the lobby summary will have enough stable read-only browser structure to safely add explicit setup/lock/ready controls in a later route/UI slice without redesigning the display contract.