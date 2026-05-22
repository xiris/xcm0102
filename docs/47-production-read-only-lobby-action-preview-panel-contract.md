# Production Read-Only Lobby Action Preview Panel Contract

## Purpose

P18F renders the P18E `actionAvailability` policy inside the Match Lab replay-session lobby panel as read-only preview copy. This lets developers and users see which future lobby action would be available from the server-owned summary without introducing mutating browser controls yet.

## Scope

In scope:

- A presentational `LobbyStatusCard` action-preview section.
- Rendering action headline, helper text, label, availability state, target lobby state, and disabled reason copy.
- Rendering no-transition copy for completed sessions.
- Vitest/ReactDOMServer coverage that the preview contains no `<button>` controls.
- Mission-runner coverage for the preview panel.

Out of scope:

- Calling `transitionReplaySessionLobbyStateFromWeb` from `MatchLab.tsx`.
- Rendering lobby mutation buttons such as `Lock setup`, `Kick off match`, or `Complete match` as interactive controls.
- Permission enforcement, sockets, invites, presence, private tactic setup, or durable lobby persistence.

## Browser Rendering Contract

`LobbyStatusCard` renders a section labelled `Future lobby action preview` with:

```ts
{
  headline: status.actionAvailability.headline,
  helperText: status.actionAvailability.helperText,
  actions: status.actionAvailability.actions.map((action) => ({
    label: action.label,
    availabilityLabel: action.available ? 'Available' : 'Disabled',
    targetLabel: `Target: ${action.targetLobbyState}`,
    disabledReason: action.disabledReason
  }))
}
```

If `actions` is empty, the panel renders `No further lobby transitions available.`.

## Read-Only Safety Rules

- Preview rows are text/list items, not buttons.
- The Match Lab component still imports no transition helper.
- Future conversion to controls must be an explicit later slice with fresh TDD coverage for click behavior, optimistic/pending/error states, and server rejection copy.
- The server remains authoritative for every lobby-state transition.

## Acceptance Criteria

- Browser-facing component tests prove available in-match completion preview copy.
- Browser-facing component tests prove disabled setup lock preview copy for missing manager assignment.
- Browser-facing component tests prove completed sessions render no-transition copy.
- Tests prove the preview renders no `<button>` controls.
- Mission runner includes named P18F preview coverage.
- Browser smoke confirms Match Lab remains read-only while showing the preview.
