# Spike 003: Integrated Match and WIB/WOB

## Question

Given two teams with attributes, normal tactics, match context, and Option A WIB/WOB maps, can the match engine make WIB/WOB choices affect actual match outcomes instead of only producing a separate movement report?

This spike connects the two earlier validated ideas:

- Spike 001: deterministic match harness.
- Spike 002: explicit `zone -> player -> target position` WIB/WOB movement-load model.

## Core design

The model remains disposable Python spike code.

It introduces an integrated engine where:

- team/player attributes influence base chance quality;
- normal tactic settings influence mentality and tempo;
- WIB/WOB maps influence central attacks, wide exposure, congestion, late arrivals, DMC protection, pressing turnovers, and late fatigue risk;
- output includes match stats, event log, tactical diagnostics, and report reasons.

The important design rule is still:

WIB/WOB positions are intent, not teleportation.

## Files

- `integrated_engine.py` - throwaway integrated match + WIB/WOB model.
- `run_integrated_simulation.py` - CLI demo that prints JSON.
- `run_mission_tests.py` - one-by-one fail-fast mission runner.
- `tests/test_integrated_engine.py` - pytest coverage.
- `tests/conftest.py` - local import path setup.

## Run tests

From repo root, run the normal suite:

```bash
python3 -m pytest spikes/003-integrated-match-and-wibwob/tests/test_integrated_engine.py -q
```

Run the mission sequence:

```bash
python3 spikes/003-integrated-match-and-wibwob/run_mission_tests.py
```

Current result:

```text
ALL 8 MISSIONS PASSED
```

## Run demo

From this directory:

```bash
python3 run_integrated_simulation.py --seed 42 --home-wibwob compact
python3 run_integrated_simulation.py --seed 42 --home-wibwob overload
python3 run_integrated_simulation.py --seed 42 --home-wibwob same-point
python3 run_integrated_simulation.py --seed 42 --home-wibwob extreme
```

The output includes:

- scoreline;
- match stats per team;
- tactical diagnostics;
- report reasons;
- first events.

## Validated behaviours

### Deterministic integrated replay

Test: `test_same_seed_same_integrated_inputs_replay_identically`

Same teams, tactics, WIB/WOB maps, context, and seed produce identical score, events, match stats, and tactical diagnostics.

### Central overload creates attacks and wide exposure

Test: `test_central_overload_creates_more_central_attacks_but_concedes_more_wide_entries`

A central overload creates more central attacks for the overloading team, but the opponent gets more wide entries.

### Extreme movement increases opponent chance quality

Test: `test_extreme_wibwob_late_arrivals_increase_opponent_chance_quality`

Extreme zone shifts create late arrivals and raise opponent average chance quality.

### Same-point congestion reduces shot quality

Test: `test_same_point_congestion_reduces_shot_quality_despite_central_density`

Stacking many players onto the same point can preserve central density but reduces shot quality through congestion.

### DMC lateral overload reduces protection

Test: `test_dmc_lateral_overload_reduces_central_protection_over_time`

Repeated left-right movement demands reduce DMC protection and increase opponent central attacks.

### High pressing has a late cost

Test: `test_high_pressing_creates_early_turnovers_but_late_concession_risk`

High pressing creates more early turnovers but increases late opponent chance quality.

### Report merges match and tactical explanations

Test: `test_report_merges_match_and_wibwob_explanations`

The match report includes both normal tactical causes and WIB/WOB causes.

### CLI is usable

Test: `test_cli_runs_integrated_demo_and_outputs_json_summary`

The demo emits JSON suitable for inspection.

## What worked

- Option A can directly influence match-level stats.
- Central overload can be represented as both benefit and liability.
- Same-point stacking is clearly different from useful overload.
- Movement-load metrics can influence opponent chance quality.
- DMC protection works better as a degrading coverage score than as a fixed bonus.
- Tactical diagnostics are essential; without them, the integrated model would feel arbitrary.

## What did not work yet

- The model is still abstract and not a real football simulation.
- Counts are intentionally coarse and deterministic enough for spike validation.
- There is no full possession chain, pass selection, marking assignment, goalkeeper model, fouls/cards, substitutions, injuries, or morale.
- WIB and WOB are still not separate maps.
- The opponent does not yet actively choose to exploit a detected weakness; exploitation is encoded as deterministic consequence counters.

## Recommendation for real build

The production architecture should keep these components separate but connected:

```text
Match engine
  uses Team/Player attributes
  uses normal tactical instructions
  uses WIB/WOB movement profile
  emits events + report

WIB/WOB engine
  reads zone -> player -> target position maps
  computes movement load, congestion, exposure, coverage, support
  feeds tactical consequences into match engine
```

Do not collapse WIB/WOB into a single tactic score. Keep the intermediate metrics because they are needed for diagnostics and UI warnings.

Useful future UI warnings:

- central overload;
- wide exposure;
- same-point congestion;
- extreme movement load;
- DMC lateral overload;
- high pressing late-risk;
- low second-half recovery.

## Verdict: VALIDATED

Spike 003 validates the integration concept: explicit WIB/WOB maps can affect actual match events and reports while preserving manager freedom and tactical tradeoffs.
