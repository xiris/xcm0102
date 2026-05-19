# Replay Session Tactic Parity Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Ensure replay sessions preserve and resume from the same tactical payload used by Match Lab simulation.

**Architecture:** Extract/share the simulation API parser and `MatchInput` builder, then let replay-session creation store that `MatchInput` as authoritative base state. Keep routes thin and browser code orchestration-only.

**Tech Stack:** TypeScript, Vitest, Next.js app routes, Fastify route tests.

---

## Scope

In scope:

- Full tactical payload support in `POST /api/replay-sessions`.
- Stored replay-session base `MatchInput`.
- Browser client request shape update.
- Match Lab reuse of a single built payload for simulation and session creation.
- Docs, mission runner, validation, and local commit.

Out of scope:

- Durable database persistence.
- Multiplayer ownership/permissions.
- Removing legacy seed-only or `/api/resume-match` compatibility.

## TDD Tasks

### Task 1: RED — API parity test

Add a failing test in `tests/api/replaySessionEndpoint.test.ts` that:

1. Builds a custom tactical payload that differs from defaults.
2. Runs `simulateMatchForApi(payload)`.
3. Creates a replay session with the same payload.
4. Expects session creation score/replay metadata to match simulation output.
5. Syncs stored visible events and resumes, proving resume succeeds from stored custom base input.

Expected initial failure: session creation ignores tactical payload and returns default-demo output.

### Task 2: RED — browser request shape test

Update `tests/web/replaySessionClient.test.ts` so create-session sends `{ simulation: <payload> }` or an equivalent full tactical payload shape, not only `{ seed }`.

Expected initial failure: current client posts seed-only body.

### Task 3: GREEN — shared simulation input builder

Refactor `src/api/simulationEndpoint.ts` to export a reusable `buildSimulationMatchInputForApi(payload)` helper that returns either validation errors or a concrete `MatchInput` plus teams/result-ready inputs. Keep `simulateMatchForApi` behavior unchanged.

### Task 4: GREEN — store base MatchInput

Update `src/api/replaySessionRepository.ts` to store `baseInput: MatchInput` on each session. Update `createReplaySessionForApi` to parse full create-session payloads and store the built input. Update `resumeReplaySessionForApi` to resume from `session.baseInput`.

### Task 5: GREEN — browser payload wiring

Update `src/web/replaySessionClient.ts` and `src/web/MatchLab.tsx` so Match Lab builds the simulation payload once and sends it to both simulation and session creation.

### Task 6: Docs and mission runner

Add mission labels for the new parity tests, update `docs/README.md`, `docs/30-project-handoff-status.md`, and this contract if implementation details differ.

### Task 7: Verification

Run:

```bash
npx vitest run tests/api/replaySessionEndpoint.test.ts -t 'preserves custom tactical payload'
npx vitest run tests/web/replaySessionClient.test.ts
npm run test:missions
npm test
npx tsc --noEmit
npm run build
```

Then browser-check:

1. Navigate to `http://localhost:3000`.
2. Change at least one tactic from default.
3. Run match.
4. Confirm replay session metadata appears.
5. Start interactive replay, record a command, request authoritative resume.
6. Confirm no `.error` elements and no console errors.

Commit locally only. Do not push and do not configure a remote.
