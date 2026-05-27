# Production Private Setup Submission Route / Client Contract

## Purpose

P18Y exposes the already-tested server-authoritative private setup draft storage contract through thin Next route and browser client boundaries.

This is deliberately a transport-boundary slice. It proves that browser-facing code can submit a side-scoped private setup draft to the server route and receive the same validated storage/reveal contract from P18X, while the product `/head-to-head-lobby` route remains local-preview only until a later guarded UI submission slice.

## In Scope

- Add a Next app route wrapper for private setup draft submission.
- Add a browser client helper for posting private setup drafts with an injected `fetch` seam.
- Preserve API-helper validation and repository guards from P18X:
  - head-to-head only;
  - setup-state only;
  - assigned side only;
  - valid `side`, `clubId`, `tacticShellId`, and `readinessIntent`.
- Add route tests for success, validation failure, not-found mapping, and repository guard propagation.
- Add browser client tests for request shape and readable server error propagation.
- Keep product route controls local-only and source-guarded against importing/using the submit client.

## Out of Scope

- No visible submit/save setup button in `/head-to-head-lobby`.
- No wiring from local draft controls to the new route/client helper.
- No account, permission, invite-token, websocket, optimistic sync, multi-tab sync, or CSRF/auth semantics.
- No Fastify route for this private setup write yet.
- No database migration.
- No setup-lock readiness gate changes.
- No real lineup, bench, set-piece, player assignment, or tactical engine application.
- No rematch, restart, or new-match controls.

## Route Contract

Route:

```text
POST /api/replay-sessions/:sessionId/private-setup
```

Request body:

```ts
{
  side: 'home' | 'away';
  draft: {
    clubId: string;
    tacticShellId: string;
    readinessIntent: 'editing' | 'ready_to_lock';
  };
}
```

The route injects `sessionId` from the URL params into `storeReplaySessionPrivateSetupDraftForApi`.

Success response:

```ts
{
  sessionId: string;
  side: 'home' | 'away';
  stored: true;
  revealState: 'hidden_until_lock' | 'revealed_after_lock';
}
```

Failure responses:

- `400` with `{ error }` for validation and repository guard failures.
- `404` with `{ error }` for missing replay sessions.

## Browser Client Contract

Helper:

```ts
submitReplaySessionPrivateSetupDraftFromWeb({
  sessionId,
  side,
  draft: { clubId, tacticShellId, readinessIntent }
})
```

The helper must POST exactly to:

```text
/api/replay-sessions/${sessionId}/private-setup
```

with JSON body:

```ts
{ side, draft }
```

Client error handling stays consistent with the existing replay-session client: server `{ error }` payloads are raised as `Replay session request failed: ...`.

## Product Route Guardrail

`/head-to-head-lobby` must remain local-preview only in this slice. Source tests must continue proving:

- no `Submit setup` label;
- no `Save setup` label;
- no browser storage APIs;
- no import or usage of `submitReplaySessionPrivateSetupDraftFromWeb`.

The new client helper is a foundation for a later guarded UI submission slice, not an immediate product behavior change.

## Acceptance Criteria

- Next route tests prove a valid assigned-side setup draft is stored and the subsequent public summary redacts it before lock.
- Next route tests prove invalid draft payloads return `400` with validation copy.
- Next route tests prove missing sessions return `404`.
- Next route tests prove non-setup or unassigned-side repository guards return readable `400` errors.
- Browser client tests prove exact POST URL/body and readable server error propagation.
- Product route source tests prove no submit/save controls and no private setup submit client usage.
- Mission runner includes the new private setup route/client contract mission.
