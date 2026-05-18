# Production Authoritative Resumable Match Engine Contract

## Purpose

P15C adds the first pure authoritative resumable match-engine foundation.

Unlike the P15B projection layer, this module regenerates future match events by rerunning the deterministic simulation with command-adjusted tactical input. It still preserves already-visible events exactly, so the user never sees history rewritten after advancing the replay.

## Module

```text
src/simulation/authoritativeResume.ts
```

Primary API:

```ts
resumeMatchAuthoritatively({ baseInput, currentMinute, visibleEvents, commands })
```

Input:

- `baseInput`: original serializable `MatchInput` used for the match.
- `currentMinute`: current interactive replay minute.
- `visibleEvents`: events already shown to the user; these are preserved byte-for-byte and order-for-order.
- `commands`: typed authoritative `MatchCommand[]` values.

Output:

- `events`: visible events followed by regenerated future events after `currentMinute`.
- `score`: score recalculated from the merged event timeline using `baseInput.home.id` and `baseInput.away.id` rather than literal side labels.
- `stats`: regenerated deterministic stats from the command-adjusted simulation.
- `report`: regenerated diagnostics plus command-application and preservation notes.
- `signature`: deterministic resume signature built from seed, pause minute, commands, and event count.

## Determinism rule

The same base input, current minute, visible event list, and command list must produce the same result and signature.

The signature includes a deterministic `vh-...` hash of the preserved visible event history so equal event counts with different visible content do not collide silently.

The module does not use wall-clock time, browser state, or client-owned randomness.

## Visible history preservation

Events in `visibleEvents` are copied into the resumed timeline exactly as provided after being checked against the server-owned original deterministic simulation.

For P15C, the supplied visible history must exactly match `simulateMatch(baseInput).events.filter(event.minute <= currentMinute)`. If it differs in length, order, minute, team, type, chain metadata, or description, the module throws instead of scoring forged or accidentally mismatched history.

Regenerated events are only taken from the deterministic rerun when their minute is greater than `currentMinute`.

This means command-adjusted reruns can change future pressure, condition, and chance events without altering what the manager has already seen.

## Command handling in P15C

The first authoritative command bridge supports the typed domain commands already present in `MatchCommand`:

- `change_mentality`
- `change_pressing`
- `change_transition_style`

Each command is applied to the matching team's cloned tactic before rerunning `simulateMatch`.

`MatchCommand` is a discriminated union, so normal TypeScript callers can only pair a command type with the correct value family. The resume module also validates command values at runtime and ignores invalid type/value pairs if untrusted data is cast into the shape.

Diagnostics explicitly state which command was applied, for example:

```text
50’ home change_pressing command set pressing to high for regenerated future simulation.
```

## Relationship to P15B projection

P15B remains the browser-facing projected replay section for current interactive manager-command labels.

P15C establishes the server-authoritative pure simulation path that can replace projection-layer event transforms later. P15D adds the first API/view-model adapter around that path:

- `src/simulation/authoritativeCommandAdapter.ts` translates current UI `ManagerCommand` records into typed `MatchCommand[]` values.
- `POST /api/resume-match` reconstructs the demo match input, validates visible history, and returns authoritative resumed events plus a deterministic signature.
- `formatAuthoritativeReplay(...)` gives the web layer a tested text contract for server-authoritative resumed output.

The P15B projection display should stay visible until the next UI pass cleanly presents both projected and authoritative concepts.

## Current limitations

P15D intentionally does not yet:

- persist resumable sessions in a database;
- expose saved match IDs or arbitrary persisted match input;
- model substitutions as real personnel changes;
- split the engine into minute-by-minute state checkpoints;
- guarantee regenerated stats are only post-pause stats;
- distinguish home/away manager ownership in the current single-manager Match Lab payload.

## Next transition

The next slice should improve the raw Match Lab UI into a modernized CM01/02-inspired manager interface: dense but readable panels, stronger table hierarchy, match-console presentation, and clearer separation between projected and authoritative replay. Do not copy original game assets, exact screens, logos, or protected text.
