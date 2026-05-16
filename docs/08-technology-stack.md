# Technology Stack Recommendation

## Recommendation in one sentence

Use TypeScript end-to-end for the product, PostgreSQL for durable game state, Redis for realtime/session coordination, and a Python spike layer only for fast match-engine experimentation until the model stabilizes.

Recommended stack:
- Frontend: Next.js + React + TypeScript
- Styling/UI: Tailwind CSS + shadcn/ui or Radix UI
- Realtime: WebSockets via Socket.IO or native ws
- Backend API: Node.js + TypeScript, preferably NestJS or Fastify
- Database: PostgreSQL
- ORM/query layer: Prisma for speed early, or Drizzle if we want more SQL control
- Cache/queues/presence: Redis + BullMQ
- Match engine prototype: Python first, later port core to TypeScript or Rust/WASM if needed
- Testing: Vitest/Jest for TS, pytest for Python spikes, Playwright for browser flows
- Deployment: Docker Compose locally; later Fly.io/Render/Railway/AWS depending scale

## Original implementation context

The original CM0102 was a native desktop game from the early 2000s, and community technical discussion around the executable, patches, crash logs, and editor tooling strongly points to a C/C++-style native Windows codebase rather than a managed/web stack.

That is useful context, but it should not force the remake to use C or C++.

What to preserve from the original engineering style:
- deterministic, server-owned simulation logic;
- compact data structures for players, clubs, competitions, and matches;
- fast table-heavy interactions;
- simple presentation over expensive animation;
- gameplay depth coming from rules, data, and emergent outcomes rather than graphics.

What to modernize:
- online-first architecture;
- browser UI;
- multiplayer lobbies and head-to-head modes;
- audit logs and deterministic replay;
- safe patching/modding/import pipelines;
- automated tests around simulation invariants;
- clear domain model instead of opaque executable patching.

A modern TypeScript/PostgreSQL/Redis stack can keep the feel while avoiding the distribution, tooling, and maintainability limits of a native-only desktop codebase. If the match engine later proves CPU-bound, a Rust or C++ simulation core behind a stable interface remains a future option.

## Product constraints that drive the stack

This game needs:
- fast table-heavy UI;
- live match updates;
- deterministic server-side simulation;
- multiplayer lobbies and presence;
- private manager state;
- durable histories/audit logs;
- large searchable player databases;
- background jobs for world ticks, tournaments, and async simulations;
- community tools and data import/export.

The stack should optimize for correctness, iteration speed, and long-term maintainability rather than exotic performance too early.

## Architecture overview

Recommended architecture:

1. Web client
   - Next.js app for dashboard, squad, tactics, match view, tournaments.
   - Uses HTTP for CRUD flows.
   - Uses WebSocket channel for live match/lobby updates.

2. API server
   - TypeScript backend owns all game commands.
   - Validates commands and writes events/state.
   - Never trusts the client for hidden data or simulation outcomes.

3. Simulation workers
   - Background workers process match ticks, world ticks, tournaments, reports.
   - Initially can be the same codebase/process.
   - Later split into separate worker services.

4. PostgreSQL
   - Durable truth: users, worlds, clubs, players, matches, events, tactics, tournaments.
   - Use relational integrity for complex game state.

5. Redis
   - Presence, lobby readiness, live match pub/sub, queues, rate limits, short-lived locks.

6. Spikes
   - Python throwaway prototypes for match-engine math and simulations.
   - Keep them under spikes/ until validated.
   - Port proven ideas into production stack.

## Frontend

### Recommended: Next.js + React + TypeScript

Why:
- excellent table/dashboard UI ecosystem;
- easy routing for game screens;
- good SSR/static options for public pages;
- strong TypeScript integration;
- easy deployment;
- large talent pool.

Use for:
- squad screen;
- player profile;
- tactics editor;
- training/scouting/transfers;
- head-to-head lobby;
- live match room;
- tournament brackets;
- admin/editor tools.

### UI components

Recommended:
- Tailwind CSS for styling;
- shadcn/ui or Radix UI for accessible primitives;
- TanStack Table for data-heavy squad/player tables;
- TanStack Query for server-state caching;
- Zustand or Jotai for local UI state;
- dnd-kit for drag/drop lineups and tactics;
- Recharts or lightweight SVG for action zones/stats.

Avoid initially:
- heavy component suites that fight custom layouts;
- complex canvas engines for the first version;
- 3D match views.

## Backend

### Recommended: TypeScript backend

Two good choices:

#### Option A: NestJS
Pros:
- structured modules;
- dependency injection;
- good for a growing domain;
- WebSocket support;
- queues/scheduled jobs patterns;
- clear service boundaries.

Cons:
- more framework ceremony;
- slower for tiny prototypes.

Best if we want architecture discipline early.

#### Option B: Fastify
Pros:
- faster and simpler;
- less ceremony;
- excellent performance;
- good TypeScript support.

Cons:
- more architecture decisions are on us.

Best if we want lean early iteration.

Recommendation:
- Use Fastify for the first product prototype if we prioritize speed.
- Use NestJS if we expect many modules and contributors soon.

For this project, I recommend Fastify first, with explicit domain modules, because we are still validating core gameplay.

## Database

### Recommended: PostgreSQL

Why:
- relational data fits football simulation well;
- strong constraints and transactions;
- JSONB for flexible scouting reports/tactics/events;
- full-text search for players/clubs/news;
- good indexing for large player databases;
- mature ecosystem.

