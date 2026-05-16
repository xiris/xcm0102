# Match Engine Variables, Intrinsic Attributes, and WIB/WOB

## Purpose

The match experience is great when results feel like the product of many interacting variables, not one hidden formula. CM0102 has that feeling because player attributes, hidden/intrinsic values, tactics, WIB/WOB positioning, weather, home/away pressure, referee behavior, morale, condition, and randomness all appear to matter.

For a modern version, the goal is not to perfectly clone the old black box. The goal is to preserve the depth and mystery while making the system fairer, more explainable, and less exploitable.

## Research sources added

Additional raw sources saved for this topic:
- research_raw/forum_cm_scout_intrinsic.txt
- research_raw/forum_cm_scout_intrinsic_p2.txt
- research_raw/forum_cm_scout_intrinsic_p3.txt
- research_raw/forum_cm_scout_intrinsic_p4.txt
- research_raw/forum_cm_scout_intrinsic_p5.txt
- research_raw/forum_cm_scout_intrinsic_p6.txt
- research_raw/forum_player_benchmarker.txt
- research_raw/github_player_benchmarker_code.txt
- research_raw/cm0102_tips_weather.txt

These supplement:
- research_raw/manual.txt
- research_raw/forum_key_attributes.txt
- research_raw/forum_wibwob.txt
- research_raw/cm0102_tactics.txt
- research_raw/cm0102_best_tactics.txt
- research_raw/cm0102_tips.txt

## Intrinsic attributes

Community tools and forum research distinguish visible attributes from deeper internal values.

Useful conceptual layers:

1. Visible attribute
   - The familiar 1-20 value shown to the manager.
   - Good for UI and scouting language.

2. Intrinsic attribute
   - A hidden/internal value representing deeper natural strength or weakness.
   - Community tools describe intrinsic values as wider-range internal values, not simply the shown 1-20.
   - These can explain why some ordinary-looking players overperform and some good-looking players underperform.

3. In-match effective value
   - The value the match engine effectively uses after accounting for current ability, age, role, condition, morale, tactic, and context.
   - This value may not be capped in the same way the visible 1-20 attribute is.

4. Scouting/rating estimate
   - What a scout, coach, tool, or UI model thinks the player can do.
   - This should not be identical to the match-engine truth.

Modern design principle:
Do not use visible 1-20 attributes directly as the only match-engine input. Use them as presentation over a deeper effective-attribute model.

## Why intrinsic attributes are useful

They support:
- hidden gems;
- late bloomers;
- cult players;
- scout uncertainty;
- imperfect public knowledge;
- variation between players with similar visible profiles;
- community debate about why a player works.

They also prevent the game becoming solved by simply sorting by visible attributes.

## Flaws to avoid with intrinsic attributes

1. Complete opacity
   - If intrinsic values are totally unknowable, outcomes feel random.
   - Reports, histories, behavior, consistency, and performances should reveal clues.

2. Scout-tool determinism
   - If a single rating exposes the truth, everyone optimizes around that rating.
   - Keep ratings probabilistic and contextual.

3. Linear weighted-score trap
   - Community tools use weighted ratings, but benchmarking suggests real effects are non-linear, thresholded, and interaction-based.
   - A 90% striker rating should not guarantee striker performance in every tactic.

4. Position blindness
   - Attribute ratings alone can overrate players for positions they cannot actually play.
   - Position familiarity, side, foot, role, and tactical behavior must modify effectiveness.

5. Patch/database dependence
   - Old community conclusions depend on patches, tactics, databases, and test environments.
   - Use them as design inspiration, not immutable truth.

## Attribute combinations

The fun comes from combinations, not isolated numbers.

Important interactions to model:

### Creativity + Passing + Decisions
Creativity should not magically create chances without passing execution and decision quality.

Recommended model:
- Creativity/Vision identifies options.
- Decisions selects whether to use them.
- Passing/Technique executes them.
- Off the Ball/Pace of teammates determines whether the option exists.

### Off the Ball + Anticipation + Pace/Acceleration
Attacking movement should require both reading the moment and physically reaching the space.

Useful for:
- runs behind defensive line;
- counter-attacks;
- poaching;
- exploiting through balls;
- late box arrivals.

