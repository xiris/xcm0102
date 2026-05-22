# Production Lobby Action Availability View Model Contract

## Purpose

P18E adds a pure browser view-model contract for future replay-session lobby controls. P18D added a tested browser client for `PATCH /api/replay-sessions/:sessionId/lobby-state`; this slice decides which future action labels are available from the current server-owned summary without rendering or invoking mutating controls in Match Lab.

## Scope

In scope:

- A typed action-availability model derived from `ReplaySessionLobbySummary`.
- Setup, locked, in-match, complete, missing-manager, and single-manager compatibility copy.
- Future mapping from action targets to the P18D transition client helper.
- Mission-runner coverage for the pure view-model policy.

Out of scope:

- Rendering invite, join, ready, lock, kickoff, complete, or transition buttons.
- Calling `transitionReplaySessionLobbyStateFromWeb` from `MatchLab.tsx`.
- Auth, permissions, sockets, presence, private tactic setup, matchmaking, or durable persistence.

## View Model Contract

`createReplaySessionLobbyStatusViewModel(summary)` adds an `actionAvailability` field:

```ts
{
  headline: string;
  helperText: string;
  actions: Array<{
    id: 'lock_setup' | 'kickoff' | 'complete_match';
    label: string;
    targetLobbyState: 'locked' | 'in_match' | 'complete';
    available: boolean;
    disabledReason?: string;
  }>;
}
```

Rules:

- `setup` summaries expose `Lock setup` targeting `locked`.
- Head-to-head setup locking is available only when both home and away managers are assigned.
- Single-manager setup locking is available when the home manager is assigned; the helper text explains that browser Match Lab sessions usually skip setup/lock and begin in match.
- `locked` summaries expose `Kick off match` targeting `in_match` when required managers are assigned.
- `in_match` summaries expose `Complete match` targeting `complete`.
- `complete` summaries expose no transition actions and explain that no further lobby transitions are available.
- The model only describes future controls; it does not mutate state.

## Future UI Mapping

When browser controls are intentionally introduced, each available action should call:

```ts
transitionReplaySessionLobbyStateFromWeb({
  sessionId: summary.sessionId,
  lobbyState: action.targetLobbyState
});
```

The server remains authoritative and can still reject stale, skipped, repeated, or unauthorized transitions.

## Browser Compatibility

Match Lab remains read-only in P18E. The action-availability model is computed and tested as pure policy, but no mutating action controls are rendered.

## Acceptance Criteria

- Pure view-model tests prove setup lock availability when both head-to-head sides are assigned.
- Pure view-model tests prove setup lock disabled copy when a manager is missing.
- Pure view-model tests prove locked kickoff, in-match complete, and complete no-action states.
- Pure view-model tests prove single-manager compatibility copy.
- Mission runner includes named P18E lobby-action availability coverage.
- Existing Match Lab browser flow remains read-only with no mutating lobby controls rendered.
