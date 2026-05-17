# Production Bench, Substitution, Fatigue, and Injury Contract

## Purpose

P12 adds the first manager-action foundation before interactive matches.

The simulation still runs as an instant full-match replay, but the timeline now contains condition events that can later become pause points for substitutions and tactical changes.

## Historic squad contract

`createHistoricTeam()` now returns 16 players per side:

- first 11 players remain the default starting XI
- players 12-16 are bench options
- IDs remain stable:
  - starters: `home-p1` through `home-p11`, `away-p1` through `away-p11`
  - bench: `home-p12` through `home-p16`, `away-p12` through `away-p16`

Inter 2002 bench includes:

```text
Mohamed Kallon
Obafemi Martins
Guly
Nelson Vivas
Okan Buruk
```

Milan 2002 bench includes:

```text
Massimo Ambrosini
Serginho
Jon Dahl Tomasson
Roque Junior
Christian Abbiati
```

The bench data is era-inspired fixture data, not a claim of complete official matchday squads.

## Condition engine contract

`src/simulation/playerConditionEngine.ts` exports:

```ts
evaluatePlayerConditions(options): PlayerConditionResult
```

Inputs:

```text
seed
team
tactic
sideLabel
```

Outputs:

```text
averageFatigue
profiles
substitutions
events
```

Each player profile includes:

```text
player
fatigue
status: fresh | tired | injury_risk
```

Fatigue is deterministic and influenced by:

```text
pressing
movement/WIB-WOB spread
transition style
player stamina
player role
seeded variation
```

## Substitution contract

The first substitution layer is automatic and deterministic.

Rules:

- only bench players can be brought on
- a bench player can only be used once
- tired/injury-risk starters are prioritized
- compatible positions are preferred
- up to three substitutions are recommended

Compatibility examples:

```text
F -> F
AM -> AM/M/F
DM -> DM/M/D
M -> M/DM/AM
D -> D
GK -> GK
```

## Event contract

New event types:

```text
fatigue_warning
injury
substitution
```

Example event text:

```text
Christian Vieri is tiring and struggling to recover his position.
Christian Vieri is carrying an injury risk after a heavy workload.
Home substitution: Mohamed Kallon replaces Christian Vieri (injury risk).
```

## API/browser contract

No response shape break was required.

The browser already renders `events[].description`.

API consumers can inspect `events[].type` for:

```text
fatigue_warning
injury
substitution
```

## Interactive-match roadmap impact

P12 creates meaningful future manager actions.

P13 can now pause at events like:

```text
player tiring
injury risk
substitution recommendation
booked player under pressure
```

Then the UI can allow:

```text
make substitution
change formation
change mentality
change pressing
resume deterministic match
```

## Current limitations

- Substitutions are automatic recommendations, not user-selected yet.
- Fatigue changes do not yet feed back into chance quality after the substitution minute.
- Injuries are risk events, not hard forced removals yet.
- Bench data is intentionally small and fixture-oriented for the match lab.
