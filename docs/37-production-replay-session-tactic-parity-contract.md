# Production Replay Session Tactic Parity Contract

## Purpose

P16E closes the authority gap left by P16D: replay sessions must preserve the same Match Lab simulation/tactical payload used to run the visible browser match. A stored session must not silently fall back to the default demo fixture when the browser chose different formations, mentalities, pressing, movement, familiarity, or slot assignments.

## Problem

Before P16E:

- `/api/simulate-match` accepted the full Match Lab tactical payload.
- `/api/replay-sessions` accepted only `{ seed, currentMinute? }`.
- Session-owned authoritative resume reconstructed a default demo input from the seed.

That meant the browser could display one match result from custom tactics while server-owned resume used a different default tactical setup. This is unacceptable for online fairness and future audit logs.

## Contract

### Create-session input

`POST /api/replay-sessions` accepts the same tactical fields as `/api/simulate-match`, plus optional `currentMinute`:

- `seed`
- `homeQuality`, `awayQuality`
- `homeFamiliarity`, `awayFamiliarity`
- `homeMovement`, `awayMovement`
- `homeFormation`, `awayFormation`
- `homeMentality`, `awayMentality`
- `homePressing`, `awayPressing`
- `homeTransitionStyle`, `awayTransitionStyle`
- `homeAssignments`, `awayAssignments`
- `currentMinute?`

Legacy seed-only create requests remain accepted during the transition and use the same defaults as `/api/simulate-match`.

### Shared input builder

Simulation and replay-session creation must share one parser/input-builder path so defaults, validation, teams, tactics, assignments, and sample-squad construction cannot drift.

### Stored session state

A replay session stores:

- seed
- initial result
- authoritative base `MatchInput`
- visible event history
- manager commands
- audit log
- latest authoritative signature

Authoritative resume must use the stored base `MatchInput`, with translated manager commands applied at resume time.

### Browser behavior

Match Lab must send the exact simulation payload it used for `/api/simulate-match` when creating the replay session. Session metadata should continue showing session ID, visible-event count, command count, and errors.

## Compatibility

- Legacy `/api/resume-match` remains available.
- Legacy seed-only `/api/replay-sessions` creation remains available.
- The preferred browser flow after P16E is full-payload session creation followed by command append, visible-event sync, and session-owned resume.

## Acceptance criteria

- A replay session created from a custom tactical payload returns the same initial score/replay metadata as `/api/simulate-match` for that payload.
- Session-owned authoritative resume uses stored custom tactics, not default demo tactics.
- The browser replay-session client posts the full simulation payload when creating a session.
- Match Lab uses one built payload for both simulation and session creation.
- Mission tests and full validation pass.
