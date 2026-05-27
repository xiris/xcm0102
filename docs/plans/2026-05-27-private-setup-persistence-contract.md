# P18X Private Setup Persistence Contract Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Add repository/API contracts for server-authoritative side-scoped private setup drafts while keeping browser mutation out of scope.

**Architecture:** Extend the replay-session repository with hidden side-scoped private setup draft records. Surface only a redacted/revealed public summary read model; pre-lock summaries never expose private draft fields, while locked/in-match/complete summaries reveal both sides from the same server-owned boundary.

**Tech Stack:** TypeScript, Vitest, Next.js API helper boundaries, existing in-memory replay-session repository.

---

## Task 1: Repository RED for side-scoped hidden setup drafts

**Objective:** Prove the repository can store and replace per-side private setup drafts without touching browser state.

**Files:**
- Modify test: `tests/api/replaySessionRepository.test.ts`
- Modify implementation: `src/api/replaySessionRepository.ts`

**Step 1: Write failing test**

Add tests that:
- create a head-to-head setup session with both managers assigned;
- store a home draft and an away draft;
- assert `privateSetupDrafts.home` and `.away` contain side-scoped records and `updatedAt` metadata;
- replace only the home draft and assert away remains unchanged;
- assert audit entries include `private_setup_draft_stored` and `commandSide`.

**Step 2: Run RED**

```bash
npx vitest run tests/api/replaySessionRepository.test.ts -t 'stores side-scoped private setup drafts'
```

Expected: FAIL because the repository has no private setup draft contract yet.

**Step 3: Implement GREEN**

Add:
- `ReplaySessionPrivateSetupReadinessIntent`
- `ReplaySessionPrivateSetupDraft`
- `ReplaySessionPrivateSetupDraftRecord`
- `ReplaySessionPrivateSetupDrafts`
- repository method `storePrivateSetupDraft(sessionId, side, draft)`
- `privateSetupDrafts` field on sessions and storage records
- audit type `private_setup_draft_stored`

**Step 4: Verify GREEN**

```bash
npx vitest run tests/api/replaySessionRepository.test.ts -t 'stores side-scoped private setup drafts'
```

Expected: PASS.

---

## Task 2: Repository RED for guards and hydration

**Objective:** Prove private setup drafts are setup-only, side-assigned, head-to-head server state and survive storage export/hydration.

**Files:**
- Modify test: `tests/api/replaySessionRepository.test.ts`
- Modify implementation: `src/api/replaySessionRepository.ts`

**Step 1: Write failing tests**

Add tests that:
- reject storing a draft for a single-manager session;
- reject storing a draft for an unassigned side;
- reject storing a draft after setup is locked;
- export/hydrate storage records and preserve private setup drafts;
- mutate an exported private draft and assert repository internals are unchanged.

**Step 2: Run RED**

```bash
npx vitest run tests/api/replaySessionRepository.test.ts -t 'rejects invalid private setup draft storage|exports and hydrates private setup drafts'
```

Expected: FAIL until guards/hydration are complete.

**Step 3: Implement GREEN**

Add validation helpers inside the repository:
- head-to-head only;
- setup state only;
- side owner must exist.

Ensure storage export/hydration clones `privateSetupDrafts` through existing record clone path.

**Step 4: Verify GREEN**

```bash
npx vitest run tests/api/replaySessionRepository.test.ts -t 'private setup draft'
```

Expected: PASS.

---

## Task 3: API helper RED/GREEN for private setup draft storage

**Objective:** Add a pure API helper contract without adding a browser route yet.

**Files:**
- Modify test: `tests/api/replaySessionEndpoint.test.ts`
- Modify implementation: `src/api/replaySessionEndpoint.ts`

**Step 1: Write failing tests**

Add tests for `storeReplaySessionPrivateSetupDraftForApi` that:
- stores a valid side draft and returns `{ sessionId, side, stored: true, revealState: 'hidden_until_lock' }`;
- rejects empty `sessionId`, invalid `side`, empty `clubId`, empty `tacticShellId`, and invalid `readinessIntent`;
- maps repository not-found to 404;
- maps repository setup/assignment guard failures to 400.

**Step 2: Run RED**

