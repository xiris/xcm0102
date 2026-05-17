# Event Taxonomy and Commentary Packs Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Expand the match engine from generic chance/goal text into a CM0102-inspired event taxonomy with richer, varied commentary packs.

**Architecture:** Keep simulation deterministic and pure. Add taxonomy/template selection inside the simulation layer, expose structured event details through `MatchEvent`, and let the existing browser render descriptions without a UI rewrite.

**Tech Stack:** TypeScript, Vitest, Next.js, deterministic seeded RNG.

---

## Task 1: Add event taxonomy model tests

**Objective:** Define chance categories and structured event metadata before changing production code.

**Files:**
- Modify: `tests/simulation/chanceEngine.test.ts`
- Modify: `src/simulation/domain.ts`
- Modify: `src/simulation/chanceEngine.ts`

**Steps:**
1. Add a failing test that `resolveTeamChances` returns at least three event categories across a sample.
2. Expect categories such as `through_ball`, `counter_attack`, `cross`, `long_shot`, and `set_piece`.
3. Run the targeted Vitest test and confirm it fails.
4. Add `MatchEventCategory` and optional `category`/`outcome` metadata on `MatchEvent`.
5. Add category selection to `chanceEngine.ts`.
6. Re-run the targeted test and confirm it passes.

## Task 2: Add commentary pack tests

**Objective:** Make text generation intentionally varied, not accidental.

**Files:**
- Create: `src/simulation/commentaryPacks.ts`
- Create: `tests/simulation/commentaryPacks.test.ts`
- Modify: `src/simulation/chanceEngine.ts`

**Steps:**
1. Write failing tests for `describeChanceWithPack`.
2. Require a `classic_cm` pack.
3. Require at least 40 chance templates across category/outcome combinations.
4. Require deterministic same-seed output.
5. Require varied output over repeated chances.
6. Implement the pack and selector.
7. Re-run tests.

## Task 3: Integrate commentary packs into chance engine

**Objective:** Use the new pack from the chance engine while preserving deterministic replay.

**Files:**
- Modify: `src/simulation/chanceEngine.ts`
- Modify: `tests/simulation/chanceEngine.test.ts`

**Steps:**
1. Write failing tests that chance descriptions include category-specific language.
2. Include goal/save/block/miss coverage.
3. Replace inline templates in `chanceEngine.ts` with `commentaryPacks.ts`.
4. Re-run targeted tests.

## Task 4: Verify API/UI compatibility

**Objective:** Ensure richer events do not break existing result rendering.

**Files:**
- Modify: `tests/api/server.test.ts` if needed.
- Modify: `tests/web/matchResultViewModel.test.ts` if needed.

**Steps:**
1. Add/adjust API tests to assert events include `category` and `outcome` while preserving `description`.
2. Run API tests.
3. Confirm browser view model still formats timeline labels.
4. Run browser-related tests.

## Task 5: Documentation and mission runner

**Objective:** Preserve the project convention that findings and contracts live in `docs/`.

**Files:**
- Create: `docs/21-production-event-taxonomy-commentary-packs.md`
- Modify: `docs/README.md`
- Modify: `scripts/run-mission-tests.ts`

**Steps:**
1. Document taxonomy, commentary pack rules, determinism, and limitations.
2. Link the new document and this plan from `docs/README.md`.
3. Add mission tests for taxonomy, commentary pack size, deterministic text, category integration, and API event metadata.
4. Run `npm run test:missions`.
5. Run `npm test`.
6. Run `npx tsc --noEmit`.
7. Run `npm run build`.
8. Browser-check `http://localhost:3000` and verify varied categorized event text.
9. Commit all changes.
