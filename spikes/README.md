# XCM0102 Spikes

Throwaway prototypes to validate risky concepts before committing to the real build.

Recommended first spike sequence:

| # | Spike | Validates | Risk |
|---|-------|-----------|------|
| 001 | match-engine-core | Given two teams with attributes/tactics/context, when we simulate many matches, then outcomes vary plausibly and diagnostics explain why | High |
| 002 | wibwob-movement-load | Given a WIB/WOB tactic with extreme movement, when match ticks run, then players pay fatigue/positioning costs instead of teleporting perfectly | High |
| 003 | head-to-head-lobby | Given two users pick teams and starting tactics, when both pre-match lock and then make live in-match changes, then a deterministic 1v1 match can run, live decisions influence the result, and a report is saved | Medium |
| 004 | tactical-diagnostics-ui | Given match events and stats, when viewing a report, then the user sees useful explanations like fatigue, width exposure, pressing cost | Medium |

Suggested order:
1. Build 001 first because it validates the core simulation model.
2. Build 002 next because WIB/WOB exploit control is one of the biggest differentiators.
3. Build 003 after the match core works.
4. Build 004 when there are enough events to explain.

Initial recommendation:
Start with 001-match-engine-core as a standalone Python CLI under spikes/001-match-engine-core/.
It should avoid web/framework overhead and focus on proving the simulation concept.

Current status:
- 001-match-engine-core created as a Python spike.
- Tests cover deterministic replay, tactical shot distribution, rain/fatigue modifiers, live tactical changes, report explanations, and CLI JSON output.
- Run normal suite with: `python3 -m pytest spikes/001-match-engine-core/tests/test_match_engine.py -q`.
- Run one-by-one mission suite with: `python3 spikes/001-match-engine-core/run_mission_tests.py`.
- Verdict: VALIDATED as a simulation harness, not yet as a realistic football model.

- 002-wibwob-movement-load created as a Python spike using Option A: explicit `zone -> player -> target position` maps.
- Tests cover deterministic replay, movement/fatigue costs, late arrivals, central overload benefits, wide exposure, same-point congestion, DMC degradation, pressing recovery cost, and CLI JSON output.
- Run normal suite with: `python3 -m pytest spikes/002-wibwob-movement-load/tests/test_movement_model.py -q`.
- Run one-by-one mission suite with: `python3 spikes/002-wibwob-movement-load/run_mission_tests.py`.
- Verdict: VALIDATED as the first WIB/WOB data model and movement-load harness.

- 003-integrated-match-and-wibwob created as a Python spike connecting match simulation to Option A WIB/WOB maps.
- Tests cover deterministic integrated replay, central-overload tradeoffs, extreme-movement chance quality, same-point congestion, DMC lateral overload, high pressing late risk, merged reports, and CLI JSON output.
- Run normal suite with: `python3 -m pytest spikes/003-integrated-match-and-wibwob/tests/test_integrated_engine.py -q`.
- Run one-by-one mission suite with: `python3 spikes/003-integrated-match-and-wibwob/run_mission_tests.py`.
- Verdict: VALIDATED as the first proof that explicit WIB/WOB maps can affect match-level events and explanations.

- 004-wib-vs-wob-transitions created as a Python spike separating with-ball and without-ball maps.
- Tests cover deterministic replay, with-ball support, without-ball protection, poor WIB-to-WOB recovery, poor WOB-to-WIB breaks, recovery-run fatigue/late arrivals, transition reports, and CLI JSON output.
- Run normal suite with: `python3 -m pytest spikes/004-wib-vs-wob-transitions/tests/test_transition_engine.py -q`.
- Run one-by-one mission suite with: `python3 spikes/004-wib-vs-wob-transitions/run_mission_tests.py`.
- Verdict: VALIDATED as a transition-state harness, not yet as calibrated football realism.

- 005-transition-attributes-and-familiarity created as a Python spike connecting player attributes and tactical familiarity to transition execution.
- Tests cover deterministic replay, pace/acceleration delay, stamina fatigue, positioning/anticipation WOB recovery, teamwork/decisions counter support, low familiarity penalties, familiarity growth caps, causal reports, and CLI JSON output.
- Run normal suite with: `python3 -m pytest spikes/005-transition-attributes-and-familiarity/tests/test_attribute_transition_engine.py -q`.
- Run one-by-one mission suite with: `python3 spikes/005-transition-attributes-and-familiarity/run_mission_tests.py`.
- Verdict: VALIDATED as an attribute/familiarity execution harness, not yet as calibrated football realism.
