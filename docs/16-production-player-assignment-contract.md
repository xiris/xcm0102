# Production Player Assignment Contract

## Purpose

Player assignment connects formation slots to actual players and makes role suitability affect match outcomes.

The game now has enough tactical structure to answer a CM0102-style question: not just "which formation did I choose?" but "who is playing in each slot, and are they comfortable there?"

## Server-authoritative boundary

The simulation layer owns assignment consequences.

- `src/simulation/domain.ts` defines `TacticBook.assignments`.
- `src/simulation/sampleData.ts` creates default slot-to-player assignments.
- `src/simulation/roleSuitability.ts` scores player position against slot role.
- `src/simulation/simulateMatch.ts` applies suitability to execution, fatigue, transition risk, and diagnostics.
- `src/web/formationPreview.ts` formats assignment labels for display.
- `src/web/MatchLab.tsx` renders a simple preview only.

The browser does not calculate execution penalties or match outcomes.

## Assignment model

A tactic book now includes:

```ts
assignments: Record<string, string>
```

The key is a formation slot id from `src/simulation/formationGeometry.ts`.
The value is a player id from the team.

Example:

```ts
{
  gk: 'home-p1',
  dl: 'home-p2',
  fc1: 'home-p10'
}
```

Default sample assignments follow formation slot order against the team player list. Manual assignments override generated defaults.

## Role suitability scoring

`scoreRoleSuitability(player, slotRole)` returns a normalized score.

Current rules:

- Natural role match: `1.0`
- Adjacent role match: `0.78`
- General mismatch: `0.55`
- Severe defender/forward mismatch: `0.35`
- Goalkeeper outfield or outfielder goalkeeper mismatch: `0.25`

Adjacent role examples:

- `DM` can cover `D`.
- `D` or `M` can cover `DM`.
- `DM` or `AM` can cover `M`.
- `M` or `F` can cover `AM`.
- `AM` can cover `F`.

## Simulation effect

Role suitability is summarized per team by looking at every assigned formation slot.

The average suitability affects:

- execution multiplier,
- fatigue cost,
- late-arrival pressure,
- diagnostics.

Mismatches under the reporting threshold produce diagnostics such as:

```text
Home role mismatch reduced tactical execution: home Player 11 playing GK
```

This is intentionally simple but important: formation and player choice now interact.

## Browser preview

The Match Lab formation preview can include assigned player names:

```text
GK — Home Player 1
DC — Home Player 3
FC — Home Player 10
```

For now, the browser uses a generated preview roster. Full drag/drop assignment is not implemented yet.

## Current limits

- No interactive player assignment UI yet.
- No substitutions.
- No role-specific attributes by slot label yet, only coarse role families.
- No squad depth, injuries, morale, condition, or player history yet.
- No goalkeeper-specific attribute set yet.
- No per-side assignment payload from the browser API yet; production API still uses generated sample teams for match lab requests.

## Next useful steps

- Add interactive slot assignment in the browser.
- Add API payload support for explicit player ids and positions.
- Add position-specific attributes and role suitability explanations.
- Add out-of-position icons/warnings in the UI.
- Add substitutions and match commands that alter assignments mid-match.
