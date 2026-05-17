# Chance Quality and Commentary Engine Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Replace the robotic floor-based score formula with deterministic per-chance resolution driven by individual player attributes and varied CM0102-style commentary text.

**Architecture:** Add a small chance engine under `src/simulation/chanceEngine.ts`, keep `simulateMatch.ts` responsible for team evaluation and event sequencing, and expose richer `MatchEvent` metadata through existing API/web paths. The engine must stay deterministic for replay: same seed/input, same chances, outcomes, and commentary.

**Tech Stack:** TypeScript, Vitest, existing seeded RNG, existing domain types.

---

## Acceptance Criteria

- Scores are no longer produced by `floor(shotsOnTarget * multiplier)`.
- Individual players are selected as creators, shooters, defenders, and goalkeepers.
- Finishing, passing, decisions, positioning, anticipation, tackling, pace, and goalkeeper positioning influence chance quality/outcome.
- Match events include varied descriptions for chance, goal, save, block, and miss outcomes.
- Same seed/input remains deterministic.
- Tests run as individual missions and aggregate suite.
- New behavior documented in `docs/20-production-chance-quality-commentary-contract.md` and linked from `docs/README.md`.

## Task 1: Add chance engine tests

**Files:**
- Create: `tests/simulation/chanceEngine.test.ts`
- Create: `src/simulation/chanceEngine.ts`

Write tests first for:
- deterministic chance generation
- elite finisher creating higher total xG/goals than poor finisher across same seed sample
- event descriptions using multiple text templates

## Task 2: Implement minimal chance engine

**Files:**
- Modify: `src/simulation/chanceEngine.ts`

Implement:
- `resolveTeamChances(options)`
- weighted creator/shooter/defender selection
- per-shot on-target and goal/save/block/miss resolution
- deterministic commentary template selection

## Task 3: Integrate with simulateMatch

**Files:**
- Modify: `src/simulation/simulateMatch.ts`
- Modify: `src/simulation/domain.ts`
- Test: `tests/simulation/simulateMatch.test.ts`

Add tests that:
- scores vary across seeds under default browser tactics
- goal/chance event text names actual players
- events have outcome variety instead of only generic sustained pressure text

## Task 4: Keep API and web compatible

**Files:**
- Modify only if required: `src/api/simulationEndpoint.ts`, `src/web/matchResultViewModel.ts`
- Test: `tests/api/server.test.ts`, `tests/web/matchResultViewModel.test.ts`

Ensure existing API shape still works and richer events pass through.

## Task 5: Docs and missions

**Files:**
- Create: `docs/20-production-chance-quality-commentary-contract.md`
- Modify: `docs/README.md`
- Modify: `scripts/run-mission-tests.ts`

Add missions 51+ for chance determinism, attribute influence, commentary variation, and simulation score variety.

## Verification

Run:

```bash
npm run test:missions
npm test
npx tsc --noEmit
npm run build
```

Browser verify:

- open `http://localhost:3000`
- run multiple seeds
- confirm scores are not always 1-0
- confirm event text mentions players and varied outcomes
- confirm browser console has no JS errors
