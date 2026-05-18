# P16A Match Lab UI Modernization Foundation Plan

> **For Hermes:** Use `test-driven-development` to implement this plan task-by-task.

**Goal:** Give the Match Lab a tested UI structure and first visual pass that feels like a modern, dense football-manager console while avoiding copied CM0102 screens, artwork, logos, data, or text.

**Architecture:** Keep React behavior thin and continue testing pure web view-model contracts first. Add a `matchLabLayoutViewModel` that defines section hierarchy and stat grouping for the screen, then wire `MatchLab.tsx` to those labels/classes and modernize CSS around dark panels, dense tables, status chips, and separated replay/resume/diagnostic areas.

**Tech Stack:** Next.js, React, TypeScript, Vitest, CSS in `app/globals.css`.

---

## Task 1: Lock the UI contract in tests

**Objective:** Define the semantic Match Lab sections and stat table groups before changing JSX/CSS.

**Files:**
- Create: `tests/web/matchLabLayoutViewModel.test.ts`
- Create: `src/web/matchLabLayoutViewModel.ts`

**Steps:**
1. Write failing tests for `createMatchLabLayoutViewModel()` returning hero/setup/team/tactics/console/replay/diagnostic sections.
2. Write failing tests for `groupMatchStatRows(...)` splitting summary, attacking, and tactical stat rows.
3. Run `npx vitest run tests/web/matchLabLayoutViewModel.test.ts` and confirm RED.
4. Implement minimal pure module and confirm GREEN.

## Task 2: Wire the contract into MatchLab

**Objective:** Use tested labels/classes in the React screen without changing match behavior.

**Files:**
- Modify: `src/web/MatchLab.tsx`

**Steps:**
1. Import the layout contract.
2. Add semantic headings/subtitles for setup, team shape, assignments, match console, replay controls, manager commands, projection, diagnostics, and replay metadata.
3. Group stat rows by `groupMatchStatRows`.
4. Keep all existing state transitions, API calls, and manager-command behavior intact.

## Task 3: Apply first visual modernization pass

**Objective:** Improve perceived product quality and readability with original styling.

**Files:**
- Modify: `app/globals.css`

**Steps:**
1. Move from the raw green prototype to a dark console palette: near-black canvas, charcoal panels, subtle borders, lime/amber football accents.
2. Add dense manager-console styles: panel headers, section subtitles, compact tables, pill buttons, result console grids, event-list cards, and status chips.
3. Preserve accessible contrast and responsive grids.
4. Do not copy CM0102 assets, exact layouts, screenshots, icons, or protected copy.

## Task 4: Update docs and mission runner

**Objective:** Make the slice discoverable and keep user-preferred mission validation current.

**Files:**
- Create: `docs/33-match-lab-ui-modernization-contract.md`
- Modify: `docs/README.md`
- Modify: `docs/30-project-handoff-status.md`
- Modify: `scripts/run-mission-tests.ts`

**Steps:**
1. Document UI direction, semantic sections, stat grouping, and limitations.
2. Add the new test as mission 117.
3. Update handoff latest-slice and validation counts.

## Task 5: Validate and commit locally

**Objective:** Prove the slice is safe and store it locally.

**Commands:**
1. Mission-specific: `npx vitest run tests/web/matchLabLayoutViewModel.test.ts`
2. Mission runner: `npm run test:missions`
3. Full suite: `npm test`
4. Typecheck: `npx tsc --noEmit`
5. Build: `npm run build`
6. Browser/console check of the built/dev Match Lab if feasible.
7. `git status --short`
8. `git add ... && git commit -m "feat: modernize match lab layout foundation"`

**Non-goals:**
- No persistence or multiplayer work.
- No remote configuration or push.
- No copying original CM0102 assets or protected UI.
