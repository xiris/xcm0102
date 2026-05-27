# P19B Product Entry Mode Selector and Cockpit Focus Implementation Plan

> **For Hermes:** Use test-driven-development to implement this plan task-by-task.

**Goal:** Make the new manager cockpit visible from the default product entry route and change the head-to-head cockpit from an all-stations stack into a focused station workspace.

**Architecture:** Add a pure product-entry mode-selector model, render it from `/`, move the existing Match Lab to `/match-lab`, and add local-only active-station state to `/head-to-head-lobby`. Keep all server-owned lobby and private setup behavior unchanged.

**Tech Stack:** Next.js app router, React client components, TypeScript, Vitest, CSS.

---

## Task 1: Product entry model RED/GREEN

**Objective:** Define the root route content as a pure model so `/` can stop rendering the old Match Lab stack.

**Files:**
- Create: `src/web/productEntryModeSelector.ts`
- Test: `tests/web/productEntryModeSelector.test.ts`

**Steps:**
1. Write a failing test expecting title `XCM0102 Manager Console`, two mode cards, `/head-to-head-lobby`, `/match-lab`, and no `Live desk` / `Tactical board` copy.
2. Run `npx vitest run tests/web/productEntryModeSelector.test.ts` and verify RED.
3. Implement the model.
4. Re-run focused test and verify GREEN.

## Task 2: Root route and Match Lab route

**Objective:** Make `/` render the product mode selector and preserve the old simulation lab under `/match-lab`.

**Files:**
- Modify: `app/page.tsx`
- Create: `app/match-lab/page.tsx`
- Test: `tests/web/productEntryModeSelector.test.ts`

**Steps:**
1. Add failing route/source tests that `app/page.tsx` imports the selector and not `MatchLab`, and `app/match-lab/page.tsx` imports `MatchLab`.
2. Run focused test and verify RED.
3. Implement the route split.
4. Re-run focused test and verify GREEN.

## Task 3: Cockpit station focus RED/GREEN

**Objective:** Make `/head-to-head-lobby` show one dominant active station instead of all stations as stacked full panels.

**Files:**
- Modify: `src/web/headToHeadManagerCockpitLayout.ts`
- Modify: `tests/web/headToHeadManagerCockpitLayout.test.ts`
- Modify: `src/web/HeadToHeadLobbyEntry.tsx`
- Modify: `tests/web/headToHeadLobbyEntry.test.ts`

**Steps:**
1. Add a failing model test expecting each station to expose a `defaultActive`/ordered focus model with `Lobby desk` first.
2. Add a failing source test expecting local `activeStationId`, station selector buttons, `cockpit-station-active`, and `hidden` inactive panels.
3. Run focused tests and verify RED.
4. Implement local-only station focus state and active/inactive panel classes.
5. Re-run focused tests and verify GREEN.

## Task 4: Visual CSS

**Objective:** Make the entry selector and focused cockpit visibly distinct.

**Files:**
- Modify: `app/globals.css`

**Steps:**
1. Add CSS for product mode selector cards.
2. Add CSS for station selector active state and inactive hidden panels.
3. Preserve responsive behavior and existing cockpit rail styles.

## Task 5: Docs, missions, validation, commit

**Objective:** Update project docs and verify the full slice.

**Files:**
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`
- Modify: `scripts/run-mission-tests.ts`

**Commands:**

```bash
npx vitest run tests/web/productEntryModeSelector.test.ts tests/web/rootLayout.test.ts tests/web/headToHeadManagerCockpitLayout.test.ts tests/web/headToHeadLobbyEntry.test.ts
npm run test:missions
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Browser smoke:

- `/` shows mode selector and does not show `Live desk` / `Tactical board`.
- `/match-lab` shows existing Match Lab.
- `/head-to-head-lobby` station focus works while create -> join -> save setup -> lock -> kickoff -> complete remains usable.

Commit:

```bash
git add ...
git commit -m "feat: add product entry selector and cockpit focus"
```
