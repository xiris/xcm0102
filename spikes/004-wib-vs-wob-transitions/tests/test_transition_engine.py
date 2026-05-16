import json
import subprocess
import sys
from pathlib import Path

from transition_engine import (
    BallStep,
    Phase,
    Player,
    Position,
    Team,
    TransitionContext,
    WibMap,
    WibWobBook,
    WobMap,
    Zone,
    simulate_transition_match,
)

DEF_LEFT = Zone("defensive", "left")
MID_LEFT = Zone("middle", "left")
MID_CENTER = Zone("middle", "center")
MID_RIGHT = Zone("middle", "right")
ATT_CENTER = Zone("attacking", "center")
ATT_RIGHT = Zone("attacking", "right")


def make_team(name: str, *, attack=12, midfield=12, defense=11, stamina=11):
    return Team(
        name=name,
        players=[
            Player("DL", "DL", attack=7, defense=defense, pace=11, stamina=stamina, positioning=12, teamwork=11, anticipation=11),
            Player("DC1", "DC", attack=6, defense=defense + 2, pace=10, stamina=stamina, positioning=13, teamwork=11, anticipation=12),
            Player("DC2", "DC", attack=6, defense=defense + 2, pace=10, stamina=stamina, positioning=13, teamwork=11, anticipation=12),
            Player("DR", "DR", attack=7, defense=defense, pace=11, stamina=stamina, positioning=12, teamwork=11, anticipation=11),
            Player("DMC", "DMC", attack=8, defense=defense + 2, pace=10, stamina=stamina + 1, positioning=15, teamwork=13, anticipation=14),
            Player("MC1", "MC", attack=midfield, defense=defense, pace=12, stamina=stamina + 1, positioning=12, teamwork=13, anticipation=12),
            Player("MC2", "MC", attack=midfield, defense=defense, pace=12, stamina=stamina + 1, positioning=12, teamwork=13, anticipation=12),
            Player("AML", "AML", attack=attack, defense=7, pace=14, stamina=stamina, positioning=10, teamwork=10, anticipation=11),
            Player("AMR", "AMR", attack=attack, defense=7, pace=14, stamina=stamina, positioning=10, teamwork=10, anticipation=11),
            Player("FC1", "FC", attack=attack + 2, defense=5, pace=13, stamina=stamina, positioning=11, teamwork=10, anticipation=10),
            Player("FC2", "FC", attack=attack + 2, defense=5, pace=13, stamina=stamina, positioning=11, teamwork=10, anticipation=10),
        ],
    )


def base_wib(name="balanced-wib", pressing=10):
    positions = {}
    for zone, x_shift in [(DEF_LEFT, -8), (MID_LEFT, -2), (MID_CENTER, 0), (MID_RIGHT, 5), (ATT_CENTER, 8), (ATT_RIGHT, 10)]:
        positions[zone] = {
            "DL": Position(22 + x_shift, 20),
            "DC1": Position(25 + x_shift, 42),
            "DC2": Position(25 + x_shift, 58),
            "DR": Position(22 + x_shift, 80),
            "DMC": Position(38 + x_shift, 50),
            "MC1": Position(50 + x_shift, 42),
            "MC2": Position(50 + x_shift, 58),
            "AML": Position(63 + x_shift, 30),
            "AMR": Position(63 + x_shift, 70),
            "FC1": Position(76 + x_shift, 45),
            "FC2": Position(76 + x_shift, 55),
        }
    return WibMap(name=name, positions_by_zone=positions, pressing=pressing)


def attacking_overload_wib():
    tactic = base_wib("attacking-overload", pressing=13)
    positions = {zone: dict(players) for zone, players in tactic.positions_by_zone.items()}
    positions[ATT_CENTER] = {
        "DL": Position(50, 38),
        "DC1": Position(48, 45),
        "DC2": Position(48, 55),
        "DR": Position(50, 62),
        "DMC": Position(60, 50),
        "MC1": Position(68, 45),
        "MC2": Position(68, 55),
        "AML": Position(78, 47),
        "AMR": Position(78, 53),
        "FC1": Position(88, 48),
        "FC2": Position(88, 52),
    }
    return WibMap("attacking-overload", positions, pressing=13)


