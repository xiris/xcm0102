# Tactical Editor Foundation Implementation Plan

> **For Hermes:** Use test-driven-development skill to implement this plan task-by-task.

**Goal:** Add the first CM0102-flavored tactical controls to the browser match lab while keeping match resolution server-authoritative.

**Architecture:** Extend the simulation request contract with tactical choices for each side: formation, mentality, pressing, transition style, and existing WIB/WOB movement preset. Add a small pure web module that builds the request payload from UI state, so browser behavior is testable without fragile DOM testing. The API validates tactical options and passes accepted values into the shared tactic-book factory.

**Tech Stack:** Next.js, React, TypeScript, Vitest, existing simulation and API modules.

---

## Acceptance Criteria

- The API accepts optional home/away `formation`, `mentality`, `pressing`, and `transitionStyle` fields.
- The API rejects invalid tactical option values with readable 400 errors.
- Accepted tactical options are passed into the server-side tactic books used by the simulation engine.
- The browser Match Lab exposes tactical controls for both teams.
- The browser request payload includes all selected tactical options.
- Docs describe the tactical editor scope, current limits, and server-authoritative boundary.
- Mission tests include tactical payload mapping and API validation.

## Task 1: TDD API Tactical Options

**Objective:** Define and implement server-side parsing of tactical options.

**Files:**
- Modify: `tests/api/server.test.ts`
- Modify: `src/api/simulationEndpoint.ts`
- Modify: `src/simulation/sampleData.ts`

**Steps:**
1. Add a failing test that valid tactical options return 200 and affect deterministic output shape without errors.
2. Add a failing test that invalid tactical options return 400 with specific error text.
3. Run `npx vitest run tests/api/server.test.ts -t 'tactical'` and verify RED.
4. Add formation type/support in `sampleData.ts` as tactic metadata without changing match rules yet.
5. Extend API validation and pass mentality, pressing, transition style, formation, familiarity, and movement to tactic creation.
6. Run the same test and verify GREEN.

## Task 2: TDD Web Payload Builder

**Objective:** Keep UI request construction pure and testable.

**Files:**
- Create: `tests/web/tacticalPayload.test.ts`
- Create: `src/web/tacticalPayload.ts`
- Modify: `src/web/simulationClient.ts`

**Steps:**
1. Add a failing test for building a full payload from tactical UI state.
2. Add a failing test for default tactical state.
3. Run `npx vitest run tests/web/tacticalPayload.test.ts` and verify RED.
4. Implement the payload builder and shared web tactical types.
5. Run the same test and verify GREEN.

## Task 3: Add Tactical Controls to Match Lab

**Objective:** Make tactical choices visible in the browser.

**Files:**
- Modify: `src/web/MatchLab.tsx`
- Modify: `app/globals.css` if layout needs minor styling.

**Steps:**
1. Add state for home/away formation, mentality, pressing, and transition style.
2. Replace inline payload construction with the tested payload builder.
3. Add select controls grouped as tactical controls.
4. Run `npx tsc --noEmit` and `npm run build`.

## Task 4: Mission Coverage and Docs

**Objective:** Preserve one-by-one validation and document decisions.

**Files:**
- Modify: `scripts/run-mission-tests.ts`
- Create: `docs/14-production-tactics-contract.md`
- Modify: `docs/README.md`

**Steps:**
1. Add missions for API tactical validation and web payload mapping.
2. Document tactical options, server-authoritative limits, current non-goals, and next steps.
3. Link the docs file from `docs/README.md`.
4. Verify docs link with a simple script.

## Task 5: Final Verification and Commit

**Objective:** Verify and checkpoint the tactical editor foundation.

**Commands:**
- `npm run test:missions`
- `npm test`
- `npx tsc --noEmit`
- `npm run build`
- `git status --short`
- `git add .`
- `git commit -m "feat: add tactical editor foundation"`

**Expected:** All checks pass and git status is clean after commit.
