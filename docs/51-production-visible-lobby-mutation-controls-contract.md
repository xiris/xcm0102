# Production Visible Lobby Mutation Controls Contract

## Purpose

P18J introduces the first guarded visible lobby mutation controls after the P18F-P18I read-only policy, route fixture, gallery, and stabilization passes. The goal is not broad multiplayer UX; it is a minimal, server-owned browser mutation path that uses the existing lobby action availability model and preserves fixture-gallery read-only coverage.

## Scope

In scope:

- A reusable `LobbyMutationControls` component that renders visible transition buttons from `ReplaySessionLobbyStatusViewModel.actionAvailability`.
- A tested `applyReplaySessionLobbyTransitionFromWeb` helper that calls the existing browser transition client and refreshes the replay-session summary after success.
- Match Lab integration for live replay-session summaries.
- Guard tests proving `/lobby-fixtures` and `LobbyFixtureGallery` remain read-only and button-free.
- Browser smoke for the single-manager Match Lab completion path.

Out of scope:

- Invite, ready, join, rematch, lobby presence, sockets, auth, or optimistic multiplayer controls.
- Adding mutation buttons to `/lobby-fixtures`.
- Duplicating action availability policy inside React-only code.
- Client-side simulation authority.

## Component Contract

`LobbyMutationControls` accepts:

```ts
{
  status: ReplaySessionLobbyStatusViewModel;
  isPending?: boolean;
  error?: string | null;
  onTransition: (action: ReplaySessionLobbyAction) => void;
}
```

Rendering rules:

- The heading is `Lobby transition controls`.
- Helper copy is read from `status.actionAvailability.helperText`.
- Buttons are rendered only from `status.actionAvailability.actions`.
- Disabled buttons use `!action.available` or pending state.
- Disabled reason copy is rendered from `action.disabledReason`.
- Empty action lists render `No lobby transition controls are available.` with no buttons.
- Target copy is rendered as `Target: <targetLobbyState>`.

## Mutation Flow Contract

`applyReplaySessionLobbyTransitionFromWeb` is the only browser flow helper for these controls.

For a selected action it must:

1. Call `transitionReplaySessionLobbyStateFromWeb({ sessionId, lobbyState: action.targetLobbyState })`.
2. After success, call `getReplaySessionSummaryFromWeb(sessionId)`.
3. Return the refreshed `ReplaySessionLobbySummary`.
4. Preserve thrown error messages exactly so server rejection copy can be displayed.

## Match Lab Contract

Match Lab may render `LobbyMutationControls` only when a live replay-session summary exists. The controls must be colocated with the read-only `LobbyStatusCard`, and the visible labels must continue to derive from `createReplaySessionLobbyStatusViewModel`.

On success, Match Lab must:

- update `replaySessionSummary` with the refreshed server summary;
- update status copy to `Replay session lobby transitioned to <state>.`;
- clear replay-session errors.

On failure, Match Lab must:

- display the exact error copy returned by the browser mutation flow;
- leave fixture-gallery surfaces unaffected.

## Read-Only Surface Contract

These surfaces must remain read-only and disconnected from lobby mutation helpers:

- `src/web/LobbyFixtureGallery.tsx`
- `app/lobby-fixtures/page.tsx`

They must not import/call:

- `transitionReplaySessionLobbyStateFromWeb`
- `applyReplaySessionLobbyTransitionFromWeb`

`LobbyFixtureGallery` must remain free of `<button>` markup.

## Acceptance Criteria

- `tests/web/lobbyMutationControls.test.ts` proves available, disabled, and completed-state rendering.
- `tests/web/lobbyMutationFlow.test.ts` proves transition + summary refresh and exact failure-copy preservation.
- `tests/web/matchLabLobbyMutationControls.test.ts` proves Match Lab wires the explicit control component and flow helper.
- `tests/web/lobbyReadOnlyMutationGuards.test.ts` proves fixture-gallery surfaces remain read-only and Match Lab keeps mutation buttons behind `LobbyMutationControls`.
- Mission runner includes P18J coverage.
- Browser smoke proves the Match Lab `Complete match` button moves the live lobby panel to `Complete`, with no console errors, while `/lobby-fixtures` remains read-only.
