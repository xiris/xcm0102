# Production Tactics Contract

## Purpose

The tactical editor foundation introduces the first real CM0102-style tactical choices into the browser Match Lab.

This is not yet a full tactics screen. It is a production-safe contract for passing tactical choices from the browser to the server-authoritative simulation engine.

## Tactical Options

The simulation request now accepts these optional fields for each team:

- `homeFormation`, `awayFormation`
- `homeMentality`, `awayMentality`
- `homePressing`, `awayPressing`
- `homeTransitionStyle`, `awayTransitionStyle`
- existing `homeMovement`, `awayMovement`
- existing `homeFamiliarity`, `awayFamiliarity`

## Allowed Values

### Formation

Allowed formations:

- `4-4-2`
- `4-1-3-2`
- `4-3-3`
- `3-5-2`
- `5-3-2`

`4-1-3-2` is included because it is strongly associated with classic CM0102 tactical culture.

### Mentality

Allowed mentalities:

- `defensive`
- `balanced`
- `attacking`

### Pressing

Allowed pressing values:

- `low`
- `medium`
- `high`

### Transition Style

Allowed transition styles:

- `hold_shape`
- `balanced`
- `fast_break`

### Movement Preset

Allowed WIB/WOB movement presets:

- `compact`
- `balanced`
- `extreme`

## Default Browser Tactical State

The browser Match Lab starts with these defaults:

```json
{
  "seed": 42,
  "homeQuality": "strong",
  "awayQuality": "average",
  "homeFamiliarity": 0.8,
  "awayFamiliarity": 0.5,
  "homeFormation": "4-1-3-2",
  "awayFormation": "4-4-2",
  "homeMentality": "attacking",
  "awayMentality": "balanced",
  "homePressing": "high",
  "awayPressing": "medium",
  "homeTransitionStyle": "fast_break",
  "awayTransitionStyle": "balanced",
  "homeMovement": "balanced",
  "awayMovement": "balanced"
}
```

## API Behavior

The API validates all tactical fields.

Invalid values return HTTP 400 with a readable error message naming the invalid field.

Example invalid request:

```json
{
  "homeFormation": "2-2-6",
  "homeMentality": "reckless"
}
```

Expected behavior:

```json
{
  "error": "homeFormation must be 4-4-2, 4-1-3-2, 4-3-3, 3-5-2, 5-3-2; homeMentality must be defensive, balanced, attacking"
}
```

## Server-Authoritative Boundary

The browser may:

- hold selected tactical state
- build a request payload
- call `/api/simulate-match`
- format returned results

The browser must not:

- calculate scores
- apply tactical modifiers
- mutate match events
- infer hidden player or engine outcomes

The server API owns validation and simulation. The simulation package owns match resolution.

## Current Implementation Detail

Formation is now tactic metadata on `TacticBook`. It is accepted, validated, and carried through server tactic construction.

Current match-resolution effects are still driven mainly by:

- mentality
- pressing
- transition style
- familiarity
- WIB/WOB movement preset
- player attributes

Formation-specific pitch geometry is a future step. The foundation exists so that future tactical geometry can be added without changing the browser/API contract again.

## Current Limits

Not included yet:

- drag-and-drop player positions
- per-zone WIB/WOB grid editing
- player role/duty selection
- tactic saving/loading
- match plan commands by minute
- formation-specific position maps
- assistant tactical feedback

## Verification

Mission coverage includes:

- API accepts valid tactical editor options
- API rejects invalid tactical editor options
- web tactical payload builder maps selected UI state into the API request
- web tactical defaults stay stable

Full verification commands:

```bash
npm run test:missions
npm test
npx tsc --noEmit
npm run build
```
