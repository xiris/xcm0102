# Authoritative Resume UI Integration Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Wire the Match Lab replay console to `POST /api/resume-match` so a user can request a server-authoritative resumed replay preview from the currently visible interactive replay and recorded manager commands.

**Architecture:** Keep server-owned resume output separate from the existing client-side projected replay. Add a thin browser client helper for request/response/error handling, preserve pure view-model formatting through `formatAuthoritativeReplay`, and keep `MatchLab.tsx` as a thin state/UI adapter. Add a Next route for `/api/resume-match` so the browser path matches the already-tested API contract.

**Tech Stack:** TypeScript, React/Next.js app router, Vitest, existing deterministic simulation/API modules.

---

## Slice P16B Tasks

### Task 1: Document UI contract

**Objective:** Capture the user-facing contract before changing code.

**Files:**
- Create: `docs/34-authoritative-resume-ui-contract.md`
- Modify later: `docs/README.md`, `docs/30-project-handoff-status.md`

**Verification:** Contract describes projected vs authoritative separation, request shape, loading/error states, and non-goals.

### Task 2: RED — browser client request and error tests

**Objective:** Prove the missing web helper should POST visible events and commands to `/api/resume-match`.

**Files:**
- Create: `tests/web/authoritativeResumeClient.test.ts`
- Create after RED: `src/web/authoritativeResumeClient.ts`

**Test expectations:**
- `resumeMatchFromWeb(request, fetcher)` sends JSON `POST /api/resume-match`.
- It returns typed authoritative output.
- It throws `Authoritative resume request failed: ...` for API errors.

**RED command:**

```bash
npx vitest run tests/web/authoritativeResumeClient.test.ts
```

Expected: FAIL because the module does not exist.

### Task 3: GREEN — browser client and Next route

**Objective:** Add the minimal browser adapter and browser-visible app route.

**Files:**
- Create: `src/web/authoritativeResumeClient.ts`
- Create: `app/api/resume-match/route.ts`

**Implementation notes:**
- Reuse request/response types around `MatchEvent`, `ManagerCommand`, and authoritative resume output.
- Mirror the existing `simulateMatchFromWeb` fetch style.
- Route should call `resumeMatchForApi` and return `NextResponse.json(result.body, { status: result.status })`.

**GREEN command:**

```bash
npx vitest run tests/web/authoritativeResumeClient.test.ts
```

Expected: PASS.

### Task 4: RED/GREEN — view-model formatting contract

**Objective:** Ensure server output remains visibly distinct from projected replay.

**Files:**
- Modify: `tests/web/interactiveReplayViewModel.test.ts`
- Modify if needed: `src/web/interactiveReplayViewModel.ts`

**Test expectations:**
- `formatAuthoritativeReplay` includes final score, signature, event count, remaining authoritative events after the pause, and diagnostics.
- Existing projected replay formatting remains unchanged.

**Command:**

```bash
npx vitest run tests/web/interactiveReplayViewModel.test.ts -t 'authoritative resumed replay'
```

### Task 5: Wire Match Lab UI

**Objective:** Add a button in the replay console that submits the current interactive replay state and manager commands to the authoritative endpoint.

**Files:**
- Modify: `src/web/MatchLab.tsx`

**Implementation notes:**
- Add state for authoritative replay lines, loading status, and authoritative-specific errors.
- Reset authoritative state when running a new simulation, restarting interactive replay, or recording a new manager command.
- Disable the button unless an interactive replay state exists.
- Display projected replay and authoritative replay in distinct `InfoList` panels.
- Keep current client projection panel intact.

### Task 6: Missions and docs

**Objective:** Keep mission-labelled validation and docs current.

**Files:**
- Modify: `scripts/run-mission-tests.ts`
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`

**Mission additions:**
- Authoritative resume web client request/error contract.
- Authoritative resume web formatting contract if the assertion changes.

### Task 7: Validation and local commit

**Objective:** Prove the slice and preserve it locally.

**Commands:**

```bash
printf '\nMISSION P16B-01: authoritative resume web client\n' && npx vitest run tests/web/authoritativeResumeClient.test.ts && printf 'MISSION P16B-01 STATUS: PASSED\n'
printf '\nMISSION P16B-02: authoritative resume web formatting\n' && npx vitest run tests/web/interactiveReplayViewModel.test.ts -t 'authoritative resumed replay' && printf 'MISSION P16B-02 STATUS: PASSED\n'
npm run test:missions
npm test
npx tsc --noEmit
npm run build
```

Browser check:
- Load Match Lab.
- Run a match.
- Start interactive replay.
- Advance to a pause if necessary.
- Record a manager action.
- Request authoritative resume.
- Confirm the authoritative replay panel appears separately from projected replay and no console errors appear.

Commit locally only; do not configure or push a remote.
