# Production Web Vertical Slice Implementation Plan

> **For Hermes:** Use test-driven-development skill to implement this plan task-by-task.

**Goal:** Make the current server-authoritative CM0102 simulation visible and usable in a browser.

**Architecture:** Add a small Next.js App Router shell that renders a client-side match lab. The browser UI must call the existing POST /api/simulate-match contract rather than duplicating simulation logic. Keep transformation and formatting logic in testable TypeScript modules so behavior can be verified without brittle DOM-only tests.

**Tech Stack:** Next.js, React, TypeScript, Vitest, existing Fastify API contract, existing production simulation package.

---

## Acceptance Criteria

- A browser page exists at `/` with a CM0102 Online match lab.
- The page exposes controls for seed, home/away quality, home/away familiarity, and home/away movement.
- Submitting the controls calls POST `/api/simulate-match` with the selected payload.
- The result renders score, stats, notable events, diagnostics, and replay metadata.
- Invalid API responses surface as user-readable errors.
- Shared API client code is deterministic and tested.
- Documentation is added at `docs/13-production-web-contract.md` and linked from `docs/README.md`.
- Mission tests are expanded to include the web client behavior.

## Task 1: Add Web Client Contract Tests

**Objective:** Define the client request/response behavior before implementation.

**Files:**
- Create: `tests/web/simulationClient.test.ts`
- Create: `src/web/simulationClient.ts`

**Steps:**
1. Write tests for:
   - sending the expected POST request to `/api/simulate-match`
   - returning parsed JSON on success
   - throwing a readable error when the API returns non-2xx
2. Run `npx vitest run tests/web/simulationClient.test.ts` and verify RED.
3. Implement the minimal `simulateMatchFromWeb` function.
4. Run the same test and verify GREEN.

## Task 2: Add Result View Model Tests

**Objective:** Define stable formatting for score, stats, events, diagnostics, and replay metadata.

**Files:**
- Create: `tests/web/matchResultViewModel.test.ts`
- Create: `src/web/matchResultViewModel.ts`

**Steps:**
1. Write tests for:
   - score title formatting
   - stats rows for possession, shots, shots on target, goals
   - limited event feed labels
   - diagnostics labels
   - replay metadata labels
2. Run `npx vitest run tests/web/matchResultViewModel.test.ts` and verify RED.
3. Implement the minimal view model formatter.
4. Run the same test and verify GREEN.

## Task 3: Add Next.js App Shell

**Objective:** Create the browser entrypoint and client component.

**Files:**
- Create: `next.config.mjs`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Create: `src/web/MatchLab.tsx`
- Modify: `package.json`

**Steps:**
1. Add dependencies: `next`, `react`, `react-dom` and dev type packages if needed.
2. Add scripts: `dev`, `build`.
3. Implement a client component that uses the tested client and view model modules.
4. Run `npx tsc --noEmit` and fix type issues.
5. Run `npm run build` and fix build issues.

## Task 4: Expand Mission Runner

**Objective:** Keep the user's preferred one-by-one mission validation style.

**Files:**
- Modify: `scripts/run-mission-tests.ts`

**Steps:**
1. Add missions for web API client success, web API client error, and result view model formatting.
2. Run `npm run test:missions` and verify all missions pass.

## Task 5: Document Web Contract

**Objective:** Preserve product and implementation decisions in docs as work progresses.

**Files:**
- Create: `docs/13-production-web-contract.md`
- Modify: `docs/README.md`

**Steps:**
1. Document page purpose, controls, API dependency, rendered fields, error behavior, and current limits.
2. Link the new document from `docs/README.md`.
3. Run a docs verification command that checks the new link exists.

## Task 6: Final Verification and Commit

**Objective:** Verify the whole project and commit a clean checkpoint.

**Commands:**
- `npm run test:missions`
- `npm test`
- `npx tsc --noEmit`
- `npm run build`
- `git status --short`
- `git add .`
- `git commit -m "feat: add production web vertical slice"`

**Expected:** All checks pass and git status is clean after commit.
