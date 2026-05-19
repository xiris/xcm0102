# Durable Replay Session Persistence Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Add a storage-shaped replay-session repository seam that can export/hydrate durable records and preserve authoritative resume parity after hydration.

**Architecture:** Keep the repository in memory for now, but introduce a JSON-compatible `ReplaySessionStorageRecord` contract. API helpers continue to depend only on `ReplaySessionRepository`; hydration/export are repository concerns and prepare the boundary for a future database adapter.

**Tech Stack:** TypeScript, Vitest, Next.js app routes, Fastify API helpers.

---

## Scope

In scope:

- `ReplaySessionStorageRecord` type with `schemaVersion: 1`.
- Repository methods for listing and hydrating records.
- Deep clone isolation for exported/imported state.
- ID continuity after hydration.
- Tests proving hydrated custom-tactic sessions resume authoritatively.
- Docs and mission runner updates.

Out of scope:

- Real database installation.
- File writes for persistence.
- Auth/user/world ownership.
- Multiplayer lobby records.

## Task 1: RED repository round-trip test

**Objective:** Prove the desired storage seam before implementation.

**Files:**

- Modify: `tests/api/replaySessionRepository.test.ts`

**Steps:**

1. Add a test that creates a session, appends a command, replaces visible events, records an authoritative signature, exports storage records, hydrates a fresh repository, and expects the hydrated session to equal the original durable state.
2. Assert `schemaVersion: 1` exists on the exported record.
3. Assert the next created session after hydration gets a later generated ID.
4. Run:

```bash
npx vitest run tests/api/replaySessionRepository.test.ts -t 'exports and hydrates durable storage records'
```

Expected RED: method missing or type/compile failure because storage methods do not exist.

## Task 2: GREEN repository storage seam

**Objective:** Implement the minimum repository methods to satisfy round-trip behavior.

**Files:**

- Modify: `src/api/replaySessionRepository.ts`

**Steps:**

1. Add `ReplaySessionStorageRecord` type.
2. Extend `ReplaySessionRepository` with `listStorageRecords()` and `hydrateStorageRecords(records)`.
3. Implement deep-cloned export/import.
4. Reject unsupported schema versions.
5. Advance `nextId` past hydrated `rs-000001` style IDs.
6. Rerun the Task 1 test and the full repository test file.

## Task 3: RED hydrated API resume parity test

**Objective:** Prove API helpers can resume a hydrated custom-tactic session without rebuilding from defaults.

**Files:**

- Modify: `tests/api/replaySessionEndpoint.test.ts`

**Steps:**

1. Create a custom tactical replay session through `createReplaySessionForApi`.
2. Export storage records from the original repository.
3. Hydrate a fresh repository.
4. Resume from the hydrated repository and compare signature/events to resume from the original repository.
5. Run:

```bash
npx vitest run tests/api/replaySessionEndpoint.test.ts -t 'resumes custom tactical sessions after storage hydration'
```

Expected RED before Task 2 or before API coverage is complete.

## Task 4: GREEN hydrated resume behavior

**Objective:** Keep API helper behavior unchanged while relying on the repository storage seam.

**Files:**

- Modify if needed: `src/api/replaySessionEndpoint.ts`
- Modify if needed: `src/api/replaySessionRepository.ts`

**Steps:**

1. Ensure `getSession()` after hydrate returns the stored `baseInput`, visible events, and commands.
2. Ensure `resumeReplaySessionForApi()` continues using `session.baseInput`.
3. Rerun targeted tests.

## Task 5: Docs, missions, validation, commit

**Objective:** Finish the slice according to project workflow.

**Files:**

- Modify: `scripts/run-mission-tests.ts`
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`

**Steps:**

1. Add a mission for durable replay-session persistence.
2. Update docs index and handoff status.
3. Run mission-labelled targeted tests, `npm run test:missions`, `npm test`, `npx tsc --noEmit`, `npm run build`, and a browser smoke check.
4. Inspect `git diff --check`, `git status --short --branch`, and `git diff --stat`.
5. Commit locally only. Do not configure or push a remote.
