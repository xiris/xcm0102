# Match Event Chains Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Turn isolated chance commentary into short football event chains: foul/free kick, corner, offside, and card sequences.

**Architecture:** Add a pure `eventChains` module that expands resolved chance events into deterministic chains without changing the existing browser contract. The simulation remains server-authoritative and seeded. The browser can keep rendering `events[].description` while API consumers can inspect `chainId`, `sequence`, `category`, and `outcome`.

**Tech Stack:** TypeScript, Vitest, existing seeded RNG, Next.js API/browser display.

---

## Task 1: Define event-chain metadata

**Files:**
- Modify: `src/simulation/domain.ts`
- Test: `tests/simulation/eventChains.test.ts`

Add event types for `foul`, `free_kick`, `corner`, `offside`, `yellow_card`, and `red_card`.

Add optional fields:

```ts
chainId?: string;
sequence?: number;
```

## Task 2: Create deterministic event chain expansion

**Files:**
- Create: `src/simulation/eventChains.ts`
- Test: `tests/simulation/eventChains.test.ts`

Implement `expandChanceEventChains(events, options)`.

Required behavior:

- Same seed and input returns identical chains.
- `set_piece` chance can receive a foul/free-kick precursor.
- blocked chance can create a corner precursor.
- some through balls can become offside and remove the chance from the final timeline.
- aggressive/high-pressing context can add yellow-card events before the chance.

## Task 3: Integrate into simulation

**Files:**
- Modify: `src/simulation/simulateMatch.ts`
- Test: `tests/simulation/simulateMatch.test.ts`
- Test: `tests/api/server.test.ts`

After home/away chance events are produced, expand them through event chains before adding tactical transition/full-time events.

## Task 4: Document interactive-match roadmap

**Files:**
- Create: `docs/22-production-match-event-chains-contract.md`
- Update: `docs/README.md`

Document that this phase is still instant full-match replay. Interactive match controls should come next after event chains and bench/substitutions because the pause/resume engine needs meaningful intervention points.

Recommended interactive roadmap:

1. P11 event chains — meaningful stoppages/intervention points.
2. P12 bench/substitutions/fatigue/injuries — meaningful manager actions.
3. P13 interactive match timeline — pause at key minutes, apply commands, resume deterministic simulation.

## Task 5: Mission tests and verification

**Files:**
- Modify: `scripts/run-mission-tests.ts`

Add missions for:

- deterministic chain expansion;
- free-kick chain;
- corner after blocked shot;
- offside removes chance;
- card event risk;
- API chain metadata.

Run:

```bash
npm run test:missions
npm test
npx tsc --noEmit
npm run build
```

Browser verification:

- open `http://localhost:3000`;
- click Run match;
- verify chain-like text appears;
- verify no JS console errors.