def extreme_attacking_wib():
    tactic = base_wib("extreme-attacking", pressing=14)
    names = sorted(next(iter(tactic.positions_by_zone.values())).keys())
    positions = {zone: dict(players) for zone, players in tactic.positions_by_zone.items()}
    positions[ATT_CENTER] = {name: Position(90, 50) for name in names}
    positions[MID_RIGHT] = {name: Position(72, 84 - idx * 6) for idx, name in enumerate(names)}
    return WibMap("extreme-attacking", positions, pressing=14)


def compact_wob(name="compact-wob", pressing=10):
    positions = {}
    for zone, x_shift in [(DEF_LEFT, -8), (MID_LEFT, -3), (MID_CENTER, 0), (MID_RIGHT, 3), (ATT_CENTER, 5), (ATT_RIGHT, 8)]:
        positions[zone] = {
            "DL": Position(26 + x_shift, 28),
            "DC1": Position(28 + x_shift, 44),
            "DC2": Position(28 + x_shift, 56),
            "DR": Position(26 + x_shift, 72),
            "DMC": Position(40 + x_shift, 50),
            "MC1": Position(48 + x_shift, 43),
            "MC2": Position(48 + x_shift, 57),
            "AML": Position(56 + x_shift, 35),
            "AMR": Position(56 + x_shift, 65),
            "FC1": Position(66 + x_shift, 45),
            "FC2": Position(66 + x_shift, 55),
        }
    return WobMap(name=name, positions_by_zone=positions, pressing=pressing)


def loose_wob():
    tactic = compact_wob("loose-wob", pressing=6)
    positions = {zone: dict(players) for zone, players in tactic.positions_by_zone.items()}
    for zone in positions:
        positions[zone]["DL"] = Position(26, 12)
        positions[zone]["DR"] = Position(26, 88)
        positions[zone]["AML"] = Position(68, 14)
        positions[zone]["AMR"] = Position(68, 86)
        positions[zone]["DMC"] = Position(52, 50)
    return WobMap("loose-wob", positions, pressing=6)


def high_mismatch_book():
    return WibWobBook(wib=extreme_attacking_wib(), wob=compact_wob("deep-compact", pressing=12), transition_style="slow-recover")


def balanced_book():
    return WibWobBook(wib=base_wib(), wob=compact_wob(), transition_style="balanced")


def overload_book():
    return WibWobBook(wib=attacking_overload_wib(), wob=compact_wob(), transition_style="balanced")


def loose_defense_book():
    return WibWobBook(wib=base_wib(), wob=loose_wob(), transition_style="balanced")


def counter_poor_book():
    return WibWobBook(wib=base_wib(), wob=compact_wob(), transition_style="slow-break")


def context(steps=None):
    return TransitionContext(
        weather="normal",
        home_advantage=1.05,
        steps=steps
        or [
            BallStep(1, DEF_LEFT, Phase.HOME_IN_POSSESSION),
            BallStep(2, MID_CENTER, Phase.HOME_IN_POSSESSION),
            BallStep(3, ATT_CENTER, Phase.HOME_IN_POSSESSION),
            BallStep(4, MID_RIGHT, Phase.AWAY_IN_POSSESSION),
            BallStep(5, MID_CENTER, Phase.AWAY_IN_POSSESSION),
            BallStep(6, ATT_RIGHT, Phase.HOME_IN_POSSESSION),
            BallStep(7, ATT_CENTER, Phase.HOME_IN_POSSESSION),
        ],
    )


def simulate(home_book, away_book, *, seed=77, steps=None):
    return simulate_transition_match(
        make_team("Home", attack=13, midfield=13, defense=11),
        make_team("Away", attack=11, midfield=11, defense=11),
        home_book,
        away_book,
        context(steps),
        seed=seed,
    )


def test_same_seed_same_wib_wob_maps_replay_identically():
    first = simulate(overload_book(), balanced_book(), seed=101)
    second = simulate(overload_book(), balanced_book(), seed=101)

    assert first.score == second.score
    assert first.events == second.events
    assert first.team_stats == second.team_stats
    assert first.transition_diagnostics == second.transition_diagnostics


