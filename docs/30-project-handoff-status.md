# Project Handoff Status — 2026-05-18

This document is the short-context handoff for starting a new chat on the XCM0102 project.

## Current Repository State

- Project path: `/Users/christophersilva/Projects/personal/xcm0102`
- Branch: `main`
- Remote: none configured yet. The user prefers to create/configure the remote repository themselves later.
- Latest commit: `8cc4aa6 feat: project resumable match replay`
- Recent commits:
  - `8cc4aa6 feat: project resumable match replay`
  - `fc9a4a0 fix: stabilize interactive manager commands`
  - `e6f2ba9 feat: project manager command effects`
  - `585a68c feat: record interactive manager commands`
  - `ab772c3 feat: add interactive match replay`

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

### Interactive manager-command work

Completed and committed:

- `585a68c feat: record interactive manager commands`
- `e6f2ba9 feat: project manager command effects`
- `fc9a4a0 fix: stabilize interactive manager commands`
- `8cc4aa6 feat: project resumable match replay`

Current behavior:

- Manager commands can be recorded during interactive replay.
- Duplicate same-action/same-pause command records are suppressed.
- Distinct same-pause actions remain allowed.
- Plain `Continue` is hidden from manager action buttons.
- Dedicated replay navigation remains available as `Continue to next key event`.
- Command effects are deterministic and displayed as diagnostics.
- Remaining replay projection can alter future displayed events while preserving visible history.

## Latest Slice: P15B Resumable Match Replay Projection

Latest commit:

```text
8cc4aa6 feat: project resumable match replay
```

Files added/updated:

- `src/simulation/resumableReplayProjection.ts`
- `tests/simulation/resumableReplayProjection.test.ts`
- `src/web/interactiveReplayViewModel.ts`
- `src/web/MatchLab.tsx`
- `tests/web/interactiveReplayViewModel.test.ts`
- `scripts/run-mission-tests.ts`
- `docs/29-production-resumable-replay-projection-contract.md`
- `docs/plans/2026-05-17-resumable-match-regeneration.md`
- `docs/README.md`

Behavior implemented:

- No-command projection preserves `sourceEvents` exactly as provided.
- Visible events at or before `currentMinute` preserve exact source order even when commands project future changes.
- Suppression rules only target future events after both the command minute and the current interactive replay minute.
- Lower-tempo / reduced-pressing style commands can suppress future fatigue warnings.
- Defensive-line commands can suppress future away pressure events.
- Proactive commands such as `Change mentality` and `Change pressing` can inject deterministic `tactical_shift` events.
- Tactical-shift injection uses the first unused minute after both the replay minute and command minute, up to minute 89.
- Non-proactive commands do not consume tactical-shift insertion slots.
- Earlier proactive commands do not globally delay later proactive commands beyond the later command's own first available future minute.
- Tactical shifts are skipped only when no valid future minute remains.
- Browser UI displays `Projected remaining replay`, projected final score, projected event count, projected event snippets, and projection diagnostics.

Final independent review for P15B passed:

- no security concerns
- no blocking logic errors
- one non-blocking suggestion: consider a future regression test documenting whether tactical-shift injected events may coexist with non-tactical source events in the same minute, or whether source-event minutes should be treated as occupied insertion slots.

## Latest Validation

Before commit `8cc4aa6`, validation passed:

```bash
npx vitest run tests/simulation/resumableReplayProjection.test.ts
npm run test:missions
npm test
npx tsc --noEmit && npm run build
```

Results:

- Projection targeted tests: 10 passed.
- Mission tests: ALL 104 MISSIONS PASSED.
- Full suite: 24 test files passed, 113 tests passed.
- TypeScript/build: PASS.
- Browser verification: projected remaining replay, projected final score, tactical shift, and command signature appeared; browser console had zero messages/errors.

## Important User Preferences

- Use TDD for new production behavior.
- Run tests individually with clear mission labels/status, then full suite.
- Keep documenting findings and decisions in `docs/` as work progresses.
- Commit locally when a slice is complete.
- Do not create/configure/push remote unless explicitly asked; user will create the remote repository later.
- Periodically do stabilization/fix passes after several feature-building slices.

## How To Resume In A New Chat

Start with:

```text
Continue work in /Users/christophersilva/Projects/personal/xcm0102. Read docs/30-project-handoff-status.md, docs/05-roadmap.md, docs/10-production-roadmap.md, and docs/29-production-resumable-replay-projection-contract.md first. Then recommend and execute the next TDD slice. Keep docs updated, run mission tests plus full validation, and commit locally when complete. Do not configure a remote.
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

Recommended next work: **P15C Authoritative Resumable Match Engine Foundation**.

Why this is next:

P15B projects future replay events from command effects, but it is still a deterministic projection layer over an already-generated event list. The next major step is making mid-match commands feed into an authoritative resumable match-engine pathway, so future events are generated from updated tactical state instead of only post-processing an existing timeline.

Suggested goals:

1. Define a resumable simulation input/output contract.
2. Split match simulation into a deterministic phase/state representation that can pause and resume.
3. Preserve already-visible events exactly.
4. Recompute only future events from updated command-adjusted tactical state.
5. Keep seed determinism stable.
6. Keep UI behavior compatible with the current projected replay section.
7. Document limitations clearly; do not overbuild multiplayer persistence yet.

Suggested files to inspect first:

- `src/simulation/simulateMatch.ts`
- `src/simulation/domain.ts`
- `src/simulation/interactiveTimeline.ts`
- `src/simulation/managerCommands.ts`
- `src/simulation/commandEffects.ts`
- `src/simulation/resumableReplayProjection.ts`
- `src/web/interactiveReplayViewModel.ts`
- `src/web/MatchLab.tsx`
- `tests/simulation/resumableReplayProjection.test.ts`
- `scripts/run-mission-tests.ts`

Suggested plan doc:

- `docs/plans/2026-05-18-authoritative-resumable-match-engine.md`

Suggested contract doc:

- `docs/31-production-authoritative-resumable-match-engine-contract.md`

Suggested TDD sequence:

1. Add tests for preserving already-visible events during authoritative resume.
2. Add tests for identical resume inputs producing identical future events.
3. Add tests showing command-adjusted tactical state changes a future outcome or event distribution.
4. Implement minimal pure resume module that delegates to existing simulation helpers instead of duplicating logic.
5. Integrate with replay projection/view model only after pure module tests pass.
6. Add mission tests.
7. Update docs index.
8. Run targeted tests, mission tests, full suite, typecheck, build, browser verification.
9. Run independent staged-diff review.
10. Commit locally.

## Known Non-Blocking Follow-Ups

- Decide whether tactical-shift injected events may coexist with non-tactical source events in the same minute, or whether all source-event minutes should count as occupied insertion slots.
- Add more nuanced command effects over time, especially substitutions, fatigue relief, mentality, pressing, and defensive-line interactions.
- Replace projection-layer future-event post-processing with truly authoritative command-aware future simulation.
- Consider persistence/session storage for manager commands after the simulation loop is more mature.
- Later, after the user creates a remote repo, configure `origin` and push `main`.
