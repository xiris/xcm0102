# P18C Lobby Setup/Lock API Smoke Plan

## Goal

Add the smallest server-first smoke path for replay sessions that begin in `setup`, then prove `setup -> locked -> in_match` readiness behavior through API and route tests. This prepares future head-to-head lobby controls without adding browser mutation UI.

## Scope

In scope:

- Extend replay-session creation parsing with an optional server-owned lobby smoke payload.
- Preserve existing Match Lab compatibility: omitted lobby options still create single-manager `in_match` sessions.
- Allow tests/routes to create head-to-head setup sessions with home/away manager owners.
- Prove API helper and Fastify/Next route transitions from `setup` to `locked` to `in_match`.
- Confirm read-only summaries reflect setup/locked/in-match state and side assignment metadata.
- Update mission runner and production docs.

Out of scope:

- Browser invite, join, ready, lock, kickoff, complete, or transition buttons.
- Auth, permissions, sockets, presence, matchmaking, or private tactic setup.
- Durable database persistence.
- Replacing current Match Lab post-simulation `in_match` session creation.

## Likely Files

- `src/api/replaySessionEndpoint.ts`
- `tests/api/replaySessionEndpoint.test.ts`
- `tests/api/server.test.ts`
- `tests/api/replaySessionNextRoutes.test.ts`
- `scripts/run-mission-tests.ts`
- `docs/44-production-lobby-setup-lock-api-smoke-contract.md`
- `docs/README.md`
- `docs/30-project-handoff-status.md`

## TDD Checkpoints

1. RED: API helper test for creating a head-to-head setup session and transitioning setup -> locked -> in_match.
2. GREEN: parse optional lobby smoke ownership fields and pass ownership to repository creation.
3. RED/GREEN: Fastify route smoke proves route-level setup creation and forward transitions.
4. RED/GREEN: Next route smoke proves app-router parity for setup creation and forward transitions.
5. Mission runner includes a named P18C setup/lock smoke mission.

## Verification

- Focused API helper test.
- Focused Fastify/Next route smoke tests.
- `npm run test:missions`.
- `npm test`.
- `npx tsc --noEmit`.
- `npm run build`.
- `git diff --check`.
- Browser smoke for existing Match Lab flow remains read-only and still creates `in_match` sessions.

## Next Phase Transition

After P18C, the recommended next slice should remain server-first unless route/readiness behavior is stable enough to add a deliberately small read-only setup/locked browser smoke fixture or begin a controlled mutating lobby client contract.
