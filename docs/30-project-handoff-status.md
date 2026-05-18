# Project Handoff Status — 2026-05-18

This document is the short-context handoff for starting a new chat on the XCM0102 project.

## Current Repository State

- Project path: `/Users/christophersilva/Projects/personal/xcm0102`
- Branch: `main`
- Remote: `origin git@github.com:xiris/xcm0102.git`
- Latest completed local work before the next browser-session slice: P16C Replay Session Persistence Foundation.

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
- Replay-session repository and API helpers can create in-memory demo match sessions, append command logs, and resume authoritatively from stored server state.
- Fastify exposes stored-session routes at `/api/replay-sessions`, `/api/replay-sessions/:sessionId/commands`, and `/api/replay-sessions/:sessionId/resume`.
- Match Lab layout sections and stat grouping are tested through a pure view-model contract.
- `MatchLab.tsx` now separates setup, team shape, assignments, match console, replay controls, manager commands, projection, diagnostics, and metadata.
- `app/globals.css` now applies an original dark, dense football-manager console visual foundation without copying CM0102 assets or exact screens.

## Latest Slice: P16C Replay Session Persistence Foundation

Files added/updated:

- `src/api/replaySessionRepository.ts`
- `tests/api/replaySessionRepository.test.ts`
- `src/api/replaySessionEndpoint.ts`
- `tests/api/replaySessionEndpoint.test.ts`
- `src/api/server.ts`
- `tests/api/server.test.ts`
- `scripts/run-mission-tests.ts`
- `docs/35-production-replay-session-persistence-contract.md`
- `docs/plans/2026-05-18-replay-session-persistence-foundation.md`
- `docs/README.md`

Behavior implemented:

- Added a replaceable `ReplaySessionRepository` interface with an in-memory implementation for current demo sessions.
- Stored replay sessions include seed, initial match result, visible events, manager commands, latest authoritative signature, timestamps, and audit entries.
- Added API helpers to create a replay session, append manager commands, and run authoritative resume from stored server-side visible history/commands.
- Added Fastify routes for stored sessions without removing the existing `/api/resume-match` compatibility path.
- Stored authoritative resume records latest signature and event-count audit metadata.

## Latest Validation

For P16C, run and verify:

```bash
npx vitest run tests/api/replaySessionRepository.test.ts
npx vitest run tests/api/replaySessionEndpoint.test.ts
npx vitest run tests/api/server.test.ts -t 'replay session endpoints'
npm run test:missions
npm test
npx tsc --noEmit
npm run build
```

Expected mission count after P16C: ALL 122 MISSIONS PASSED.

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

Recommended next work: **P16D Browser Session ID Resume Integration**.

Why this is next:

The API can now create server-owned replay sessions and run authoritative resume from stored visible history/commands, but Match Lab still uses the legacy browser-payload `/api/resume-match` path. The next slice should make the browser create/hold a replay session ID after running a match, append manager commands to that session, and request authoritative resume through the session route.

Suggested goals:

1. Add a tested browser client for replay-session creation, command append, and session-owned resume.
2. Wire Match Lab to create a replay session after a successful simulation.
3. Append manager commands to the stored session before requesting authoritative resume.
4. Display session ID/audit metadata in the replay metadata panel.
5. Keep legacy `/api/resume-match` tests passing during the transition.

Suggested docs:

- `docs/36-browser-replay-session-ui-contract.md`
- `docs/plans/2026-05-18-browser-replay-session-ui-integration.md`

Suggested TDD sequence:

1. Add web client tests for session create/append/resume request shapes and API errors.
2. Add pure UI state tests or helper tests for session status/reset rules.
3. Wire Match Lab state/events after pure tests are green.
4. Add mission tests and update handoff docs.
5. Run full validation and commit locally.

## Known Non-Blocking Follow-Ups

- Decide whether tactical-shift injected events may coexist with non-tactical source events in the same minute, or whether all source-event minutes should count as occupied insertion slots.
- Add more nuanced command effects over time, especially substitutions, fatigue relief, mentality, pressing, and defensive-line interactions.
- Persist match sessions, command logs, events, reports, and audit logs.
- Add home/away manager command ownership for multiplayer/head-to-head scenarios.
- Replace projection-layer future-event post-processing with authoritative command-aware future simulation in the browser UI once the UX is ready.
