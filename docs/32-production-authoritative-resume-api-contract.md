# Production Authoritative Resume API Contract

## Purpose

P15D connects the pure authoritative resumable match engine to an API/view-model adapter. The slice keeps the existing projected replay UI available, but adds a server-owned path that can accept visible replay history plus recorded manager commands and return a deterministic authoritative resumed timeline.

## API endpoint

```text
POST /api/resume-match
```

Request body:

```ts
{
  seed: number;
  currentMinute: number;
  visibleEvents: MatchEvent[];
  managerCommands: ManagerCommand[];
}
```

Current P15D scope uses the same demo Inter/Milan fixture reconstruction as `/api/simulate-match`. This deliberately avoids adding persistence before the resume contract is proven.

Response body:

```ts
{
  authoritative: true;
  score: { home: number; away: number };
  stats: MatchStats;
  events: MatchEvent[];
  diagnostics: string[];
  replay: MatchReplayMetadata;
  signature: string;
}
```

## Validation

The endpoint rejects:

- non-object request bodies;
- missing or non-integer `seed`;
- `currentMinute` values outside `0..90`;
- non-array or malformed `visibleEvents`;
- non-array or malformed `managerCommands`;
- visible event history that does not match the server-owned deterministic original simulation up to `currentMinute`.

Forged visible history fails through `resumeMatchAuthoritatively`, so the API does not score client-owned fabricated goals or events.

## Manager command translation

Module:

```text
src/simulation/authoritativeCommandAdapter.ts
```

Primary API:

```ts
translateManagerCommandsToMatchCommands(commands, teamId)
```

Supported P15D mappings:

| UI manager action | Authoritative command |
| --- | --- |
| `Change mentality` | `change_mentality: attacking` |
| `Change pressing` | `change_pressing: high` |
| `Lower tempo/pressing` | `change_pressing: low` |
| `Adjust defensive line` | `change_transition_style: hold_shape` |
| `Reduce pressing or change mentality` | `change_pressing: low` plus `change_mentality: defensive` |

Ignored UI-only actions:

- `Continue`
- `Review formation`
- `Review match report`
- other unmapped actions such as current substitution placeholders

The adapter preserves command order and command minutes. P15D assumes the command belongs to the local/home manager because the current Match Lab is single-manager. Multiplayer/away-manager attribution should be added with session ownership later.

## Web formatting

Module:

```text
src/web/interactiveReplayViewModel.ts
```

`formatAuthoritativeReplay(...)` formats:

- authoritative final score;
- deterministic server signature;
- authoritative event count;
- resume diagnostics.

The current React screen can continue showing projected replay while this formatter gives the next UI slice a tested, stable display contract for authoritative replay output.

## Current limitations

P15D intentionally does not yet:

- persist match sessions or command logs;
- expose arbitrary saved match IDs;
- model substitutions as real personnel changes;
- distinguish home/away manager command ownership in UI payloads;
- replace the raw Match Lab styling;
- remove the P15B projection display.

## Next slice

The next recommended slice is a UI modernization pass: make Match Lab feel like a modernized CM01/02-inspired manager screen with dense tables, panels, match-console hierarchy, and stronger visual structure while avoiding copied protected assets or exact original UI reproduction.
