# Session Route Parity and Lobby State Smoke Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Prove replay-session side ownership works through server routes and add a small read-only session summary shape for future lobby/state UI.

**Architecture:** Keep authority in the existing pure API helper layer. Add a `getReplaySessionSummaryForApi` helper with injected repository, then wire Fastify and Next routes as thin wrappers. Keep Match Lab home-default behavior unchanged.

**Tech Stack:** TypeScript, Vitest, Fastify inject tests, Next app-route smoke tests, existing in-memory replay-session repository.

---

## Scope

In scope:

- Fastify route parity tests for away-side commands and invalid side rejection.
- Next app-route smoke tests for side-aware command append.
- `GET /api/replay-sessions/:sessionId` summary helper/routes.
- Docs/mission runner/handoff updates.

Out of scope:

- Auth/accounts, invite links, sockets, database persistence, lobby UI, or state transition mutation endpoints.

## Task 1: RED Fastify route parity tests

**Objective:** Prove route wiring must preserve P17B side-aware command behavior.

**Files:**

- Modify: `tests/api/server.test.ts`

**Steps:**

1. Add a test that creates a replay session.
2. POST a command with `side: 'away'` to `/api/replay-sessions/:sessionId/commands`.
3. Assert response includes `commandCount: 1` and `commandCounts: { home: 0, away: 1 }`.
4. Resume the session and assert diagnostics include the away-team transition-style command.
5. Add a test for `side: 'bench'` returning `400` and `side must be home or away`.
6. Run the tests and confirm RED for any missing route behavior.

Command:

```bash
npx vitest run tests/api/server.test.ts -t 'replay session routes preserve away-side commands|replay session routes reject invalid command sides'
```

## Task 2: RED summary helper/route tests

**Objective:** Define the read-only summary shape for lobby state smoke checks.

**Files:**

- Modify: `tests/api/replaySessionEndpoint.test.ts`
- Modify: `tests/api/server.test.ts`

**Steps:**

1. Add helper test for `getReplaySessionSummaryForApi` returning session ID, seed, ownership, lobby state, command counts, visible event count, and latest signature.
2. Assert summary omits `baseInput`, `initialResult`, `visibleEvents`, `sideManagerCommands`, `managerCommands`, and `auditLog`.
3. Add Fastify `GET /api/replay-sessions/:sessionId` test for the same public shape.
4. Run tests and verify RED because helper/route are missing.

## Task 3: GREEN summary helper and Fastify route

**Objective:** Implement the minimal public summary path.

**Files:**

- Modify: `src/api/replaySessionEndpoint.ts`
- Modify: `src/api/server.ts`

**Steps:**

1. Export `getReplaySessionSummaryForApi(payload, repository)`.
2. Parse `sessionId` only.
3. Read the repository session.
4. Return the public summary shape.
5. Map missing sessions to `404`.
6. Wire `server.get('/api/replay-sessions/:sessionId', ...)`.
7. Run targeted API/server tests until GREEN.

## Task 4: RED/GREEN Next route smoke

**Objective:** Prove the Next app-route layer forwards side-aware command bodies and exposes the summary route.

**Files:**

- Create: `tests/api/replaySessionNextRoutes.test.ts`
- Create: `app/api/replay-sessions/[sessionId]/route.ts`
- Modify: `app/api/replay-sessions/[sessionId]/commands/route.ts` only if tests expose a gap.

**Steps:**

1. Import the create route POST and command route POST directly.
2. Create a session through the route.
3. Append an away command through the command route.
4. Assert JSON response has away command count.
5. Import the summary GET route, call it, and assert public summary shape.
6. Implement the GET route as a thin wrapper around `getReplaySessionSummaryForApi`.
7. Run the test and `npx tsc --noEmit` because app-route typing is build-sensitive.

## Task 5: Mission runner and docs

**Files:**

- Modify: `scripts/run-mission-tests.ts`
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`

**Steps:**

1. Add Mission 127 for route side parity.
2. Add Mission 128 for session summary/lobby-state smoke if separate enough.
3. Add contract and plan to docs index.
4. Update handoff latest slice, validation commands, and next recommendation.
5. Remove stale duplicate recommended-next block if present.

## Task 6: Full validation and commit

Run:

```bash
npx vitest run tests/api/server.test.ts -t 'replay session routes preserve away-side commands|replay session routes reject invalid command sides|get replay session route exposes lobby summary'
npx vitest run tests/api/replaySessionEndpoint.test.ts -t 'returns replay session ownership summary'
npx vitest run tests/api/replaySessionNextRoutes.test.ts
npm run test:missions
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Browser check:

- Open Match Lab.
- Run match.
- Start interactive replay.
- Record a home-default manager command.
- Request authoritative resume.
- Confirm session metadata and authoritative panel still work, no `.error`, and no console errors.

Commit locally only:

```bash
git add ...
git commit -m "feat: expose replay session lobby summary"
```
