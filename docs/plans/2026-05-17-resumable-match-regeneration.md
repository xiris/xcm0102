# Resumable Match Regeneration Implementation Plan

> **For Hermes:** Use test-driven-development task by task. Write failing tests before production code.

**Goal:** Make recorded interactive manager commands deterministically alter the projected remaining replay timeline without rewriting the full match engine yet.

## Scope

P15B introduces a pure projection layer between command history and future replay events.

It should:

- preserve all already-visible events up to the current pause minute
- project the remaining timeline from `currentMinute + commandHistory`
- make different command logs produce different projected remaining events
- keep same source events + same command log deterministic
- expose the projected timeline in the interactive replay view model and UI

## Out of scope

- Full match resimulation from tactics/team inputs
- Manual substitution player swaps
- API persistence for match sessions
- Multiplayer rooms
- Mutating the authoritative final `MatchResult`

## Production approach

Add a pure module:

```text
src/simulation/resumableReplayProjection.ts
```

Expected API:

```ts
projectRemainingReplay({ source, state, commands })
```

The projection should return:

- `events`: visible events plus projected future events
- `score`: projected final score from projected events
- `diagnostics`: command-sensitive projection notes
- `signature`: deterministic command/timeline signature

Initial deterministic rules:

- `Lower tempo/pressing` suppresses one future fatigue warning after the command minute.
- `Adjust defensive line` suppresses one future away chance/set-piece pressure event after the command minute.
- `Change mentality` can add a home tactical-shift projection event.
- `Change pressing` can add a home tactical-shift projection event.
- No commands should preserve the source event timeline exactly.

## Files likely to change

- `src/simulation/resumableReplayProjection.ts`
- `src/web/interactiveReplayViewModel.ts`
- `src/web/MatchLab.tsx`
- `tests/simulation/resumableReplayProjection.test.ts`
- `tests/web/interactiveReplayViewModel.test.ts`
- `scripts/run-mission-tests.ts`
- `docs/29-production-resumable-replay-projection-contract.md`
- `docs/README.md`

## TDD checkpoints

1. RED/GREEN: no commands preserve the original event timeline.
2. RED/GREEN: lower tempo suppresses one future fatigue warning.
3. RED/GREEN: defensive-line adjustment suppresses one future away pressure event.
4. RED/GREEN: mentality/pressing commands inject deterministic tactical-shift events.
5. RED/GREEN: view model exposes projected remaining replay diagnostics.

## Verification

- Targeted Vitest for new projection module and view model.
- `npm run test:missions`
- `npm test`
- `npx tsc --noEmit`
- `npm run build`
- Browser check: run match, start interactive replay, click a command, verify projected remaining replay appears and browser console is clean.

## Next phase

P15C can move from projected future events to authoritative resumable simulation sessions, likely by making `simulateMatch` consume a typed command log and regenerate remaining events from the pause point.