### Positioning + Anticipation + Decisions
Defensive reliability is not just tackling. A defender or DMC must read danger and stand in useful places before the duel happens.

Useful for:
- holding shape;
- interceptions;
- cover positioning;
- offside trap timing;
- defending crosses;
- screening through balls.

### Heading + Jumping + Strength + Bravery
Aerial play should distinguish:
- reaching the ball;
- competing physically;
- committing to the duel;
- directing the header.

For example:
- Jumping wins access.
- Strength/Bravery contests space.
- Heading determines contact quality.
- Off the Ball/Positioning determines location before the duel.

### Marking + Instruction + Positioning
Marking should matter most when the tactic actually asks the player to mark.

Recommended model:
- Man marking: Marking heavily used.
- Zonal marking: Positioning, Anticipation, Teamwork more important.
- No marking / free role: Marking mostly irrelevant.

### Aggression + Bravery + Tackling + Temperament + Referee
Aggression should increase duel frequency/intensity, not always success.

Possible outcomes:
- more ball wins;
- more fouls;
- intimidation;
- more cards;
- more injuries;
- worse discipline under strict referees.

### Stamina + Work Rate + Tactical Load
High work-rate pressing is only useful if the player has enough stamina and conditioning to sustain it.

Low stamina under high pressing should cause:
- late reactions;
- poorer positioning;
- weaker tackles;
- worse decisions;
- injury risk;
- failure to follow WIB/WOB movement.

### Consistency + Important Matches + Pressure
Performance variance should be player-specific.

- Consistency controls week-to-week variance.
- Important Matches controls high-pressure fixtures.
- Pressure/Temperament controls composure under stress.
- Determination controls response when losing or facing adversity.

## Non-linear attribute curves

Avoid simple additive formulas everywhere.

Use different curve types:

### Linear-ish
Some attributes can provide gradual benefit across the range.
Example: Pace in open-space actions.

### Threshold/penalty
Low values hurt badly; high values are only mildly better than good values.
Example: Technique for a technical role, Work Rate in a pressing role.

### Bonus/ceiling
Only high values unlock special outcomes.
Example: Jumping for a target forward or aerial centre-back.

### Diminishing returns
Stacking many elite attributes should help, but each extra maxed attribute should add less.

This preserves specialist players while preventing perfectly maxed profiles from breaking the engine.

## Player quality model

Recommended layered model:

1. Base player truth
   - visible attributes;
   - intrinsic attributes;
   - hidden traits;
   - CA/PA or equivalent development budget;
   - positions/sides/footedness.

2. Pre-match effective profile
   - condition;
   - fatigue;
   - injury/knock;
   - morale;
   - form/confidence;
   - tactical familiarity;
   - role familiarity;
   - pressure context.

3. In-action effective value
   - base effective profile;
   - current stamina;
   - weather/pitch;
   - opponent pressure;
   - match state;
   - referee/card risk;
   - exact tactical instruction.

4. Outcome resolution
   - non-linear role/action formula;
   - opponent interaction;
   - controlled randomness;
   - event result;
   - feedback to commentary/stats.

## Home and away

Home advantage should not be a flat hidden stat boost.

Model it as context:
- crowd support;
- travel fatigue;
- pitch familiarity;
- pressure expectation;
- referee/crowd influence, if used, only subtle;
- confidence at home;
- hostile away environment.

Interactions:
- inexperienced players may struggle away;
- leaders reduce pressure effects;
- high Determination/Important Matches helps;
- underdogs may feel less pressure;
- home teams may start more proactive, but tactics can override this.

Pitfall:
Do not let home advantage swamp squad quality, tactics, and match events.

## Weather and pitch

Weather should affect action difficulty and fatigue, not just add random chaos.

Suggested dimensions:
- precipitation: dry, drizzle, rain, heavy rain, snow;
- wind: calm, breezy, windy, storm;
- temperature: cold, normal, hot;
- pitch: dry, normal, wet, muddy, frozen;
- visibility: normal, fog, poor.

