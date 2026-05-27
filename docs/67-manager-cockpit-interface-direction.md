# Manager Cockpit Interface Direction

## Purpose

The current prototype has proven a server-authoritative head-to-head loop, but the interface still reads like one form after another. This document sets the design direction for evolving XCM0102 toward a manager cockpit: a dense, fast, opinionated football-management workspace that keeps the classic text-first fun while using modern interaction structure.

This is design inspiration only. Do not copy Championship Manager assets, screens, icons, logos, database text, or proprietary UI. The goal is to preserve the workflow feel: fast scanning, high information density, tactical confidence, and readable consequences.

## Product Feeling

The app should feel like a club operations room, not a web form:

- A manager should always know: where am I, what needs my decision, what is locked, what is private, what changed?
- Primary flows should feel like cockpit stations: lobby desk, team setup, match controls, report room.
- The UI should be dense but calm: dark surfaces, clear panels, strong status labels, no decorative clutter.
- Interactions should be staged by task, not dumped as chronological forms.
- Keyboard/mouse speed matters. A user should be able to scan and act quickly.

## First Cockpit Navigation Model

Start with a simple sectional cockpit before full tab state:

1. **Lobby desk** — create/load/join and invite/session identity.
2. **Team setup** — private club/tactic/lineup setup, readiness, redaction, save state.
3. **Match controls** — lock, kickoff, complete, and eventually in-match manager commands.
4. **Report room** — scoreline, result report, stats, audit/history.

This can begin as anchor tabs in the product route, then become true tabs/menus once each station has enough content.

## Visual System Direction

Use a dark, modern, football-operations interface:

- Near-black/green-black canvas with low-glow club-room atmosphere.
- Card/panel hierarchy rather than raw stacked forms.
- Pill navigation and small uppercase station labels.
- High information density using description lists, compact rows, and controlled line lengths.
- Accent colors reserved for real action/status: green for primary forward action, amber for warnings/readiness, red for errors.
- Avoid skeuomorphic paper, direct CM0102 clones, or nostalgic pixel copying.

Influence references:

- **Championship Manager feel:** fast text-driven decisions, dense lists, immediate cause/effect, manager-first workflow.
- **Modern dashboard discipline:** Linear-like dark precision, restrained borders, stacked surfaces, purposeful navigation.
- **Sports desk metaphor:** cockpit/war-room sections rather than marketing-style landing pages.

## Interaction Principles

1. **One dominant next action per station.** Each cockpit station should make the next useful action obvious.
2. **Do not hide server authority.** Server-owned state, locks, submissions, and redaction boundaries should be explicit.
3. **Separate local perspective from identity.** Until auth exists, perspective switch copy must not imply permissions/accounts.
4. **Private information needs hard visual language.** Hidden/revealed/missing private setup states should be visually distinct.
5. **Reduce form fatigue.** Replace repeated article/form cards over time with station layouts: summary rail, action panel, detail workspace.
6. **Keep classic speed.** Do not replace useful dense text with oversized decorative cards.

## Near-Term UI Roadmap

### P18Z: Guarded Product Private Setup Submit UI

- Add first write-capable private setup button in Team setup.
- Introduce cockpit hero and section nav anchors.
- Keep server/privacy copy explicit.

### Next Interface Stabilization Slice

- Convert `/head-to-head-lobby` from a flat sequence of cards into a two-column cockpit:
  - left rail: session, managers, phase, invite code, errors/status;
  - main workspace: selected station content.
- Collapse create/load/join into a Lobby desk station.
- Keep Match controls compact and sticky-ish near the active phase.

### Later Cockpit Slices

- Replace sample setup controls with real lineup/tactic workspace.
- Add true tabs or route segments once station state becomes richer.
- Add manager inbox/news and command feed as right-side rails.
- Add keyboard shortcuts only after actions and state boundaries are stable.

## Current Design Decision

For now, introduce cockpit section anchors and styling without changing route structure too aggressively. This keeps browser smoke stable while moving away from the raw stacked-form feel.

## Acceptance Heuristics

A future UI slice should be considered good only if:

- It reduces visible form-stack fatigue.
- It preserves fast scanability.
- It makes server/private/redacted state more obvious, not less.
- It does not imply auth/permissions before those systems exist.
- It remains browser-smokeable with the existing create -> join -> setup -> lock -> kickoff -> complete loop.
