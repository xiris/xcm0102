# Project Handoff Status — 2026-05-18

This document is the short-context handoff for starting a new chat on the XCM0102 project.

## Current Repository State

- Project path: `/Users/christophersilva/Projects/personal/xcm0102`
- Branch: `main`
- Remote: `origin git@github.com:xiris/xcm0102.git`
- Latest completed local work before the next persistence/multiplayer slice: P16E Stabilization and Custom-Tactic Session Parity.

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
- Fastify exposes stored-session routes at `/api/replay-sessions`, `/api/replay-sessions/:sessionId/commands`, `/api/replay-sessions/:sessionId/visible-events`, and `/api/replay-sessions/:sessionId/resume`.
- Next app routes expose the same replay-session create/append/sync/resume contract for browser use.
- Match Lab now creates a replay session after simulation, appends manager commands to that session, syncs visible replay events, and requests authoritative resume by session ID.
- Replay-session creation now shares the simulation API input builder and stores the full `MatchInput`, preserving custom formations, tactical settings, movement/familiarity, and player assignments for session-owned resume.
- Match Lab layout sections and stat grouping are tested through a pure view-model contract.
- `MatchLab.tsx` now separates setup, team shape, assignments, match console, replay controls, manager commands, projection, diagnostics, and metadata.
- `app/globals.css` now applies an original dark, dense football-manager console visual foundation without copying CM0102 assets or exact screens.

## Latest Slice: P16E Stabilization and Custom-Tactic Session Parity

Files added/updated:

- `src/api/simulationEndpoint.ts`
- `src/api/replaySessionRepository.ts`
- `tests/api/replaySessionRepository.test.ts`
- `src/api/replaySessionEndpoint.ts`
- `tests/api/replaySessionEndpoint.test.ts`
- `src/web/replaySessionClient.ts`
- `tests/web/replaySessionClient.test.ts`
- `src/web/MatchLab.tsx`
- `scripts/run-mission-tests.ts`
- `docs/37-production-replay-session-tactic-parity-contract.md`
- `docs/plans/2026-05-18-replay-session-tactic-parity.md`
- `docs/README.md`

Behavior implemented:

- Extracted a shared simulation API `MatchInput` builder so `/api/simulate-match` and replay-session creation use identical parsing/default/team/tactic construction.
- Replay sessions now store the authoritative base `MatchInput` alongside seed, initial result, visible events, commands, audit log, and latest signature.
- Session-owned authoritative resume now uses `session.baseInput`, preserving custom Match Lab formations, mentalities, pressing, transitions, familiarity, movement, and player assignments.
- Browser replay-session creation now posts the full simulation payload, and Match Lab builds that payload once for both simulation and session creation.
- The duplicate mission 124 route coverage was replaced with a custom-tactic parity mission.

## Latest Validation

For P16E, run and verify:

```bash
npx vitest run tests/api/replaySessionEndpoint.test.ts -t 'preserves custom tactical payloads'
npx vitest run tests/web/replaySessionClient.test.ts -t 'creates appends synchronizes'
npx vitest run tests/api/replaySessionRepository.test.ts
npm run test:missions
npm test
npx tsc --noEmit
npm run build
```

Expected mission count after P16E: ALL 124 MISSIONS PASSED.

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

## Recommended Next Slice

Recommended next work: **P17A Durable Match Persistence Design and Repository Seam**.

Why this is next:

Replay sessions now preserve browser tactics and command logs in memory, which completes the server-authoritative demo-session loop. The next production risk is durable reconstruction: matches, session base inputs, visible events, commands, reports, and audit entries need a storage-shaped repository contract before multiplayer lobbies or career save/load work can be trusted.

Suggested goals:

1. Add a storage-oriented repository contract for match/replay-session records that can later be backed by PostgreSQL/Drizzle/Prisma.
2. Define stable serializable records for base match input, initial result, visible events, manager commands, latest authoritative output, and audit log.
3. Keep the current in-memory implementation but shape it like durable storage boundaries.
4. Add tests proving a session can be serialized/deserialized and resumed without losing tactic parity.
5. Document persistence boundaries and migration/versioning notes.

Suggested docs:

- `docs/38-production-durable-replay-session-persistence-contract.md`
- `docs/plans/2026-05-18-durable-replay-session-persistence.md`

Suggested TDD sequence:

1. Write RED repository tests for export/import or storage-record round trip.
2. Add API/helper tests proving resume works after repository rehydration.
3. Implement durable-shaped records in the in-memory repository.
4. Update docs, mission runner, full validation, browser check, and local commit.

## Known Non-Blocking Follow-Ups

- Decide whether tactical-shift injected events may coexist with non-tactical source events in the same minute, or whether all source-event minutes should count as occupied insertion slots.
- Add more nuanced command effects over time, especially substitutions, fatigue relief, mentality, pressing, and defensive-line interactions.
- Persist match sessions, command logs, events, reports, and audit logs.
- Add home/away manager command ownership for multiplayer/head-to-head scenarios.
- Replace projection-layer future-event post-processing with authoritative command-aware future simulation in the browser UI once the UX is ready.