```bash
npx vitest run tests/api/replaySessionEndpoint.test.ts -t 'private setup draft'
```

Expected: FAIL because the helper does not exist.

**Step 3: Implement GREEN**

Add:
- exported `storeReplaySessionPrivateSetupDraftForApi(payload, repository)`;
- parser `parsePrivateSetupDraftRequest`;
- validation helpers for draft fields;
- repository call and standard error mapping.

Do not add a Next route or browser client in this slice.

**Step 4: Verify GREEN**

```bash
npx vitest run tests/api/replaySessionEndpoint.test.ts -t 'private setup draft'
```

Expected: PASS.

---

## Task 4: Summary redaction/reveal RED/GREEN

**Objective:** Prove public summaries redact private setup details before lock and reveal both sides after lock.

**Files:**
- Modify test: `tests/api/replaySessionEndpoint.test.ts`
- Modify implementation: `src/api/replaySessionEndpoint.ts`

**Step 1: Write failing tests**

Add tests that:
- store home and away private setup drafts;
- call `getReplaySessionSummaryForApi` before lock;
- assert `privateSetup.revealState` is `hidden_until_lock`;
- assert side statuses are `stored` but do not expose `clubId`, `tacticShellId`, `readinessIntent`, or `updatedAt`;
- transition to `locked` and call the summary again;
- assert both sides reveal stored draft details together;
- assert missing side drafts are explicit missing placeholders after reveal.

**Step 2: Run RED**

```bash
npx vitest run tests/api/replaySessionEndpoint.test.ts -t 'redacts private setup drafts before lock|reveals private setup drafts after lock'
```

Expected: FAIL until summary shaping exists.

**Step 3: Implement GREEN**

Add a private summary builder in `replaySessionEndpoint.ts` that consumes only repository session state and returns a redacted/revealed read model.

**Step 4: Verify GREEN**

```bash
npx vitest run tests/api/replaySessionEndpoint.test.ts -t 'private setup'
```

Expected: PASS.

---

## Task 5: Product route guardrail test

**Objective:** Keep browser mutation out of scope while server contracts are added.

**Files:**
- Modify test: `tests/web/headToHeadLobbyEntry.test.ts`

**Step 1: Write failing/passing guard test updates**

Extend source-boundary assertions to ensure `HeadToHeadLobbyEntry.tsx` still does not contain:
- `storeReplaySessionPrivateSetupDraft`
- `Submit setup`
- `Save setup`
- `localStorage`
- `sessionStorage`

**Step 2: Run guard tests**

```bash
npx vitest run tests/web/headToHeadLobbyEntry.test.ts
```

Expected: PASS unless accidental browser mutation was added.

---

## Task 6: Docs, mission, validation, commit

**Objective:** Record the new contract and verify all boundaries.

**Files:**
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`
- Modify: `scripts/run-mission-tests.ts`

**Steps:**
1. Add docs index entries for contract and plan.
2. Add `MISSION 162: private setup persistence contract`.
3. Run focused tests:

```bash
npx vitest run tests/api/replaySessionRepository.test.ts tests/api/replaySessionEndpoint.test.ts tests/web/headToHeadLobbyEntry.test.ts
```

4. Run aggregate validation:

```bash
npm run test:missions
npm test
npx tsc --noEmit
npm run build
git diff --check
```

5. Browser smoke existing product/harness routes to prove no premature browser setup mutation:
   - `/head-to-head-lobby`: create -> join -> local draft controls still local -> lock -> kickoff -> complete -> report preview.
   - Verify no setup submit/save/rematch/restart/new-match buttons.
   - `/lobby-transition-harness`: invalid direct kickoff rejection and setup -> locked -> in_match.
   - `/lobby-fixtures`: button-free/read-only.
6. Commit locally:

```bash
git add docs/65-production-private-setup-persistence-contract.md docs/plans/2026-05-27-private-setup-persistence-contract.md docs/README.md docs/30-project-handoff-status.md scripts/run-mission-tests.ts src/api/replaySessionRepository.ts src/api/replaySessionEndpoint.ts tests/api/replaySessionRepository.test.ts tests/api/replaySessionEndpoint.test.ts tests/web/headToHeadLobbyEntry.test.ts
git commit -m "feat: add private setup persistence contract"
```