Effects:
- Wind: hurts long passes, crosses, long shots, clearances, and goalkeeper distribution.
- Rain/wet pitch: hurts first touch, dribbling, turning, and clean passing; increases slips and fatigue.
- Mud/heavy pitch: reduces acceleration and repeated sprints; favors stamina, strength, work rate.
- Heat: increases condition decay, especially pressing/high-tempo systems.
- Cold: can hurt low-work-rate or low-motivation players; may raise muscular injury risk.

Pitfalls:
- Do not make technical players always bad in rain; elite Balance/Technique should mitigate.
- Do not make long ball automatically good in bad weather; wind can punish it.
- Do not create one obvious weather tactic.

## Referee

Referees should have inspectable tendencies.

Suggested attributes:
- strictness;
- foul threshold;
- card threshold;
- advantage tendency;
- penalty strictness;
- dissent tolerance;
- consistency;
- big-match temperament;
- home-crowd susceptibility, optional and subtle.

Interactions:
- Hard tackling + high Aggression/Dirtiness + low Tackling + strict referee = danger.
- Easy tackling reduces cards but concedes physical pressure.
- Repeated fouls should increase scrutiny.
- Yellow-carded players may become less aggressive unless temperament/instructions override.

Pitfall:
Referee effects should be visible through fouls, warnings, commentary, and assistant advice. They should not feel like invisible dice-roll punishment.

## Condition and fatigue

Separate:
- condition: short-term match readiness;
- fatigue: accumulated load across fixtures/training;
- sharpness: readiness from recent play;
- injury risk: probability affected by load, weather, tackles, age, and knocks.

Condition drain inputs:
- Stamina;
- Work Rate;
- role intensity;
- pressing;
- tempo;
- repeated sprints;
- WIB/WOB movement distance;
- weather/pitch;
- age;
- fixture congestion;
- injury status.

Performance effects should be smooth, not a hard cliff:
- high condition: full action range;
- moderate condition: reduced repeated sprints and concentration;
- low condition: slower reactions, poor decisions, bad tackles, injury risk;
- very low condition: player visibly fails to execute demanding instructions.

Important: fatigue should affect mental and tactical execution, not only pace/stamina.

## Morale, form, and pressure

### Morale
Morale should have causes:
- playing time;
- contract satisfaction;
- role promises;
- winning/losing;
- media comments;
- transfer interest;
- teammate/staff conflicts;
- adaptation/homesickness;
- discipline.

Effects:
- effort;
- tactical compliance;
- risk tolerance;
- response to setbacks;
- training application;
- squad cohesion.

### Form
Form should be recent performance plus confidence, not a magic attribute boost.

Track:
- recent ratings;
- opponent-adjusted contribution;
- position-adjusted performance;
- confidence effects.

### Pressure
Pressure is situational.

Inputs:
- derby;
- cup final;
- title/relegation decider;
- board expectation;
- media criticism;
- penalty shootout;
- late lead/trailing state.

Player modifiers:
- Important Matches;
- Determination;
- Influence/Leadership;
- Professionalism;
- experience;
- morale;
- current form.

Pitfall:
Do not confuse morale, form, and pressure. They overlap but should be separate.

## WIB/WOB as tactical intent

WIB/WOB should remain a core feature. It lets managers define with-ball and without-ball shapes zone by zone, which creates a uniquely satisfying tactical-design experience.

But WIB/WOB instructions should be interpreted as intent, not perfect teleportation.

Modern model:
1. Manager defines base formation, WIB zones, WOB zones, instructions, and set pieces.
2. Engine converts them into intent fields: desired shape, passing options, pressing triggers, transition behavior.
3. Players interpret intent based on attributes, role, familiarity, condition, morale, weather, pressure, and opponent actions.
4. Movement is continuous: acceleration, turning, recognition delay, and stamina cost matter.
5. Opponent can detect and exploit spaces.

## WIB/WOB flaws in the original-style meta

Community evidence points to several exploit patterns:
- narrow shapes overperform;
- central overloads dominate;
- DMC can act like a magic shield;
- 1-striker or 3-striker systems may be structurally favored;
- two-defender shapes can work unrealistically;
- pressing + hard tackling + attacking + offside can become too universal;
- AI uses weaker tactical logic than humans;
- downloaded super tactics can let average squads beat elite teams.

