# Online Modernization

## Online modes

### Solo hosted save
One human manager, server-hosted deterministic save. Useful for cloud saves and testing.

### Private multiplayer world
Friends manage clubs in the same world. Progression can be host-continue, all-ready, scheduled, or hybrid.

### Public competitive league
Strict rules, deadlines, anti-cheat, tactic lock, immutable audit logs, admin tools, and balance presets.

### Head-to-head / versus mode
First-class 1v1 match mode for players who want to compete directly without creating a full season and manually arranging friendlies. Players create a lobby, choose teams/rules, privately set tactics/lineups, lock simultaneously, play the match, and receive a saved match report. This can later expand into brackets, ranked ladders, draft tournaments, and community cups.

### Sandbox/editor world
Custom data, generated databases, historical scenarios, experimental tactics/match engines.

## Progression models

Host continue:
- host/admin advances;
- best for small friend groups.

All-ready:
- active managers mark ready;
- absent managers use holiday mode;
- good for synchronous groups.

Scheduled ticks:
- world advances at fixed real-time windows;
- best for larger async leagues.

Hybrid:
- scheduled by default, host can pause or force with permissions.

## Presence and holiday mode

Manager states:
- online;
- offline;
- ready;
- in match;
- blocked by required action;
- on holiday/assistant control;
- auto-ready until date.

Holiday settings:
- assistant picks team;
- use saved tactic;
- reject bids below threshold;
- renew contracts under limits;
- avoid purchases;
- handle friendlies;
- return from holiday on major event.

## Private information

Keep private:
- tactics before match lock;
- shortlist;
- notes;
- scouting reports;
- hidden attribute knowledge;
- private bids;
- transfer negotiation details unless public;
- board details if configured private.

Public:
- fixtures/results;
- league tables;
- public bids;
- completed transfers;
- lineups after lock/kickoff;
- public player statuses;
- job changes.

## Match participation online

Options:
- live synchronized match room;
- async quick-sim if both managers allow;
- deadline auto-sim using submitted match plans;
- spectator mode after kickoff or after final whistle.

Competitive worlds should have lineup/tactic lock deadlines to avoid last-second information abuse.

## Exploit and balance policy

Classic mode:
- preserve historical power patterns and nostalgia;
- allow super tactics if users want sandbox fun.

Modern-balanced mode:
- tune against universally dominant narrow/DMC/high-press tactics;
- fatigue, cards, injuries, weather, and tactical counters matter;
- monitor tactic diversity and win rates;
- expose balance changes through patch notes.

Competitive mode:
- server-side validation;
- tactic lock;
- audit logs;
- optional restrictions on imported/shared super tactics;
- no client-side hidden data.

## Modern UX requirements

Must-have:
- responsive tables;
- saved views and filters;
- fast global search;
- keyboard shortcuts;
- clear availability flags;
- easy player comparison;
- batch scout/shortlist actions;
- assistant recommendations;
- onboarding hints;
- autosave/version restore;
- dark/light mode.

Nice-to-have:
- lightweight 2D match view;
- shareable match reports;
- league chat/comments;
- alerts/watchlists;
- dashboards;
- public read API for community tools.

## Modding and data updates

Community longevity depends on data and tools.

Support:
- web database editor;
- CSV/JSON import/export;
- generated databases;
- historical database packs;
- validation rules;
- migration/versioning;
- custom leagues/competitions;
- custom tactics sharing;
- community publishing.

Avoid executable patching. Make data/rules first-class and validated.

## Monetization warning

Avoid pay-to-win. Better monetization, if any:
- hosted private worlds;
- larger-world hosting;
- cosmetics/themes;
- premium admin/modding tools;
- legally clean database/scenario packs;
- supporter subscriptions.