def test_with_ball_overload_improves_attacking_support_while_possession_is_retained():
    balanced = simulate(balanced_book(), balanced_book(), seed=5)
    overloaded = simulate(overload_book(), balanced_book(), seed=5)

    assert overloaded.team_stats["Home"].with_ball_support > balanced.team_stats["Home"].with_ball_support
    assert overloaded.team_stats["Home"].attacking_chances > balanced.team_stats["Home"].attacking_chances
    assert "Home WIB attacking overload improved support in possession" in overloaded.transition_diagnostics


def test_without_ball_compactness_improves_defensive_protection_when_out_of_possession():
    loose = simulate(loose_defense_book(), balanced_book(), seed=6)
    compact = simulate(balanced_book(), balanced_book(), seed=6)

    assert compact.team_stats["Home"].without_ball_protection > loose.team_stats["Home"].without_ball_protection
    assert compact.team_stats["Away"].counterattack_chances < loose.team_stats["Away"].counterattack_chances
    assert "Home WOB compactness improved protection out of possession" in compact.transition_diagnostics


def test_poor_wib_to_wob_transition_creates_counterattack_exposure_after_losing_possession():
    stable = simulate(balanced_book(), balanced_book(), seed=8)
    poor_recovery = simulate(high_mismatch_book(), balanced_book(), seed=8)

    assert poor_recovery.team_stats["Home"].transition_delay > stable.team_stats["Home"].transition_delay
    assert poor_recovery.team_stats["Away"].counterattack_chances > stable.team_stats["Away"].counterattack_chances
    assert "Home slow WIB-to-WOB recovery exposed counters after losing possession" in poor_recovery.transition_diagnostics


def test_poor_wob_to_wib_transition_reduces_counterattack_support_after_winning_possession():
    normal_break = simulate(balanced_book(), balanced_book(), seed=9)
    slow_break = simulate(counter_poor_book(), balanced_book(), seed=9)

    assert slow_break.team_stats["Home"].counterattack_support < normal_break.team_stats["Home"].counterattack_support
    assert slow_break.team_stats["Home"].counterattack_chances < normal_break.team_stats["Home"].counterattack_chances
    assert "Home slow WOB-to-WIB break reduced counterattack support after winning possession" in slow_break.transition_diagnostics


def test_extreme_recovery_runs_create_late_arrivals_and_fatigue():
    stable = simulate(balanced_book(), balanced_book(), seed=10)
    extreme = simulate(high_mismatch_book(), balanced_book(), seed=10)

    assert extreme.team_stats["Home"].recovery_run_distance > stable.team_stats["Home"].recovery_run_distance
    assert extreme.team_stats["Home"].late_arrivals > stable.team_stats["Home"].late_arrivals
    assert extreme.team_stats["Home"].fatigue > stable.team_stats["Home"].fatigue
    assert "Home extreme recovery runs caused late arrivals and fatigue" in extreme.transition_diagnostics


def test_report_explains_transition_causes():
    result = simulate(high_mismatch_book(), balanced_book(), seed=11)

    assert result.report.scoreline.startswith("Home ")
    assert any("WIB-to-WOB" in reason for reason in result.report.key_reasons)
    assert any("counter" in reason for reason in result.report.key_reasons)
    assert any("late arrivals" in reason for reason in result.report.key_reasons)


def test_cli_runs_transition_demo_and_outputs_json_summary():
    spike_dir = Path(__file__).resolve().parents[1]

    completed = subprocess.run(
        [sys.executable, "run_transition_simulation.py", "--seed", "42", "--home-style", "high-mismatch"],
        cwd=spike_dir,
        check=True,
        capture_output=True,
        text=True,
    )

    payload = json.loads(completed.stdout)
    assert payload["seed"] == 42
    assert payload["home_style"] == "high-mismatch"
    assert payload["scoreline"].startswith("Home ")
    assert payload["transition_diagnostics"]
    assert payload["stats"]["Home"]["transition_delay"] > 0