Use Postgres for:
- users/managers;
- game worlds;
- clubs/nations/competitions;
- players/staff/contracts;
- tactics;
- matches/events/reports;
- transfer bids/contracts;
- tournaments/brackets;
- audit logs.

### ORM/query layer

Prisma:
- very fast to start;
- good schema/migrations;
- strong TypeScript types;
- easy for CRUD-heavy app.

Drizzle:
- more SQL-like;
- lighter;
- better control;
- less magic.

Recommendation:
- Prisma for first app build unless we hit query-control pain.
- Use raw SQL for hot leaderboard/search/report queries if needed.

## Realtime and queues

### Redis

Use Redis for:
- match room pub/sub;
- lobby presence;
- ready states;
- temporary locks;
- rate limiting;
- background job queues;
- scheduled tournament deadlines.

### Queue system

Recommended:
- BullMQ if using Node/TypeScript workers.

Jobs:
- simulate match tick;
- continue world tick;
- process transfer responses;
- generate scout reports;
- tournament deadline/forfeit handling;
- async notifications.

## Match engine

### Prototype phase

Use Python for spikes.

Why:
- fastest for simulation experiments;
- great for running thousands of matches;
- easy to inspect probabilities and statistics;
- good for notebooks/plots later if needed.

Spikes should validate:
- attribute combinations;
- intrinsic/effective attribute model;
- weather/referee/home/away modifiers;
- tactical load;
- WIB/WOB movement cost;
- live tactical changes;
- deterministic replay.

### Production phase

Best default: TypeScript match engine inside backend/worker.

Why:
- one language for product;
- easier shared types with API/UI;
- simpler deployment;
- deterministic enough if we control RNG carefully;
- easier for contributors.

Possible future optimization:
- Rust core compiled to WASM or native worker if simulations become CPU-heavy.

Do not start with Rust unless performance becomes a proven blocker.

## Determinism

Use a seedable RNG library, not Math.random.

Requirements:
- server owns seed;
- every match event consumes RNG in a deterministic order;
- live manager commands are timestamped/tick-numbered;
- match can be replayed from initial state + command log + seed.

Store:
- match seed;
- initial team/tactic snapshots;
- command log;
- event log;
- final report.

## Data and search

Start with PostgreSQL full-text and indexed filters.

Later options:
- Meilisearch or Typesense for fast fuzzy player search;
- Elasticsearch/OpenSearch only if scale demands it.

For early product:
- Postgres is enough.

## Tactics editor technology

Use HTML/SVG first.

Recommended:
- React + SVG pitch;
- dnd-kit for draggable player dots;
- JSON tactic model;
- server validation;
- tactical load diagnostics.

Avoid initially:
- canvas game engines;
- complex animations;
- full 3D.

SVG is enough for:
- base formation;
- WIB/WOB zones;
- arrows/runs;
- action zones;
- simple match timeline.

## Testing stack

TypeScript:
- Vitest for unit tests;
- fast-check for property-based tests around match-engine invariants;
- Supertest or Fastify inject for API tests;
- Playwright for end-to-end UI flows.

Python spikes:
- pytest;
- optionally pandas/matplotlib for simulation summaries.

Important test categories:
- deterministic replay same seed/same commands;
- different live commands change outcome distribution;
- fatigue never increases from high pressing during match;
- impossible lineups rejected;
- private tactics not visible before lock;
- tournament bracket advances correctly;
- match engine does not produce impossible events.

## Local development

Use Docker Compose for dependencies only:
- Postgres;
- Redis.

Run app locally with native Node for speed.

Suggested package manager:
- pnpm.

Suggested monorepo layout:

```text
apps/
  web/              Next.js app
  api/              Fastify/Nest backend
  worker/           background jobs and simulation workers
packages/
  domain/           shared domain types and pure logic
  match-engine/     deterministic simulation core
  db/               schema/client/migrations
  ui/               shared UI components if needed
spikes/
  001-match-engine-core/
  002-wibwob-movement-load/
docs/
```

## Deployment path

Early prototype:
- local dev only;
- Docker Compose for Postgres/Redis.

Private alpha:
- Fly.io, Render, Railway, or a small VPS;
- managed Postgres;
- managed Redis if available;
- single API/worker process is okay initially.

Scale later:
- separate web/API/worker;
- queue-based simulation workers;
- match rooms horizontally scaled with Redis pub/sub;
- read replicas/search service if needed.

## What not to use early

Avoid early:
- microservices;
- Kubernetes;
- event streaming platforms like Kafka;
- Rust-first engine;
- 3D match engine;
- Elasticsearch;
- overly generic ECS architecture;
- blockchain/NFT/market mechanics;
- mobile native apps.

These may become useful later, but they slow proof-of-concept work.

## Immediate next step

Build spike 001 in Python:

```text
spikes/001-match-engine-core/
  README.md
  match_engine.py
  sample_data.py
  run_simulation.py
```

Validate:
- seeded deterministic matches;
- different tactics produce different distributions;
- weather/referee/home/away affect outcomes;
- live tactical changes affect remaining match ticks;
- report explains major causes.

After spike 001 is validated, decide whether to port the match engine to TypeScript immediately or keep iterating in Python for spike 002.

## Final recommendation

Use this stack:

- Python for disposable match-engine spikes.
- TypeScript monorepo for the product.
- Next.js + React for the web client.
- Fastify for the first backend unless we want NestJS structure.
- PostgreSQL for durable relational game state.
- Redis + BullMQ for realtime coordination and jobs.
- SVG/React for tactics and match visualization.
- Vitest/Playwright/pytest for testing.

This gives us fast iteration now and a credible path to a serious online game later.
