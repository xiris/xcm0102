# Bench, Substitutions, Fatigue, and Injuries Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Add the first production layer for match management choices: historic benches, deterministic fatigue/risk events, and automatic substitution events.

**Architecture:** Keep simulation deterministic and server-authoritative. Historic squads gain bench players. A pure `playerConditionEngine` computes fatigue, injury/card risk, and automatic substitution recommendations, then `simulateMatch` injects events into the timeline.

**Tech Stack:** TypeScript, Vitest, Next.js App Router.

---

## Task 1: Historic bench data

**Objective:** Inter 2002 and Milan 2002 should expose squad players beyond the starting XI.

**Files:**
- Modify: `src/simulation/historicSquads.ts`
- Test: `tests/simulation/historicSquads.test.ts`

**Steps:**
1. Write tests asserting each historic team has at least 16 players and includes known bench names.
2. Run targeted tests and confirm failure.
3. Add era-inspired bench players with positions/attributes.
4. Re-run targeted tests.

## Task 2: Player condition engine

**Objective:** Compute deterministic player fatigue/risk profiles and substitution recommendations.

**Files:**
- Create: `src/simulation/playerConditionEngine.ts`
- Create: `tests/simulation/playerConditionEngine.test.ts`

**Steps:**
1. Test deterministic fatigue output for the same seed/input.
2. Test high pressing and low stamina increases fatigue.
3. Test injured/booked/tired players create human-readable risk events.
4. Test substitution recommendation picks an unused bench player with compatible position.
5. Implement the pure engine and re-run tests after each behavior.

## Task 3: Domain and simulation integration

**Objective:** Match events should include fatigue, injury, and substitution events.

**Files:**
- Modify: `src/simulation/domain.ts`
- Modify: `src/simulation/simulateMatch.ts`
- Test: `tests/simulation/simulateMatch.test.ts`
- Test: `tests/api/server.test.ts`

**Steps:**
1. Add failing simulation test for condition/substitution timeline events.
2. Add failing API test that events expose these types.
3. Add event types: `fatigue_warning`, `injury`, `substitution`.
4. Integrate condition events after chance chains and before full time.
5. Re-run targeted tests.

## Task 4: Documentation and missions

**Objective:** Capture the production contract and add mission-style coverage.

**Files:**
- Create: `docs/24-production-bench-substitution-condition-contract.md`
- Modify: `docs/README.md`
- Modify: `scripts/run-mission-tests.ts`

**Steps:**
1. Document squad/bench, condition, injury, and substitution contracts.
2. Link the contract from docs README.
3. Add missions for historic bench, condition determinism, fatigue pressure, substitution recommendation, simulation events, and API metadata.
4. Run mission tests, full suite, typecheck, build, browser verification.
