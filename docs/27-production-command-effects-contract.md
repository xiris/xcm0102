# Production Command Effects Contract

## Purpose

P15A gives recorded manager commands deterministic projected effects.

The replay still does not regenerate future events yet, but commands now create a tactical/fatigue/risk projection that is visible in the browser and testable as pure simulation state.

## Module

```text
src/simulation/commandEffects.ts
```

Main API:

```ts
projectCommandEffects(commands: ManagerCommand[]): CommandEffectsProjection
```

Projection shape:

```ts
type CommandEffectsProjection = {
  pressingAdjustment: number;
  mentalityAdjustment: number;
  defensiveRiskAdjustment: number;
  fatigueRelief: number;
  substitutionIntent: number;
  formationReview: boolean;
  commandSignature: string;
  diagnostics: string[];
};
```

## Neutral state

With no commands:

```text
pressingAdjustment: 0
mentalityAdjustment: 0
defensiveRiskAdjustment: 0
fatigueRelief: 0
substitutionIntent: 0
formationReview: false
commandSignature: no-commands
```

Diagnostic:

```text
No outcome-affecting manager commands recorded yet.
```

## Current command mappings

### Lower tempo/pressing

Effect:

```text
pressingAdjustment -1
fatigueRelief +2
```

Diagnostic:

```text
54’ Lower tempo/pressing reduced pressing load and fatigue pressure.
```

### Change mentality

Effect:

```text
mentalityAdjustment +1
```

Diagnostic:

```text
14’ Change mentality increased tactical pressure projection.
```

### Change pressing

Effect:

```text
pressingAdjustment +1
```

Diagnostic:

```text
21’ Change pressing increased pressing intensity projection.
```

### Adjust defensive line

Effect:

```text
defensiveRiskAdjustment -1
```

Diagnostic:

```text
7’ Adjust defensive line lowered defensive exposure after the pause event.
```

### Prepare substitution / Confirm substitution and continue

Effect:

```text
substitutionIntent +1
```

Diagnostic:

```text
60’ Prepare substitution queued substitution intent for the next personnel phase.
```

### Review formation

Effect:

```text
formationReview true
```

Diagnostic:

```text
61’ Review formation marked the shape for manager review.
```

### Reduce pressing or change mentality

Effect:

```text
pressingAdjustment -1
mentalityAdjustment -1
fatigueRelief +1
```

Diagnostic:

```text
45’ Reduce pressing or change mentality reduced pressure and protected booked/tired players.
```

## Browser contract

Interactive replay now shows:

```text
Manager commands
Command effects
```

The `Command effects` list includes command diagnostics plus a projected state summary:

```text
Projected state: pressing -1 · mentality 0 · fatigue relief +2 · defensive risk 0 · substitution intent 0
```

## Determinism

Command effect projection is deterministic.

Same command list:

```text
same commandSignature
same numeric projection
same diagnostics
```

Different command list:

```text
different commandSignature
potentially different projected state
```

## Current limitation

P15A does not yet change:

- remaining match events
- score
- final statistics
- player assignments
- actual substitutions

It only projects command effects and displays them.

## P15B transition

P15B should consume `CommandEffectsProjection` inside resumable match state and regenerate remaining events from:

```text
seed + currentMinute + commandSignature + projected tactical state
```

This will let selected commands actually change future chance pressure, fatigue warnings, event chains, and substitutions while preserving deterministic replay.
