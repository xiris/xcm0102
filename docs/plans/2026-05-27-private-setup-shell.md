# P18S Private Setup Shell / Club-Tactic Selection Preview Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Add a safe, read-only private setup shell to `/head-to-head-lobby` that previews future per-side club/tactic setup without storing hidden competitive state or changing server transition rules.

**Architecture:** Keep the behavior in a pure browser view-model helper, then render it through the product route once a public lobby summary exists. The shell consumes only public replay-session summary fields and uses Inter/Milan 2002 as placeholder fixture clubs.

**Tech Stack:** TypeScript, Next.js, React, Vitest, existing replay-session lobby summary contract.

---

## Scope

- Add a pure `createHeadToHeadPrivateSetupShell(summary)` helper.
- Render the shell on `/head-to-head-lobby` after a lobby summary is loaded.
- Show home/away setup cards with manager labels, sample club labels, state-aware privacy/readiness copy, and explicit no-hidden-state-yet notes.
- Preserve existing create, join, lock, kickoff, complete, and report-preview flow.

## Non-goals

- No actual club selection mutation.
- No hidden lineup/tactic persistence.
- No accounts, invite permissions, websockets, or durable DB persistence.
- No rematch/restart/new-match controls.
- No full report page.
- No server transition rule changes.

## Task 1: Add private setup shell view-model tests

**Objective:** Define the shell contract before production code exists.

**Files:**
- Create: `tests/web/headToHeadPrivateSetupShell.test.ts`
- Create later: `src/web/headToHeadPrivateSetupShell.ts`

**TDD steps:**
1. Test that `null` summary returns `null`.
2. Test setup with only home assigned: home is assigned to Internazionale 2002, away is waiting on Milan 2002, and no hidden state is implied.
3. Test setup with both managers assigned: both setup spaces are ready for private preview and lock remains server-owned.
4. Test locked/in-match/complete copy changes state without adding mutations.
5. Run `npx vitest run tests/web/headToHeadPrivateSetupShell.test.ts` and verify RED from missing module.

## Task 2: Implement the pure view model

**Objective:** Add the minimal typed helper that satisfies the view-model tests.

**Files:**
- Create: `src/web/headToHeadPrivateSetupShell.ts`

**TDD steps:**
1. Implement `HeadToHeadPrivateSetupShellViewModel` and helper types.
2. Derive two side cards from public `ReplaySessionLobbySummary` only.
3. Use placeholder fixture clubs: home `Internazionale 2002`, away `Milan 2002`.
4. Rerun focused tests and verify GREEN.

## Task 3: Render the shell in the product route

**Objective:** Wire the helper into `/head-to-head-lobby` without expanding mutation scope.

**Files:**
- Modify: `src/web/HeadToHeadLobbyEntry.tsx`
- Modify: `tests/web/headToHeadLobbyEntry.test.ts`

**TDD steps:**
1. Add route/source/render assertions for the private setup helper, shell heading, privacy copy, sample club names, and existing guardrails.
2. Run `npx vitest run tests/web/headToHeadLobbyEntry.test.ts` and verify RED.
3. Import the helper, derive shell view model, and render a read-only panel after a summary exists.
4. Rerun focused product route tests and verify GREEN.

## Task 4: Mission runner, docs, validation, browser smoke, commit

**Objective:** Record the contract, add mission coverage, and verify the complete slice.

**Files:**
- Create: `docs/60-production-private-setup-shell-contract.md`
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`
- Modify: `scripts/run-mission-tests.ts`

**Validation commands:**

```bash
npx vitest run tests/web/headToHeadPrivateSetupShell.test.ts tests/web/headToHeadLobbyEntry.test.ts
npm run test:missions
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Browser smoke:
- `/head-to-head-lobby`: create, join, lock, kickoff, complete, verify report preview and private setup shell presence.
- Verify the shell remains read-only and does not imply actual submitted hidden choices exist.
- Verify no rematch/restart/new-match buttons are present.
- `/lobby-transition-harness`: still renders controlled harness actions.
- `/lobby-fixtures`: remains button-free.

Commit:

```bash
git add <changed files>
git commit -m "feat: add private setup shell preview"
```
