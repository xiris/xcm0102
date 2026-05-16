# Head-to-Head and Tournament Mode

## Why this mode matters

CM0102 is often used informally for 1v1 matches and small tournaments, but the original game does not support that as a first-class mode. Players usually need to start a normal save, choose clubs, advance through setup, manually schedule friendlies, and work around season/calendar systems that are irrelevant to the immediate competitive match.

A modern online version should make this use case native: quick, fair, repeatable head-to-head matches with optional tournament structure.

Think of this as the football-manager equivalent of playing someone in FIFA, Street Fighter, chess, or online card games: pick teams, lock lineups/tactics, play the match, record the result, rematch or advance bracket.

## Core product goal

Let two players go from lobby to kickoff in under two minutes, while preserving the CM0102 tactical/team-selection depth that makes the matchup interesting.

## Mode names

Possible product names:
- Quick Match
- Head-to-Head
- Versus Mode
- Tournament Mode
- Challenge Match
- Manager Duel

Recommended structure:
- Head-to-Head: one match or two-legged tie.
- Tournament: bracket/group/league event built from head-to-head matches.

## Head-to-Head flow

1. Create or join match lobby.
2. Choose rules preset.
3. Choose database/squad pool.
4. Choose clubs/teams or draft squads.
5. Optional squad normalization/balance rules.
6. Each player edits lineup, bench, tactics, set pieces, and match plan privately.
7. Both players lock tactics.
8. Match runs live or async.
9. Result, stats, report, and replay/audit log are saved.
10. Players can rematch, switch teams, or return to tournament bracket.

## Lobby settings

Important settings:
- match type: single match, two-legged tie, best-of-3, best-of-5;
- match length/speed;
- extra time and penalties;
- home advantage on/off;
- neutral venue on/off;
- weather: random, fixed, disabled, tournament-defined;
- referee strictness: random/fixed;
- injuries: none, match-only, persistent within tournament;
- suspensions/cards: none, match-only, persistent within tournament;
- player condition: reset to 100%, realistic, tournament-persistent;
- morale/form: neutral, club default, tournament-persistent;
- tactics: basic only, advanced WIB/WOB allowed, shared presets allowed/forbidden;
- match engine preset: classic, balanced, experimental;
- hidden attributes: visible, masked, scout-report-only;
- team selection: real clubs, generated teams, draft, equalized teams, custom squads;
- spectators: public/private;
- result visibility and sharing.

## Team selection models

### Real club selection
Players choose existing clubs from a database. Simple and nostalgic, but can be unbalanced.

Balance options:
- mirror match allowed;
- alternating home/away legs;
- team rating bands;
- underdog handicap;
- banlist for overpowered clubs;
- random team draw from a tier.

### Equalized club mode
Use real club identities/squads but normalize condition, morale, and optionally budgets/forms. Good for quick casual play.

### Draft mode
Players draft from a player pool.

Variants:
- snake draft;
- auction draft;
- salary-cap draft;
- random pack draft;
- position-constrained draft.

Draft mode creates a more esport-like competitive format and avoids everyone picking the same club.

### Custom squad mode
Players import or build squads. Best for community tournaments, fantasy leagues, and experiments. Requires validation rules.

### Mirror mode
Both players use the same team/squad. Best for pure tactical comparison.

## Pre-match privacy, lock, and live changes

"Lock" does not mean the whole result is decided before kickoff. It only means the pre-match starting state is frozen fairly for both players.

Before lock:
- tactics are private;
- lineups are private unless rules expose them;
- set pieces and WIB/WOB are private;
- submitted match plan can be changed freely.

When both players lock:
- starting lineups are frozen;
- starting tactic snapshots are frozen;
- set-piece assignments are frozen;
- bench selections are frozen;
- both teams reveal simultaneously, depending on rules;
- server records a deterministic match seed and initial state.

During the match:
- managers can still make substitutions;
- managers can still change mentality, passing, tackling, pressing, counter, offside, etc.;
- managers can switch to another saved tactic;
- managers can adjust player instructions;
- managers can react to cards, injuries, weather, fatigue, match stats, ratings, and opposition changes;
- those live changes influence the rest of the match simulation.

