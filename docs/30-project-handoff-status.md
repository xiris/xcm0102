# Project Handoff Status — 2026-05-18

This document is the short-context handoff for starting a new chat on the XCM0102 project.

## Current Repository State

- Project path: `/Users/christophersilva/Projects/personal/xcm0102`
- Branch: `main`
- Remote: `origin git@github.com:xiris/xcm0102.git`
- Latest completed local/pushed work before the next UI slice: P15D Authoritative Resume API/View-Model Adapter.

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

### Interactive manager-command and resume work

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

## Latest Slice: P15D Authoritative Resume API/View-Model Adapter

Files added/updated:

- `src/simulation/authoritativeCommandAdapter.ts`
- `tests/simulation/authoritativeCommandAdapter.test.ts`
- `src/api/authoritativeResumeEndpoint.ts`
- `src/api/server.ts`
- `tests/api/server.test.ts`
- `src/web/interactiveReplayViewModel.ts`
- `tests/web/interactiveReplayViewModel.test.ts`
- `scripts/run-mission-tests.ts`
- `docs/32-production-authoritative-resume-api-contract.md`
- `docs/31-production-authoritative-resumable-match-engine-contract.md`
- `docs/plans/2026-05-18-authoritative-resume-api-adapter.md`
- `docs/README.md`

Behavior implemented:

- `Change mentality` maps to authoritative `change_mentality: attacking`.
- `Change pressing` maps to `change_pressing: high`.
- `Lower tempo/pressing` maps to `change_pressing: low`.
- `Adjust defensive line` maps to `change_transition_style: hold_shape`.
- `Reduce pressing or change mentality` emits low pressing plus defensive mentality.
- `Continue`, `Review formation`, and `Review match report` are ignored as UI-only actions.
- `/api/resume-match` rejects malformed requests and forged visible histories.
- Identical authoritative resume API requests return identical responses/signatures.
- Web formatting labels authoritative output as server-owned with final score, signature, and event count.

## Latest Validation

For P15D, run and verify:

```bash
npx vitest run tests/simulation/authoritativeCommandAdapter.test.ts tests/api/server.test.ts tests/web/interactiveReplayViewModel.test.ts
npm run test:missions
npm test
npx tsc --noEmit
npm run build
```

Expected mission count after P15D: ALL 116 MISSIONS PASSED.

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

Recommended next work: **P16A Match Lab UI Modernization Foundation**.

Why this is next:

The product loop now has enough match/replay/resume behavior, but the browser interface is still raw/prototype-like. The next slice should improve perceived product quality and usability before deeper persistence or multiplayer work.

Suggested goals:

1. Define a UI direction doc for a modernized CM01/02-inspired interface without copying protected assets or exact screens.
2. Add pure view-model/layout tests for section labels, match-console hierarchy, stat/table grouping, and replay/resume separation.
3. Refactor `MatchLab.tsx` styling into clearer panels: setup, teams/tactics, match console, replay controls, diagnostics.
4. Improve typography, spacing, table density, contrast, and status chips.
5. Keep all existing behavior and tests intact.

Suggested docs:

- `docs/33-match-lab-ui-modernization-contract.md`
- `docs/plans/2026-05-18-match-lab-ui-modernization.md`

Suggested TDD sequence:

1. Add tests for UI copy/view-model groupings where possible before changing JSX.
2. Add CSS/class structure incrementally.
3. Run browser verification after build to catch layout or console issues.
4. Add mission tests for any new pure formatting/view-model behavior.
5. Run full validation and commit.

## Known Non-Blocking Follow-Ups

- Decide whether tactical-shift injected events may coexist with non-tactical source events in the same minute, or whether all source-event minutes should count as occupied insertion slots.
- Add more nuanced command effects over time, especially substitutions, fatigue relief, mentality, pressing, and defensive-line interactions.
- Persist match sessions, command logs, events, reports, and audit logs.
- Add home/away manager command ownership for multiplayer/head-to-head scenarios.
- Replace projection-layer future-event post-processing with authoritative command-aware future simulation in the browser UI once the UX is ready.
