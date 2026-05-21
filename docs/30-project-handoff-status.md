# Project Handoff Status — 2026-05-21

This document is the short-context handoff for starting a new chat on the XCM0102 project.

## Current Repository State

- Project path: `/Users/christophersilva/Projects/personal/xcm0102`
- Branch: `main`
- Remote: `origin git@github.com:xiris/xcm0102.git`
- Latest completed local work before the next lobby/multiplayer slice: P18A Lobby Setup View Model and Read-Only Status Panel.

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
- view a read-only replay-session lobby status panel with server-derived state, ownership, command counts, visible event count, and latest authoritative signature metadata

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
- Match Lab now renders a read-only replay-session lobby status panel from the summary route after session creation, manager-command sync, and authoritative resume.
- The lobby status panel shows server-derived lobby state, mode, side owners, command counts, visible event count, seed, and optional latest signature without adding mutating browser controls.
- Match Lab layout sections and stat grouping are tested through a pure view-model contract.
- `MatchLab.tsx` now separates setup, team shape, assignments, match console, replay controls, manager commands, projection, diagnostics, and metadata.
- `app/globals.css` now applies an original dark, dense football-manager console visual foundation without copying CM0102 assets or exact screens.

## Latest Slice: P18A Lobby Setup View Model and Read-Only Status Panel

Files added/updated:

- `src/web/replaySessionLobbyStatusViewModel.ts`
- `src/web/replaySessionClient.ts`
- `src/web/MatchLab.tsx`
- `src/web/matchLabLayoutViewModel.ts`
- `app/globals.css`
- `tests/web/replaySessionLobbyStatusViewModel.test.ts`
- `tests/web/replaySessionClient.test.ts`
- `tests/web/matchLabLayoutViewModel.test.ts`
- `scripts/run-mission-tests.ts`
- `docs/42-production-lobby-status-panel-contract.md`
- `docs/plans/2026-05-21-lobby-setup-status-panel.md`
- `docs/README.md`

Behavior implemented:

- Added a pure replay-session lobby status view model for server-derived summary display.
- Added a browser GET client for `/api/replay-sessions/:sessionId` with shared replay-session error handling.
- Match Lab now fetches session summary after replay-session creation and renders a read-only lobby status panel.
- Match Lab refreshes the summary after manager-command append and authoritative resume so command counts and latest signature remain server-derived.
- The panel displays lobby state, mode, home/away owner labels, command counts, visible event count, seed, and optional latest authoritative signature.
- The panel explicitly stays read-only; lobby transitions remain API/server-command-only until a future UX slice.
- Added original dense-console CSS for lobby-state pill and status rows.
- Mission runner now includes the new lobby status view-model and summary-client tests.

## Latest Validation

For P18A, run and verify:

```bash
npx vitest run tests/web/replaySessionLobbyStatusViewModel.test.ts
npx vitest run tests/web/replaySessionClient.test.ts -t 'gets read-only replay session summaries|throws readable session errors'
npx vitest run tests/web/matchLabLayoutViewModel.test.ts
npm run test:missions
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Browser smoke verified on `http://localhost:3000`:

- submitted the Match Lab form
- confirmed the read-only `Replay session lobby` panel appears
- confirmed it shows `IN MATCH`, `Single manager`, `Local manager`, `Unassigned`, command counts, visible events, and read-only transition copy
- confirmed browser console had no messages/errors after verification

Expected mission count after P18A: ALL 133 MISSIONS PASSED.

## Recommended Next Slice

Recommended next work: **P18B Side-Aware Lobby Readiness View Model**.

Why this is next:

The Match Lab now exposes read-only session summary state in the browser, but it still compresses side ownership into a compact generic panel. The next small UI-safe slice should make head-to-head readiness easier to understand without adding lobby mutations: a pure side-card view model that separates home and away manager/command/readiness facts and can later host lock/ready controls.

Suggested goals:

1. Add a pure side-aware lobby readiness view model for home/away owner labels, assignment state, command counts, and lobby-state-specific readiness copy.
2. Render two compact read-only side cards inside or beside the lobby status panel.
3. Keep Match Lab single-manager compatible by showing the home side as local and the away side as unassigned.
4. Do not add invite, lock, ready, or transition buttons yet; keep all mutation routes API-only until the side-card contract is stable.

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
