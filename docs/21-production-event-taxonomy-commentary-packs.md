# Production Event Taxonomy and Commentary Packs Contract

## Purpose

The simulation now has a structured event taxonomy and a larger CM0102-inspired commentary pack.

The goal is to avoid robotic repetition while preserving deterministic replay.

## Event taxonomy

Chance events can now be classified as:

```text
through_ball
counter_attack
cross
long_shot
set_piece
```

These categories are stored on match events as optional metadata:

```ts
category?: MatchEventCategory
outcome?: MatchEventOutcome
```

The existing `description` field remains the browser-facing text, so the UI remains compatible.

## Outcomes

Chance outcomes are:

```text
goal
save
block
miss
```

Goal outcomes still emit event type:

```text
goal
```

Other chance outcomes emit event type:

```text
chance
```

## Commentary pack

The default commentary pack is:

```text
classic_cm
```

Implementation:

```text
src/simulation/commentaryPacks.ts
```

The pack is intentionally terse and CM-like. It includes at least 40 templates across:

```text
5 categories x 4 outcomes
```

Examples:

```text
Pirlo threads it through to Shevchenko, who scores!
A rapid counter ends with Vieri putting it away.
Recoba crosses and Crespo heads home.
Pirlo tries one from distance; Toldo saves.
From the corner, Materazzi rises and finds the net.
```

## Determinism contract

Commentary remains deterministic:

```text
same seed + same chance + same pack = same text
```

Different seeds and event categories create variation.

## Chance engine integration

`src/simulation/chanceEngine.ts` now:

1. selects creator/shooter/defender/goalkeeper from player attributes;
2. selects chance category from tactical context and attributes;
3. resolves goal/save/block/miss;
4. asks `commentaryPacks.ts` for the final description;
5. emits `MatchEvent` with category/outcome metadata.

## Current category selection inputs

`through_ball` weights:

```text
creator passing
creator decisions
shooter positioning
```

`counter_attack` weights:

```text
attack intent
opponent transition delay
shooter pace
shooter acceleration
```

`cross` weights:

```text
creator teamwork
creator passing
forward target bonus
```

`long_shot` weights:

```text
shooter finishing
shooter decisions
opponent defensive control
```

`set_piece` weights:

```text
creator passing
shooter anticipation
opponent late arrivals
```

## API compatibility

The `/api/simulate-match` response now includes richer event objects, for example:

```json
{
  "minute": 24,
  "teamId": "home",
  "type": "chance",
  "category": "cross",
  "outcome": "save",
  "description": "Recoba swings in a cross; Dida saves from Vieri."
}
```

Existing consumers that only read `description` still work.

## Current limitations

- Categories are selected probabilistically from weights, not from a full ball-by-ball tactical engine yet.
- Set pieces are represented as chance categories, not separate foul/corner simulation chains yet.
- There are no cards, offsides, injuries, substitutions, or penalty shootouts yet.
- Only one commentary pack ships now: `classic_cm`.

## Next useful steps

- Add true foul/corner/free-kick precursor events.
- Add offside, cards, injuries, substitutions, and tactical reactions.
- Add commentary tone selector in the UI.
- Add packs: `radio`, `tactical_analyst`, `dramatic`, and `minimal_cm`.
- Add localization once event semantics settle.
