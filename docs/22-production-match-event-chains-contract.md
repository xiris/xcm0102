# Production Match Event Chains Contract

## Purpose

The match timeline now supports short football event chains instead of only isolated chances.

This keeps the current one-click full-match replay but creates the structure needed for a later interactive match mode.

## New event types

The domain now supports:

```text
foul
free_kick
corner
offside
yellow_card
red_card
```

Existing types remain:

```text
kickoff
chance
goal
transition_delay
late_arrival
tactical_shift
full_time
```

## Chain metadata

Match events can now include:

```ts
chainId?: string;
sequence?: number;
```

Example:

```json
{
  "minute": 17,
  "teamId": "home",
  "type": "foul",
  "category": "set_piece",
  "outcome": "foul",
  "chainId": "home-18-0",
  "sequence": 1,
  "description": "The attacker is clipped just as the move opens up."
}
```

A later event in the same chain may be:

```json
{
  "minute": 18,
  "teamId": "home",
  "type": "chance",
  "category": "set_piece",
  "outcome": "save",
  "chainId": "home-18-0",
  "sequence": 3,
  "description": "Recoba delivers the set piece; Vieri forces a save."
}
```

## Current chain rules

`src/simulation/eventChains.ts` expands resolved chance events.

Current behavior:

- `set_piece` chance can become:

```text
foul -> free_kick -> chance/goal
```

- `cross` chance with `block` outcome can become:

```text
corner -> chance
```

- `through_ball` chance can be replaced by:

```text
offside
```

- high pressing can add:

```text
yellow_card
red_card
```

before the chance.

## Determinism contract

Same seed + same events + same pressing options = same expanded timeline.

The expansion must remain pure and reproducible because future interactive replay will depend on deterministic resume points.

## API compatibility

The browser still renders `events[].description`.

API consumers can now inspect:

```text
type
category
outcome
chainId
sequence
```

No breaking response shape change was required.

## Interactive match roadmap

This phase is still instant full-match replay.

That is intentional.

Interactive matches should come after event chains and bench/substitution support because interaction needs meaningful pause points and meaningful actions.

Recommended roadmap:

### P11 Event chains

Creates meaningful stoppages and linked sequences:

```text
foul -> free kick -> shot
corner -> header
through ball -> offside
pressing -> yellow card
```

### P12 Bench, substitutions, fatigue, injuries

Creates meaningful manager actions:

```text
bring on a striker
protect a tired fullback
replace a booked defender
change formation after injury
```

### P13 Interactive match timeline

Convert one-click full replay into a resumable match:

```text
simulate to minute 15
pause at key event
manager changes mentality/pressing/substitution
resume from same deterministic state
```

Possible UI modes:

- Instant result: current behavior.
- Key highlights: pause only on goals/cards/injuries/tactical windows.
- Full text: stream every event with pause/resume.

## Current limitations

- Chain selection is rule/probability based, not yet a full referee/ball-state simulation.
- Cards are pressing-risk based, not tied to individual player aggression yet.
- Corners and free kicks are represented as chain precursors; they do not yet alter set-piece specialists or marking assignments.
- Offside can replace a through-ball chance but does not yet adjust tactical line behavior.

## Next useful step

P12 should add bench/substitutions/fatigue/injuries before the interactive timeline so manager intervention has useful choices.
