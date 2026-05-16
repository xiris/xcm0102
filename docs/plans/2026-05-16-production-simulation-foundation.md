# Production Simulation Foundation Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build the first production TypeScript simulation package for XCM0102, porting the validated spike contracts into a deterministic, tested core.

**Architecture:** Start with a small package-oriented structure instead of a full app. The simulation core owns pure domain types, seeded RNG, and `simulateMatch(input)`. Web/API/database layers come later and must call this package rather than duplicating match logic.

**Tech Stack:** TypeScript, Node.js, Vitest, tsx, npm workspaces or a simple package layout. Python spikes remain as reference only.

---

## Scope

This plan creates a production foundation, not the full online game.

In scope:

- TypeScript project setup.
- Simulation domain types.
- Seeded deterministic RNG.
- First match simulation API.
- Basic tactic and WIB/WOB data structures.
- Diagnostic report output.
- CLI demo emitting JSON.
- Mission-style tests and aggregate tests.
- Documentation updates.

Out of scope:

- Database.
- Backend HTTP API.
- Next.js UI.
- Auth/accounts.
- Full career calendar.
- Real-player data.
- Perfect match realism.

## Source references

Read before implementing:

- `docs/07-match-engine-variables.md`
- `docs/09-spike-findings.md`
- `docs/10-production-roadmap.md`
- `spikes/001-match-engine-core/match_engine.py`
- `spikes/002-wibwob-movement-load/movement_model.py`
- `spikes/003-integrated-match-and-wibwob/integrated_engine.py`
- `spikes/004-wib-vs-wob-transitions/transition_engine.py`
- `spikes/005-transition-attributes-and-familiarity/attribute_transition_engine.py`

## Proposed file structure

```text
package.json
tsconfig.json
vitest.config.ts
src/
  index.ts
  simulation/
    domain.ts
    rng.ts
    simulateMatch.ts
    sampleData.ts
    report.ts
  cli/
    runSimulation.ts
scripts/
  run-mission-tests.ts
tests/
  simulation/
    simulateMatch.test.ts
docs/
  10-production-roadmap.md
  11-production-simulation-contract.md
```

If an existing TypeScript structure already exists when this plan is executed, adapt paths to fit the existing conventions and document the deviation.

---

### Task 1: Confirm project baseline

**Objective:** Verify the current repository state before adding production files.

**Files:**
- Read: `docs/README.md`
- Read: `docs/09-spike-findings.md`
- Read: `spikes/README.md`

**Step 1: Inspect files**

Run:

```bash
pwd
git status --short
```

Expected:

- Working directory is the project root.
- Any uncommitted docs/spike changes are known before implementation begins.

**Step 2: List existing package files**

Run:

```bash
find . -maxdepth 2 \( -name package.json -o -name tsconfig.json -o -name vitest.config.ts \) -print
```

Expected:

- If none exist, create them in later tasks.
- If they exist, reuse and adjust the plan.

**Step 3: Document baseline if needed**

If the repository already has app structure, update this plan or create a short note in `docs/11-production-simulation-contract.md` explaining the chosen structure.

---

### Task 2: Add TypeScript test/tooling setup

**Objective:** Create the minimal Node/TypeScript/Vitest foundation.

**Files:**
- Create/modify: `package.json`
- Create/modify: `tsconfig.json`
- Create/modify: `vitest.config.ts`

**Step 1: Write `package.json`**

If no package file exists, create:

```json
{
  "name": "xcm0102",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:missions": "tsx scripts/run-mission-tests.ts",
    "sim:demo": "tsx src/cli/runSimulation.ts"
  },
  "devDependencies": {
    "@types/node": "latest",
    "tsx": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

**Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src", "tests", "scripts"]
}
```

