# Spike 005: Transition Attributes and Tactical Familiarity

## Question

Given the same WIB/WOB tactical book, should better-suited players execute transitions better than weaker or unfamiliar players?

## Why this matters

Spike 004 validated separate WIB and WOB maps plus possession-state transitions. That proved the shape model. But a CM0102-inspired match engine should not treat tactics as magic. A tactic should be only as executable as the players and squad familiarity allow.

This spike validates the next layer:

```text
transition execution = tactic geometry + player attributes + tactical familiarity
```

## Files

- `attribute_transition_engine.py` - deterministic transition simulation with player attributes and familiarity.
- `run_attribute_transition_simulation.py` - CLI JSON demo.
- `run_mission_tests.py` - mission-by-mission test runner.
- `tests/test_attribute_transition_engine.py` - behavior tests.

## What was tested

1. Same seed, same players, same WIB/WOB book, and same familiarity replay identically.
2. Higher pace and acceleration reduce transition delay and late arrivals.
3. Higher stamina reduces fatigue and improves second-half recovery.
4. Higher positioning and anticipation improve WOB recovery after losing possession.
5. Higher teamwork and decisions improve WOB-to-WIB counter support after winning possession.
6. Low tactical familiarity increases transition delay even for good players.
7. Familiarity improves through repeated use but remains capped, so it does not become magical.
8. Reports explain whether problems came from geometry, player attributes, or familiarity.
9. CLI demo emits parseable JSON.

## Commands

From repo root:

```bash
python3 spikes/005-transition-attributes-and-familiarity/run_mission_tests.py
python3 -m pytest spikes/005-transition-attributes-and-familiarity/tests/test_attribute_transition_engine.py -q
python3 spikes/005-transition-attributes-and-familiarity/run_attribute_transition_simulation.py --seed 42 --home-quality weak --familiarity 0.20
```

## Demo styles

```bash
python3 spikes/005-transition-attributes-and-familiarity/run_attribute_transition_simulation.py --seed 42 --home-quality weak --familiarity 0.20
python3 spikes/005-transition-attributes-and-familiarity/run_attribute_transition_simulation.py --seed 42 --home-quality average --familiarity 0.60
python3 spikes/005-transition-attributes-and-familiarity/run_attribute_transition_simulation.py --seed 42 --home-quality elite --familiarity 0.88
```

## Findings

- The same tactical shape should perform differently depending on the squad.
- Pace and acceleration are most important for physically reaching transition targets.
- Stamina determines whether repeated recovery runs remain viable late in matches.
- Positioning and anticipation should affect how quickly the team recovers into WOB and closes counter windows.
- Teamwork and decisions should affect how well the team breaks from WOB into WIB after winning possession.
- Tactical familiarity should be a multiplier on execution, not a cosmetic number.
- Familiarity should improve through match minutes and training focus, but should be capped below perfection.
- Reports need to distinguish tactic geometry problems from player-limit problems.

## Verdict: VALIDATED

### What worked

The spike validates a deterministic harness where the same WIB/WOB book produces different transition outcomes depending on player attributes and tactical familiarity. It also validates that reports can explain three different cause families:

- tactic geometry;
- player attributes;
- tactical familiarity.

### What did not prove realism yet

The weights are still arbitrary. This validates the model shape and expected directional behaviour, not final simulation realism. Production will need calibration against internal match data, user testing, and balancing goals.

### Recommendation for the real build

Production transition execution should use at least these attribute groups:

```text
physical execution:
  pace
  acceleration

recovery endurance:
  stamina
  work rate later

defensive transition intelligence:
  positioning
  anticipation
  decisions

attacking transition intelligence:
  teamwork
  decisions
  off the ball later

tactical familiarity:
  book familiarity
  role familiarity later
  unit familiarity later
```

Reports should expose problems in user language, for example:

- `the tactic leaves long recovery runs between WIB and WOB`;
- `your defenders lack pace/acceleration to recover this shape`;
- `low familiarity is slowing transition execution`;
- `good teamwork and decisions helped counters after winning the ball`.

## Recommended next step

Pause spikes and consolidate the validated findings into production docs/plans:

1. production match-engine architecture;
2. production tactic-book domain model;
3. player attribute and familiarity model;
4. tactical editor UI requirements;
5. deterministic online match/replay architecture.

After consolidation, the next implementation phase should start replacing disposable spike code with production modules.
