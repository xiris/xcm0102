# Replay Session Persistence Foundation Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Introduce the first server-owned replay-session boundary so authoritative resume can reference stored match state instead of relying only on full client replay payloads.

**Architecture:** Add an in-memory repository contract under `src/api/` as the first persistence seam. Keep it deliberately replaceable by a future PostgreSQL/Drizzle or Prisma adapter. Add API-level helpers and Fastify routes for creating a demo match session, appending manager commands, and resuming authoritatively from stored session state.

**Tech Stack:** TypeScript, Vitest, Fastify injection tests, existing deterministic simulation modules.

---

## Scope

P16C builds a minimal persistence boundary, not a final database implementation.

In scope:

- `ReplaySessionRepository` interface and in-memory implementation.
- Stored session records containing seed, initial result, visible events, manager commands, latest authoritative signature, and audit entries.
- API helper functions for:
  - creating a deterministic demo match session;
  - appending a manager command to a session;
  - running authoritative resume from stored session state.
- Fastify routes for the same helper functions.
- Mission tests and docs updates.

Out of scope:

- PostgreSQL/Prisma/Drizzle migration.
- Accounts, users, tenancy, authorization, and multiplayer ownership.
- Browser Match Lab session migration.
- File-backed durability.

## Task 1 — Repository RED/GREEN

**Objective:** Prove a session repository can create, retrieve, append commands, update visible events, and record authoritative resume audit metadata.

**Files:**

- Create: `tests/api/replaySessionRepository.test.ts`
- Create: `src/api/replaySessionRepository.ts`

**RED command:**

```bash
npx vitest run tests/api/replaySessionRepository.test.ts
```

Expected before implementation: FAIL because `src/api/replaySessionRepository` does not exist.

**GREEN behavior:**

- `createInMemoryReplaySessionRepository()` returns an isolated repository.
- `createSession({ seed, initialResult })` stores a deterministic session with generated `sessionId`.
- `getSession(sessionId)` returns the stored session.
- `appendManagerCommand(sessionId, command)` appends in command order.
- `replaceVisibleEvents(sessionId, visibleEvents)` stores the server-accepted visible event slice.
- `recordAuthoritativeResume(sessionId, { signature, currentMinute, eventCount })` stores `latestAuthoritativeSignature` and appends an audit entry.
- Missing session operations throw `Replay session not found: <id>`.

## Task 2 — Stored-session API RED/GREEN

**Objective:** Prove API helpers can create a demo session, append a command, and resume authoritatively using stored visible events/commands.

**Files:**

- Create: `tests/api/replaySessionEndpoint.test.ts`
- Create: `src/api/replaySessionEndpoint.ts`

**RED command:**

```bash
npx vitest run tests/api/replaySessionEndpoint.test.ts
```

Expected before implementation: FAIL because `src/api/replaySessionEndpoint` does not exist.

**GREEN behavior:**

- `createReplaySessionForApi(payload, repository)` validates seed and current minute.
- It simulates the demo Inter/Milan match, stores the initial result, stores visible events through `currentMinute`, and returns `sessionId`, `score`, `visibleEventCount`, and `replay` metadata.
- `appendReplaySessionCommandForApi(payload, repository)` validates `sessionId` and manager-command shape, appends the command, and returns command count.
- `resumeReplaySessionForApi(payload, repository)` validates `sessionId` and `currentMinute`, uses stored visible events and commands, calls the existing authoritative resume engine, records signature/event-count audit metadata, and returns authoritative resume output plus `sessionId`.

## Task 3 — Fastify routes

**Objective:** Expose the stored-session helper functions through the existing API server while preserving existing `/api/simulate-match` and `/api/resume-match` behavior.

**Files:**

- Modify: `src/api/server.ts`
- Modify: `tests/api/server.test.ts`

Routes:

- `POST /api/replay-sessions`
- `POST /api/replay-sessions/:sessionId/commands`
- `POST /api/replay-sessions/:sessionId/resume`

Testing approach:

- Add one server injection test proving a session can be created, a command appended, and authoritative resume run from stored state.
- Do not require browser wiring in this slice.

## Task 4 — Documentation and mission runner

**Objective:** Preserve project handoff quality and mission-labelled validation.

**Files:**

- Create: `docs/35-production-replay-session-persistence-contract.md`
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`
- Modify: `scripts/run-mission-tests.ts`

Add missions for repository and stored-session API behavior.

## Verification

Run in order:

```bash
printf '\nMISSION P16C-01: replay session repository\n' && npx vitest run tests/api/replaySessionRepository.test.ts && printf 'MISSION P16C-01 STATUS: PASSED\n'
printf '\nMISSION P16C-02: replay session API adapter\n' && npx vitest run tests/api/replaySessionEndpoint.test.ts && printf 'MISSION P16C-02 STATUS: PASSED\n'
npm run test:missions
npm test
npx tsc --noEmit
npm run build
```

Browser check:

- Load the existing Match Lab.
- Run a match.
- Start interactive replay.
- Request authoritative resume.
- Confirm existing P16B UI still works with no console errors.

## Next-phase transition

After P16C, the recommended next slice is to migrate Match Lab to create and hold a replay session ID, then request authoritative resume by session ID rather than sending all visible events from the browser.
