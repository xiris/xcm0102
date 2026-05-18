# Browser Replay Session UI Integration Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Migrate Match Lab’s browser flow from the legacy full-payload authoritative resume path toward server-owned replay sessions.

**Architecture:** Keep React thin by adding a tested browser client in `src/web/replaySessionClient.ts`. Expose Next route handlers for replay-session create, command append, visible-event synchronization, and session-owned authoritative resume. Match Lab stores session status metadata and renders it in the replay metadata panel.

**Tech Stack:** TypeScript, Next.js app routes, Vitest, existing simulation/API adapters.

---

## Scope

P16D implements:

1. Browser client functions for:
   - `POST /api/replay-sessions`
   - `POST /api/replay-sessions/:sessionId/commands`
   - `POST /api/replay-sessions/:sessionId/visible-events`
   - `POST /api/replay-sessions/:sessionId/resume`
2. Next app route handlers backed by a shared in-memory replay-session repository.
3. Match Lab session state:
   - create a session after a match simulation succeeds;
   - show session ID/status in replay metadata;
   - append manager commands to the stored session;
   - synchronize visible replay events before authoritative resume;
   - request authoritative output from the session-owned route.
4. Mission-test entries and handoff docs.

## Out of scope

- Durable database persistence.
- Accounts or session ownership auth.
- Removing legacy `/api/resume-match`.
- Full custom-tactic session persistence; this slice preserves the current demo fixture seam and documents the limitation.

## TDD checkpoints

### Task 1 — Browser client contract

**Files:**

- Create: `tests/web/replaySessionClient.test.ts`
- Create: `src/web/replaySessionClient.ts`

**RED:** Test create/append/sync/resume URL, method, JSON headers, body shape, and error mapping.

**GREEN:** Implement a small injected-fetch client.

### Task 2 — Server visible-event sync helper

**Files:**

- Modify: `src/api/replaySessionEndpoint.ts`
- Modify: `tests/api/replaySessionEndpoint.test.ts`
- Modify: `src/api/server.ts`
- Modify: `tests/api/server.test.ts`

**RED:** Test `syncReplaySessionVisibleEventsForApi` and Fastify route before implementation.

**GREEN:** Call repository `replaceVisibleEvents`, return `visibleEventCount`, and expose `/api/replay-sessions/:sessionId/visible-events`.

### Task 3 — Next app routes

**Files:**

- Create: `app/api/replay-sessions/sessionStore.ts`
- Create: `app/api/replay-sessions/route.ts`
- Create: `app/api/replay-sessions/[sessionId]/commands/route.ts`
- Create: `app/api/replay-sessions/[sessionId]/visible-events/route.ts`
- Create: `app/api/replay-sessions/[sessionId]/resume/route.ts`

**Approach:** Thin wrappers only. Reuse API helpers and shared repository.

### Task 4 — Match Lab UI wiring

**Files:**

- Modify: `src/web/MatchLab.tsx`

**Behavior:**

- Create replay session after `simulateMatchFromWeb` succeeds.
- Show session metadata in replay metadata list.
- Append commands when manager actions are recorded.
- Before authoritative resume, synchronize `interactiveState.visibleEvents`, then call session-owned resume.
- Keep graceful fallback/error messaging.

### Task 5 — Docs and missions

**Files:**

- Modify: `scripts/run-mission-tests.ts`
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`

Add mission tests for the browser client and visible-event sync.

## Verification

Run:

```bash
npx vitest run tests/web/replaySessionClient.test.ts
npx vitest run tests/api/replaySessionEndpoint.test.ts -t 'visible events'
npx vitest run tests/api/server.test.ts -t 'visible events'
npm run test:missions
npm test
npx tsc --noEmit
npm run build
```

Browser check:

1. Open `http://localhost:3000`.
2. Run match.
3. Verify replay metadata shows a replay session ID/status.
4. Start interactive replay.
5. Click a manager action.
6. Request authoritative resume.
7. Verify the `Server-authoritative replay` panel appears without `.error` elements or console errors.

## Next-phase transition

After P16D, the natural next slice is a stabilization pass or P16E custom tactic session parity, where replay sessions store the same tactic payload used by the browser simulation rather than reconstructing the demo fixture only from seed.
