# Production API Foundation Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Wrap the production simulation package in a small server-authoritative Fastify API.

**Architecture:** Keep the API thin. The API validates requests, owns default seed/sample input creation for demo endpoints, calls `simulateMatch(input)`, and returns serializable results. The simulation package remains the only match-engine authority.

**Tech Stack:** TypeScript, Fastify, Vitest, tsx, Node.js.

---

## Scope

In scope:

- Fastify app factory.
- Health endpoint.
- Simulation endpoint.
- Basic request validation without overbuilding a schema framework yet.
- API tests using Fastify injection.
- Mission runner updates.
- API contract documentation.

Out of scope:

- Database.
- Authentication.
- Accounts.
- Browser UI.
- Multiplayer lobby.
- Persistence/audit tables.

## Files

Create:

- `src/api/server.ts`
- `tests/api/server.test.ts`
- `docs/12-production-api-contract.md`

Modify:

- `package.json`
- `scripts/run-mission-tests.ts`
- `docs/README.md`

## Tasks

### Task 1: Install Fastify

Run:

```bash
npm install fastify
```

Verify:

```bash
npx tsc --noEmit
```

### Task 2: TDD health endpoint

Write failing test in `tests/api/server.test.ts`:

- `buildServer()` returns a Fastify instance.
- `GET /health` returns status 200.
- Body includes `{ ok: true, service: 'xcm0102-api' }`.

Run RED:

```bash
npm test -- tests/api/server.test.ts -t 'health endpoint'
```

Expected: fail because `src/api/server.ts` does not exist.

Implement `buildServer()` and `/health`.

Run GREEN:

```bash
npm test -- tests/api/server.test.ts -t 'health endpoint'
```

### Task 3: TDD simulation endpoint

Add tests for `POST /api/simulate-match`:

- accepts `{ seed, homeQuality, awayQuality, homeFamiliarity, awayFamiliarity, homeMovement, awayMovement }`.
- returns status 200.
- response includes `score`, `stats`, `events`, `diagnostics`, `replay`.
- same request returns identical response.
- weak/low-familiarity/extreme home request returns diagnostics mentioning familiarity or movement.

Run RED for each behavior, then implement minimal endpoint.

### Task 4: TDD validation

Add tests:

- invalid seed returns 400.
- invalid team quality returns 400.
- invalid familiarity outside 0..1 returns 400.

Implement minimal validation helpers in `src/api/server.ts`.

### Task 5: Mission runner

Update `scripts/run-mission-tests.ts` with API missions:

- health endpoint;
- deterministic simulate endpoint;
- validation failure endpoint.

Run:

```bash
npm run test:missions
```

### Task 6: Documentation

Create `docs/12-production-api-contract.md` documenting:

- API principle: server owns simulation authority;
- endpoints;
- request/response examples;
- validation boundaries;
- non-goals;
- next step toward persistence/lobby.

Update `docs/README.md`.

### Task 7: Final verification

Run:

```bash
npx tsc --noEmit
npm run test:missions
npm test
```

Expected:

- typecheck passes;
- all missions pass;
- aggregate tests pass.
