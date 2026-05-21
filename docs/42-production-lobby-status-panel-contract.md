# Production Lobby Status Panel Contract

## Purpose

P18A surfaces the replay-session summary route in the browser as a compact read-only Match Lab lobby/status panel. P17C and P17D already made session ownership, side command counts, lobby state, latest authoritative signature, and transition commands server-owned. This slice makes that state visible without adding browser mutations.

## Scope

In scope:

- A pure lobby status view model for session summary display.
- A browser GET client for `/api/replay-sessions/:sessionId`.
- Match Lab rendering of the summary after replay-session creation, manager-command synchronization, and authoritative resume.
- Original dark football-manager console styling for the read-only panel.

Out of scope:

- Browser controls for lobby-state transitions.
- Manager invites, auth, permissions, sockets, or private tactic setup.
- Durable database persistence.
- Away-side command UI. The current Match Lab remains single-manager/home-default.

## Input Contract

The browser client consumes the existing read-only summary response:

```ts
{
  sessionId: string;
  seed: number;
  ownership: ReplaySessionOwnership;
  lobbyState: 'setup' | 'locked' | 'in_match' | 'complete';
  commandCounts: { home: number; away: number };
  visibleEventCount: number;
  latestAuthoritativeSignature?: string;
}
```

The route intentionally omits full match input, command bodies, visible event arrays, and audit logs.

## View Model Contract

`createReplaySessionLobbyStatusViewModel(summary)` returns:

```ts
{
  title: 'Replay session lobby';
  eyebrow: 'Read-only status';
  stateLabel: string;
  stateTone: 'setup' | 'waiting' | 'active' | 'complete';
  rows: { label: string; value: string }[];
  notes: string[];
}
```

Formatting rules:

- `setup` renders as `Setup open` with setup tone.
- `locked` renders as `Locked for kickoff` with waiting tone.
- `in_match` renders as `In match` with active tone.
- `complete` renders as `Complete` with complete tone.
- Mode labels render as `Single manager` or `Head-to-head`.
- Missing side owners render as `Unassigned`.
- Command counts render as `Home <n> · Away <n>`.
- Latest signature is included only when present.
- Notes must explicitly state that the panel is read-only and that lobby transitions remain tested server commands.

## Browser Behavior

Match Lab must:

1. Create a replay session after simulation as before.
2. Fetch the session summary after creation and render the read-only lobby status panel.
3. Refresh the summary after command append so command counts stay server-derived.
4. Refresh the summary after authoritative resume so the latest signature is visible.
5. Continue to show existing replay metadata and status strings for compatibility.

If summary fetching fails, the existing replay-session error area remains responsible for displaying the readable failure. The panel should not expose mutation buttons in this slice.

## Acceptance Criteria

- Pure view-model tests prove lobby-state copy, owner labels, command counts, visible events, seed, and optional signature formatting.
- Web-client tests prove `GET /api/replay-sessions/:sessionId` is called with readable error handling shared with existing replay-session requests.
- Match Lab layout exposes a semantic `lobby-status` section.
- Mission runner includes the new lobby status and summary-client tests.
- Existing session creation, command append, visible-event sync, and authoritative resume flows remain compatible.
