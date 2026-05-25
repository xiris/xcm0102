# P18L First Real Lobby Create/Join Read Model Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Add a first product-facing head-to-head lobby entry route that can create a setup lobby with a named home manager and read an existing lobby by session ID, without adding away-side join mutation, auth, sockets, or persistence.

**Architecture:** Keep server authority unchanged by reusing the existing replay-session create and summary routes. Put request/read-model behavior in a pure `headToHeadLobbyModel` module, then keep the React route thin. Preserve the P18K transition harness as smoke-only infrastructure and keep `/lobby-fixtures` read-only.

**Tech Stack:** TypeScript, Next.js App Router, React client component, Vitest, existing replay-session web client.

---

## Task 1: Pure head-to-head lobby model

**Objective:** Create a pure model that builds the first product-facing head-to-head setup request and formats a read-only lobby entry view.

**Files:**
- Create: `src/web/headToHeadLobbyModel.ts`
- Test: `tests/web/headToHeadLobbyModel.test.ts`

**RED:**
- Test `createHeadToHeadLobbyRequest({ homeManagerName: 'Chris Silva' })` returns:
  - `ownership.mode: 'head_to_head'`
  - `ownership.lobbyState: 'setup'`
  - assigned home manager `Chris Silva`
  - deterministic home manager id `home-chris-silva`
  - no away manager
  - full home/away assignment maps for current default formations
- Test `createHeadToHeadLobbyReadModel(summary)` returns:
  - title `Head-to-head lobby`
  - session/invite copy
  - away waiting copy when away is unassigned
  - no mutation actions of its own; transition policy remains in the existing lobby status view model

**GREEN:**
- Implement the helper by reusing `defaultTacticalState` and `createAssignmentState`.
- Implement read-model formatting as data only.

## Task 2: Product-facing lobby entry route

**Objective:** Add a product-facing route separate from `/lobby-transition-harness` for creating and reading head-to-head setup lobbies.

**Files:**
- Create: `src/web/HeadToHeadLobbyEntry.tsx`
- Create: `app/head-to-head-lobby/page.tsx`
- Test: `tests/web/headToHeadLobbyEntry.test.ts`

**RED:**
- Static render contains:
  - `Head-to-head lobby`
  - home manager input label
  - create button
  - read existing lobby input/button
  - no transition controls before a lobby exists
- Source boundary test verifies:
  - route imports `HeadToHeadLobbyEntry`
  - component imports `createHeadToHeadLobbyRequest`
  - component imports `createReplaySessionFromWeb` and `getReplaySessionSummaryFromWeb`
  - component does not import `LobbyMutationControls` or `applyReplaySessionLobbyTransitionFromWeb`

**GREEN:**
- Add a client component with two flows:
  - create setup lobby from home manager name;
  - load an existing lobby by session ID for read-only join/review.
- Render shared `LobbyStatusCard` from the server summary and a product read-model panel.
- Do not render mutation controls in this route.

## Task 3: Docs, missions, validation, browser smoke

**Objective:** Document the contract, wire mission tests, and validate the slice.

**Files:**
- Create: `docs/53-production-head-to-head-lobby-entry-contract.md`
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`
- Modify: `scripts/run-mission-tests.ts`

**Validation:**
- Focused:
  - `npx vitest run tests/web/headToHeadLobbyModel.test.ts`
  - `npx vitest run tests/web/headToHeadLobbyEntry.test.ts`
  - `npx vitest run tests/web/lobbyReadOnlyMutationGuards.test.ts`
- Full:
  - `npm run test:missions`
  - `npm test`
  - `npx tsc --noEmit`
  - `npm run build`
  - `git diff --check`
- Browser smoke:
  - visit `/head-to-head-lobby`
  - create lobby with a home manager name
  - verify read-only lobby summary shows home manager assigned and away manager unassigned/waiting
  - verify no lobby transition buttons appear on this route
  - verify `/lobby-transition-harness` still exists for transition smoke
  - verify `/lobby-fixtures` remains button-free

## Commit boundary

Commit locally after full validation if the user has authorized continuation commit behavior for this slice. Do not push unless explicitly requested.
