# Authoritative Resume UI Contract

## Purpose

P16B connects the redesigned Match Lab replay console to the server-authoritative resume endpoint introduced in P15D.

The UI must let a manager compare two different concepts without confusion:

1. **Projected remaining replay** — the existing client-side preview derived from visible events plus manager-command transformations.
2. **Server-authoritative resumed replay** — the server-owned `/api/resume-match` response that verifies visible history and regenerates the remaining match from command-adjusted tactics.

## Browser API client

Module:

```text
src/web/authoritativeResumeClient.ts
```

Primary API:

```ts
resumeMatchFromWeb(request, fetcher?)
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

Endpoint:

```text
POST /api/resume-match
```

The client sends JSON with `content-type: application/json` and throws readable errors using this prefix:

```text
Authoritative resume request failed: ...
```

## Next.js route

Browser-visible route:

```text
app/api/resume-match/route.ts
```

The route delegates to the existing `resumeMatchForApi` module and returns the same body/status as the server API contract.

## Replay console UI

When an interactive replay is active, Match Lab exposes an authoritative resume action. The action submits:

- current seed;
- current replay minute;
- currently visible events;
- recorded manager commands.

The console displays:

- a loading/status line while the request is in flight;
- a readable authoritative-specific error if the server rejects the request;
- a distinct **Server-authoritative replay** panel when output exists.

The authoritative panel must remain separate from:

- `Projected remaining replay`;
- `Command effects`;
- base match diagnostics;
- replay metadata.

## Formatting contract

`formatAuthoritativeReplay(summary)` formats these stable lines:

1. final authoritative score;
2. server-authoritative deterministic signature;
3. authoritative event count;
4. remaining authoritative events after the current pause when a current minute is supplied;
5. server diagnostics.

The event-count and signature lines make it obvious the output is server-owned and deterministic.

## Reset rules

Authoritative output should reset when:

- a new simulation is run;
- interactive replay is restarted;
- a manager command is recorded after a prior authoritative request.

This prevents stale authoritative output from being mistaken for the current command state.

## Non-goals

P16B intentionally does not:

- persist match sessions or command logs;
- add saved match IDs;
- add account/session ownership;
- model away-manager command ownership;
- remove the client projection panel;
- implement real substitutions or player swaps in authoritative commands.
