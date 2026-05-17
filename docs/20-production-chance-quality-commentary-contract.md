# Production Chance Quality and Commentary Contract

## Purpose

The match engine no longer turns shots into goals with a crude floor formula.

Before this phase, scorelines could feel stuck because goals were computed as:

```text
floor(shotsOnTarget * fixed execution multiplier)
```

That made many default runs resolve to the same 1-0/0-0 patterns and did not make individual players feel alive.

This phase adds deterministic per-chance resolution and varied match commentary.

## Canonical module

Chance resolution lives in:

```text
src/simulation/chanceEngine.ts
```

Main export:

```ts
resolveTeamChances(options: ChanceEngineOptions): TeamChanceResolution
```

## Determinism contract

The chance engine is deterministic:

```text
same seed + same teams + same tactics = same chances, same outcomes, same text
```

This preserves replay/debuggability while creating more variation across different seeds.

## Individual player influence

Each chance selects actual players:

```text
creator
shooter
defender
goalkeeper
```

Selection is weighted by attributes.

Creator weighting emphasizes:

```text
passing
decisions
teamwork
anticipation
```

Shooter weighting emphasizes:

```text
finishing
positioning
anticipation
pace
```

Defender weighting emphasizes:

```text
tackling
positioning
anticipation
decisions
```

Goalkeeper pressure currently uses the GK player's:

```text
positioning
anticipation
decisions
```

## Chance outcome contract

Each resolved chance has:

```ts
minute
teamId
creator
shooter
defender
goalkeeper
quality
outcome
description
```

Outcome is one of:

```text
goal
save
block
miss
```

Stats are now aggregated from actual resolved chances:

```text
shots = number of resolved chances
shotsOnTarget = goals + saves
goals = goal outcomes
```

## Commentary contract

Event descriptions should not sound like a robotic single-template feed.

The engine uses outcome-specific template banks:

```text
goal templates
save templates
block templates
miss templates
```

Examples:

```text
Pirlo slips the ball through and Shevchenko finishes with conviction.
Vieri drives the shot on target and Dida turns it away.
Nesta closes fast as Crespo shoots, taking the sting out of it.
Recoba spots the run; Vieri's finish flashes past the post.
```

The text is deterministic for the seed, but varied across chances and seeds.

## Integration contract

`src/simulation/simulateMatch.ts` still owns:

```text
team evaluation
tactical execution
fatigue
transition delay
late arrivals
possession
diagnostics
replay metadata
```

It delegates shot/chance/goal resolution to `chanceEngine.ts`.

The API shape remains compatible:

```text
score
stats
events
diagnostics
replay
teams
```

The browser result timeline automatically displays the richer event descriptions because it already renders `events[].description`.

## Current limitations

- No set pieces yet.
- No cards, injuries, offsides, penalties, or substitutions yet.
- Keeper model is still simplified because GK-specific attributes do not exist yet.
- Commentary template bank is intentionally small but now structured for expansion.
- No localization yet.

## Next useful steps

- Add set-piece chance types: corners, free kicks, penalties.
- Add dedicated GK attributes: handling, reflexes, aerial ability, one-on-ones.
- Add commentary packs by tone: terse CM-style, radio, dramatic, tactical analyst.
- Add player preferred foot and shot type variation.
- Add second-half tactical command effects on chance generation.
