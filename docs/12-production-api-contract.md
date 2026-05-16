# Production API Contract

## Status

This is the first server API layer for XCM0102.

It is intentionally thin. The API does not implement separate match logic. It validates requests, creates demo/sample match inputs, calls the production simulation package, and returns serializable results.

## Principle

The server owns simulation authority.

Clients may submit commands or setup choices, but they must not compute official results. This protects deterministic replay, online fairness, private state, and future audit logs.

## Implementation paths

API server:

- `src/api/server.ts`

Tests:

- `tests/api/server.test.ts`

Mission runner:

- `scripts/run-mission-tests.ts`

Simulation dependency:

- `src/simulation/simulateMatch.ts`
- `src/simulation/sampleData.ts`
- `src/simulation/domain.ts`

## App factory

The API exposes:

```ts
buildServer()
```

This returns a Fastify instance for tests and future runtime entrypoints.

Tests use Fastify injection instead of opening a port. This keeps API tests fast and deterministic.

## Endpoints

### GET /health

Purpose:

- simple service liveness check;
- useful for future deployment probes.

Response:

```json
{
  "ok": true,
  "service": "xcm0102-api"
}
```

### POST /api/simulate-match

Purpose:

- run a deterministic demo match through the server-authoritative API;
- prove the API can call the production simulation package;
- provide the future web UI with a stable shape before persistence exists.

Request body:

```json
{
  "seed": 42,
  "homeQuality": "weak",
  "awayQuality": "average",
  "homeFamiliarity": 0.2,
  "awayFamiliarity": 0.7,
  "homeMovement": "extreme",
  "awayMovement": "balanced"
}
```

Fields:

- `seed`: integer, defaults to `1`.
- `homeQuality`: `weak`, `average`, or `strong`, defaults to `average`.
- `awayQuality`: `weak`, `average`, or `strong`, defaults to `average`.
- `homeFamiliarity`: number from `0` to `1`, defaults to `0.7`.
- `awayFamiliarity`: number from `0` to `1`, defaults to `0.7`.
- `homeMovement`: `compact`, `balanced`, or `extreme`, defaults to `balanced`.
- `awayMovement`: `compact`, `balanced`, or `extreme`, defaults to `balanced`.

Response body shape:

```json
{
  "score": { "home": 0, "away": 2 },
  "stats": {
    "home": {
      "shots": 10,
      "shotsOnTarget": 4,
      "goals": 0,
      "possession": 41,
      "fatigue": 83.6,
      "transitionDelay": 76.717,
      "lateArrivals": 10,
      "execution": 0.252,
      "movementLoad": 85.412
    },
    "away": {
      "shots": 33,
      "shotsOnTarget": 14,
      "goals": 2,
      "possession": 59,
      "fatigue": 22.767,
      "transitionDelay": 8.16,
      "lateArrivals": 1,
      "execution": 0.537,
      "movementLoad": 28.612
    }
  },
  "events": [],
  "diagnostics": [],
  "replay": {
    "seed": 42,
    "engineVersion": "production-sim-foundation-0.1.0",
    "commandCount": 0
  }
}
```

The exact numbers depend on the request, but identical request bodies must produce identical responses.

## Validation

The endpoint currently performs minimal explicit validation in `src/api/server.ts`.

Invalid examples:

- non-integer `seed`;
- non-object request bodies such as arrays;
- JSON `null` request bodies;
- unknown team quality;
- unknown movement style;
- familiarity below `0` or above `1`.

Invalid requests return:

```json
{
  "error": "seed must be an integer; homeQuality must be weak, average, or strong"
}
```

with HTTP status `400`.

## Current non-goals

This API foundation does not include:

- database persistence;
- accounts/authentication;
- sessions;
- lobby presence;
- match lock flow;
- audit log tables;
- real club/player data;
- browser UI;
- WebSockets.

Those should come after the API boundary is stable.

## Test contract

API missions cover:

- health endpoint;
- simulation endpoint response shape;
- deterministic API replay for identical requests;
- validation failure;
- non-object request body rejection;
- JSON null request body rejection.

Run:

```bash
npm run test:missions
npm test
npx tsc --noEmit
```

## Next step

The next layer should be either:

1. runtime entrypoint and local dev server script; or
2. persistence design for worlds/matches/events; or
3. minimal Next.js UI that calls this API.

Recommended next product step:

Build a tiny browser vertical slice that calls `POST /api/simulate-match`, because it will make the game visible while still avoiding database complexity.
