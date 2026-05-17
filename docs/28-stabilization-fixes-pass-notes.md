# Stabilization Fixes Pass Notes

## Purpose

This pass pauses feature expansion after P15A and hardens the interactive replay command surface.

## Root-cause findings

### Duplicate command records

Observed browser behavior:

```text
Click Start interactive replay
Click Adjust defensive line twice
Manager commands shows two identical records
```

Root cause:

```text
appendManagerCommand always appended any non-Continue command without checking whether the same action had already been recorded for the same pause event.
```

Fix:

```text
src/simulation/managerCommands.ts
```

`appendManagerCommand` now ignores a command when history already contains the same:

- minute
- action
- event type
- event description

Distinct actions at the same pause still append normally.

### Continue rendered as manager action

Observed browser behavior:

```text
Manager options: Adjust defensive line · Change pressing · Continue
```

But the replay already has a dedicated navigation button:

```text
Continue to next key event
```

Root cause:

```text
interactiveReplayViewModel exposed every pause action, including plain Continue, to the manager-action button group.
```

Fix:

```text
src/web/interactiveReplayViewModel.ts
```

Plain `Continue` is filtered out of manager-action buttons. The dedicated replay-navigation button remains available.

## Regression coverage

New/updated tests cover:

- duplicate same-action/same-pause commands are ignored
- distinct same-pause actions are preserved
- plain `Continue` is omitted from manager-action buttons
- existing continue-only command helper behavior still holds

## Browser acceptance

Manual browser verification should confirm:

1. Run match.
2. Start interactive replay.
3. Manager action buttons do not include plain `Continue`.
4. Double-click a tactical action.
5. Manager commands shows one record, not two.
6. Command effects shows one projected effect, not duplicate effects.
7. Dedicated `Continue to next key event` button remains usable.
