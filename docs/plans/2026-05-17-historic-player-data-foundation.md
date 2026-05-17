# Historic Player Data Foundation Implementation Plan

> **For Hermes:** Use test-driven-development skill to implement this plan task-by-task.

**Goal:** Make Internazionale 2002 and Milan 2002 shared fixture squads the canonical sample data for browser assignment and server simulation.

**Architecture:** Add a shared simulation fixture module with stable player ids, names, positions, and era-inspired 1-20 attributes. Browser assignment state and API/server sample teams must consume the same module instead of duplicating names. Keep payload ids unchanged.

**Tech Stack:** TypeScript, Vitest, Next.js client component, existing simulation/domain model.

---

## Task 1: Shared historic squad fixtures

**Objective:** Create a canonical fixture source for Inter/Milan 2002 players.

**Files:**
- Create: `src/simulation/historicSquads.ts`
- Create: `tests/simulation/historicSquads.test.ts`

**Steps:**
1. Write failing tests for `createHistoricTeam('home')`, `createHistoricTeam('away')`, and `getHistoricSquadSummary()`.
2. Verify RED with `npx vitest run tests/simulation/historicSquads.test.ts`.
3. Implement fixed first-XI style squads with stable ids and player attributes.
4. Verify GREEN with the same command.

## Task 2: Replace browser duplicate squad definitions

**Objective:** Make assignment state consume the shared fixture module.

**Files:**
- Modify: `src/web/assignmentState.ts`
- Test: `tests/web/assignmentState.test.ts`

**Steps:**
1. Add/adjust a test asserting browser sample attributes for Vieri and Pirlo are not generic all-12 values.
2. Verify RED before changing browser code.
3. Update `createSamplePlayers()` to call `createHistoricTeam()`.
4. Verify GREEN.

## Task 3: Wire API/server simulation to historic teams

**Objective:** The API should simulate with historic player names and attributes instead of generated `Home XI`/`Away XI` generic players.

**Files:**
- Modify: `src/api/simulationEndpoint.ts`
- Test: `tests/api/server.test.ts`

**Steps:**
1. Add failing API test asserting `/api/simulate-match` response includes `teams.home.name === 'Internazionale 2002'` and historic player names/attributes.
2. Verify RED.
3. Update endpoint to call `createHistoricTeam('home')` and `createHistoricTeam('away')`.
4. Add `teams` metadata to response body.
5. Verify GREEN.

## Task 4: Add player detail view model/UI

**Objective:** Surface player attributes in the Match Lab so real data is visible.

**Files:**
- Modify: `src/web/MatchLab.tsx`
- Modify: `app/globals.css`
- Test existing pure helpers plus browser verification.

**Steps:**
1. Keep React thin by rendering attributes from `AssignmentState.players`.
2. Add attribute mini-cards in the roster rail or under assignment card.
3. Show key stats: pace, stamina, positioning, decisions, finishing, passing, tackling.
4. Browser verify names and attributes are visible.

## Task 5: Docs and mission tests

**Objective:** Document the player data contract and add mission-by-mission regression checks.

**Files:**
- Create: `docs/19-production-historic-player-data-contract.md`
- Modify: `docs/README.md`
- Modify: `scripts/run-mission-tests.ts`

**Steps:**
1. Add mission tests for historic home squad, historic away squad, browser shared data, and API teams metadata.
2. Add docs contract clarifying that attributes are era-inspired, not official CM database exports.
3. Run docs verification.

## Final verification

Run:

```bash
npm run test:missions
npm test
npx tsc --noEmit
npm run build
```

Browser check:

- Open `http://localhost:3000`.
- Verify Inter/Milan names are visible.
- Verify player attributes are visible in the assignment UI.
- Run a match and verify no console errors.

Commit:

```bash
git add .
git commit -m "feat: add historic player data foundation"
```
