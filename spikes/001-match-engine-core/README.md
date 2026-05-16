# Spike 001: match-engine-core

## Question

Given two teams with attributes, tactics, and match context, can we simulate deterministic CM0102-inspired matches where:

- the same seed and same inputs replay identically;
- tactics change shot/pressure distributions;
- weather/referee/home-away context affects outcomes;
- live tactical changes affect only the remaining match;
- the match report explains major causes instead of only printing a score.

## Approach

This is a disposable Python spike, not production code.

The simulation uses:

- immutable input dataclasses for players, teams, tactics, context, and live commands;
- Python `random.Random(seed)` for deterministic replay;
- 90 simple ticks;
- per-team pressure calculations from team attributes, mentality, width, pressing, tempo, weather, and home advantage;
- fatigue accumulation from pressing/tempo/weather/stamina;
- event log, command log, diagnostics, and report output.

The goal is to validate the shape of the tests and core behaviours before building a TypeScript production engine.

## Files

- `match_engine.py` - throwaway simulation core.
- `run_simulation.py` - CLI demo that prints JSON.
- `tests/test_match_engine.py` - pytest coverage for the proposed behaviours.

## Run tests

From repo root, run the normal suite:

```bash
python3 -m pytest spikes/001-match-engine-core/tests/test_match_engine.py -q
```

Or run the mission sequence, which collects every test and executes them one by one with fail-fast mission labels:

```bash
python3 spikes/001-match-engine-core/run_mission_tests.py
```

Current result:

```text
ALL 6 MISSIONS PASSED
```

## Run demo

From this directory:

```bash
python3 run_simulation.py --seed 42
python3 run_simulation.py --seed 42 --weather rain --live-change
```

Example output includes:

- scoreline;
- shots/goals/second-half pressure;
- fatigue;
- diagnostics;
- live command log;
- key report reasons;
- first events.

## Validated behaviours

### Deterministic replay

Test: `test_same_seed_same_inputs_replays_identically`

Same teams, tactics, context, commands, and seed produce identical score, events, and diagnostics.

### Tactics affect distributions

Test: `test_attacking_tactic_creates_more_shots_than_defensive_tactic_over_many_seeds`

Across 50 seeds, an attacking setup creates meaningfully more shots than a defensive setup.

### Weather affects match model

Test: `test_rain_reduces_total_chances_and_increases_fatigue_cost`

Rain reduces total shots, increases fatigue, and appears in diagnostics.

### Live tactical changes matter

Test: `test_live_tactical_change_affects_remaining_match_ticks`

A command at tick 45 changes the home tactic and increases second-half pressure compared with the unchanged baseline.

### Reports explain causes

Test: `test_report_explains_major_causes_not_just_score`

The report contains scoreline, stat summary, and causal reasons such as attacking mentality and home advantage.

### CLI is usable

Test: `test_cli_runs_seeded_demo_and_outputs_json_summary`

The demo script runs from the spike directory and emits JSON that can be inspected or piped into future analysis tools.

## What worked

- The proposed tests are a good first safety net for match-engine behaviour.
- Seeded deterministic replay is straightforward if every random draw comes from a controlled RNG.
- The API shape is promising: `simulate_match(home, away, home_tactic, away_tactic, context, seed, commands)`.
- Separating diagnostics/reporting from raw events is useful.
- Live tactical commands are easy to model as tick-numbered command log entries.

## What did not work yet

- The actual football model is still extremely shallow.
- There is no player-level possession model.
- There is no real passing, space, marking, goalkeeper, injuries, cards, morale, substitutions, or set-piece model.
- Referee strictness is only diagnostic right now; it does not yet change fouls/cards.
- WIB/WOB is not modelled yet.
- The scoring/chance probabilities are arbitrary and need calibration.

## Surprises

- Even a small pressure/fatigue model already makes testable behaviour visible.
- Diagnostics should probably be first-class from the start; otherwise the engine becomes a black box quickly.
- Live commands should be part of deterministic replay from day one, not added later.

## Recommendation for the real build

Keep this spike as a disposable behavioural reference, then build spike 002 around WIB/WOB movement load.

Before production implementation, add tests for:

- strict referee increasing fouls/cards;
- high pressing causing late-match fatigue drop-off;
- narrow tactics creating central overload but exposing width;
- DMC protection having limits;
- substitutions and role changes;
- goalkeeper influence;
- set pieces;
- deterministic replay with multiple commands.

## Verdict: VALIDATED

The core question is validated: a small deterministic match-engine API can satisfy the first proposed tests and produce inspectable JSON output. This does not validate the football realism yet; it validates the simulation harness, deterministic replay pattern, command-log model, and first behavioural tests.
