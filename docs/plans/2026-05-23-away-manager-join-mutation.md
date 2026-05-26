# P18M Away Manager Join Mutation Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Add the first server-owned away-manager join mutation for head-to-head setup lobbies and wire it into the product lobby entry route.

**Architecture:** Extend the replay-session repository first, then expose the behavior through API helpers, Next route wrappers, browser client helpers, a pure web flow, and finally the `/head-to-head-lobby` product route. Keep transition controls out of the product route; `/lobby-transition-harness` remains the transition smoke route.

**Tech Stack:** TypeScript, Next.js App Router, React client components, Vitest.

---

## Task 1: Repository join contract

**Objective:** Add server-owned away-manager assignment on setup head-to-head lobbies.

**Files:**
- Modify: `src/api/replaySessionRepository.ts`
- Test: `tests/api/replaySessionRepository.test.ts`

**RED:**
- Add a failing test proving `joinAwayManager(sessionId, owner)` assigns `ownership.sides.away` and preserves setup state.
- Add a failing test proving duplicate away joins, locked/in-match/complete lobbies, and single-manager sessions are rejected with exact messages.

**GREEN:**
- Add `joinAwayManager` to repository interface and in-memory implementation.
- Add an audit entry type `away_manager_joined` with `managerId` and `displayName`.

## Task 2: API and Next route contract

**Objective:** Expose away join through server helpers and Next route wrapper.

**Files:**
- Modify: `src/api/replaySessionEndpoint.ts`
- Create: `app/api/replay-sessions/[sessionId]/join-away/route.ts`
- Test: `tests/api/replaySessionEndpoint.test.ts`
- Test: `tests/api/replaySessionNextRoutes.test.ts`

**RED:**
- API helper accepts `{ sessionId, managerId, displayName }` and returns updated `sessionId`, `lobbyState`, and `ownership`.
- API helper rejects invalid bodies, missing sessions, duplicate joins, non-setup joins, and single-manager sessions with exact copy.
- Next route wrapper passes the path session ID and body owner fields into the helper.

**GREEN:**
- Implement parser, helper, and route wrapper.

## Task 3: Browser client and product-route flow

**Objective:** Add browser helper and route UI for joining as the away manager without adding transition controls.

**Files:**
- Modify: `src/web/replaySessionClient.ts`
- Create: `src/web/headToHeadLobbyJoinFlow.ts`
- Modify: `src/web/HeadToHeadLobbyEntry.tsx`
- Test: `tests/web/replaySessionClient.test.ts`
- Test: `tests/web/headToHeadLobbyJoinFlow.test.ts`
- Test: `tests/web/headToHeadLobbyEntry.test.ts`

**RED:**
- Client posts to `/api/replay-sessions/:sessionId/join-away` and preserves server rejection copy via the existing parse path.
- Flow joins away manager then refreshes summary.
- Product route static shell includes away manager name and `Join as away manager` controls.
- Source-boundary test proves the product route imports the join flow/client helper and still does not import transition helpers or mutation controls.

**GREEN:**
- Implement helper, flow, and UI.

## Task 4: Docs, missions, validation, browser smoke

**Objective:** Document the mutation contract and validate the full slice.

**Files:**
- Create: `docs/54-production-away-manager-join-contract.md`
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`
- Modify: `scripts/run-mission-tests.ts`

**Validation:**
- Focused:
  - `npx vitest run tests/api/replaySessionRepository.test.ts`
  - `npx vitest run tests/api/replaySessionEndpoint.test.ts`
  - `npx vitest run tests/api/replaySessionNextRoutes.test.ts`
  - `npx vitest run tests/web/replaySessionClient.test.ts`
  - `npx vitest run tests/web/headToHeadLobbyJoinFlow.test.ts`
  - `npx vitest run tests/web/headToHeadLobbyEntry.test.ts`
- Full:
  - `npm run test:missions`
  - `npm test`
  - `npx tsc --noEmit`
  - `npm run build`
  - `git diff --check`
- Browser smoke:
  - create lobby at `/head-to-head-lobby` with a home manager;
  - enter away manager name and click join;
  - verify summary shows both managers;
  - attempt duplicate join and verify exact rejection copy;
  - verify no lobby transition buttons on product route;
  - verify `/lobby-transition-harness` still renders and `/lobby-fixtures` remains button-free.

## Commit boundary

Commit locally after full validation. Do not push unless explicitly requested.
