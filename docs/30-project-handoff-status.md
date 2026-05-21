# Project Handoff Status — 2026-05-18

This document is the short-context handoff for starting a new chat on the XCM0102 project.

## Current Repository State

- Project path: `/Users/christophersilva/Projects/personal/xcm0102`
- Branch: `main`
- Remote: `origin git@github.com:xiris/xcm0102.git`
- Latest completed local work before the next persistence/multiplayer slice: P17C Session Ownership Server Route Parity and Lobby State Smoke.

## Product Direction

Build a modern online football-management game inspired by Championship Manager 01/02 while preserving the core fun:

- fast season flow
- readable text-driven simulation
- tactical tinkering with visible consequences
- player/club storytelling
- deterministic and explainable match outcomes
- online-ready architecture without copying CM0102 assets, executable data, logos, database, or manual text

Use Inter 2002 and Milan 2002 as sample/fixture squads when historic football data is useful.

## Current Architecture

The project is a Node/TypeScript/Next/Vitest app.

Important boundaries:

- `src/simulation/` contains deterministic football simulation logic.
- `src/api/` contains the server-authoritative API layer.
- `src/web/` contains browser-facing view models and UI components.
- `tests/` contains Vitest coverage.
- `scripts/run-mission-tests.ts` contains user-preferred mission-labelled validation.
- `docs/` contains design, contract, plan, and handoff documentation.

The browser app currently exposes a Match Lab where the user can:

- configure seed, quality, formations, mentality, pressing, transitions, familiarity, and movement style
- run a deterministic match simulation
- inspect score, stats, diagnostics, and events
- use progressive interactive replay
- pause at key events
- record manager commands
- view deterministic projected command effects
- view projected remaining replay after manager commands
- consume a tested, modernized Match Lab layout with grouped stat panels and clearer replay/diagnostic separation
- request server-authoritative resumed replay output from the interactive replay console and compare it with client-side projected replay
- create server-owned replay sessions through the API and resume them authoritatively from stored visible history and command logs
- create and hold a browser replay session ID, sync manager commands/visible events, and request authoritative resume through session-owned routes
- preserve the full Match Lab tactical payload inside replay sessions so session-owned resume does not drift back to demo defaults
- export and hydrate schema-versioned replay-session storage records so future durable persistence can reconstruct sessions without losing tactic/command parity
- store replay-session ownership metadata and side-specific home/away command logs for future head-to-head lobbies while preserving the current home-only Match Lab flow
- expose side-aware replay-session route parity and a read-only lobby/session summary shape for future head-to-head UI

## Completed Production Slices

### Production foundation

- Deterministic simulation package and domain model.
- Server-authoritative simulation API.
- Browser-visible match lab.
- Tactical editor payload mapping and validation.
- Formation geometry and shape preview.
- Player assignment and role suitability.
- Visual pitch assignment.
- Historic Inter/Milan 2002 sample squad data.
- Chance quality and commentary variation.
- Event taxonomy and commentary packs.
- Match event chains.
- Bench/condition/substitution events.
- Progressive interactive match timeline.

### Interactive manager-command, resume, and UI foundation work

Completed:

- Manager commands can be recorded during interactive replay.
- Duplicate same-action/same-pause command records are suppressed.
- Distinct same-pause actions remain allowed.
- Plain `Continue` is hidden from manager action buttons.
- Dedicated replay navigation remains available as `Continue to next key event`.
- Command effects are deterministic and displayed as diagnostics.
- Remaining replay projection can alter future displayed events while preserving visible history.
- Pure authoritative resume can preserve server-verified visible history and regenerate future events from command-adjusted tactics.
- Authoritative command adapter maps current UI manager commands to typed simulation commands.
- `POST /api/resume-match` exposes a deterministic authoritative resume preview for the current demo fixture.
- Web view-model helpers format authoritative resume score/signature/event-count diagnostics.
- A tested browser client posts visible replay history and manager commands to `/api/resume-match`.
- Match Lab can request server-authoritative resumed replay output and displays it in a distinct panel from client-side projection.
- Replay-session repository and API helpers can create in-memory demo match sessions, append command logs, synchronize visible events, and resume authoritatively from stored server state.
- Fastify exposes stored-session routes at `/api/replay-sessions`, `/api/replay-sessions/:sessionId`, `/api/replay-sessions/:sessionId/commands`, `/api/replay-sessions/:sessionId/visible-events`, and `/api/replay-sessions/:sessionId/resume`.
- Next app routes expose the same replay-session create/append/sync/resume contract for browser use.
- Match Lab now creates a replay session after simulation, appends manager commands to that session, syncs visible replay events, and requests authoritative resume by session ID.
- Replay-session creation now shares the simulation API input builder and stores the full `MatchInput`, preserving custom formations, tactical settings, movement/familiarity, and player assignments for session-owned resume.
- Replay-session repositories now export and hydrate schema-versioned storage records, preserving base input, results, visible events, commands, audit log, timestamps, and generated ID continuity.
- Replay-session repositories now store ownership metadata plus side-specific home/away command logs, while legacy home-only `managerCommands` remains a compatibility alias.
- Session-owned authoritative resume now applies home commands to the home team and away commands to the away team, preserving side isolation for future head-to-head play.
- Fastify and Next route boundaries now preserve away-side command appends and expose a public replay-session lobby summary with ownership, lobby state, command counts, visible event count, seed, and latest signature metadata.
- Match Lab layout sections and stat grouping are tested through a pure view-model contract.
- `MatchLab.tsx` now separates setup, team shape, assignments, match console, replay controls, manager commands, projection, diagnostics, and metadata.
- `app/globals.css` now applies an original dark, dense football-manager console visual foundation without copying CM0102 assets or exact screens.

