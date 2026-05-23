# Project Handoff Status — 2026-05-21

This document is the short-context handoff for starting a new chat on the XCM0102 project.

## Current Repository State

- Project path: `/Users/christophersilva/Projects/personal/xcm0102`
- Branch: `main`
- Remote: `origin git@github.com:xiris/xcm0102.git`
- Latest completed local work before the next lobby/multiplayer slice: P18H Read-Only Lobby Fixture Gallery.

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
- view read-only home/away lobby readiness cards that separate manager assignment, command counts, and state-specific readiness copy for future head-to-head lobbies

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
- The lobby status panel now includes read-only home/away side readiness cards with manager assignment, command counts, and lobby-state-specific readiness copy.
- Replay-session creation can now accept tested server/API ownership metadata for setup lobby smoke paths while omitted ownership preserves the current Match Lab `in_match` single-manager flow.
- API helper, Fastify routes, and Next route wrappers now prove head-to-head `setup -> locked -> in_match` lobby readiness without adding browser mutation controls.
- The browser replay-session client now has a tested `PATCH /api/replay-sessions/:sessionId/lobby-state` helper for future lobby controls while Match Lab remains read-only.
- The replay-session lobby status view model now includes pure future-action availability policy for setup lock, kickoff, completion, disabled manager-assignment copy, and single-manager compatibility.
- Match Lab now renders that future-action availability policy as a read-only lobby action preview, including available/disabled state and target lobby-state copy without mutating buttons.
- Browser-facing route-shaped lobby summary fixtures now cover setup, locked, in-match, and complete preview states for future smoke/story coverage without wiring mutation controls.
- A read-only `/lobby-fixtures` gallery now renders every route-shaped lobby action-preview state through the same lobby status card contract for browser smoke before mutation controls are introduced.
- Match Lab layout sections and stat grouping are tested through a pure view-model contract.
- `MatchLab.tsx` now separates setup, team shape, assignments, match console, replay controls, manager commands, projection, diagnostics, and metadata.
- `app/globals.css` now applies an original dark, dense football-manager console visual foundation without copying CM0102 assets or exact screens.

## Latest Slice: P18H Read-Only Lobby Fixture Gallery

Files added/updated:

- `app/lobby-fixtures/page.tsx`
- `src/web/LobbyFixtureGallery.tsx`
- `tests/web/lobbyFixtureGallery.test.ts`
- `app/globals.css`
- `scripts/run-mission-tests.ts`
- `docs/49-production-read-only-lobby-fixture-gallery-contract.md`
- `docs/plans/2026-05-23-read-only-lobby-fixture-gallery.md`
- `docs/README.md`
- `docs/30-project-handoff-status.md`

Behavior implemented:

- Added a static read-only `/lobby-fixtures` browser route for lobby action-preview fixture smoke coverage.
- Added `LobbyFixtureGallery`, which renders setup, locked, in-match, and complete P18G route-shaped summaries through `createReplaySessionLobbyStatusViewModel` and the existing `LobbyStatusCard`.
- Tests prove the gallery and route render `Lock setup`, `Kick off match`, `Complete match`, and complete/no-transition copy.
- Tests prove the gallery/route render no mutating `<button>` controls.
- Mission runner now includes named P18H read-only fixture-gallery coverage.
- Browser-facing fixture smoke remains read-only; `transitionReplaySessionLobbyStateFromWeb` is not imported or called by the gallery.

## Latest Validation

For P18H, run and verify:

```bash
npx vitest run tests/web/lobbyFixtureGallery.test.ts -t 'renders every read-only lobby fixture state'
npx vitest run tests/web/lobbyFixtureGallery.test.ts
npm run test:missions
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Observed validation:

- Focused mission 01: read-only lobby fixture gallery passed.
- Focused mission 02: fixture gallery route passed.
- `npm run test:missions`: ALL 140 MISSIONS PASSED.
- `npm test`: 36 test files passed, 175 tests passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed; `/lobby-fixtures` prerendered as a static route.
- `git diff --check`: passed.

Browser smoke verified on `http://localhost:3000/lobby-fixtures`:

- confirmed the `Lobby fixture gallery` route renders
- confirmed setup, locked, in-match, and complete lobby states are visible
- confirmed `Lock setup`, `Kick off match`, `Complete match`, and no-transition preview copy are visible
- confirmed no invite, ready, lock setup, kickoff, join, complete match, rematch, or other mutating lobby controls appear as buttons
- confirmed browser console had no messages/errors after verification

Expected mission count after P18H: ALL 140 MISSIONS PASSED.

## Recommended Next Slice

Recommended next work: **P18I Stabilization Before Lobby Mutations**.

Why this is next:

P18H completes read-only route-fixture browser coverage for setup, locked, in-match, and complete lobby action-preview states. Before exposing any mutation buttons, do a focused stabilization pass across lobby route contracts, browser client error handling, fixture/gallery no-mutation guarantees, and documentation consistency so the future mutation-control slice starts from a clean base.

Suggested goals:

1. Add guard tests that prevent `LobbyFixtureGallery` and `MatchLab` from importing or calling the lobby transition helper until the explicit mutation-control slice.
2. Re-run and tighten route/client rejection-copy tests for invalid transitions and completed-session command guards.
3. Clean up any duplicated lobby fixture/test setup discovered during the read-only slices.
4. Document the exact acceptance gate required before visible mutation controls may be added.

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
