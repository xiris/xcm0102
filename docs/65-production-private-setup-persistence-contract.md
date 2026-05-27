# Production Private Setup Persistence Contract

## Purpose

P18X introduces the first server-authoritative hidden private setup persistence contract for head-to-head replay sessions. This is deliberately a repository/API contract slice, not a browser mutation slice.

The goal is to prove that each assigned side can store a private setup draft on the server, that public summaries keep setup choices hidden before lock, and that both sides reveal simultaneously only after the server-owned setup lock transition.

## In Scope

- Add a side-scoped server private setup draft record to replay sessions.
- Store one draft per side with explicit sample setup fields:
  - `clubId`
  - `tacticShellId`
  - `readinessIntent`
- Add repository contract behavior for storing drafts while a head-to-head session is in `setup`.
- Add API helper contract behavior for validating and storing drafts.
- Add public summary reveal behavior:
  - before setup lock: draft details are redacted;
  - after setup lock/in-match/complete: stored draft details are revealed for both sides at the same time;
  - missing drafts remain explicit missing placeholders after reveal.
- Preserve storage export/hydration behavior for future durable persistence.
- Preserve current browser-local draft controls as local preview only.

## Out of Scope

- No browser submit/save setup controls.
- No Next route or browser client wiring for private setup submission yet.
- No account, invite-token, authorization, websocket, optimistic sync, or multi-tab behavior.
- No database migration.
- No real lineup, bench, set-piece, player assignment, or tactical engine application.
- No change to setup lock availability: server-owned lock still depends only on manager assignment in this slice.
- No rematch, restart, or new-match controls.

## Private Draft Shape

```ts
type ReplaySessionPrivateSetupDraft = {
  clubId: string;
  tacticShellId: string;
  readinessIntent: 'editing' | 'ready_to_lock';
};
```

Stored records are side-scoped and include server metadata:

```ts
type ReplaySessionPrivateSetupDraftRecord = ReplaySessionPrivateSetupDraft & {
  side: 'home' | 'away';
  updatedAt: string;
};
```

## Public Summary Shape

Public summaries may include `privateSetup` but must not leak hidden setup values before lock.

Before lock:

```ts
{
  revealState: 'hidden_until_lock',
  sides: {
    home: { side: 'home', status: 'stored', detailVisibility: 'hidden', redactionLabel: 'Hidden until setup lock' },
    away: { side: 'away', status: 'missing', detailVisibility: 'hidden', redactionLabel: 'Hidden until setup lock' }
  }
}
```

After lock, in match, or complete:

```ts
{
  revealState: 'revealed_after_lock',
  sides: {
    home: { side: 'home', status: 'stored', detailVisibility: 'revealed', draft: { ... } },
    away: { side: 'away', status: 'missing', detailVisibility: 'revealed', missingLabel: 'No private setup draft stored' }
  }
}
```

## Rules

1. Private setup drafts can only be stored for head-to-head replay sessions.
2. Private setup drafts can only be stored while `ownership.lobbyState` is `setup`.
3. The side must be assigned before its draft can be stored.
4. Side values must be `home` or `away`.
5. Draft fields must be non-empty strings and `readinessIntent` must be `editing` or `ready_to_lock`.
6. Storing a side draft replaces only that side's previous draft.
7. Storing or replacing a draft adds a side-scoped audit entry.
8. Public summaries before lock must not include `clubId`, `tacticShellId`, `readinessIntent`, or `updatedAt` for either side.
9. Public summaries after lock reveal both sides from the same server-owned lobby-state boundary.
10. Existing local browser draft controls remain component state only until a later browser mutation slice.

## Acceptance Criteria

- Repository tests prove side-scoped draft storage and replacement.
- Repository tests prove invalid storage is rejected for unassigned sides, non-head-to-head sessions, and non-setup states.
- Storage export/hydration preserves private setup drafts without aliasing mutable objects.
- API helper tests prove request validation, error mapping, and successful storage response.
- Summary API tests prove pre-lock redaction and post-lock simultaneous reveal.
- Product route source tests continue to prove there are no setup submit/save controls, no browser storage APIs, and no private setup submit client usage.
- Mission runner includes the new private setup persistence contract mission.
