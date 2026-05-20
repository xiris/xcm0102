# Production Head-to-Head Session Ownership Contract

## Purpose

P17B introduces the first multiplayer-shaped ownership seam for replay sessions without adding accounts, auth, networking, or a live lobby UI. The goal is to make replay sessions able to describe who controls the home and away sides, keep command logs isolated per side, and export/hydrate that state through the durable storage record introduced in P17A.

This is still an in-memory Match Lab foundation. It must remain compatible with the current single-manager browser flow, where manager commands implicitly belong to the home side.

## Scope

In scope:

- Provider-neutral session ownership metadata.
- Home/away side identity fields on replay sessions.
- Side-scoped manager-command logs.
- Backward-compatible home-default command append behavior.
- Storage-record export/hydration preserving ownership and side command logs.
- API helper parsing for optional command side.

Out of scope:

- Real user accounts or auth.
- Invite links, sockets, matchmaking, or lobby UI.
- Private tactic screens.
- Authorization enforcement.
- Database persistence.

## Domain Contract

```ts
type MatchSide = 'home' | 'away';

type ReplaySessionLobbyState = 'setup' | 'locked' | 'in_match' | 'complete';

type ReplaySessionSideOwner = {
  managerId: string;
  displayName: string;
};

type ReplaySessionOwnership = {
  mode: 'single_manager' | 'head_to_head';
  lobbyState: ReplaySessionLobbyState;
  sides: {
    home?: ReplaySessionSideOwner;
    away?: ReplaySessionSideOwner;
  };
};

type ReplaySessionSideCommandLogs = {
  home: ManagerCommand[];
  away: ManagerCommand[];
};
```

## Compatibility Rules

- Existing calls to `appendManagerCommand(sessionId, command)` must behave as home-side commands.
- Existing API requests without `side` must append to the home command log.
- Existing browser UI remains home-only until a lobby UI exists.
- The legacy `managerCommands` array remains a home-command compatibility alias for existing consumers.
- New code should use `sideManagerCommands.home` and `sideManagerCommands.away` for multiplayer semantics.

## Authoritative Resume Rules

- Home-side commands translate to match commands for `baseInput.home.id`.
- Away-side commands translate to match commands for `baseInput.away.id`.
- Resume command count and signature must include commands from both sides.
- Command diagnostics should show the affected team ID, allowing tests to verify side isolation.

## Storage Rules

`ReplaySessionStorageRecord` remains `schemaVersion: 1` in this slice and adds ownership/side-command fields while staying compatible with freshly exported records.

A future migration can introduce `schemaVersion: 2` when hydrating old records from disk becomes necessary. For now, P17B only needs typed export/hydration for records produced by the current repository.

Storage records must include:

- `ownership`
- `sideManagerCommands`
- existing `managerCommands` compatibility alias
- existing P17A durable state: base input, initial result, visible events, latest signature, audit log, and timestamps

## Audit Rules

When a command is appended:

- audit entry type remains `manager_command_appended`
- `commandId` is preserved
- `currentMinute` is preserved
- `commandSide` records `home` or `away`

## Acceptance Criteria

- Repository tests prove home/away command logs are isolated.
- Repository tests prove default append is home-compatible.
- Hydration preserves ownership and side command logs.
- API tests prove `side: 'away'` appends an away command and authoritative resume applies it to the away team.
- API tests prove invalid side values are rejected.
- Existing browser flow continues to work without sending side.
