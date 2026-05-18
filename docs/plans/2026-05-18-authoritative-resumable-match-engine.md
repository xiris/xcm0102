# Authoritative Resumable Match Engine Foundation Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Add the first pure authoritative resume module that preserves visible match history while regenerating future events from command-adjusted simulation input.

**Architecture:** Keep this slice in `src/simulation/authoritativeResume.ts` so the browser projection layer remains stable. The module accepts an original `MatchInput`, current replay minute, already-visible events, and typed `MatchCommand[]`; it applies command values to cloned tactics, reruns the existing deterministic simulation, and combines preserved visible history with regenerated future events.

**Tech Stack:** TypeScript, Vitest, existing deterministic simulation helpers.

---

## Task 1: Contract tests for preserving visible history

**Files:**
- Create: `tests/simulation/authoritativeResume.test.ts`
- Create: `src/simulation/authoritativeResume.ts`

**Steps:**
1. Write a failing test that calls `resumeMatchAuthoritatively` with `visibleEvents` from an original simulation up to a pause minute.
2. Assert returned visible events equal the input visible events exactly.
3. Run `npx vitest run tests/simulation/authoritativeResume.test.ts -t "preserves visible history"` and confirm RED because the module does not exist.
4. Add the minimal module and type exports to pass.

## Task 2: Deterministic resume signature and future replay

**Files:**
- Modify: `tests/simulation/authoritativeResume.test.ts`
- Modify: `src/simulation/authoritativeResume.ts`

**Steps:**
1. Add a test proving identical resume inputs produce identical events, score, and signature.
2. Run the focused test and confirm RED.
3. Implement deterministic command signature and future event merge from a rerun simulation.
4. Run the focused test and confirm GREEN.

## Task 3: Command-adjusted tactical state affects regenerated future

**Files:**
- Modify: `tests/simulation/authoritativeResume.test.ts`
- Modify: `src/simulation/authoritativeResume.ts`

**Steps:**
1. Add a test with a home `change_pressing` command that changes regenerated future diagnostics/stats compared with a no-command resume.
2. Run the focused test and confirm RED.
3. Apply command values to cloned home/away tactics before simulation.
4. Run the focused test and confirm GREEN.

## Task 4: Export, mission tests, and documentation

**Files:**
- Modify: `src/index.ts`
- Modify: `scripts/run-mission-tests.ts`
- Create: `docs/31-production-authoritative-resumable-match-engine-contract.md`
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`

**Steps:**
1. Export the new module from `src/index.ts`.
2. Add mission-labelled tests for the new contract.
3. Document scope, inputs, outputs, determinism, command handling, and limitations.
4. Update handoff status with the new latest slice and validation.
5. Run targeted tests, mission tests, full suite, typecheck, and build.
6. Commit locally without configuring a remote.
