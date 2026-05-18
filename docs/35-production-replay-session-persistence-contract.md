# Production Replay Session Persistence Contract

## Purpose

P16C introduces the first server-owned replay-session persistence boundary.

The current Match Lab can already simulate a deterministic match, record browser-side manager commands, and ask the server for an authoritative resumed replay. However, the P16B request still sends visible replay history and manager commands directly from the browser. That is acceptable for a demo fixture, but a real online match needs server-owned session state and audit metadata.

This contract defines a minimal in-memory seam that can later be replaced by PostgreSQL/Drizzle or Prisma without changing the match-engine contract.

## Session record

A replay session stores:

```ts
{
  sessionId: string;
  seed: number;
  initialResult: MatchResult;
  visibleEvents: MatchEvent[];
  managerCommands: ManagerCommand[];
  latestAuthoritativeSignature?: string;
  auditLog: ReplaySessionAuditEntry[];
  createdAt: string;
  updatedAt: string;
}
```

Audit entries are server-created strings with ISO timestamps. P16C records at least:

- session creation;
- command append;
- visible-event replacement;
- authoritative resume signature/event count.

## Repository interface

Module:

```text
src/api/replaySessionRepository.ts
```

Required operations:

- `createSession({ seed, initialResult, visibleEvents? })`
- `getSession(sessionId)`
- `appendManagerCommand(sessionId, command)`
- `replaceVisibleEvents(sessionId, visibleEvents)`
- `recordAuthoritativeResume(sessionId, { signature, currentMinute, eventCount })`

P16C ships an in-memory implementation only. It must be deterministic enough for tests but does not need durability across process restarts.

## API helper contract

Module:

```text
src/api/replaySessionEndpoint.ts
```

Helper functions accept an explicit repository argument so tests can isolate state:

- `createReplaySessionForApi(payload, repository)`
- `appendReplaySessionCommandForApi(payload, repository)`
- `resumeReplaySessionForApi(payload, repository)`

All helpers return the existing API shape:

```ts
{ ok: true, status: 200, body: ... }
{ ok: false, status: 400 | 404, body: { error: string } }
```

## Fastify route contract

Routes:

```text
POST /api/replay-sessions
POST /api/replay-sessions/:sessionId/commands
POST /api/replay-sessions/:sessionId/resume
```

### Create session request

```ts
{
  seed: number;
  currentMinute?: number;
}
```

The server simulates the existing Inter/Milan demo fixture, stores the initial result, and stores visible events at or before `currentMinute` when supplied. If omitted, the session starts at minute 0 with kickoff-visible state.

Response includes:

- `sessionId`;
- `score`;
- `visibleEventCount`;
- `replay` metadata.

### Append command request

```ts
{
  command: ManagerCommand;
}
```

Response includes:

- `sessionId`;
- `commandCount`.

### Resume request

```ts
{
  currentMinute: number;
}
```

The server loads stored visible events and stored manager commands, then calls the existing authoritative resume engine. Response includes:

- `sessionId`;
- `score`;
- `stats`;
- `events`;
- `diagnostics`;
- `replay`;
- `signature`;
- `authoritative: true`.

## Security and authority notes

P16C is not an authorization slice, but it moves toward server authority by making stored session state the resume source of truth. The browser should eventually send only a session ID and manager action intent, not the entire trusted replay history.

## Non-goals

P16C intentionally does not:

- add accounts or user ownership;
- add persistent database storage;
- migrate Match Lab to session IDs;
- remove the legacy `/api/resume-match` demo endpoint;
- model away-manager ownership;
- implement final audit-log schema for multiplayer disputes.
