# Outcome-Affecting Manager Commands Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Give interactive replay commands a deterministic projected tactical effect, without full timeline regeneration yet.

**Architecture:** Add a pure command-effects projection module that derives tactical/fatigue/risk state from the command log. Keep the existing full-match result unchanged in P15A, but surface projected command effects in replay diagnostics so P15B can regenerate remaining events from the same projection.

**Tech Stack:** TypeScript, Vitest, React/Next.js client component.

---

## Scope

P15A includes:

- pure command effect projection from `ManagerCommand[]`
- deterministic effect state for pressing, mentality, defensive risk, fatigue relief, substitution intent, and formation review
- replay view-model formatting for projected effects
- browser display of effect diagnostics after command clicks

P15A does not include:

- regenerating future match events
- changing the final score
- manual bench/player substitution application
- API/session persistence

## Task 1: Command effect projection

**Objective:** Derive deterministic tactical effect state from the recorded manager command history.

**Files:**
- Create: `tests/simulation/commandEffects.test.ts`
- Create: `src/simulation/commandEffects.ts`

**Steps:**
1. Write failing tests for empty state, lowering tempo/pressing, changing mentality/pressing, defensive-line adjustment, substitution intent, and deterministic command signature.
2. Run the targeted test and verify RED.
3. Implement `projectCommandEffects(commands)` with minimal deterministic logic.
4. Run the targeted test and verify GREEN.

## Task 2: Replay view model effects

**Objective:** Format command effects for the interactive replay panel.

**Files:**
- Modify: `tests/web/interactiveReplayViewModel.test.ts`
- Modify: `src/web/interactiveReplayViewModel.ts`

**Steps:**
1. Write failing tests for effect diagnostic formatting.
2. Run the targeted test and verify RED.
3. Add an `effects` array to the view model.
4. Run the targeted test and verify GREEN.

## Task 3: Browser effect diagnostics

**Objective:** Show command effect diagnostics in the Match Lab UI.

**Files:**
- Modify: `src/web/MatchLab.tsx`

**Steps:**
1. Pass command history into the replay view model.
2. Render `Command effects` beside `Manager commands` when interactive replay is active.
3. Keep command clicks non-mutating for full-match events.
4. Verify in browser that a clicked manager command adds both command history and effect diagnostics.

## Task 4: Documentation and missions

**Objective:** Document the P15A contract and add named mission tests.

**Files:**
- Create: `docs/27-production-command-effects-contract.md`
- Modify: `docs/README.md`
- Modify: `scripts/run-mission-tests.ts`

**Steps:**
1. Document projected state, current limitation, and P15B transition.
2. Add missions for effect projection and web formatting.
3. Run `npm run test:missions`, `npm test`, `npx tsc --noEmit`, `npm run build`.
4. Browser-verify command effect rendering and console cleanliness.
5. Commit intended files only.
