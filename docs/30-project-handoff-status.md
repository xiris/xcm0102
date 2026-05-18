# Project Handoff Status — 2026-05-18

This document is the short-context handoff for starting a new chat on the XCM0102 project.

## Current Repository State

- Project path: `/Users/christophersilva/Projects/personal/xcm0102`
- Branch: `main`
- Remote: `origin git@github.com:xiris/xcm0102.git`
- Latest completed local/pushed work before the next persistence/authoritative UI slice: P16A Match Lab UI Modernization Foundation.

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
- Match Lab layout sections and stat grouping are tested through a pure view-model contract.
- `MatchLab.tsx` now separates setup, team shape, assignments, match console, replay controls, manager commands, projection, diagnostics, and metadata.
- `app/globals.css` now applies an original dark, dense football-manager console visual foundation without copying CM0102 assets or exact screens.

## Latest Slice: P16A Match Lab UI Modernization Foundation

Files added/updated:

- `src/web/matchLabLayoutViewModel.ts`
- `tests/web/matchLabLayoutViewModel.test.ts`
- `src/web/MatchLab.tsx`
- `app/globals.css`
- `scripts/run-mission-tests.ts`
- `docs/33-match-lab-ui-modernization-contract.md`
- `docs/plans/2026-05-18-match-lab-ui-modernization.md`
- `docs/README.md`

Behavior implemented:

- Match Lab now has a tested semantic layout contract for setup, team shape, assignments, match console, replay controls, manager commands, projection, diagnostics, and replay metadata.
- Match stat rows are grouped into Summary, Attacking, and Tactical load tables.
- The React screen uses the layout contract for stable section labels and clearer projected/diagnostic/metadata separation.
- Global CSS now applies an original dark, dense football-manager console visual foundation with compact tables, subtle borders, status accents, and responsive panels.
- Existing simulation, replay, command, projection, and authoritative resume behavior remains intact.

## Latest Validation

For P16A, run and verify:

```bash
npx vitest run tests/web/matchLabLayoutViewModel.test.ts
npm run test:missions
npm test
npx tsc --noEmit
npm run build
```

Expected mission count after P16A: ALL 117 MISSIONS PASSED.

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

Recommended next work: **P16B Authoritative Resume UI Integration**.

Why this is next:

The Match Lab now has a clearer console structure, but the browser still displays the P15B projected remaining replay path rather than actively submitting visible history and commands to `/api/resume-match`. The next slice should put the server-authoritative resume preview into the redesigned replay console.

Suggested goals:

1. Add a tested web client helper for `POST /api/resume-match`.
2. Add pure UI/view-model tests for authoritative resume status, errors, signature, event count, and final score display.
3. Wire a replay-console button to request authoritative resume preview from visible events and recorded manager commands.
4. Display projected replay and authoritative replay as distinct panels so client projection is never confused with server-owned output.
5. Keep all existing replay/projection behavior and tests intact.

Suggested docs:

- `docs/34-authoritative-resume-ui-contract.md`
- `docs/plans/2026-05-18-authoritative-resume-ui-integration.md`

Suggested TDD sequence:

1. Add web client tests for request shape and API error handling.
2. Add view-model tests for authoritative resume panel formatting.
3. Wire React state/events after pure tests are green.
4. Add mission tests for the new client/view-model behavior.
5. Run full validation and commit.

## Known Non-Blocking Follow-Ups

- Decide whether tactical-shift injected events may coexist with non-tactical source events in the same minute, or whether all source-event minutes should count as occupied insertion slots.
- Add more nuanced command effects over time, especially substitutions, fatigue relief, mentality, pressing, and defensive-line interactions.
- Persist match sessions, command logs, events, reports, and audit logs.
- Add home/away manager command ownership for multiplayer/head-to-head scenarios.
- Replace projection-layer future-event post-processing with authoritative command-aware future simulation in the browser UI once the UX is ready.