The result should not be predetermined before kickoff. The match is deterministic only in the technical sense that, given the same starting state, same random seed, and same sequence/timing of live manager decisions, the server can reproduce the same result for audit/replay.

Optional final adjustment phase:
- after lineup reveal, each manager gets one short timed window to adjust before kickoff;
- useful for competitive play, but slower than instant kickoff.

## Live match interaction

Options:
- fully live: both managers can make tactical changes/subs during match;
- pause windows: changes allowed at half-time and defined stoppages only;
- async plan-only: both submit match plans and the server simulates;
- hybrid: live if both present, auto-plan if a player disconnects.

For tournaments, define timeout rules:
- per-player pause budget;
- substitution decision timer;
- disconnect grace period;
- auto-assistant fallback.

## Tournament formats

Supported formats should grow over time.

MVP:
- single-elimination bracket;
- best-of-1 or two-legged ties;
- manual seeding;
- invite links;
- automatic result advancement.

Next:
- double elimination;
- round robin/group stage;
- Swiss;
- league table;
- best-of-N series;
- third-place match;
- qualifiers into knockout bracket.

Advanced:
- draft tournaments;
- salary-cap tournaments;
- club tier restrictions;
- persistent injuries/cards/condition across tournament;
- transfer/draft windows between rounds;
- spectator prediction/brackets;
- ELO/rating ladder;
- seasonal cups.

## Tournament admin tools

Admins need:
- create/edit event;
- invite players;
- seed bracket;
- set deadlines;
- force result/forfeit;
- pause/resume event;
- replace player;
- view audit logs;
- resolve disputes;
- export results;
- publish match reports.

## Result and audit model

Each head-to-head match should store:
- rules preset;
- database version;
- team/squad snapshots;
- locked tactics and lineups;
- random seed;
- match events;
- substitutions/tactical changes;
- final stats;
- disconnects/timeouts;
- chat/admin actions if used;
- result confirmation state.

This allows:
- replay/debugging;
- dispute resolution;
- anti-cheat checks;
- highlight reports;
- tournament history.

## Balance and fairness concerns

1. Team strength imbalance
   - solve with tiers, mirror mode, draft, salary cap, or random draw.

2. Super tactics
   - allow in casual classic mode;
   - restrict or balance in competitive presets;
   - optionally ban imported tactics and require manual tactic creation.

3. Hidden attributes
   - for head-to-head, hidden data can create unfair knowledge gaps.
   - competitive modes may use visible attributes, standardized reports, or generated teams.

4. Randomness
   - football needs variance, but tournaments need trust.
   - use server-side deterministic seeds and audit logs.

5. Disconnects/stalling
   - use timers, pause budgets, assistant fallback, and forfeit rules.

6. Persistent injuries/cards
   - fun for tournaments, bad for quick casual matches.
   - make persistence a rules setting.

## MVP version

The first implementation can be small:
- create 1v1 lobby;
- choose two clubs from one database;
- reset condition/morale to neutral;
- choose single match or two-legged tie;
- private lineup/tactic setup;
- simultaneous lock;
- live text match or server quick-sim;
- match report/result page;
- rematch button.

No need initially for:
- draft;
- brackets;
- ratings;
- spectators;
- persistent injuries/cards;
- custom squads;
- complex admin tools.

## Later iteration ideas

- Ranked 1v1 ladder.
- Weekend cups.
- Community-hosted tournaments.
- Team draft and auction draft.
- Salary cap squad building.
- Mirror tactical duels.
- Best-of-series with side switching.
- Prebuilt challenge scenarios.
- Historical squads/tournaments.
- Spectator mode with match chat.
- Shareable match reports and highlights.
- Tournament API/export.
- Elo/Glicko manager ratings.
- Anti-meta seasonal balance patches.

## Design principle

This mode should not require the normal career/calendar layer. It should reuse the same players, tactics, match engine, and reports, but wrap them in a lightweight competitive shell optimized for immediate human-vs-human play.