These are not reasons to remove WIB/WOB. They are reasons to price movement, compactness, pressing, and risk properly.

## Fixing WIB/WOB without killing it

### No free teleporting
Players move through space. Zone changes create target changes, but players must run, turn, perceive, and decide.

### Movement budget
Every tactic has physical and cognitive load:
- distance from base role;
- repeated transitions;
- pressing distance;
- recovery runs;
- width shifts;
- offside-line coordination.

### Perfect obedience is impossible
Execution depends on:
- Decisions;
- Teamwork;
- Work Rate;
- Stamina;
- Positioning / Off the Ball;
- tactical familiarity;
- morale;
- pressure;
- fatigue.

### Central overloads have tradeoffs
They should create short passing and counter-pressing strength, but expose:
- wide switches;
- far-post crosses;
- fullback overloads;
- blocked central lanes;
- lateral recovery fatigue.

### DMC is powerful, not magical
A DMC should be pulled apart by dual 10s, wide half-space runners, late midfield arrivals, poor positioning, or fatigue.

### High line/offside is risky
Requires:
- Positioning;
- Anticipation;
- Pace;
- communication/leadership;
- tactical familiarity;
- low fatigue.

Failure creates high-quality chances, not minor penalties.

### Pressing is costly
Pressing should generate turnovers but also:
- drain condition;
- create holes if bypassed;
- raise foul/card risk;
- reduce attacking sharpness late;
- require team shape and coordination.

## Tactical load meter

Add a UI diagnostic for each tactic:
- Movement load;
- Pressing load;
- Width balance;
- Rest-defense risk;
- Offside difficulty;
- Build-up congestion;
- Transition exposure;
- Set-piece vulnerability.

This preserves experimentation while making tradeoffs legible.

## Match-day feedback

Managers need actionable feedback:
- commentary reflecting real engine states;
- action zones;
- duel outcomes;
- player ratings with reasons;
- fatigue warnings;
- referee warnings;
- weather notes;
- assistant tactical advice;
- post-match diagnostics.

Examples:
- Your press caused 12 turnovers but cost 18% extra condition.
- Your narrow WIB shape created central shots but conceded 9 wide entries.
- Your offside trap failed 4 times due to low defensive cohesion.
- Your left back stopped reaching the high WIB target after 70 minutes due to fatigue.

## Proposed match-engine architecture

### A. Pre-match context layer
- venue;
- weather forecast;
- pitch;
- referee;
- fixture congestion;
- match importance;
- player morale/form/condition;
- opponent scouting.

### B. Tactical intent layer
- mentality;
- passing;
- pressing;
- tackling;
- line height/offside;
- counter/men behind ball;
- WIB/WOB target zones;
- player instructions;
- set pieces.

### C. Player state layer
- intrinsic attributes;
- visible attributes;
- hidden traits;
- condition;
- fatigue;
- morale;
- confidence;
- pressure response;
- injury/knock;
- card risk;
- tactical familiarity.

### D. Action resolution layer
- action selected based on tactic and situation;
- relevant attribute combination calculated;
- context modifiers applied;
- opponent interaction resolved;
- randomness applied within bounded ranges;
- event generated.

### E. Feedback layer
- commentary;
- stats;
- ratings;
- reports;
- diagnostics;
- persistent match record.

## Implementation recommendation

Build the first match engine around small composable action resolvers:
- pass short;
- pass direct;
- through ball;
- cross;
- dribble;
- tackle;
- press;
- intercept;
- header duel;
- shot;
- save;
- set piece;
- offside check.

Each resolver should declare:
- relevant attributes;
- hidden traits;
- tactical inputs;
- context inputs;
- fatigue effects;
- possible outcomes;
- feedback text/stat hooks.

This makes the engine testable and balanceable.

## Core principle

The manager can ask for anything through tactics and WIB/WOB. The squad, context, opponent, and match state decide whether it actually works.

Preserve:
- many variables;
- hidden depth;
- tactical authorship;
- community debate;
- surprising cult players;
- weather/referee/home/away drama.

Fix:
- free extreme movement;
- perfect obedience;
- one-tactic dominance;
- AI tactical inferiority;
- invisible unfairness;
- single-score optimization.
