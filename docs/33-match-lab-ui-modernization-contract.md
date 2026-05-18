# Match Lab UI Modernization Contract

## Purpose

P16A starts the first UI-quality pass after the authoritative resume work. The goal is to make Match Lab feel like a serious football-manager console: dense, readable, tactical, and modern in the browser.

This slice is inspired by the category of classic football-management screens, but it must not copy CM0102 protected assets, exact layouts, icons, logos, screenshots, database content, or manual text. The implementation uses original CSS, labels, and component structure.

## Scope

P16A adds a tested UI layout/view-model contract for:

- hero/introduction copy;
- setup controls;
- team shape previews;
- player assignment/tactical board areas;
- match console result hierarchy;
- replay controls;
- manager command history;
- projected remaining replay;
- diagnostics;
- replay metadata.

The React screen can use this contract to keep labels, CSS hooks, and stat grouping stable while the visual treatment evolves.

## Module

```text
src/web/matchLabLayoutViewModel.ts
```

Primary APIs:

```ts
createMatchLabLayoutViewModel()
groupMatchStatRows(rows)
```

## Section contract

The layout view-model exposes these stable sections:

| ID | Title | Purpose |
| --- | --- | --- |
| `setup` | Match setup | Seed, quality, formations, tactical sliders, and movement controls. |
| `team-shape` | Team shape | Formation-line previews for both teams. |
| `assignments` | Player assignments | Visual pitch, roster chips, role suitability, and slot dropdowns. |
| `match-console` | Match console | Scoreline and grouped match statistics. |
| `replay-controls` | Replay controls | Interactive replay navigation. |
| `manager-commands` | Manager commands | Recorded manager interventions. |
| `projection` | Projected remaining replay | Client-side projection display kept separate from authoritative replay work. |
| `diagnostics` | Diagnostics | Manager-readable explanation lines. |
| `replay-metadata` | Replay metadata | Seed, engine version, command count, and deterministic replay metadata. |

## Stat grouping contract

Match stat rows are grouped into manager-readable categories:

- `summary`: possession and goals;
- `attacking`: shots and shots on target;
- `tactical`: transition delay, late arrivals, and other tactical/execution rows.

This keeps the table dense without flattening every number into a single undifferentiated list.

## Visual direction

The P16A visual treatment should use:

- near-black/charcoal canvas and panels;
- subtle borders and luminance stacking for panel hierarchy;
- lime and amber accents for football-manager status rather than brand mimicry;
- compact tables and high information density;
- clear separation between projected replay, authoritative/server-owned output, diagnostics, and metadata;
- responsive grids that remain usable on narrower screens.

## Current limitations

P16A intentionally does not:

- redesign the full product navigation shell;
- add persistence, saves, accounts, or multiplayer;
- replace projected replay with authoritative UI submission;
- introduce licensed assets or exact CM0102 screen reproductions;
- add visual regression screenshots as tests.

## Next likely slices

After this foundation, likely follow-ups are:

1. Connect the UI to `/api/resume-match` so the authoritative resume preview is visible from the replay console.
2. Split Match Lab into smaller React components once layout stabilizes.
3. Add session persistence for match/replay command logs.
