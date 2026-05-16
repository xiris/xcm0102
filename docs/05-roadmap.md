# Implementation Roadmap

## Phase 0 — Prototype decisions

Decide:
- fictional/generated data vs licensed/open data;
- solo-first or multiplayer-first;
- classic feel vs modern-balanced match engine;
- tech stack;
- event architecture;
- licensing boundaries.

Deliverables:
- initial schema;
- command/event list;
- calendar prototype;
- fixture generator prototype;
- UI navigation skeleton.

## Phase 1 — Playable vertical slice

Goal: one league, small database, one human manager, full loop from squad to match to table.

Scope:
- clubs, players, basic staff;
- one competition schedule;
- manager creates save and chooses club;
- squad screen;
- basic tactics;
- team selection;
- text match simulation;
- fixtures/results/table;
- injuries/cards/basic morale;
- news inbox;
- save/load.

Success criterion:
- A user can play a full season quickly and understand what happened.

## Phase 1A — Head-to-head prototype

This can be built before full online career multiplayer because it reuses the match engine without requiring the normal career/calendar layer.

Scope:
- create 1v1 lobby;
- choose two clubs from one database;
- reset condition/morale to neutral;
- single match or two-legged tie;
- private lineup/tactic setup;
- simultaneous pre-match lock for starting lineup, bench, set pieces, and initial tactic;
- live in-match substitutions and tactical changes still influence the simulation;
- server match simulation or live text match;
- match report/result page;
- rematch button.

Success criterion:
- Two players can go from lobby to kickoff quickly without starting a season or scheduling friendlies manually.

## Phase 2 — Recruitment economy

Scope:
- player search;
- shortlist;
- scouting-lite/fog-of-war;
- transfer bids;
- contract negotiation;
- free transfers;
- loans;
- transfer windows;
- finances-lite and wage budget;
- basic AI squad building.

Success criterion:
- Recruitment feels like a treasure hunt, not a static list of known best players.

## Phase 3 — Training, staff, board, career

Scope:
- training routines;
- coach assignments;
- attribute growth/decline;
- physio reports;
- assistant reports;
- board confidence;
- job security;
- sackings/resignations/job applications;
- manager history/hall of fame.

Success criterion:
- Long-term career consequences exist beyond match results.

## Phase 4 — Advanced tactics and richer match engine

Use 07-match-engine-variables.md as the design reference for intrinsic attributes, context variables, non-linear attribute interactions, and WIB/WOB exploit fixes.

Scope:
- player instructions;
- set pieces;
- WIB/WOB zone editor;
- weather/referee effects;
- tactical familiarity;
- action zones;
- better ratings/stat generation;
- post-match explanations.

Success criterion:
- Tactical changes are meaningful, but one exploit does not dominate balanced mode.

## Phase 5 — Online multiplayer

Scope:
- accounts;
- hosted worlds/lobbies;
- invites;
- ready/continue flow;
- holiday mode;
- private manager state;
- match lock/submission deadlines;
- deterministic server simulation;
- audit logs;
- admin controls.

Success criterion:
- A group can run an async league without manual coordination chaos.

## Phase 6 — Modding and community

Scope:
- database editor;
- import/export;
- custom leagues/rules;
- tactics sharing;
- database packs;
- validation/migration;
- public read API if useful.

Success criterion:
- Community can keep the game alive without modifying code.

## MVP cut line

Include:
- one league;
- players with attributes/positions/contracts;
- squad/team selection;
- basic tactics;
- match sim/commentary;
- league table/fixtures;
- transfers/contracts/free agents;
- scouting-lite;
- news inbox;
- finances-lite;
- save progression;
- optional 1v1 head-to-head lobby if multiplayer is prioritized early.

Defer:
- full global database;
- every real competition rule;
- advanced media/agents;
- 3D match engine;
- deep youth academy;
- mobile apps;
- public marketplace.

## Open questions

1. Should the first database be fictional, generated, or licensed/open?
2. Should the match engine target exact CM0102-like outcomes or just the feel?
3. How much hidden attribute information should scouting reveal?
4. How strict should competitive-mode tactic balancing be?
5. Should online worlds be scheduled simulations or mostly user-advanced saves?
6. How deep should finances go before slowing the game?
7. What minimum editor will let the community grow safely?
8. Should head-to-head be casual-first, competitive-first, or both from the beginning?
9. Should 1v1 use real clubs, mirror teams, draft squads, or generated balanced teams first?
