# Production Interactive Assignment Contract

## Purpose

The Match Lab now lets users actively change player-slot assignments instead of only viewing generated slot labels.

This closes the gap reported after P5: slots were visible, but there was no way to drag or select players. The first interaction model is dropdown-based selection. Drag/drop can be layered on top later, but dropdowns are explicit, keyboard-friendly, and easier to validate.

## Browser behavior

The browser owns local assignment UI state for the current Match Lab sample rosters.

For each side:

- the selected formation determines the visible slot ids,
- each slot renders a player dropdown,
- changing a dropdown immediately updates the shape preview,
- role mismatch warnings appear before simulation,
- running a match sends the assignment map to the API.

Assignment state helper:

```ts
AssignmentState = {
  side: 'home' | 'away';
  formation: Formation;
  players: AssignmentPlayer[];
  assignments: Record<string, string>;
}
```

The UI currently uses generated sample players:

```text
Home Player 1 (GK)
Home Player 2 (D)
...
Home Player 11 (F)
```

## API payload

The web simulation request now accepts:

```ts
homeAssignments: Record<string, string>
awayAssignments: Record<string, string>
```

Example:

```json
{
  "homeFormation": "4-4-2",
  "homeAssignments": {
    "gk": "home-p1",
    "dl": "home-p2",
    "dc1": "home-p3",
    "dc2": "home-p4",
    "dr": "home-p5",
    "ml": "home-p6",
    "mc1": "home-p7",
    "mc2": "home-p8",
    "mr": "home-p9",
    "fc1": "home-p10",
    "fc2": "home-p11"
  }
}
```

## Server validation

The server validates explicit assignment maps against:

- selected formation slot ids,
- generated side player ids,
- missing required slots,
- unknown slot ids,
- unknown player ids,
- duplicate player assignments.

Invalid assignments return HTTP 400 with a readable error.

Valid assignments are passed to `createSampleTacticBook()` and affect the server-authoritative simulation through the existing role-suitability system.

## Role mismatch warnings

The browser preflight warning uses the same role-suitability scoring model as the simulation layer.

Example visible warning:

```text
Home Player 11 is out of position at GK
```

The server may also emit post-simulation diagnostics such as:

```text
Home role mismatch reduced tactical execution: home Player 11 playing GK
```

## Current drag/drop limit

Drag/drop is not implemented yet.

The current production-safe interaction is dropdown selection because it is:

- deterministic,
- accessible by keyboard,
- easy to validate,
- enough to change match outcomes now.

A later drag/drop layer should call the same `replaceAssignment()` helper and keep this API contract unchanged.

## Current limits

- Sample rosters only; no persistent squad database yet.
- No duplicate-prevention in the browser yet; duplicates are rejected by the server.
- No drag/drop yet.
- No substitutions or in-match assignment changes yet.
- No custom player attributes in the browser payload yet.

## Next useful steps

- Disable already-selected players in other slot dropdowns.
- Add drag/drop on top of the dropdown model.
- Add actual club squads and player pages.
- Add API payload support for custom rosters and attributes.
- Add a visual pitch layout for slots.
