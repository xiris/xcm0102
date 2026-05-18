# Browser Replay Session UI Contract

## Purpose

P16D wires Match Lab to the replay-session persistence seam introduced in P16C. The browser should no longer rely only on the legacy full-payload `/api/resume-match` request for the primary authoritative resume flow.

Instead, Match Lab creates a server-owned replay session, appends manager commands to that session, synchronizes visible replay history, and requests authoritative resume by session ID.

## Browser client module

Module:

```text
src/web/replaySessionClient.ts
```

Required operations:

- `createReplaySessionFromWeb({ seed, currentMinute? })`
- `appendReplaySessionCommandFromWeb({ sessionId, command })`
- `syncReplaySessionVisibleEventsFromWeb({ sessionId, visibleEvents })`
- `resumeReplaySessionFromWeb({ sessionId, currentMinute })`

All functions use JSON `POST` requests and throw `Error` objects that include server-provided error text when an API response is not OK.

## Next route contract

Routes:

```text
POST /api/replay-sessions
POST /api/replay-sessions/:sessionId/commands
POST /api/replay-sessions/:sessionId/visible-events
POST /api/replay-sessions/:sessionId/resume
```

The app routes share an in-memory replay-session repository for the running Next process.

## Match Lab behavior

After a successful match simulation:

1. Match Lab attempts to create a replay session with the current seed.
2. Replay metadata displays either:
   - `Replay session: <id>` and session state details, or
   - a session creation error.
3. Starting/restarting replay clears authoritative output but keeps the current session ID.
4. Recording a manager action appends it to the session route.
5. Requesting authoritative resume synchronizes the currently visible replay events and then calls the session-owned resume route.
6. Server-authoritative output remains visually distinct from client-side projected replay.

## Authority notes

P16D is still an in-memory/demo-fixture slice. It improves authority by using session IDs for the main browser path, but it does not yet persist the full custom tactical setup used by Match Lab’s simulation request. That is the recommended follow-up before deeper head-to-head work.

## Compatibility

The legacy `/api/resume-match` browser helper and tests stay in place for transition coverage. The new session-owned route is the preferred Match Lab flow after P16D.
