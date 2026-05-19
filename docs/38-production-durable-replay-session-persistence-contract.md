# Production Durable Replay Session Persistence Contract

## Purpose

P17A defines the storage-shaped seam for replay sessions before adding a real database. The current implementation remains in-memory, but it must be able to export and hydrate stable records that represent the durable state needed for future PostgreSQL/Drizzle/Prisma persistence.

This slice is intentionally a repository-contract slice, not a database-install slice.

## Durable reconstruction requirement

A replay session must be reconstructable from stored state alone:

- `schemaVersion`
- `sessionId`
- `seed`
- authoritative `baseInput`
- initial `MatchResult`
- server-verified `visibleEvents`
- appended `managerCommands`
- `latestAuthoritativeSignature`
- replay-session `auditLog`
- `createdAt` / `updatedAt`

After hydration into a fresh repository, session-owned authoritative resume must produce the same signature/events as the original repository for the same current minute and visible history.

## Storage record shape

The storage boundary is a plain JSON-compatible record:

```ts
type ReplaySessionStorageRecord = {
  schemaVersion: 1;
  sessionId: string;
  seed: number;
  baseInput: MatchInput;
  initialResult: MatchResult;
  visibleEvents: MatchEvent[];
  managerCommands: ManagerCommand[];
  latestAuthoritativeSignature?: string;
  auditLog: ReplaySessionAuditEntry[];
  createdAt: string;
  updatedAt: string;
};
```

Notes:

- `schemaVersion` starts at `1` and is mandatory.
- `baseInput` is the canonical reconstruction payload. Do not rebuild from seed-only defaults during hydrate/resume.
- `sessionId` is durable and must survive hydrate/export.
- `latestAuthoritativeSignature` may be absent before any authoritative resume.
- Records must be clone-safe: repository callers should not mutate stored state through shared object references.

## Repository contract additions

The replay-session repository adds a storage seam:

- `listStorageRecords(): ReplaySessionStorageRecord[]`
- `hydrateStorageRecords(records: ReplaySessionStorageRecord[]): void`

Implementation rules:

1. `listStorageRecords()` exports all sessions as schema-versioned records.
2. `hydrateStorageRecords()` replaces the repository contents with the provided records.
3. Hydration must reject unsupported schema versions with a readable error.
4. Hydration must preserve IDs and advance future generated IDs past imported numeric IDs.
5. Hydration must deep-clone imported records before storing them.

## Out of scope

- No PostgreSQL/Drizzle/Prisma dependency yet.
- No filesystem persistence.
- No user/account/world model.
- No migration runner.
- No multiplayer lobby state.

## Acceptance checks

- Repository test proves export/import preserves full session state.
- API/helper test proves a hydrated repository can resume the same custom-tactic session.
- Mission runner includes a named durable persistence mission.
- Full suite/typecheck/build/browser smoke remain green.
