# P18D Lobby Transition Browser Client Contract Plan

## Goal

Add the smallest browser-facing client boundary for the existing server-owned replay-session lobby-state transition route. This prepares future invite/ready/lock/kickoff UI without adding any visible mutation controls to Match Lab yet.

## Scope

In scope:

- A typed web-client helper for `PATCH /api/replay-sessions/:sessionId/lobby-state`.
- Injected-fetch tests proving URL, method, JSON headers, body shape, and returned ownership/lobby state.
- Readable error handling for server payload failures through the existing replay-session client error prefix.
- Mission-runner coverage for the new browser client contract.
- Production contract docs and handoff updates.

Out of scope:

- Rendering lock/kickoff/ready/invite buttons.
- Calling the helper from `MatchLab.tsx`.
- Auth, accounts, permissions, sockets, presence, matchmaking, or private tactic setup.
- Durable persistence or database work.

## TDD Checkpoints

1. RED: add a web-client test that imports `transitionReplaySessionLobbyStateFromWeb` and proves it sends `PATCH` to `/api/replay-sessions/:sessionId/lobby-state` with `{ lobbyState }`.
2. GREEN: implement the minimal typed helper and shared `patchJson` request wrapper.
3. RED/GREEN: add a readable server-error test for invalid transitions.
4. Add mission 136 for the transition browser client contract.
5. Update docs and handoff with P18D completion and the next recommended slice.

## Verification

Run:

```bash
npx vitest run tests/web/replaySessionClient.test.ts -t 'transitions replay session lobby state from the browser client'
npx vitest run tests/web/replaySessionClient.test.ts
npm run test:missions
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Browser smoke should remain the existing read-only Match Lab path: create a match/session, verify the lobby panel is still `IN MATCH` / `Single manager`, verify no mutating lobby controls are rendered, and verify the console is clean.

## Next Phase Transition

After P18D, the next smallest slice should be a pure lobby action view-model that decides which future controls are available from `setup`, `locked`, `in_match`, and `complete` summaries without actually wiring mutations into the browser yet.