**Step 3: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    reporters: ['default']
  }
});
```

**Step 4: Install dependencies**

Run:

```bash
npm install
```

Expected:

- `node_modules/` and lockfile created.
- No install errors.

**Step 5: Verify empty test command**

Run:

```bash
npm test -- --passWithNoTests
```

Expected:

- Vitest exits successfully with no tests or with current existing tests.

---

### Task 3: Create failing deterministic RNG tests

**Objective:** Define the deterministic RNG contract before implementation.

**Files:**
- Create: `tests/simulation/rng.test.ts`
- Create later: `src/simulation/rng.ts`

**Step 1: Write failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { createSeededRng } from '../../src/simulation/rng';

describe('createSeededRng', () => {
  it('replays the same sequence for the same seed', () => {
    const a = createSeededRng(42);
    const b = createSeededRng(42);

    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
  });

  it('produces numbers in the half-open range [0, 1)', () => {
    const rng = createSeededRng(7);

    for (let i = 0; i < 100; i += 1) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('supports deterministic integer ranges', () => {
    const rng = createSeededRng(99);
    const values = Array.from({ length: 10 }, () => rng.int(1, 6));

    expect(values).toEqual(Array.from({ length: 10 }, (unused, index) => values[index]));
    expect(values.every((value) => value >= 1 && value <= 6)).toBe(true);
  });
});
```

**Step 2: Run mission test**

Run:

```bash
npm test -- tests/simulation/rng.test.ts
```

Expected:

- FAIL because `src/simulation/rng.ts` does not exist yet.

---

### Task 4: Implement deterministic RNG

**Objective:** Add a small deterministic RNG utility for all simulation randomness.

**Files:**
- Create: `src/simulation/rng.ts`

**Step 1: Implement RNG**

```ts
export type SeededRng = {
  next: () => number;
  int: (minInclusive: number, maxInclusive: number) => number;
  pick: <T>(items: readonly T[]) => T;
};

export function createSeededRng(seed: number): SeededRng {
  let state = seed >>> 0;

  const nextUint32 = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return (value ^ (value >>> 14)) >>> 0;
  };

  const next = (): number => nextUint32() / 4294967296;

  return {
    next,
    int: (minInclusive: number, maxInclusive: number): number => {
      if (!Number.isInteger(minInclusive) || !Number.isInteger(maxInclusive)) {
        throw new Error('RNG integer bounds must be integers');
      }
      if (maxInclusive < minInclusive) {
        throw new Error('RNG max must be >= min');
      }
      const span = maxInclusive - minInclusive + 1;
      return minInclusive + Math.floor(next() * span);
    },
    pick: <T>(items: readonly T[]): T => {
      if (items.length === 0) {
        throw new Error('Cannot pick from an empty array');
      }
      return items[Math.floor(next() * items.length)] as T;
    }
  };
}
```

**Step 2: Run mission test**

Run:

```bash
npm test -- tests/simulation/rng.test.ts
```

Expected:

- PASS.

---

### Task 5: Define production simulation domain types

**Objective:** Create serializable, explicit types for the first match-engine contract.

**Files:**
- Create: `src/simulation/domain.ts`
- Create/modify: `src/index.ts`

**Step 1: Add domain types**

Create types for:

- `PlayerAttributes`
- `Player`
- `Team`
- `PitchPoint`
- `BallZone`
- `WibWobMap`
- `TacticBook`
- `MatchContext`
- `MatchCommand`
- `MatchInput`
- `MatchEvent`
- `TeamMatchStats`
- `MatchReport`
- `MatchResult`

Minimum required fields:

```ts
export type PlayerAttributes = {
  pace: number;
  acceleration: number;
  stamina: number;
  positioning: number;
  anticipation: number;
  teamwork: number;
  decisions: number;
  finishing: number;
  passing: number;
  tackling: number;
};

export type Player = {
  id: string;
  name: string;
  position: 'GK' | 'D' | 'DM' | 'M' | 'AM' | 'F';
  attributes: PlayerAttributes;
};

export type Team = {
  id: string;
  name: string;
  players: Player[];
};

export type PitchPoint = { x: number; y: number };

export type BallZone =
  | 'DEF_LEFT'
  | 'DEF_CENTER'
  | 'DEF_RIGHT'
  | 'MID_LEFT'
  | 'MID_CENTER'
  | 'MID_RIGHT'
  | 'ATT_LEFT'
  | 'ATT_CENTER'
  | 'ATT_RIGHT';

export type WibWobMap = Partial<Record<BallZone, Record<string, PitchPoint>>>;

export type TacticBook = {
  id: string;
  name: string;
  mentality: 'defensive' | 'balanced' | 'attacking';
  pressing: 'low' | 'medium' | 'high';
  transitionStyle: 'hold_shape' | 'balanced' | 'fast_break';
  familiarity: number;
  wib: WibWobMap;
  wob: WibWobMap;
};
```

