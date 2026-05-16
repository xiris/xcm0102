# Spike 002: WIB/WOB Movement Load

## Question

Given a CM0102-style WIB/WOB tactic where the manager can place each player in specific positions for different ball zones, can the game model reflect those instructions for good and for worse?

This spike uses Option A: explicit player positions per ball zone.

The core idea:

- The manager can put any player anywhere in each zone screen.
- Multiple players can intentionally overload the same zone or even the same point.
- These choices create benefits such as central density and short passing support.
- They also create costs such as congestion, wide exposure, fatigue, late arrivals, uncovered targets, and degraded DMC protection.

## Research notes used

Existing project research says WIB/WOB should remain a core feature because it lets managers define with-ball and without-ball shapes zone by zone.

Important notes from the docs/raw research:

- Community discussion describes WIB/WOB as a distinct way to play, focused on player positioning.
- Strong old tactics often use narrow formations, central overloads, DMCs, pressing, high lines, and crowded central WIB/WOB boxes.
- Some community guides explicitly recommend filling key central WOB boxes with bodies and crowding high central WIB boxes with forwards/midfielders.
- The modernization principle is not to remove this freedom. The principle is to price it properly.

Relevant source files:

- `docs/07-match-engine-variables.md`
- `docs/research_raw/forum_wibwob.txt`

Design conclusion:

WIB/WOB positions are tactical intent, not teleportation. The engine should try to obey the manager, but execution depends on distance, fatigue, attributes, repeated transitions, congestion, and opponent exploitation.

## Approach

This is a disposable Python spike, not production code.

The model includes:

- `Zone`: pitch third + lane.
- `Position`: explicit x/y target for a player in a zone.
- `WibWobTactic`: map of zone -> player -> desired position.
- `BallStep`: deterministic sequence of ball-zone changes.
- `simulate_movement`: evaluates movement distance, fatigue, late arrivals, uncovered targets, early pressure, second-half recovery, and DMC coverage.
- `analyze_tactic`: evaluates a single zone for central density, short support, wide exposure, same-point overload, and congestion.

## Files

- `movement_model.py` - throwaway Option A movement-load model.
- `run_movement_simulation.py` - CLI demo that prints JSON.
- `run_mission_tests.py` - one-by-one fail-fast mission runner.
- `tests/test_movement_model.py` - pytest coverage.
- `tests/conftest.py` - local import path setup.

## Run tests

From repo root, run the normal suite:

```bash
python3 -m pytest spikes/002-wibwob-movement-load/tests/test_movement_model.py -q
```

Run the mission sequence:

```bash
python3 spikes/002-wibwob-movement-load/run_mission_tests.py
```

Current result:

```text
ALL 8 MISSIONS PASSED
```

## Run demo

From this directory:

```bash
python3 run_movement_simulation.py --seed 42 --scenario compact
python3 run_movement_simulation.py --seed 42 --scenario overload
python3 run_movement_simulation.py --seed 42 --scenario extreme
```

The output includes:

- team movement metrics;
- attacking-zone analysis;
- diagnostics;
- late-arrival events.

## Validated behaviours

### Deterministic replay

Test: `test_same_seed_same_wibwob_map_replays_identically`

Same seed, same explicit zone-position map, and same ball path produce identical events, team metrics, player metrics, and diagnostics.

### Extreme movement has cost

Test: `test_extreme_zone_positions_create_more_movement_fatigue_than_compact_shape`

Large target jumps across zones create much more movement distance and fatigue than compact shifts.

### Far jumps create late arrivals

Test: `test_far_zone_jumps_cause_late_arrivals_and_uncovered_targets`

When players are asked to move too far for the next ball zone, they can arrive late and leave targets uncovered.

### Central overload is useful but risky

Test: `test_overloading_one_zone_improves_central_density_but_exposes_wide_areas`

A narrow central overload improves central density and short passing support, but increases wide exposure.

### Multiple players on the same point create congestion

Test: `test_multiple_players_same_target_creates_congestion_penalty`

The engine detects when many players are assigned to exactly the same point and applies a congestion penalty.

This directly reflects your requirement: if the player overloads a zone with multiple players, the game should reflect it for good or for worse.

### DMC is strong but not magical

Test: `test_dmc_protection_degrades_when_pulled_across_repeated_lateral_switches`

A DMC can protect the middle, but repeated lateral switches degrade coverage and reduce central protection.

### Pressing has late-match cost

Test: `test_high_pressing_improves_early_pressure_but_costs_second_half_recovery`

High pressing improves early pressure but reduces second-half recovery.

### CLI is usable

Test: `test_cli_runs_option_a_demo_and_outputs_json_summary`

The demo script runs and emits JSON for inspection.

## What worked

- Option A makes sense for this project.
- Explicit per-zone player placement captures the original WIB/WOB feeling.
- Overloads are not simply forbidden; they become tactical tradeoffs.
- Same-point and same-zone clustering can be detected cleanly.
- Movement distance and repeated lateral shifts are good first proxies for fatigue and late coverage.
- DMC degradation can be modelled as coverage decay rather than a binary position bonus.

## What did not work yet

- This still does not model true football possession.
- There is no opponent decision model yet.
- No real passing lanes, marking assignments, duels, or offside trap.
- Zone definitions are crude.
- Player familiarity, morale, decisions, anticipation, and work rate are not yet included.
- WOB and WIB are not separated yet; this spike treats all zone screens as one generic target map.

## Recommendation for real build

Keep Option A as the foundational data model:

```text
zone -> player -> target position
```

Then layer helper tools on top:

- formation templates;
- mirror left/right;
- copy zone;
- compactness warnings;
- movement-load meter;
- same-point congestion warning;
- wide-exposure warning;
- DMC-overload warning.

The real match engine should treat these positions as intent fields. Players attempt to obey, but actual execution depends on distance, acceleration, stamina, decisions, positioning, teamwork, fatigue, weather, and opponent actions.

## Verdict: VALIDATED

Option A is validated as the correct first model for a CM0102-inspired modern WIB/WOB system. It preserves manager freedom while giving the engine enough structure to apply benefits and costs.
