# Stabilization Fixes Pass Plan

> **For Hermes:** Use systematic-debugging for each concrete defect and test-driven-development for every behavior change.

**Goal:** Pause feature expansion after P15A and harden the interactive replay/manager-command slice before deeper match-regeneration work.

## Fix targets

1. Audit the current surface before changing code:
   - git status and recent commits
   - TODO/FIXME markers
   - interactive replay UI in browser
   - docs index and mission runner shape

2. Prevent duplicate manager-command spam:
   - repeated clicks on the same manager option at the same pause should not create duplicate command records
   - command IDs should remain deterministic and sequential for distinct decisions
   - duplicate prevention should happen in the pure command-history helper, not only in React

3. Treat `Continue` as navigation-only everywhere:
   - the pure helper already ignores plain `Continue`
   - the UI should not render the plain `Continue` option as a manager-command button because there is already a dedicated replay navigation button

4. Improve command-effects presentation:
   - keep command history visible
   - keep projected effect diagnostics visible
   - make the no-command projected state explicit and readable

5. Validate through mission tests, full suite, typecheck, build, and browser interaction.

## Acceptance criteria

- Duplicate same-action/same-minute/same-event clicks produce one command record.
- Distinct actions at the same pause still append as separate records.
- Plain `Continue` manager actions are omitted from the UI manager-action button group.
- The dedicated `Continue to next key event` replay button remains available.
- `npm run test:missions` passes.
- `npm test` passes.
- `npx tsc --noEmit` passes.
- `npm run build` passes.
- Browser check confirms no duplicate command record after double-clicking a manager action.
