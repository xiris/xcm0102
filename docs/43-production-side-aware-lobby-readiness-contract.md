# Production Side-Aware Lobby Readiness Contract

## Purpose

P18B extends the read-only Match Lab replay-session lobby panel with side-aware readiness cards. P18A already exposed the server-owned replay-session summary in the browser. This slice keeps the browser non-mutating but makes the home/away ownership and readiness boundary clear enough for future head-to-head lock/ready controls.

## Scope

In scope:

- A pure side-card view model derived from the existing replay-session summary shape.
- Home and away cards showing manager assignment, command counts, and lobby-state-specific readiness copy.
- Match Lab rendering of the two read-only side cards inside the replay-session lobby panel.
- Single-manager compatibility: home shows the local manager, away can remain unassigned with explicit AI/default copy.

Out of scope:

- Browser invite, join, ready, lock, kickoff, or complete controls.
- Away-side command buttons in Match Lab.
- Auth, accounts, permissions, sockets, presence, matchmaking, or private tactic setup.
- Durable database persistence.

## View Model Contract

`createReplaySessionLobbyStatusViewModel(summary)` continues to return the P18A lobby status fields and now adds:

```ts
sideCards: Array<{
  side: 'home' | 'away';
  title: string;
  managerLabel: string;
  assignmentLabel: 'Assigned' | 'Needs manager';
  commandCountLabel: string;
  readinessLabel: string;
  readinessTone: 'setup' | 'waiting' | 'active' | 'complete' | 'unassigned';
}>;
```

Formatting rules:

- Cards are always ordered home, then away.
- Assigned sides use the owner display name and `Assigned` assignment label.
- Missing owners use `Unassigned` and `Needs manager`.
- Command counts use singular/plural copy, for example `1 command` and `2 commands`.
- `setup` assigned sides render `Setup still open` with setup tone.
- `locked` assigned sides render `Locked for kickoff` with waiting tone.
- `in_match` assigned sides render `In-match commands available` with active tone.
- `complete` assigned sides render `Result complete` with complete tone.
- A missing away manager in `single_manager` mode renders `AI/default side for this single-manager session` with unassigned tone.
- Other missing managers render `Waiting for manager assignment` with unassigned tone.

## Browser Behavior

Match Lab must render the side cards in the existing read-only lobby panel after the session summary has been fetched. The cards are display-only and must not introduce mutation controls. The existing summary rows, notes, replay metadata, command append, visible-event sync, and authoritative resume flow remain unchanged.

## Acceptance Criteria

- Pure view-model tests prove head-to-head locked side cards and single-manager in-match compatibility.
- The mission runner includes named side-readiness coverage.
- The Match Lab lobby panel shows Home side and Away side cards in a real browser flow.
- The browser smoke confirms the side cards, read-only copy, and no console errors.
