# Head-to-Head Session Ownership Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Add replay-session ownership metadata and side-specific command logs so future head-to-head lobbies can distinguish home and away managers without breaking the existing single-manager Match Lab.

**Architecture:** Extend the replay-session repository contract first, because repository storage records are the durable seam for future persistence. Keep API helpers thin and backward-compatible: requests without `side` continue to append home commands. Do not add auth, sockets, database code, or lobby UI in this slice.

**Tech Stack:** TypeScript, Vitest, Next.js app routes, existing in-memory replay-session repository.

---

## Scope

In scope:

- `MatchSide`, `ReplaySessionOwnership`, and side-command log types.
- Repository support for ownership metadata and side-scoped command append.
- API helper support for optional `side` in command append requests.
- Web client request type support for optional side while Match Lab still omits it.
- Mission runner/docs/handoff updates.

Out of scope:

- Account identities, invites, auth, lobby UI, sockets, database adapter, or route authorization.

## Task 1: RED repository ownership and side-command tests

**Objective:** Prove the repository needs ownership metadata and isolated home/away command logs.

**Files:**

- Modify: `tests/api/replaySessionRepository.test.ts`

**Steps:**

1. Add a test that creates a head-to-head session with home and away side owners.
2. Append one home command and one away command.
3. Assert:
   - `ownership.mode === 'head_to_head'`
   - home/away owners are preserved
   - `sideManagerCommands.home` contains only the home command
   - `sideManagerCommands.away` contains only the away command
   - legacy `managerCommands` equals the home command log
   - audit entries record `commandSide`
4. Run the test and verify RED because ownership/side APIs do not exist yet.

Expected command:

```bash
npx vitest run tests/api/replaySessionRepository.test.ts -t 'stores ownership metadata and side-specific command logs'
```

## Task 2: RED storage hydration test

**Objective:** Prove durable export/hydration preserves ownership and side command logs.

**Files:**

- Modify: `tests/api/replaySessionRepository.test.ts`

**Steps:**

1. Extend or add a storage round-trip test for ownership and side logs.
2. Export records, hydrate a new repository, and assert equality.
3. Verify RED if the storage record does not yet include ownership/side fields.

## Task 3: GREEN repository implementation

**Objective:** Add minimal repository/domain support for side ownership.

**Files:**

- Modify: `src/api/replaySessionRepository.ts`

**Steps:**

1. Add `MatchSide`, `ReplaySessionLobbyState`, `ReplaySessionSideOwner`, `ReplaySessionOwnership`, and `ReplaySessionSideCommandLogs` types.
2. Extend `ReplaySession` with `ownership` and `sideManagerCommands`.
3. Extend create input with optional `ownership`.
4. Add default ownership for current browser flow:
   - mode: `single_manager`
   - lobbyState: `in_match`
   - home owner: local manager
5. Change `appendManagerCommand` signature to accept optional `side: MatchSide = 'home'`.
6. Keep `managerCommands` as the home-side compatibility alias.
7. Include `commandSide` in audit entries.
8. Run repository tests until GREEN.

## Task 4: RED/GREEN API helper side parsing

**Objective:** Let command append requests include `side: 'home' | 'away'` and reject invalid values.

**Files:**

- Modify: `tests/api/replaySessionEndpoint.test.ts`
- Modify: `src/api/replaySessionEndpoint.ts`

**Steps:**

1. Add an API test that appends an away command with `{ side: 'away' }`.
2. Resume the session and assert diagnostics include an away-team command application.
3. Assert response includes both total `commandCount` and `commandCounts: { home, away }`.
4. Add an invalid-side rejection test.
5. Implement minimal parse/append/resume changes:
   - request without side defaults to home
   - invalid side returns 400
   - resume translates home commands to `session.baseInput.home.id` and away commands to `session.baseInput.away.id`
6. Run targeted API tests until GREEN.

## Task 5: Browser client compatibility

**Objective:** Allow future browser/lobby callers to pass side while preserving current Match Lab behavior.

**Files:**

- Modify: `src/web/replaySessionClient.ts`
- Modify: `tests/web/replaySessionClient.test.ts`

**Steps:**

1. Add optional `side` to `WebReplaySessionCommandRequest`.
2. Include `side` in the POST body only when supplied.
3. Update/extend client test to verify a side-aware append body.
4. Keep current Match Lab calls unchanged.

## Task 6: Mission runner and docs

**Files:**

- Modify: `scripts/run-mission-tests.ts`
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`

**Steps:**

1. Add mission 126 for replay-session side ownership.
2. Add this contract and plan to docs index.
3. Update handoff latest slice, validation commands, and next recommendation.

## Task 7: Full validation and commit

Run:

```bash
npx vitest run tests/api/replaySessionRepository.test.ts -t 'stores ownership metadata and side-specific command logs'
npx vitest run tests/api/replaySessionEndpoint.test.ts -t 'applies away-side replay session commands'
npx vitest run tests/web/replaySessionClient.test.ts -t 'posts side-aware command append requests'
npm run test:missions
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Browser check:

- Open Match Lab.
- Run a match.
- Start interactive replay.
- Record a manager command through current home-only UI.
- Request authoritative resume.
- Confirm session ID, visible-event count, command count, authoritative panel, no `.error`, and no console errors.

Commit locally only:

```bash
git add ...
git commit -m "feat: add replay session side ownership"
```
