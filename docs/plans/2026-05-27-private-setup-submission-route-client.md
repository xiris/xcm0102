# P18Y Private Setup Submission Route / Client Contract Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Expose private setup draft storage through a thin Next route and browser client helper while keeping the product route local-preview only.

**Architecture:** Reuse the P18X API helper `storeReplaySessionPrivateSetupDraftForApi` and shared in-memory replay-session repository. Add a narrow Next `POST` route under the replay-session session ID, add a browser client helper with injected fetch, and preserve `/head-to-head-lobby` guardrails against using the submit path until a later UI slice.

**Tech Stack:** TypeScript, Next app routes, Vitest, existing replay-session repository/API/client modules.

---

## Task 1: RED route wrapper success and redaction test

**Objective:** Prove the missing Next route can store a valid private setup draft and that the summary remains redacted before lock.

**Files:**
- Modify test: `tests/api/replaySessionNextRoutes.test.ts`
- Later create: `app/api/replay-sessions/[sessionId]/private-setup/route.ts`

**Step 1: Write failing test**

Add an import for the new route:

```ts
import { POST as submitPrivateSetupRoute } from '../../app/api/replay-sessions/[sessionId]/private-setup/route';
```

Add a test that:

1. creates a head-to-head setup session with both managers assigned;
2. calls `submitPrivateSetupRoute` with `side: 'home'` and a valid draft;
3. expects status `200` and `{ sessionId, side: 'home', stored: true, revealState: 'hidden_until_lock' }`;
4. fetches the summary and verifies `privateSetup.sides.home` is `status: 'stored'`, `detailVisibility: 'hidden'`, with no draft detail before lock.

**Step 2: Run RED**

```bash
npx vitest run tests/api/replaySessionNextRoutes.test.ts -t 'stores private setup drafts through the Next route wrapper'
```

Expected: FAIL because the route module does not exist.

**Step 3: Implement minimal route**

Create `app/api/replay-sessions/[sessionId]/private-setup/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { storeReplaySessionPrivateSetupDraftForApi } from '../../../../../src/api/replaySessionEndpoint';
import { replaySessionRepository } from '../../sessionStore';

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const body = await request.json();
  const { sessionId } = await context.params;
  const result = storeReplaySessionPrivateSetupDraftForApi({ ...body, sessionId }, replaySessionRepository);
  return NextResponse.json(result.body, { status: result.status });
}
```

**Step 4: Run GREEN**

```bash
npx vitest run tests/api/replaySessionNextRoutes.test.ts -t 'stores private setup drafts through the Next route wrapper'
```

Expected: PASS.

---

## Task 2: RED route validation and guard tests

**Objective:** Prove the route maps helper validation, missing session, and repository guard failures to HTTP responses.

**Files:**
- Modify: `tests/api/replaySessionNextRoutes.test.ts`

**Step 1: Write failing/expanding tests**

Add tests for:

- invalid draft payload returns `400` and includes `draft.clubId must be a non-empty string`;
- missing session returns `404` and includes `Replay session not found`;
- unassigned side returns `400` and includes `Private setup side away is not assigned`;
- locked/non-setup session returns `400` and includes `Private setup drafts can only be stored while setup is open`.

**Step 2: Run tests**

```bash
npx vitest run tests/api/replaySessionNextRoutes.test.ts -t 'private setup'
```

Expected: PASS after Task 1 route because P18X helper already owns the validation and guard behavior.

---

## Task 3: RED browser client helper test

**Objective:** Prove browser code has a typed helper for submitting private setup drafts without wiring product UI.

**Files:**
- Modify test: `tests/web/replaySessionClient.test.ts`
- Modify implementation: `src/web/replaySessionClient.ts`

**Step 1: Write failing test**

Import `submitReplaySessionPrivateSetupDraftFromWeb` and add a test that uses an injected fetch mock. Assert exact call:

```ts
expect(fetchMock).toHaveBeenCalledWith('/api/replay-sessions/rs-0001/private-setup', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    side: 'away',
    draft: {
      clubId: 'milan-2002',
      tacticShellId: 'compact-451',
      readinessIntent: 'ready_to_lock'
    }
  })
});
```

Assert the response body is returned and server error payloads throw `Replay session request failed: ...`.

**Step 2: Run RED**

```bash
npx vitest run tests/web/replaySessionClient.test.ts -t 'private setup'
```

Expected: FAIL because the helper is missing.

**Step 3: Implement minimal client helper**

Add request/result types and:

```ts
export async function submitReplaySessionPrivateSetupDraftFromWeb(
  request: WebReplaySessionPrivateSetupDraftRequest,
  fetcher?: FetchLike
): Promise<WebReplaySessionPrivateSetupDraftResult> {
  const { sessionId, side, draft } = request;
  return postJson(`/api/replay-sessions/${sessionId}/private-setup`, { side, draft }, fetcher) as Promise<WebReplaySessionPrivateSetupDraftResult>;
}
```

**Step 4: Run GREEN**

```bash
npx vitest run tests/web/replaySessionClient.test.ts -t 'private setup'
```

Expected: PASS.

---

## Task 4: Preserve product route source guardrails

**Objective:** Ensure the new client helper does not get wired into the product route yet.

**Files:**
- Modify: `tests/web/headToHeadLobbyEntry.test.ts`

**Steps:**

1. Add/keep assertions that `HeadToHeadLobbyEntry.tsx` does not contain:
   - `Submit setup`
   - `Save setup`
   - `localStorage`
   - `sessionStorage`
   - `submitReplaySessionPrivateSetupDraftFromWeb`
2. Run:

```bash
npx vitest run tests/web/headToHeadLobbyEntry.test.ts
```

Expected: PASS.

---

## Task 5: Documentation and mission runner

**Objective:** Update the project handoff and validation affordances.

**Files:**
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`
- Modify: `scripts/run-mission-tests.ts`

**Steps:**

1. Link `docs/66-production-private-setup-submission-route-client-contract.md` in `docs/README.md`.
2. Link this plan in `docs/README.md`.
3. Add MISSION 163 for private setup submission route/client contract.
4. Update handoff latest slice to P18Y and record observed validation after running commands.

---

## Task 6: Full validation and local commit

**Objective:** Prove the slice and preserve a clean local checkpoint.

**Commands:**

```bash
npx vitest run tests/api/replaySessionNextRoutes.test.ts tests/web/replaySessionClient.test.ts tests/web/headToHeadLobbyEntry.test.ts
npm run test:missions
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Browser smoke:

- `/head-to-head-lobby`: create → join → verify local draft controls still say local/not submitted and no setup submit/save controls → switch perspective → edit local draft labels → lock → kickoff → complete → report preview.
- `/lobby-transition-harness`: invalid direct kickoff rejection and setup → locked → in_match still work.
- `/lobby-fixtures`: remains button-free/read-only.
- Verify browser console is clean.
- Check `git diff -- next-env.d.ts` and revert generated-only churn if present.

Commit:

```bash
git add docs/66-production-private-setup-submission-route-client-contract.md docs/plans/2026-05-27-private-setup-submission-route-client.md docs/README.md docs/30-project-handoff-status.md scripts/run-mission-tests.ts app/api/replay-sessions/[sessionId]/private-setup/route.ts src/web/replaySessionClient.ts tests/api/replaySessionNextRoutes.test.ts tests/web/replaySessionClient.test.ts tests/web/headToHeadLobbyEntry.test.ts
git commit -m "feat: add private setup submission route client"
```
