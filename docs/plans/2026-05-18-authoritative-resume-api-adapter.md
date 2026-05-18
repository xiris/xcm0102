# Authoritative Resume API Adapter Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Bridge recorded interactive manager commands into the authoritative resumable match engine through a tested API and web formatting layer.

**Architecture:** Keep the pure P15C `resumeMatchAuthoritatively` module as the simulation boundary. Add a small translator from browser-facing `ManagerCommand` records to typed `MatchCommand` values, then expose a server endpoint that rebuilds the same demo `MatchInput`, validates visible history, and returns an authoritative resumed replay payload. Keep the existing P15B projected replay visible until the authoritative UI is fully polished.

**Tech Stack:** TypeScript, Fastify inject tests, Vitest, Next.js-compatible pure web view-model helpers.

---

## Task 1: Translate UI manager commands to typed authoritative commands

**Objective:** Convert actionable interactive replay command records into `MatchCommand[]` without letting UI-only actions affect the authoritative simulation.

**Files:**
- Create: `src/simulation/authoritativeCommandAdapter.ts`
- Create: `tests/simulation/authoritativeCommandAdapter.test.ts`

**TDD:**
1. Test that `Change mentality` maps to `{ type: 'change_mentality', value: 'attacking' }` for the home side.
2. Test that `Continue` and report/review actions are ignored.
3. Implement the minimal adapter and export it from `src/index.ts`.

## Task 2: Add authoritative resume API endpoint

**Objective:** Provide a server-owned endpoint for authoritative replay resume previews.

**Files:**
- Create: `src/api/authoritativeResumeEndpoint.ts`
- Modify: `src/api/server.ts`
- Modify: `tests/api/server.test.ts`

**TDD:**
1. Test `POST /api/resume-match` returns score/events/diagnostics/signature for valid visible history and commands.
2. Test identical requests produce identical signatures.
3. Test forged visible history is rejected.
4. Implement parsing, demo input reconstruction, command translation, and error handling.

## Task 3: Add web formatting for authoritative resume payloads

**Objective:** Make authoritative results presentable without changing the React UI heavily yet.

**Files:**
- Modify: `src/web/interactiveReplayViewModel.ts`
- Modify: `tests/web/interactiveReplayViewModel.test.ts`

**TDD:**
1. Test authoritative resume formatting includes final score, signature, event count, and server-authoritative diagnostic language.
2. Implement a small formatter and expose an optional `authoritativeReplay` field.

## Task 4: Documentation and mission validation

**Objective:** Preserve project context and user-preferred mission validation.

**Files:**
- Create: `docs/32-production-authoritative-resume-api-contract.md`
- Modify: `docs/31-production-authoritative-resumable-match-engine-contract.md`
- Modify: `docs/30-project-handoff-status.md`
- Modify: `docs/README.md`
- Modify: `scripts/run-mission-tests.ts`

**TDD/Validation:**
1. Add missions 112-116 for translator/API/view formatting.
2. Run targeted tests as they are added.
3. Run `npm run test:missions`, `npm test`, `npx tsc --noEmit`, and `npm run build`.
4. Commit and push after the repository is clean.

## Explicit follow-up after this slice

The next slice should be a UI modernization pass: keep the current football-manager data density, but move toward a modernized CM01/02-inspired visual language with stronger tables, panels, typography, match-console hierarchy, and less prototype/raw styling. Do not copy original game assets, screenshots, logos, or protected text.
