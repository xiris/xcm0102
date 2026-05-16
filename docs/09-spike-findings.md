# Spike Findings

This file records implementation findings from disposable spikes so important decisions are preserved in `docs/`, not only inside spike folders.

## Current spike status

| Spike | Path | Verdict | Main finding |
|---|---|---|---|
| 001 | `spikes/001-match-engine-core/` | VALIDATED | A deterministic match-engine harness can replay seeded matches, apply tactical/context modifiers, process live commands, and produce explainable reports. |
| 002 | `spikes/002-wibwob-movement-load/` | VALIDATED | WIB/WOB should start with explicit `zone -> player -> target position` maps. This preserves manager freedom while allowing the engine to price movement, overloads, congestion, fatigue, and exposure. |
| 003 | `spikes/003-integrated-match-and-wibwob/` | VALIDATED | Explicit WIB/WOB maps can feed match-level events and reports: central overloads create attacks but expose width, congestion lowers shot quality, extreme movement raises opponent chance quality, and DMC/pressing effects degrade over time. |
| 004 | `spikes/004-wib-vs-wob-transitions/` | VALIDATED | Separate WIB and WOB maps can drive possession-state transitions: attacking support, defensive protection, recovery delay, counter exposure, counter support, late arrivals, fatigue, and transition explanations. |
| 005 | `spikes/005-transition-attributes-and-familiarity/` | VALIDATED | The same WIB/WOB book performs differently depending on player attributes and tactical familiarity: pace/acceleration, stamina, positioning/anticipation, teamwork/decisions, and familiarity all affect transition execution. |

## Spike 001: match-engine-core

### What was tested

- Same seed and same inputs replay identically.
- Attacking tactics create more shots than defensive tactics across many seeds.
- Rain reduces total chances and increases fatigue cost.
- Live tactical changes affect the remaining match ticks.
- Match reports explain major causes, not only the score.
- CLI demo emits inspectable JSON.

### Result

Validated as a simulation harness.

This does not validate football realism yet. It validates the API shape and test harness:

```text
simulate_match(home, away, home_tactic, away_tactic, context, seed, commands)
```

### Product decision

The production engine should be deterministic from day one:

- server owns the seed;
- every random draw comes from controlled RNG;
- live commands are recorded by tick;
- replay uses initial state + seed + command log.

Reports/diagnostics should be first-class, because otherwise the match engine becomes an opaque black box.

## Spike 002: WIB/WOB movement-load

### What was researched

Project research and raw forum material confirm that WIB/WOB is a core part of the CM0102 tactical culture:

- managers can define detailed player positioning;
- human-created WIB/WOB tactics can be much stronger than default/AI tactics;
- common strong patterns include narrow shapes, crowded central boxes, DMCs, pressing, high lines, and central overloads;
- some players treat no-WIB/WOB tactics as a separate challenge because WIB/WOB can manipulate the old match engine heavily.

Relevant sources:

- `docs/07-match-engine-variables.md`
- `docs/research_raw/forum_wibwob.txt`

### Option A decision

Use explicit target positions per player per ball zone:

```text
zone -> player -> target position
```

Example:

```text
ATT_CENTER:
  DMC -> (60, 50)
  MC1 -> (68, 47)
  MC2 -> (68, 53)
  FC1 -> (88, 48)
```

This is the right first model because it is closest to the original WIB/WOB feel. The user can choose specific player positions for each zone, including deliberate overloads.

### What was tested

- Same seed and same WIB/WOB map replay identically.
- Extreme zone-to-zone movement creates more distance and fatigue than compact movement.
- Far jumps cause late arrivals and uncovered targets.
- Central overload improves central density and short-passing support.
- Central overload also increases wide exposure.
- Multiple players assigned to the same point create a congestion penalty.
- DMC protection degrades under repeated lateral switches.
- High pressing improves early pressure but reduces late recovery.
- CLI demo emits inspectable JSON.

### Result

