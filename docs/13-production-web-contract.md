# Production Web Contract

## Purpose

The production web vertical slice makes the current server-authoritative match simulation usable from a browser. It is intentionally a match lab, not yet a full management game screen.

The page should prove these foundations:

- A modern React/Next.js shell can host the online CM0102 experience.
- Browser inputs can drive deterministic match simulations.
- The browser does not own match rules or scoring logic.
- Results are readable enough to guide future tactics, squad, training, and multiplayer UX.

## Routes

### `GET /`

Renders the Match Lab page.

The page includes:

- product title and explanation
- match setup form
- result panel
- error panel

### `POST /api/simulate-match`

Next.js route for the browser vertical slice. It uses the same shared simulation endpoint module as the Fastify API boundary.

The route accepts the existing production API request body:

```json
{
  "seed": 42,
  "homeQuality": "strong",
  "awayQuality": "average",
  "homeFamiliarity": 0.8,
  "awayFamiliarity": 0.5,
  "homeMovement": "balanced",
  "awayMovement": "extreme"
}
```

It returns the existing production API response shape:

```json
{
  "score": { "home": 2, "away": 1 },
  "stats": {
    "home": {
      "shots": 11,
      "shotsOnTarget": 6,
      "goals": 2,
      "possession": 57,
      "fatigue": 14,
      "transitionDelay": 3,
      "lateArrivals": 2,
      "execution": 78,
      "movementLoad": 62
    },
    "away": {
      "shots": 7,
      "shotsOnTarget": 3,
      "goals": 1,
      "possession": 43,
      "fatigue": 19,
      "transitionDelay": 6,
      "lateArrivals": 5,
      "execution": 65,
      "movementLoad": 71
    }
  },
  "events": [],
  "diagnostics": [],
  "replay": {
    "seed": 42,
    "engineVersion": "0.1.0",
    "commandCount": 0
  }
}
```

## Browser Controls

The Match Lab exposes these controls:

- `seed`: integer input for deterministic replay.
- `homeQuality`: weak, average, strong.
- `awayQuality`: weak, average, strong.
- `homeFamiliarity`: 0..1 range input.
- `awayFamiliarity`: 0..1 range input.
- `homeMovement`: compact, balanced, extreme.
- `awayMovement`: compact, balanced, extreme.

These controls map directly to the simulation API body. They are not yet persisted.

## Rendered Result

After a successful simulation, the page renders:

- score title: `Home XI {homeGoals} - {awayGoals} Away XI`
- stats table:
  - possession
  - shots
  - shots on target
  - goals
  - transition delay
  - late arrivals
- event list with minute labels
- diagnostics list
- replay metadata:
  - seed
  - engine version
  - command count

## Error Behavior

If the API returns a non-2xx response, `simulateMatchFromWeb` raises a readable error:

`Simulation request failed: {api error message}`

The Match Lab renders that message in an error panel.

## Server-Authoritative Rule

The web layer must not duplicate match-engine rules.

Allowed in the web layer:

- collecting form input
- calling the API
- formatting returned data for display
- rendering loading and error states

Not allowed in the web layer:

- calculating score
- mutating match events
- changing stats
- applying tactic or player-attribute rules

## Current Limits

This is a vertical slice, so it deliberately does not include:

- real clubs or players
- login or online sessions
- saved matches
- database persistence
- squad management
- tactical editor UI
- multiplayer tournaments

Those should build on this slice rather than bypassing it.

## Verification

Mission coverage includes:

- web client posts the exact JSON request to `/api/simulate-match`
- web client surfaces readable API errors
- result view model formats score, stats, events, diagnostics, and replay labels

Full verification commands:

```bash
npm run test:missions
npm test
npx tsc --noEmit
npm run build
```
