# Game Systems

## Core gameplay loop

1. Read news/inbox.
2. Check squad condition, morale, injuries, bans, and eligibility.
3. Adjust training, scouting, transfers, contracts, or staff.
4. Pick team and tactics.
5. Continue the world calendar.
6. Play/watch match through commentary and stats.
7. React to results, reports, injuries, media, board, and transfer responses.
8. Repeat.

The world advances by dated simulation ticks. A tick can process fixtures, transfer responses, injuries, contract deadlines, training updates, scout reports, board decisions, and news. The game pauses at blocking decisions or matches.

## New game setup

Important settings:
- database: custom/generated/historical/modern;
- database size;
- real or generated players;
- active countries/leagues;
- foreground leagues with full simulation;
- background leagues with lighter simulation;
- attribute masking/fog of war;
- multiplayer mode;
- progression mode: solo continue, host continue, all-ready, scheduled ticks;
- balance preset: classic, modern-balanced, sandbox.

## Manager and club

Manager systems:
- reputation;
- manager points/score;
- career history;
- current club or unemployed;
- job applications/offers;
- sackings/resignations/retirement;
- hall of fame.

Board confidence depends on expectations, league position, form, cup progress, finances, wage discipline, transfers, squad harmony, reputation, tenure, and public job applications.

Club systems:
- finances, transfer budget, wage budget, wage bill;
- stadium capacity and expansion;
- attendance/gate receipts;
- staff;
- senior/reserve/youth squads;
- expectations and history.

## Staff

Assistant manager:
- reserve team;
- holiday/delegation;
- advice and reports.

Coaches:
- training quality;
- player reports;
- tactical familiarity support.

Scouts:
- player, club, region, league, competition, youth, and next-opposition reports.

Physios:
- injury reports;
- recovery estimates;
- medicals;
- rehabilitation/surgery advice.

## Players and attributes

Visible attributes are 1-20 style values: acceleration, aggression, anticipation, balance, creativity/vision, crossing, decisions, determination, dribbling, finishing, flair, heading, influence, jumping, long shots, marking, off the ball, pace, passing, positioning, set pieces, stamina, strength, tackling, teamwork, technique, work rate, plus goalkeeper attributes such as agility, handling, reflexes.

Hidden traits should influence simulation: adaptability, consistency, dirtiness, important matches, injury proneness, loyalty, one-on-ones, pressure, professionalism, sportsmanship, temperament, versatility, relationships, favourite/disliked clubs/staff/players.

Availability flags should be computed and clickable: injured, suspended, wanted, bid pending, retiring, international duty, foreign restriction, ineligible, no work permit, tired, cup-tied, loan-listed, transfer-listed, unhappy, absent, contract expired.

Morale drivers include playing time, squad role promises, being dropped, fines, rejected transfers, contract dissatisfaction, homesickness, conflicts, media, winning/losing, injuries, and ambition.

## Community key-attribute wisdom

Treat as useful scouting heuristics, not absolute formulas.

- General: determination, stamina/natural fitness, positioning, consistency, pressure, important matches, professionalism, and low injury proneness matter.
- GK: handling, reflexes, one-on-ones, positioning, agility, consistency.
- CB: positioning, jumping, tackling, marking, strength, heading, bravery, pace.
- FB/WB: positioning, stamina, pace, tackling, crossing, work rate.
- DMC: positioning, passing, tackling, teamwork, stamina, decisions.
- CM: passing, off the ball, decisions, teamwork, stamina, creativity/vision.
- AM: passing, off the ball, technique, creativity/vision, dribbling, long shots.
- Winger: pace, dribbling, crossing, off the ball, stamina.
- Striker: off the ball, pace, jumping, finishing, heading, anticipation.

## Tactics and match engine

Team instructions:
- mentality: defensive/normal/attacking;
- passing: mixed/direct/short/long;
- tackling: easy/normal/hard;
- pressing;
- offside trap;
- counter attack;
- men behind ball.

Player instructions:
- passing, tackling, pressing;
- pass direction;
- set-piece attack/defense;
- free role;
- forward runs;
- run with ball;
- hold up ball;
- long shots;
- marking;
- crossing;
- through balls.

WIB/WOB should be preserved as an advanced tactical editor: position players in with-ball and without-ball zones. Add visual warnings for gaps, overloads, high-line risk, and poor compactness.

Community tactical meta:
- narrow shapes overperform;
- central overloads are powerful;
- DMC is a very strong role;
- short passing, pressing, hard tackling, and high lines are common strong patterns;
- 4-1-3-2 is iconic;
- super tactics can break challenge.

Match engine inputs: attributes, hidden traits, intrinsic values, position fit, condition, fatigue, morale, form, pressure, tactic, opposition tactic, training familiarity, weather, pitch, referee, home/away context, competition importance, and deterministic randomness.

Match outputs: commentary, goals, shots, cards, injuries, substitutions, ratings, stats, action zones, live table, match report, form/morale/condition changes.

For deeper match-engine architecture, see 07-match-engine-variables.md.

## Training

Training categories:
- fitness;
- tactics;
- skills;
- shooting;
- goalkeeping;
- new position;
- new side.

Intensity levels: none, light, medium, intensive.

Training should trade growth against fatigue and injury risk. Coaches improve category effectiveness. Hidden professionalism/determination/adaptability/versatility influence development and retraining.

Default schedules should exist for keepers, defenders, midfielders, forwards, youth, rehab/fitness, and retraining.

## Scouting and transfers

Fog-of-war knowledge levels:
- unknown;
- reputation/basic profile;
- partial attributes/ranges;
- report with confidence;
- stale report.

Scout reports should include ability, potential, role fit, attribute ranges, personality hints, injury/consistency risk, work permit chance, value/wage estimate, and recommendation.

Transfer bids can include fee, installments, sell-on clause, appearance clauses, exchange player, public/private flag, and future date.

Contract offers include wage, length, bonuses, release clauses, role/status, and clauses. Acceptance depends on wage, role, reputation, playing time, geography, language, ambition, loyalty, happiness, and competing offers.

Loans include duration, wage share, cup eligibility, recall/future fee if modernized, and playing-time expectations.

## News, media, competitions, history

News is the central event bus and inbox. Categories: matches, injuries, suspensions, transfers, contracts, reports, board, morale, media, jobs, competitions, shortlist, finances, multiplayer.

Media should stay lightweight but meaningful. FA interactions include ban appeals, referee complaints, and postponement requests.

Competition rules should be data-driven: schedule, points, tiebreakers, promotion/relegation, playoffs, qualification, subs, eligibility, foreign limits, work permits, registration, cup-tied rules, discipline, prize money.

History is core: match reports, player careers, transfers, injuries, bans, manager history, club records, competition winners, hall of fame.