Validated as the first WIB/WOB data model and movement-load harness.

### Product decision

Do not ban extreme WIB/WOB tactics. Let managers try them.

But every tactical choice must have consequences:

| Manager choice | Possible upside | Possible downside |
|---|---|---|
| Central overload | short passing, counter-pressing, central shots | wide exposure, congestion, blocked lanes |
| Same-point stacking | aggressive local overload | collision/congestion, poor spacing, lower option quality |
| Extreme zone shifts | surprise rotations, overloads | fatigue, late arrivals, uncovered targets |
| DMC anchor | central protection | can be pulled apart by lateral switches and repeated runners |
| High pressing | early pressure, turnovers | late fatigue, fouls/cards later, weaker recovery |

The match engine should treat WIB/WOB positions as intent, not teleportation. Players attempt to obey, but execution should depend on:

- movement distance;
- acceleration/pace;
- stamina and fatigue;
- positioning;
- teamwork;
- decisions/anticipation;
- tactical familiarity;
- weather/pitch;
- opponent actions.

## Spike 003: integrated match and WIB/WOB

### What was tested

- Same teams, tactics, WIB/WOB maps, context, and seed replay identically.
- Central overload creates more central attacks for the overloading team.
- Central overload also gives the opponent more wide entries.
- Extreme movement produces late arrivals and increases opponent average chance quality.
- Same-point congestion preserves central density but reduces attacking shot quality.
- DMC lateral overload reduces central protection and increases opponent central attacks.
- High pressing creates early turnovers but increases late opponent chance quality.
- Match reports merge normal tactical reasons and WIB/WOB tactical explanations.
- CLI demo emits inspectable JSON.

### Result

Validated as the first integrated proof that Option A WIB/WOB maps can affect match-level gameplay.

### Product decision

Keep the production architecture split but connected:

```text
WIB/WOB engine
  reads zone -> player -> target position maps
  computes movement load, congestion, exposure, coverage, support
  feeds tactical consequences into match engine

Match engine
  reads teams, players, normal tactics, context, and WIB/WOB consequences
  emits match events, stats, diagnostics, and report reasons
```

Do not collapse WIB/WOB into a single tactic score. The intermediate metrics are important:

- central density;
- short passing support;
- wide exposure;
- same-point congestion;
- movement distance;
- fatigue/recovery;
- late arrivals;
- DMC coverage;
- pressing load.

Those metrics should power both gameplay and UI warnings.

### Demo observations

For the same seed:

- `overload` produced central benefits and exposed wide areas.
- `same-point` produced congestion and much lower home shot quality.
- `extreme` produced many late arrivals, very low central protection, and higher away chance quality.

This is the desired direction: the manager can create aggressive or strange WIB/WOB shapes, but the match makes those choices visible and consequential.

## Spike 004: WIB vs WOB transitions

### What was tested

- Same seed, same teams, same WIB/WOB books, and same possession path replay identically.
- With-ball overload improves attacking support while possession is retained.
- Without-ball compactness improves defensive protection when out of possession.
- Poor WIB-to-WOB recovery creates counterattack exposure after losing possession.
- Poor WOB-to-WIB break reduces counterattack support after winning possession.
- Extreme recovery runs create late arrivals and fatigue.
- Reports explain transition causes, including counter windows and late arrivals.
- CLI demo emits inspectable JSON.

### Result

Validated as a deterministic possession-transition harness.

This still does not validate final football realism. It validates that the product architecture should distinguish:

```text
WIB target map
WOB target map
possession phase
transition delay
counter window
recovery run cost
```

### Product decision

Do not infer WOB from WIB or collapse both into one tactical screen.

The production tactic model should keep separate objects:

```text
TacticBook
  wib: zone -> player -> target position
  wob: zone -> player -> target position
  transition_style
```

The match engine should explicitly emit transition states/events:

```text
possession_lost
wib_to_wob_recovery
counter_window
wob_to_wib_break
settled_possession
```

The UI should warn managers when a tactical book has:

