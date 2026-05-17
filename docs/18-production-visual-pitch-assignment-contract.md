# Production Visual Pitch Assignment Contract

## Purpose

The Match Lab now renders each team's assignments as a football tactics pitch instead of only a text/dropdown table.

This phase adds the first CM-style tactical board:

- pitch-positioned slot markers,
- draggable player chips,
- drag/drop swapping between occupied slots,
- dropdown fallback for accessibility,
- real sample fixture names from Internazionale 2002 and Milan 2002.

## Sample squads

The browser assignment UI uses historic sample squads when real data is needed.

Home side:

```text
Internazionale 2002
```

Away side:

```text
Milan 2002
```

Player ids remain stable and API-compatible:

```text
home-p1 ... home-p11
away-p1 ... away-p11
```

The displayed names are real sample fixture names, while ids stay generic so the existing API validation and assignment payloads remain stable.

## Pitch board view model

The pure view-model builder is:

```ts
createPitchAssignmentViewModel(state: AssignmentState): PitchAssignmentViewModel
```

It converts:

- selected formation geometry,
- slot assignments,
- sample squad players,
- role suitability scores,

into markers with:

```ts
{
  slotId: string;
  label: string;
  role: PlayerPosition;
  playerId: string;
  playerName: string;
  playerPosition: PlayerPosition;
  left: string;
  top: string;
  suitability: 'natural' | 'acceptable' | 'risky' | 'severe';
}
```

Coordinate mapping uses existing normalized formation geometry:

```text
left = slot.point.y%
top = 100 - slot.point.x%
```

This keeps defensive players near the bottom of the rendered pitch and attackers near the top.

## Drag/drop behavior

Pitch markers and roster chips are draggable.

Dropping a player onto a slot calls:

```ts
movePlayerToSlot(state, playerId, targetSlotId)
```

If the player is already assigned to another slot, the helper swaps the two assignments. This prevents duplicate players from being created in the UI.

Example:

```text
Drag Christian Vieri onto GK
```

Result:

```text
GK -> Christian Vieri
FC2 -> Francesco Toldo
```

## Dropdown fallback

Every slot still has a dropdown below the pitch.

Changing a dropdown uses the same `movePlayerToSlot()` helper as drag/drop, so dropdown use also preserves unique assignments.

The dropdowns are intentionally retained because they are:

- keyboard-accessible,
- easy to test,
- useful on devices where drag/drop is awkward,
- a stable fallback if drag/drop behavior changes.

## Suitability styling

Pitch markers expose a suitability class:

```text
natural
acceptable
risky
severe
```

The browser uses this to color slot chips. Severe mismatches, such as a striker dropped into goal, are visually highlighted and also appear in warning text.

## API contract unchanged

The API payload remains:

```ts
homeAssignments: Record<string, string>
awayAssignments: Record<string, string>
```

The pitch board is only a more expressive UI over the existing assignment contract.

## Current limits

- Drag/drop is HTML5 pointer drag/drop; no mobile touch-specific layer yet.
- Sample squads are fixed first-XI style fixtures, not full squad databases.
- Player attributes are still generic preview attributes in the browser assignment state.
- The server simulation still uses generated sample teams for attributes and validates stable ids.

## Next useful steps

- Add real player attribute profiles for Inter/Milan 2002.
- Add mobile-friendly tap-to-select assignment mode.
- Add persistent saved lineups.
- Add full club squad pages.
- Add substitutes and bench assignment.
