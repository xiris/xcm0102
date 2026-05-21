# Lobby State Transition Commands Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Add server-owned replay-session lobby-state transition commands so future head-to-head lobby UI can advance setup state without mutating repository internals or trusting client state.

**Architecture:** Extend the existing in-memory replay-session repository with a small state-machine method, expose it through one API helper, then wire thin Fastify and Next route wrappers. Keep current Match Lab creation behavior defaulting to `in_match`.

**Tech Stack:** TypeScript, Vitest, Fastify, Next.js app routes, in-memory repository.

---

## Scope

In scope:

- Forward-only lobby-state transition method.
- Audit entries for lobby-state transitions.
- Completed-session command append guard.
- API helper and Fastify/Next route wrappers.
- Mission runner and docs updates.

Out of scope:

- Browser lobby UI.
- Auth/authorization or side permissions.
- Sockets or live lobby updates.
- Database persistence.

## TDD Tasks

### Task 1: Repository RED tests

**Objective:** Define repository state-machine behavior before implementation.

**Files:**

- Modify: `tests/api/replaySessionRepository.test.ts`
- Later modify: `src/api/replaySessionRepository.ts`

**RED assertions:**

- A head-to-head session created in `setup` transitions to `locked`, then `in_match`, then `complete`.
- Transition audit entries include `fromLobbyState` and `toLobbyState`.
- `setup -> in_match`, `locked -> setup`, and `complete -> in_match` throw `Invalid replay session lobby transition: <from> -> <to>`.
- Completed sessions reject `appendManagerCommand` with `Replay session is complete and cannot accept manager commands`.

**Command:**

```bash
npx vitest run tests/api/replaySessionRepository.test.ts -t 'transitions lobby state|rejects invalid lobby transitions|rejects manager commands after completion'
```

Expected first result: FAIL because `transitionLobbyState` and audit fields do not exist.

### Task 2: Repository GREEN implementation

**Objective:** Implement minimal repository support for transition state and command guard.

**Files:**

- Modify: `src/api/replaySessionRepository.ts`

**Implementation notes:**

- Add `lobby_state_transitioned` to `ReplaySessionAuditType`.
- Add optional `fromLobbyState` and `toLobbyState` fields to `ReplaySessionAuditEntry`.
- Add `transitionLobbyState` to `ReplaySessionRepository`.
- Validate transitions with a small map:
  - `setup: 'locked'`
  - `locked: 'in_match'`
  - `in_match: 'complete'`
  - `complete: undefined`
- Use a single timestamp per save where convenient.
- Guard `appendManagerCommand` when current state is `complete`.

### Task 3: API helper RED tests

**Objective:** Define public transition API behavior.

**Files:**

- Modify: `tests/api/replaySessionEndpoint.test.ts`
- Later modify: `src/api/replaySessionEndpoint.ts`

**RED assertions:**

- `transitionReplaySessionLobbyStateForApi` transitions current Match Lab sessions from `in_match` to `complete`.
- Invalid `lobbyState` returns `400` with `lobbyState must be setup locked in_match or complete`.
- Invalid transition returns `400` with repository transition error.
- Missing session returns `404`.

### Task 4: API helper GREEN implementation

**Objective:** Parse and execute transition requests through the repository.

**Files:**

- Modify: `src/api/replaySessionEndpoint.ts`

**Implementation notes:**

- Import `ReplaySessionLobbyState` type.
- Add `transitionReplaySessionLobbyStateForApi`.
- Add parser for `{ sessionId, lobbyState }`.
- Treat missing sessions as `404`; invalid transitions as `400`.

### Task 5: Route RED tests

**Objective:** Prove Fastify and Next route parity.

**Files:**

- Modify: `tests/api/server.test.ts`
- Modify: `tests/api/replaySessionNextRoutes.test.ts`

**RED assertions:**

- Fastify `PATCH /api/replay-sessions/:sessionId/lobby-state` returns complete summary shape.
- Fastify command append after completion returns `400`.
- Next app-route PATCH wrapper transitions the shared in-process session to complete.

### Task 6: Route GREEN implementation

**Objective:** Add thin route wrappers.

**Files:**

- Modify: `src/api/server.ts`
- Create: `app/api/replay-sessions/[sessionId]/lobby-state/route.ts`

**Implementation notes:**

- Reuse `transitionReplaySessionLobbyStateForApi`.
- Next dynamic route context should be typed as `{ params: Promise<{ sessionId: string }> }` and awaited.

### Task 7: Docs, missions, validation, commit

**Objective:** Finish the slice with documentation, mission labels, full validation, and local commit.

**Files:**

- Modify: `scripts/run-mission-tests.ts`
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`

**Validation:**

```bash
printf '\nMISSION P17D-01: replay session repository lobby transitions\n'
npx vitest run tests/api/replaySessionRepository.test.ts -t 'transitions lobby state|rejects invalid lobby transitions|rejects manager commands after completion'

printf '\nMISSION P17D-02: replay session lobby transition API helper\n'
npx vitest run tests/api/replaySessionEndpoint.test.ts -t 'transitions replay session lobby state|rejects invalid replay session lobby state requests'

printf '\nMISSION P17D-03: replay session lobby transition routes\n'
npx vitest run tests/api/server.test.ts -t 'replay session lobby-state route completes sessions'
npx vitest run tests/api/replaySessionNextRoutes.test.ts

npm run test:missions
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Browser check:

- Run existing Match Lab flow.
- Confirm replay session metadata still appears.
- Append a manager action and request authoritative resume.
- Confirm no UI error and no console errors.

Commit locally only; do not configure or push a remote.
