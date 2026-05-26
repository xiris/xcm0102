# Production Result Report Preview Contract

## Purpose

P18Q adds a read-only post-match report preview to `/head-to-head-lobby` after a head-to-head lobby reaches `complete`. The preview gives the closed product state immediate value without adding rematch, restart, full report pages, persistence migration, accounts, invites, or websocket synchronization.

## Server Summary Contract

`GET /api/replay-sessions/:sessionId` continues to return the lobby summary and now includes compact result metadata:

- `resultPreview.score` — stored initial result score.
- `resultPreview.teams.home` / `resultPreview.teams.away` — team names from stored `baseInput`.
- `resultPreview.stats.home` / `resultPreview.stats.away` — stored match stats from `initialResult`.
- `resultPreview.eventCount` — total stored initial result event count.
- `resultPreview.replay` — replay metadata: seed, engine version, command count.

The summary still must not expose private session internals such as:

- `baseInput`
- `initialResult`
- `visibleEvents`
- `managerCommands`
- `sideManagerCommands`
- `auditLog`

## Browser View-Model Contract

`createHeadToHeadResultReportPreview(summary)` returns `null` unless:

1. `summary.lobbyState === 'complete'`; and
2. `summary.resultPreview` is present.

When present, the view model provides:

- `title: Post-match report preview`
- a scoreline such as `Internazionale 2002 2–1 Milan 2002`
- a winner/draw outcome label
- stat rows for shots, shots on target, possession, and execution
- metadata rows for event count, replay seed, command count, and engine version
- a note that the panel is read-only and rematch/full report pages remain follow-up slices

## Product Route Contract

`/head-to-head-lobby`:

- Renders the report preview only after the current server summary is `complete`.
- Does not render report preview for missing, setup, locked, or in-match summaries.
- Keeps `Complete match` as an in-match-only control.
- Keeps `Kick off match` disabled after leaving `locked`.
- Does not render rematch/restart/new-match branching controls.
- Does not import `LobbyMutationControls`.
- Does not import `applyReplaySessionLobbyTransitionFromWeb`.

## Route Guardrails

- `/lobby-transition-harness` remains the controlled transition smoke route.
- `/lobby-fixtures` remains read-only and button-free.
- This slice does not add authentication, real invite permissions, websockets, persistent DB-backed sessions, private tactic setup, club selection, rematch, or full report pages.

## Validation

P18Q validation includes:

- API summary result-preview contract tests.
- Pure result-report preview view-model tests.
- Product route source/render guard tests.
- Mission suite.
- Full Vitest suite.
- TypeScript typecheck.
- Next build.
- `git diff --check`.
- Browser smoke for `/head-to-head-lobby`, `/lobby-transition-harness`, and `/lobby-fixtures`.