**Step 2: Export from `src/index.ts`**

```ts
export * from './simulation/domain';
export * from './simulation/rng';
```

**Step 3: Type-check**

Run:

```bash
npx tsc --noEmit
```

Expected:

- PASS.

---

### Task 6: Write failing simulation contract tests

**Objective:** Lock down the first `simulateMatch(input)` behavior before implementation.

**Files:**
- Create: `tests/simulation/simulateMatch.test.ts`
- Create later: `src/simulation/simulateMatch.ts`
- Create later: `src/simulation/sampleData.ts`

**Step 1: Write mission tests**

Tests should cover:

1. same seed and same input replay identically;
2. attacking mentality creates at least as many shots as defensive mentality across a deterministic sample;
3. low familiarity creates more transition delay than high familiarity;
4. weak pace/acceleration creates more late arrivals than strong pace/acceleration;
5. output includes diagnostics explaining at least one tactical or execution cause.

**Step 2: Run one mission at a time**

Run each test individually with labels in the terminal before the command, for example:

```bash
printf '\nMISSION 01: deterministic replay\n'
npm test -- tests/simulation/simulateMatch.test.ts -t 'replays identically'
```

Expected:

- FAIL because `simulateMatch` and sample data do not exist yet.

---

### Task 7: Implement sample data builders

**Objective:** Provide small deterministic teams and tactic books for tests and demos.

**Files:**
- Create: `src/simulation/sampleData.ts`

**Step 1: Implement builders**

Create functions:

- `createSampleTeam(options)`
- `createSampleTacticBook(options)`
- `createSampleMatchInput(options)`

Options should allow:

- team quality: `weak`, `average`, `strong`;
- mentality;
- familiarity;
- movement style: `compact`, `balanced`, `extreme`.

**Step 2: Type-check**

Run:

```bash
npx tsc --noEmit
```

Expected:

- PASS.

---

### Task 8: Implement first `simulateMatch(input)`

**Objective:** Port the validated spike shape into production TypeScript without overbuilding.

**Files:**
- Create: `src/simulation/simulateMatch.ts`
- Modify: `src/index.ts`

**Step 1: Implement pure function**

The API should be:

```ts
export function simulateMatch(input: MatchInput): MatchResult
```

Rules for first implementation:

- Use only `createSeededRng(input.seed)` for randomness.
- Never use `Math.random()`.
- Compute team execution from attributes and familiarity.
- Compute tactical effects from mentality, pressing, transition style, and simple WIB/WOB movement distance.
- Emit events with minute, team id, type, and description.
- Emit stats for shots, shots on target, goals, possession, fatigue, transition delay, late arrivals.
- Emit diagnostics explaining major causes.

**Step 2: Export function**

Add to `src/index.ts`:

```ts
export * from './simulation/simulateMatch';
export * from './simulation/sampleData';
```

**Step 3: Run mission tests one by one**

Use the user's preferred style:

```bash
printf '\nMISSION 01: deterministic replay\n'
npm test -- tests/simulation/simulateMatch.test.ts -t 'replays identically'

printf '\nMISSION 02: attacking creates pressure\n'
npm test -- tests/simulation/simulateMatch.test.ts -t 'attacking mentality'

printf '\nMISSION 03: familiarity affects transitions\n'
npm test -- tests/simulation/simulateMatch.test.ts -t 'low familiarity'

printf '\nMISSION 04: attributes affect late arrivals\n'
npm test -- tests/simulation/simulateMatch.test.ts -t 'pace'

printf '\nMISSION 05: diagnostics explain causes\n'
npm test -- tests/simulation/simulateMatch.test.ts -t 'diagnostics'
```

