# Production Historic Player Data Contract

## Purpose

The project now has a shared historic player data foundation for the default sample fixture:

```text
Internazionale 2002 vs Milan 2002
```

This makes the browser tactics board and server simulation use the same player names, ids, positions, and attributes.

## Canonical module

Historic sample data lives in:

```text
src/simulation/historicSquads.ts
```

Main exports:

```ts
createHistoricTeam(side: 'home' | 'away'): Team
getHistoricSquadSummary(): HistoricSquadSummary[]
```

## Stable sides

```text
home -> Internazionale 2002
away -> Milan 2002
```

Stable team ids:

```text
home
away
```

Stable player ids:

```text
home-p1 ... home-p11
away-p1 ... away-p11
```

These ids are intentionally stable so assignment payloads and API validation remain deterministic.

## Attribute scale

Attributes use the existing 1-20 style model:

```ts
pace
acceleration
stamina
positioning
anticipation
teamwork
decisions
finishing
passing
tackling
```

The current values are era-inspired approximations for gameplay prototyping. They are not official CM0102 database exports and should not be treated as exact historical ratings.

The purpose is to make the prototype more meaningful than generic all-12 attributes while keeping the data small, auditable, and easy to replace later.

## Browser contract

`src/web/assignmentState.ts` now consumes `createHistoricTeam()`.

This means the visual pitch, dropdown assignments, role mismatch warnings, roster chips, and player attribute cards all read the same shared fixture data.

The browser exposes key attributes through:

```text
src/web/playerAttributeCards.ts
```

The UI shows compact labels such as:

```text
Christian Vieri · F · FIN 20
PAC 13 · STA 15 · POS 18 · DEC 17 · FIN 20 · PAS 12 · TCK 7
```

## API contract

`POST /api/simulate-match` now simulates with historic teams by default.

The response includes team metadata:

```ts
teams: {
  home: Team;
  away: Team;
}
```

The rest of the simulation response remains unchanged:

```ts
score
stats
events
diagnostics
replay
```

## Assignment compatibility

Explicit assignment payloads still use stable ids:

```ts
homeAssignments: Record<string, string>
awayAssignments: Record<string, string>
```

Example:

```ts
homeAssignments: {
  gk: 'home-p1',
  fc2: 'home-p11'
}
```

## Current limitations

- Only first-XI style fixture squads exist.
- No substitutes or squad registration yet.
- No official CM database import yet.
- Browser quality controls still exist, but the default API path now prioritizes historic player attributes over generated all-equal teams.
- No player age, nationality, footedness, morale, condition, value, contract, or hidden attributes yet.

## Next useful steps

- Add substitutes/bench for both clubs.
- Add official-ish player metadata fields: age, nationality, preferred foot, squad number.
- Add click-to-open player profile modal.
- Add quality profile controls that scale historic attributes explicitly instead of replacing players.
- Add a data provenance note per future data source.
