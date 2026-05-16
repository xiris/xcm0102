# Production Simulation Contract

## Status

This is the first production TypeScript match-simulation contract for XCM0102.

It ports the validated spike direction into a small, deterministic, test-covered core. It is intentionally not a full football model yet. The goal is to establish the contract that future API, UI, database, replay, and online systems will call.

## Implementation paths

Core files:

- `src/simulation/domain.ts`
- `src/simulation/rng.ts`
- `src/simulation/sampleData.ts`
- `src/simulation/simulateMatch.ts`
- `src/index.ts`

Execution helpers:

- `src/cli/runSimulation.ts`
- `scripts/run-mission-tests.ts`

Tests:

- `tests/simulation/rng.test.ts`
- `tests/simulation/simulateMatch.test.ts`

## Public API

The core simulation API is:

```ts
simulateMatch(input: MatchInput): MatchResult
```

The function is pure from the caller's perspective:

- all match input is supplied in `MatchInput`;
- randomness comes only from `input.seed`;
- output is fully serializable;
- replay metadata is returned in the report.

## Determinism rules

Production simulation must obey these rules:

1. Never use `Math.random()` inside simulation.
2. Use `createSeededRng(seed)` for all random draws.
3. Treat server-owned seed plus initial state plus command log as the replay source of truth.
4. Return events, stats, score, diagnostics, and replay metadata.
5. Keep hidden/future online authority server-side; clients should request commands, not compute outcomes.

Current replay metadata:

```ts
report: {
  replay: {
    seed: number;
    engineVersion: string;
    commandCount: number;
  }
}
```

## Domain shape

The first production domain includes:

- `PlayerAttributes`
- `Player`
- `Team`
- `PitchPoint`
- `BallZone`
- `WibWobMap`
- `TacticBook`
- `MatchContext`
- `MatchCommand`
- `MatchInput`
- `MatchEvent`
- `TeamMatchStats`
- `MatchReport`
- `MatchResult`

The important design decision is that tactics are not a single score. A tactic book contains explicit fields:

```ts
TacticBook {
  mentality;
  pressing;
  transitionStyle;
  familiarity;
  wib;
  wob;
}
```

WIB and WOB are first-class maps:

```ts
zone -> player -> target position
```

This preserves the original CM0102 tactical fun while allowing the engine to price movement, congestion, recovery, exposure, and fatigue.

## Attribute execution model

The first implementation computes execution from these attribute groups:

- pace + acceleration: recovery speed and late arrivals;
- stamina: fatigue from movement and pressing;
- positioning + anticipation: defensive recovery quality;
- teamwork + decisions + passing: attacking support and transition decisions;
- finishing: chance conversion contribution;
- tackling: defensive control contribution.

Execution is then modified by tactical familiarity.

Low familiarity should not make a tactic impossible, but it should make execution slower and messier.

## Tactical model

The first production slice uses these tactical variables:

- mentality: defensive, balanced, attacking;
- pressing: low, medium, high;
- transition style: hold shape, balanced, fast break;
- WIB/WOB movement load;
- tactical familiarity.

The implementation currently computes a simple movement-load value from the distance between WIB and WOB centroids plus shape spread.

That is intentionally simpler than the Python spikes, but it preserves the most important contract:

- extreme WIB/WOB movement costs more;
- weak/slow players arrive late more often;
- low familiarity increases transition delay;
- tactical choices affect match stats and diagnostics.

## Output contract

`MatchResult` includes:

- `score.home` / `score.away`
- `stats.home` / `stats.away`
- `events[]`
- `report.diagnostics[]`
- `report.replay`

Team stats currently include:

- shots;
- shots on target;
- goals;
- possession;
- fatigue;
- transition delay;
- late arrivals;
- execution;
- movement load.

Events currently include:

- kickoff;
- chance;
- goal;
- transition delay;
- late arrival;
- full time.

## Diagnostics philosophy

Diagnostics are first-class output, not debug leftovers.

The game should explain causes to the manager without revealing a perfect hidden formula. Current diagnostics distinguish:

- low tactical familiarity;
- long WIB/WOB recovery geometry;
- player attribute limitations;
- late arrivals and counter windows;
- pressing fatigue costs.

This follows the spike finding that a modern CM0102-inspired game should remain readable and explainable while preserving tactical mystery.

## Spike lineage

This production contract comes from:

- Spike 001: deterministic match harness, seed replay, live-command shape, reports.
- Spike 002: explicit WIB/WOB target maps and movement load.
- Spike 003: tactical consequences from WIB/WOB maps feeding match-level outcomes.
- Spike 004: separate WIB and WOB maps plus possession-state transition costs.
- Spike 005: player attributes and tactical familiarity affecting the same tactical book differently.

## Test contract

Mission tests currently cover:

- deterministic RNG replay;
- RNG integer helper ranges;
- sample tactic maps keyed by actual team player ids;
- deterministic match replay;
- attacking mentality pressure;
- tactical familiarity effects;
- attribute effects on late arrivals;
- diagnostic explanations.

Run mission tests:

```bash
npm run test:missions
```

Run aggregate tests:

```bash
npm test
```

Run typecheck:

```bash
npx tsc --noEmit
```

Run CLI demo:

```bash
npm run sim:demo -- --seed 42 --home-quality weak --home-familiarity 0.2 --home-movement extreme
```

## Current simplifications

The first production implementation deliberately simplifies:

- no database persistence;
- no real command application yet;
- no substitutions;
- no injuries/cards;
- no set pieces;
- no player-role familiarity;
- no unit familiarity;
- no full zone-by-zone event engine;
- no scouting fog-of-war;
- no multiplayer lock/audit flow yet.

These are future layers. The current goal is the stable deterministic simulation contract.

## Next production step

The next implementation plan should wrap this package in a Fastify API while keeping simulation authority server-side.

Recommended next doc/plan:

- `docs/plans/YYYY-MM-DD-production-api-foundation.md`
