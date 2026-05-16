# Production Roadmap After Spikes

## Decision

The spike phase has answered enough of the high-risk match-engine questions to move into production design and implementation.

Validated foundations:

- deterministic seeded match simulation;
- command logs for replay and audit;
- explicit WIB and WOB tactic maps;
- possession-state transitions instead of teleporting tactical shapes;
- tactical consequences for overloads, congestion, exposure, late arrivals, and fatigue;
- player attributes and tactical familiarity affecting execution;
- explainable diagnostics for managers.

The next phase should stop adding isolated Python spikes unless a specific unknown blocks implementation. The priority is now to build a production skeleton that can absorb the validated ideas cleanly.

## Recommended next step

Build the production foundation in TypeScript:

1. monorepo/app structure;
2. deterministic simulation package;
3. shared domain types for teams, players, tactics, contexts, commands, events, reports;
4. first port of the spike match-engine contract;
5. test harness proving replay determinism and tactical effects;
6. documentation that maps every production concept back to spike findings.

This does not need the full web app yet. The first production slice should be a tested simulation library and CLI demo. That gives the project a stable core before UI, database, accounts, lobbies, or multiplayer are added.

## Why this is next

The match engine is the soul of the game. If the domain model is wrong, the web app will only make wrong assumptions permanent.

The project should therefore harden these concepts first:

- Match inputs must be explicit and serializable.
- Randomness must be server-owned and seed-driven.
- Player attributes must influence action execution without becoming a single magic score.
- Tactics must preserve the CM0102 feeling of manager control.
- WIB/WOB must be powerful but costly when abused.
- Reports must explain outcomes without revealing hidden perfect truth.
- Online matches must be replayable from initial state, seed, and command log.

## Phase P0 — Production simulation foundation

Goal: create a real production package for the deterministic match engine.

Deliverables:

- TypeScript package for simulation domain and engine.
- Typed objects for Player, Team, TacticBook, MatchContext, MatchCommand, MatchEvent, MatchReport.
- Seeded RNG utility with repeatable output.
- First deterministic `simulateMatch(input)` API.
- Tests run mission-by-mission and as a suite.
- CLI command that outputs JSON for inspection.
- Documentation linking implementation choices to spikes 001-005.

Success criteria:

- Same input + same seed always produces identical output.
- Tactical intent affects match stats/events.
- WIB/WOB maps are represented as first-class data, even if the first port only uses a subset.
- The output includes events, stats, diagnostics, and replay metadata.
- Tests are readable enough to become regression examples.

Non-goals:

- No database yet.
- No auth/accounts yet.
- No full UI yet.
- No real-player database.
- No perfect football realism.
- No multiplayer lobbies yet.

## Phase P1 — Domain persistence design

Goal: design the database model around the production simulation inputs and outputs.

Deliverables:

- PostgreSQL schema draft.
- Prisma or Drizzle decision confirmed.
- Tables/entities for users, worlds, clubs, players, tactics, matches, match commands, match events, reports, audit logs.
- Save-game boundary definition.
- Migration strategy for tactics and match-engine versions.

Success criteria:

- A match can be reconstructed from durable state.
- Tactics can be versioned safely.
- Online audit logs can prove what happened.
- Hidden state remains server-side.

## Phase P2 — Vertical-slice API

Goal: expose the simulation core through a backend command API.

Deliverables:

- Fastify TypeScript server.
- Endpoint to create a demo world.
- Endpoint to select lineups/tactics.
- Endpoint to simulate a match.
- Endpoint to fetch match report and event timeline.
- Basic validation and error handling.

Success criteria:

- The server, not the client, owns simulation.
- API responses are deterministic and test-covered.
- A future web UI can consume the API without special knowledge.

## Phase P3 — Minimal browser UI

Goal: create the first playable browser loop around the production core.

Deliverables:

- Next.js app.
- Squad screen.
- Basic team selection.
- Basic tactic-book viewer/editor.
- Simulate-match screen.
- Match report screen.

Success criteria:

- A user can pick a team, inspect players, set a simple tactic, run a match, and understand why the result happened.

## Phase P4 — Online head-to-head prototype

Goal: add a constrained 1v1 mode before the full career multiplayer layer.

Deliverables:

- Lobby creation/join.
- Club/team choice.
- Private tactic setup.
- Ready/lock flow.
- Server-side match simulation.
- Shared match report.
- Rematch flow.

Success criteria:

- Two users can play a match without starting a full career world.
- Tactics and lineups remain private until lock/kickoff.
- The match is replayable from seed + command log.

## Phase P5 — Career loop

Goal: expand from isolated matches into a playable season.

Deliverables:

- One generated league.
- Calendar and fixture generator.
- League table.
- Injuries, cards, condition, morale.
- News inbox.
- Save/load progression.

Success criteria:

- A solo user can play a full season quickly and understand the consequences of decisions.

## Production design rules

### Keep CM0102 fun

Preserve:

- fast progression;
- readable tables;
- simple surface, deep consequences;
- surprising cheap-player discovery;
- tactics mattering immediately;
- text/report-driven imagination;
- long-save stories.

### Fix old gaps

Modernize:

- explainability;
- deterministic online fairness;
- anti-exploit tactical costs;
- better scouting fog-of-war;
- save/version migration;
- multiplayer coordination;
- accessibility and browser UX;
- safer community editing/modding.

### Avoid early traps

Do not start with:

- a 3D match view;
- every world league;
- licensed data assumptions;
- complex finances;
- hardcoded exploit bans;
- client-side simulation authority;
- huge UI before the engine contract stabilizes.

## Documentation tasks to keep current

As production begins, keep these docs updated continuously:

- `docs/03-domain-model.md` for entity changes.
- `docs/05-roadmap.md` for phase scope changes.
- `docs/07-match-engine-variables.md` for simulation variables and balancing decisions.
- `docs/08-technology-stack.md` for stack decisions and deviations.
- `docs/09-spike-findings.md` for any new experimental findings.
- `docs/10-production-roadmap.md` for current build sequence.

## Immediate implementation plan

Use `docs/plans/2026-05-16-production-simulation-foundation.md` as the next execution plan.

That plan starts with a production simulation package and deliberately avoids database/UI complexity until the deterministic match contract is ported and tested.