Expected:

- All missions PASS.

**Step 4: Run aggregate simulation suite**

Run:

```bash
npm test -- tests/simulation/simulateMatch.test.ts
```

Expected:

- PASS.

---

### Task 9: Add mission test runner

**Objective:** Make mission-style validation repeatable.

**Files:**
- Create: `scripts/run-mission-tests.ts`

**Step 1: Implement runner**

The script should run each important Vitest pattern individually and print labels like:

```text
MISSION 01: deterministic replay
STATUS: PASSED
```

It can shell out to `npm test -- ... -t "pattern"` using Node's `child_process`.

**Step 2: Run mission runner**

Run:

```bash
npm run test:missions
```

Expected:

- Every mission reports PASSED.

---

### Task 10: Add CLI JSON demo

**Objective:** Provide an inspectable simulation output like the Python spikes.

**Files:**
- Create: `src/cli/runSimulation.ts`

**Step 1: Implement CLI**

Support simple options:

- `--seed 42`
- `--home-quality weak|average|strong`
- `--away-quality weak|average|strong`
- `--home-familiarity 0.2`
- `--away-familiarity 0.8`

The output should be pretty JSON including:

- score;
- team stats;
- first few events;
- diagnostics;
- replay metadata.

**Step 2: Run CLI**

Run:

```bash
npm run sim:demo -- --seed 42 --home-quality weak --home-familiarity 0.2
```

Expected:

- JSON output is valid and includes diagnostics about weak execution or familiarity when applicable.

---

### Task 11: Document the production simulation contract

**Objective:** Preserve implementation decisions in `docs/` as work progresses.

**Files:**
- Create: `docs/11-production-simulation-contract.md`
- Modify: `docs/README.md`

**Step 1: Write contract doc**

Include:

- simulation goals;
- input/output shape;
- determinism rules;
- command/replay model;
- tactic-book representation;
- how attributes and familiarity affect execution;
- diagnostics philosophy;
- what came from spikes 001-005;
- what is intentionally simplified in the first production slice.

**Step 2: Update docs index**

Add:

```text
- 10-production-roadmap.md — production sequence after validated spikes.
- 11-production-simulation-contract.md — first production match-engine contract.
```

**Step 3: Verify docs exist**

Run:

```bash
test -f docs/10-production-roadmap.md && test -f docs/11-production-simulation-contract.md
```

Expected:

- PASS, no output.

---

### Task 12: Run final verification

**Objective:** Prove the production foundation works before continuing to API/UI/database.

**Files:**
- All production files touched above.

**Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected:

- PASS.

**Step 2: Run mission tests**

```bash
npm run test:missions
```

Expected:

- All missions PASS with labels.

**Step 3: Run aggregate suite**

```bash
npm test
```

Expected:

- PASS.

**Step 4: Run CLI demo**

```bash
npm run sim:demo -- --seed 42 --home-quality weak --home-familiarity 0.2
```

Expected:

- Valid JSON.
- Diagnostics are present.

**Step 5: Update docs if findings changed**

If implementation diverged from this plan, document the reason in:

- `docs/10-production-roadmap.md`
- `docs/11-production-simulation-contract.md`

## Completion criteria

This plan is complete when:

- TypeScript production simulation package exists.
- Deterministic RNG tests pass.
- Match simulation mission tests pass one by one.
- Aggregate tests pass.
- CLI demo outputs inspectable JSON.
- Documentation is updated in `docs/`.

## Next plan after this

After this production simulation foundation passes, the next plan should be:

`docs/plans/YYYY-MM-DD-production-api-foundation.md`

That plan should add a Fastify API around the simulation package and only then start persistence design or UI wiring.
