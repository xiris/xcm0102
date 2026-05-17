# Production Manager Commands Contract

## Purpose

P14 records manager decisions during interactive match replay.

The match is still deterministic and non-mutating. A selected manager option creates a command-history record that can be displayed, persisted later, and used by P15 to alter the remaining simulation.

## Current flow

```text
Run match
Start interactive replay
Pause at key event
Click manager option
Command is recorded
Continue to next key event
```

## Command record

File:

```text
src/simulation/managerCommands.ts
```

Command shape:

```ts
type ManagerCommand = {
  id: string;
  minute: number;
  action: string;
  eventType: MatchEventType;
  eventDescription: string;
  effectSummary: string;
};
```

Example:

```text
54’ Prepare substitution — Recorded intent: prepare substitution at 54’.
```

## Deterministic IDs

Command IDs are stable and readable:

```text
cmd-054-01-prepare-substitution
cmd-054-02-lower-tempo-pressing
```

The ID includes:

- match minute, padded to three digits
- command index, padded to two digits
- slugified action label

## Continue-only actions

The plain `Continue` action is not recorded as a manager command.

Reason:

- continuing replay is navigation, not a managerial decision
- command history should contain deliberate tactical/substitution intent only

Actions that include more intent are recorded, even if their label includes `continue`:

```text
Confirm substitution and continue
```

## Browser contract

When interactive replay is active, manager options are now buttons instead of static text.

Clicking a manager option appends a command to:

```text
Manager commands
```

If no command exists yet, the browser shows:

```text
No manager commands recorded yet.
```

Starting a new match or restarting interactive replay clears the command history.

## Current limitation

P14 records commands but does not change future match outcomes yet.

The selected command does not currently:

- change mentality/pressing state
- recalculate fatigue
- apply manual substitutions
- affect future chance quality
- alter final score

## P15 transition

P15 should make command history outcome-affecting by:

1. splitting the match into resumable phases
2. applying command effects to tactical state
3. recalculating remaining events from the pause point
4. preserving deterministic replay from seed + command log
5. exposing command count/history in replay metadata
