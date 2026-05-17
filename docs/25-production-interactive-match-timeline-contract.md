# Production Interactive Match Timeline Contract

## Purpose

P13 introduces the first interactive matchday loop.

The match can now be replayed progressively instead of only as a full post-match report:

```text
Run match -> Start interactive replay -> Continue to next key event -> choose/consider manager action -> Continue
```

## Current model

The simulation remains deterministic and server-authoritative.

For P13, the browser still receives a complete simulated match result from `/api/simulate-match`, then uses a pure timeline slicer to reveal events in key-event chunks.

This is intentionally a foundation step:

- the user can pause and inspect key events
- the UI can show manager action options
- future work can make those actions alter the remaining match state

## Pure timeline engine

File:

```text
src/simulation/interactiveTimeline.ts
```

Main function:

```ts
createInteractiveMatchState(result, { currentMinute })
```

Returns:

```text
currentMinute
visibleEvents
pauseEvent
scoreSoFar
availableActions
isComplete
```

## Pause-worthy events

The interactive replay pauses at:

```text
goal
foul
free_kick
corner
offside
yellow_card
red_card
fatigue_warning
injury
substitution
tactical_shift
full_time
```

Normal chance text remains visible when it occurs before the next pause event, but does not pause the replay by itself.

## Score-so-far contract

The displayed interactive score is derived from revealed goal events only.

This means:

- at minute 0: `0 - 0`
- after first revealed home goal: `1 - 0`
- after later away goal: `1 - 1`
- at full time: final revealed score

## Manager action labels

P13 action options are advisory labels, not outcome-changing commands yet.

Examples:

```text
Goal:
- Change mentality
- Change pressing
- Continue

Card:
- Reduce pressing or change mentality
- Prepare substitution
- Continue

Fatigue/injury:
- Prepare substitution
- Lower tempo/pressing
- Continue

Substitution:
- Confirm substitution and continue
- Review formation
```

## Browser contract

After running a match, the result panel now shows:

```text
Start interactive replay
Continue to next key event
Show full match
```

Default behavior remains unchanged:

- `Run match` still shows the full match report by default
- interactive replay is opt-in
- `Show full match` returns to the complete event list

When interactive replay is active, the result panel shows:

```text
Interactive replay · 54’
Paused: [event text]
Manager options: [action labels]
Interactive events
```

## Current limitations

P13 does not yet alter future outcomes from manager choices.

That should come next:

- persist manager commands
- allow manual substitution selection
- recalculate/continue remaining match state from the pause point
- update fatigue/chance quality after tactical changes
- support match speeds: instant result, key highlights, full text
