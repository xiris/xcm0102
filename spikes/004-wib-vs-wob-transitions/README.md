# Spike 004: WIB vs WOB Transitions

## Question

Given separate with-ball (WIB) and without-ball (WOB) target maps, when possession changes, can the match engine model attacking shape, defensive shape, transition delay, counterattack exposure, recovery runs, fatigue, and explainable reports?

## Why this matters

Spike 002 validated explicit `zone -> player -> target position` maps. Spike 003 proved those maps can affect match-level events. But Spike 003 still used one generic target map, while the CM0102 tactical idea distinguishes what a team does in possession from what it does out of possession.

This spike validates the next split:

```text
WIB map: targets used while the team has the ball
WOB map: targets used while the opponent has the ball
Transition model: movement and delay when possession flips
```

## Files

- `transition_engine.py` - deterministic transition simulation harness.
- `run_transition_simulation.py` - CLI JSON demo.
- `run_mission_tests.py` - mission-by-mission test runner.
- `tests/test_transition_engine.py` - behavior tests.

## What was tested

1. Same seed and same WIB/WOB maps replay identically.
2. With-ball overload improves attacking support while possession is retained.
3. Without-ball compactness improves defensive protection when out of possession.
4. Poor WIB-to-WOB transition creates counterattack exposure after losing possession.
5. Poor WOB-to-WIB transition reduces counterattack support after winning possession.
6. Extreme recovery runs create late arrivals and fatigue.
7. Report explains transition causes.
8. CLI demo emits parseable JSON.

## Commands

From repo root:

```bash
python3 spikes/004-wib-vs-wob-transitions/run_mission_tests.py
python3 -m pytest spikes/004-wib-vs-wob-transitions/tests/test_transition_engine.py -q
python3 spikes/004-wib-vs-wob-transitions/run_transition_simulation.py --seed 42 --home-style high-mismatch
```

## Demo styles

```bash
python3 spikes/004-wib-vs-wob-transitions/run_transition_simulation.py --seed 42 --home-style balanced
python3 spikes/004-wib-vs-wob-transitions/run_transition_simulation.py --seed 42 --home-style overload
python3 spikes/004-wib-vs-wob-transitions/run_transition_simulation.py --seed 42 --home-style high-mismatch
python3 spikes/004-wib-vs-wob-transitions/run_transition_simulation.py --seed 42 --home-style slow-break
```

## Findings

- WIB and WOB should be stored separately, not inferred from one generic shape.
- With-ball overload should mostly affect support, chance creation, and attacking buildup.
- Without-ball compactness should mostly affect protection and opponent counter chances.
- Transition quality should be a first-class match-engine concept, not only a stamina side effect.
- The biggest exploit risk is not only an overloaded attacking screen; it is the distance between the attacking WIB screen and the defensive WOB screen after losing the ball.
- Slow breaks should reduce counterattack support after winning the ball, even if the team's defensive shape is sound.
- Extreme recovery runs should remain legal, but produce visible late-arrival and fatigue diagnostics.

## Verdict: VALIDATED

### What worked

The spike validates a deterministic harness for separate WIB/WOB maps and possession-state transitions. Transition delay, recovery run distance, counterattack support, counterattack exposure, late arrivals, fatigue, and explanatory diagnostics all move in the expected direction.

### What did not prove realism yet

The constants are deliberately simple. This validates model shape and testability, not final football realism. Production will need calibration against match data, player attributes, tactical familiarity, role instructions, weather, pitch size, and multiplayer latency constraints.

### Recommendation for the real build

Use separate map objects in the production domain model:

```text
TacticBook
  wib: zone -> player -> target position
  wob: zone -> player -> target position
  transition_style
```

The match engine should keep possession transitions explicit in the event stream:

```text
possession_lost
wib_to_wob_recovery
counter_window
wob_to_wib_break
settled_possession
```

The UI should warn managers about:

- high WIB/WOB distance;
- slow recovery after losing possession;
- low counterattack support after winning possession;
- extreme recovery fatigue;
- late arrivals in key defensive zones.

## Recommended next spike

Spike 005 should add player attributes and tactical familiarity to transition execution.

Goal:

Given the same WIB/WOB book, players with better pace, stamina, positioning, anticipation, teamwork, and tactical familiarity should execute transitions faster, arrive late less often, and maintain better counter/support quality.
