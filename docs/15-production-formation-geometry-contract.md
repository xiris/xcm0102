# Production Formation Geometry Contract

## Purpose

Formation geometry makes tactical shape matter in the production simulation foundation.

Earlier tactical editor work accepted formation names as validated metadata. This contract turns those formation choices into normalized pitch coordinates used to build WIB/WOB maps and movement-load profiles.

## Server-authoritative boundary

The browser may preview formation shape, but it does not calculate match outcomes.

Authoritative ownership remains:

- `src/simulation/formationGeometry.ts` owns supported formation slot geometry.
- `src/simulation/sampleData.ts` uses geometry to generate tactic WIB/WOB maps.
- `src/simulation/simulateMatch.ts` derives movement load, transition delay, fatigue, late arrivals, shots, goals, events, diagnostics, and replay metadata.
- `src/web/formationPreview.ts` formats geometry for display only.
- `src/web/MatchLab.tsx` renders the preview and sends selected tactical options to the API.

## Coordinate model

Coordinates are normalized pitch points:

- `x`: 0 to 100, defensive goal to attacking goal.
- `y`: 0 to 100, left touchline to right touchline.

Each formation exposes:

- `formation`: supported formation id.
- `width`: profile rating for horizontal spread.
- `depth`: profile rating for vertical attacking depth.
- `slots`: exactly 11 player slots.

Each slot exposes:

- `id`: stable slot id.
- `role`: coarse tactical role (`GK`, `D`, `DM`, `M`, `AM`, `F`).
- `label`: display label such as `GK`, `DL`, `DMC`, `MC`, `FC`.
- `point`: normalized base position.

## Supported profiles

### 4-4-2

- Width: 68
- Depth: 62
- Shape: four defenders, four midfielders, two forwards.
- Intended feel: balanced, familiar CM0102 baseline.

### 4-1-3-2

- Width: 62
- Depth: 70
- Shape: four defenders, one defensive midfielder, three midfielders, two forwards.
- Intended feel: classic CM0102-flavored shape with a DMC screen and two strikers.

### 4-3-3

- Width: 76
- Depth: 76
- Shape: four defenders, three midfielders, three forwards.
- Intended feel: broad and aggressive, with high forward line spread.

### 3-5-2

- Width: 72
- Depth: 68
- Shape: three defenders, five midfielders/wing-backs, two forwards.
- Intended feel: midfield-heavy with wing-back width.

### 5-3-2

- Width: 58
- Depth: 55
- Shape: five defenders, three midfielders, two forwards.
- Intended feel: cautious, deeper, narrower defensive shell.

## WIB/WOB map generation

`createSampleTacticBook()` now combines:

- formation slot base points,
- movement preset (`compact`, `balanced`, `extreme`),
- phase (`wib` or `wob`),
- zone (`DEF_CENTER`, `MID_CENTER`, `ATT_CENTER`).

This means two tactics with the same movement preset but different formations generate different maps.

Movement presets continue to affect recovery distance:

- `compact`: smaller phase shifts and tighter vertical movement.
- `balanced`: moderate phase shifts.
- `extreme`: larger shifts and alternating runs.

## Simulation effect

The simulation already derives movement load from WIB/WOB map centroid distance and spread.

Because formations now change map coordinates, formation choice can affect:

- movement load,
- transition delay,
- fatigue,
- late arrivals,
- diagnostics,
- chance pressure indirectly.

## Browser preview

The Match Lab displays a formation preview for home and away selections.

Preview includes:

- formation title,
- slot count,
- width/depth profile,
- grouped tactical lines.

This preview is intentionally descriptive. It does not resolve match logic.

## Current limits

- Coordinates are authored profiles, not yet imported from CM0102 data files.
- Player role suitability is not yet evaluated against formation slots.
- Individual player assignment and drag/drop editing are not implemented yet.
- Width/depth are profile ratings, not separate simulation inputs.
- No visual pitch canvas yet; preview is line-based.

## Next useful steps

- Add player assignment to formation slots.
- Add role suitability and out-of-position penalties.
- Add an actual pitch visualization.
- Add CM0102-style tactical instructions per slot.
- Expand zones beyond center-only samples.
