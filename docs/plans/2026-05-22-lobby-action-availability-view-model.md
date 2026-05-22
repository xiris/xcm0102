# P18E Lobby Action Availability View Model Plan

> For Hermes: Use test-driven-development to implement this plan task-by-task.

Goal: Add a pure browser view-model contract that describes future replay-session lobby actions from the server-owned replay-session summary, without wiring mutating controls into Match Lab.

Architecture: Keep policy in `src/web/replaySessionLobbyStatusViewModel.ts` so React remains a thin read-only adapter. The action model describes labels, availability, disabled reasons, and the target `lobbyState` each future control would send through the already-tested P18D transition client helper.

Tech Stack: TypeScript, Vitest, Next/React thin UI boundary.

---

## Task 1: Add failing action-availability tests

Objective: Prove the desired pure view-model behavior before implementation.

Files:
- Modify: `tests/web/replaySessionLobbyStatusViewModel.test.ts`

Steps:
1. Add tests for setup, missing-manager setup, locked, in-match, complete, and single-manager compatibility copy.
2. Run `npx vitest run tests/web/replaySessionLobbyStatusViewModel.test.ts -t 'lobby action availability'`.
3. Expected RED: action availability field/function is missing.

## Task 2: Implement minimal pure action model

Objective: Return action availability from `ReplaySessionLobbySummary` without UI mutation controls.

Files:
- Modify: `src/web/replaySessionLobbyStatusViewModel.ts`

Steps:
1. Add typed action availability fields to the view model.
2. Map server states:
   - `setup` -> lock setup target `locked`, available only when all head-to-head sides are assigned or when single-manager setup has its home owner.
   - `locked` -> kickoff target `in_match`, available when sides are assigned.
   - `in_match` -> complete match target `complete`.
   - `complete` -> no transition actions.
3. Include compatibility copy explaining single-manager sessions can skip setup/lock and begin in match.
4. Run the focused test until GREEN.

## Task 3: Mission runner and docs

Objective: Keep user-preferred mission validation and contract documentation current.

Files:
- Modify: `scripts/run-mission-tests.ts`
- Create: `docs/46-production-lobby-action-availability-view-model-contract.md`
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`

Steps:
1. Add a named P18E mission for action availability.
2. Document the contract and future UI mapping to `transitionReplaySessionLobbyStateFromWeb`.
3. Update handoff latest slice, validation commands, mission count, and next recommendation.

## Task 4: Full validation and commit

Objective: Prove the slice is complete and safe.

Commands:
- `npx vitest run tests/web/replaySessionLobbyStatusViewModel.test.ts -t 'lobby action availability'`
- `npx vitest run tests/web/replaySessionLobbyStatusViewModel.test.ts`
- `npm run test:missions`
- `npm test`
- `npx tsc --noEmit`
- `npm run build`
- `git diff --check`
- browser smoke: verify Match Lab still renders read-only lobby status without mutating controls.

Commit:
- `git commit -m "feat: add lobby action availability view model"`