## Latest Slice: P17C Session Ownership Server Route Parity and Lobby State Smoke

Files added/updated:

- `src/api/replaySessionEndpoint.ts`
- `src/api/server.ts`
- `app/api/replay-sessions/[sessionId]/route.ts`
- `tests/api/replaySessionEndpoint.test.ts`
- `tests/api/server.test.ts`
- `tests/api/replaySessionNextRoutes.test.ts`
- `scripts/run-mission-tests.ts`
- `docs/40-production-session-route-parity-lobby-state-contract.md`
- `docs/plans/2026-05-20-session-route-parity-lobby-state.md`
- `docs/README.md`

Behavior implemented:

- Added `getReplaySessionSummaryForApi` as a read-only API helper for replay-session lobby/session summaries.
- Added Fastify `GET /api/replay-sessions/:sessionId` summary route.
- Added Next app-route `GET /api/replay-sessions/[sessionId]` summary route.
- Summary responses expose only public metadata: `sessionId`, `seed`, `ownership`, `lobbyState`, `commandCounts`, `visibleEventCount`, and optional `latestAuthoritativeSignature`.
- Summary responses intentionally omit full `baseInput`, `initialResult`, full event arrays, command bodies, side command logs, and audit logs.
- Fastify route tests now prove `side: 'away'` command append reaches the away log and affects authoritative resume diagnostics.
- Fastify route tests now prove invalid command sides return `400` with `side must be home or away`.
- Next route smoke tests now prove route-level away command append and summary response shape.
- Lobby-state semantics are documented for future `setup` → `locked` → `in_match` → `complete` transitions, while current Match Lab sessions remain `in_match` by default.

## Latest Validation

For P17C, run and verify:

```bash
npx vitest run tests/api/server.test.ts -t 'replay session routes preserve away-side commands|replay session routes reject invalid command sides'
npx vitest run tests/api/replaySessionEndpoint.test.ts -t 'returns replay session ownership summary'
npx vitest run tests/api/replaySessionNextRoutes.test.ts
npm run test:missions
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Expected mission count after P17C: ALL 128 MISSIONS PASSED.

## Recommended Next Slice

Recommended next work: **P17D Lobby State Transition Commands**.

Why this is next:

Replay sessions now have side ownership, side-aware route parity, and a read-only lobby/session summary. The next small multiplayer foundation should add explicit server-owned lobby-state transition commands so a future lobby UI can move from setup to locked to in-match to complete without mutating repository internals or trusting client state.

Suggested goals:

1. Add API/helper tests for valid lobby-state transitions and invalid transition rejection.
2. Add repository method(s) to update lobby state with audit entries.
3. Expose a narrow route for state transitions without adding auth or lobby UI yet.
4. Keep existing Match Lab creation defaulting to `in_match` for compatibility.

## Important User Preferences

- Use TDD for new production behavior.
- Run tests individually with clear mission labels/status, then full suite.
- Keep documenting findings and decisions in `docs/` as work progresses.
- Commit locally when a slice is complete.
- Remote exists now; push only when explicitly asked or when continuing the current push-after-complete workflow is clear.
- Periodically do stabilization/fix passes after several feature-building slices.

## How To Resume In A New Chat

Start with:

```text
Continue work in /Users/christophersilva/Projects/personal/xcm0102. Read docs/30-project-handoff-status.md, docs/05-roadmap.md, docs/10-production-roadmap.md, and the latest production contract docs first. Then recommend and execute the next TDD slice. Keep docs updated, run mission tests plus full validation, and commit locally when complete.
```

Recommended first commands in the new chat:

```bash
git status --short --branch
git log --oneline -5
npm run test:missions
npm test
npx tsc --noEmit && npm run build
```

## Known Non-Blocking Follow-Ups

- Decide whether tactical-shift injected events may coexist with non-tactical source events in the same minute, or whether all source-event minutes should count as occupied insertion slots.
- Add more nuanced command effects over time, especially substitutions, fatigue relief, mentality, pressing, and defensive-line interactions.
- Persist match sessions, command logs, events, reports, and audit logs.
- Add home/away manager command ownership for multiplayer/head-to-head scenarios.
- Replace projection-layer future-event post-processing with authoritative command-aware future simulation in the browser UI once the UX is ready.