- high distance between WIB and WOB shapes;
- slow recovery after losing possession;
- low support after winning possession;
- extreme recovery-run fatigue;
- repeated late arrivals in central defensive zones.

### Demo observations

For the same seed with `--home-style high-mismatch`:

- Home had strong with-ball support from an attacking overload.
- Home also had high transition delay and 26 late arrivals.
- Away received extra counter chances from Home's slow defensive recovery.
- The report included both the upside and downside: attacking support, compact WOB protection, slow WIB-to-WOB recovery, counter exposure, and late-arrival fatigue.

## Spike 005: transition attributes and tactical familiarity

### What was tested

- Same seed, same players, same WIB/WOB book, and same tactical familiarity replay identically.
- Higher pace and acceleration reduce transition delay and late arrivals.
- Higher stamina reduces fatigue from repeated recovery runs and improves second-half recovery.
- Higher positioning and anticipation improve WOB recovery after losing possession.
- Higher teamwork and decisions improve WOB-to-WIB counter support after winning possession.
- Low tactical familiarity increases delay and late arrivals even for strong players.
- Familiarity improves through repeated use and training focus but remains capped below perfection.
- Reports distinguish tactic geometry, player attribute limits, and low familiarity.
- CLI demo emits inspectable JSON.

### Result

Validated as a deterministic attribute/familiarity execution harness.

This validates that the same tactic can be good on paper but bad for a specific squad. That is central to preserving the CM0102 feel: the fun is not only finding a tactic, but matching it to players who can execute it.

### Product decision

Production transition execution should be driven by three cause families:

```text
tactic geometry
  distance between WIB and WOB targets
  shape compactness/support
  transition style

player attributes
  pace / acceleration
  stamina
  positioning / anticipation
  teamwork / decisions

tactical familiarity
  tactic-book familiarity
  role familiarity later
  unit familiarity later
```

Tactical familiarity should be a real execution modifier, not a cosmetic label. It should improve with match minutes and training focus, but stay capped so familiarity never overrides bad geometry or unsuitable attributes.

### Demo observations

For the same seed with `--home-quality weak --familiarity 0.20`:

- Home transition delay was very high.
- Home had 52 late arrivals.
- Home second-half recovery collapsed to 0.0 in the demo.
- Away generated counter chances because Home could not recover the shape.
- The report explicitly identified geometry, player attributes, and familiarity as separate causes.

### Architecture implication

The production match report should avoid vague messages like `bad tactic`.

It should explain actionable causes:

- `the tactic leaves long recovery runs between WIB and WOB`;
- `your defenders lack pace/acceleration to recover this shape`;
- `low familiarity is slowing transition execution`;
- `good teamwork and decisions helped counters after winning the ball`.

## Testing convention

Every spike should include two test commands:

1. Normal full suite.
2. Mission runner that collects tests and executes them one by one with fail-fast mission labels.

Example:

```bash
python3 -m pytest spikes/002-wibwob-movement-load/tests/test_movement_model.py -q
python3 spikes/002-wibwob-movement-load/run_mission_tests.py
```

Current combined result:

```text
39 passed
```

## Recommended next step

Pause disposable spikes and consolidate the validated findings into production documentation and implementation plans.

Recommended docs/plans to create next:

1. Production match-engine architecture.
2. Production tactic-book domain model.
3. Player attribute and tactical familiarity model.
4. Tactical editor UI requirements.
5. Deterministic online match/replay architecture.

Why pause spikes now:

- Spike 001 validated the deterministic match harness.
- Spike 002 validated explicit WIB/WOB target maps.
- Spike 003 validated match-level consequences.
- Spike 004 validated separate WIB and WOB transition states.
- Spike 005 validated player attributes and tactical familiarity as execution constraints.

Together, these answer the riskiest gameplay/modeling questions. The next risk is no longer `can the model work?`; it is `can we turn the model into clean production architecture without carrying spike shortcuts forward?`.
