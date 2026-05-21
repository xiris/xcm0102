# Project Handoff Status — 2026-05-21

This document is the short-context handoff for starting a new chat on the XCM0102 project.

## Current Repository State

- Project path: `/Users/christophersilva/Projects/personal/xcm0102`
- Branch: `main`
- Remote: `origin git@github.com:xiris/xcm0102.git`
- Latest completed local work before the next lobby/multiplayer slice: P17D Lobby State Transition Commands.

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
- advance replay-session lobby state through server-owned transition commands and prevent late manager commands after completion

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
- Replay sessions now support server-owned lobby-state transitions (`setup` → `locked` → `in_match` → `complete`) with audit entries and completed-session command guards.
- Match Lab layout sections and stat grouping are tested through a pure view-model contract.
- `MatchLab.tsx` now separates setup, team shape, assignments, match console, replay controls, manager commands, projection, diagnostics, and metadata.
- `app/globals.css` now applies an original dark, dense football-manager console visual foundation without copying CM0102 assets or exact screens.

## Latest Slice: P17D Lobby State Transition Commands

Files added/updated:

- `src/api/replaySessionRepository.ts`
- `src/api/replaySessionEndpoint.ts`
- `src/api/server.ts`
- `app/api/replay-sessions/[sessionId]/lobby-state/route.ts`
- `tests/api/replaySessionRepository.test.ts`
- `tests/api/replaySessionEndpoint.test.ts`
- `tests/api/server.test.ts`
- `tests/api/replaySessionNextRoutes.test.ts`
- `scripts/run-mission-tests.ts`
- `docs/41-production-lobby-state-transition-contract.md`
- `docs/plans/2026-05-21-lobby-state-transition-commands.md`
- `docs/README.md`

Behavior implemented:

- Added repository-owned lobby-state transitions for replay sessions.
- Valid transition path is `setup` → `locked` → `in_match` → `complete`.
- Current Match Lab sessions still default to `in_match` for compatibility and may transition to `complete`.
- Invalid skipped/backward/repeated transitions return readable `Invalid replay session lobby transition: <from> -> <to>` errors.
- Successful transitions update `ownership.lobbyState`, `updatedAt`, and append `lobby_state_transitioned` audit entries with `fromLobbyState` and `toLobbyState`.
- Storage export/hydration preserves transitioned lobby state and transition audit entries.
- Completed replay sessions reject new manager commands with `Replay session is complete and cannot accept manager commands`.
- Added shared `transitionReplaySessionLobbyStateForApi` helper with parse validation and not-found/invalid-transition responses.
- Added Fastify `PATCH /api/replay-sessions/:sessionId/lobby-state` route.
- Added Next app-route `PATCH /api/replay-sessions/[sessionId]/lobby-state` route.
- Added route tests proving transition success and late-command rejection.

## Latest Validation

For P17D, run and verify:

```bash
npx vitest run tests/api/replaySessionRepository.test.ts -t 'transitions lobby state|rejects invalid lobby transitions|rejects manager commands after completion'
npx vitest run tests/api/replaySessionEndpoint.test.ts -t 'transitions replay session lobby state|rejects invalid replay session lobby state requests'
npx vitest run tests/api/server.test.ts -t 'replay session lobby-state route completes sessions'
npx vitest run tests/api/replaySessionNextRoutes.test.ts -t 'transitions replay session lobby state'
npm run test:missions
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Expected mission count after P17D: ALL 131 MISSIONS PASSED.

## Recommended Next Slice

Recommended next work: **P18A Lobby Setup View Model and Read-Only Status Panel**.

Why this is next:

Replay sessions now have ownership, side-specific command logs, summary routes, and server-owned lobby transitions. The next small UI-safe slice should surface this lobby/session state in a read-only browser panel before adding manager invites, auth, sockets, or interactive lobby controls.

Suggested goals:

1. Add a pure lobby summary view model for session ownership, state, command counts, and completion status.
2. Render a compact read-only status panel in Match Lab after replay-session creation.
3. Keep the panel original and aligned with the modern football-manager console direction.
4. Do not add mutating lobby controls yet; keep transition routes API-only until UX is designed.

## Important User Preferences

- Use TDD for new production behavior.
- Run tests individually with clear mission labels/status, then full suite.
- Keep documenting findings and decisions in `docs/` as work progresses.
- Commit locally when a slice is complete.
- Remote exists; do not push or change remote configuration unless explicitly asked.
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
