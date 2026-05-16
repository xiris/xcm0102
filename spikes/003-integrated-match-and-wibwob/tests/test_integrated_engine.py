import json
import subprocess
import sys
from pathlib import Path

from integrated_engine import (
    BallStep,
    IntegratedContext,
    Player,
    Position,
    Team,
    Tactic,
    WibWobMap,
    Zone,
    simulate_integrated_match,
)

DEF_LEFT = Zone("defensive", "left")
MID_LEFT = Zone("middle", "left")
MID_CENTER = Zone("middle", "center")
MID_RIGHT = Zone("middle", "right")
ATT_CENTER = Zone("attacking", "center")
ATT_RIGHT = Zone("attacking", "right")


def make_team(name: str, *, attack=11, midfield=11, defense=11, stamina=11):
    players = [
        Player("DL", "DL", attack=7, defense=defense, pace=11, stamina=stamina, positioning=12, teamwork=11),
        Player("DC1", "DC", attack=6, defense=defense + 2, pace=10, stamina=stamina, positioning=13, teamwork=11),
        Player("DC2", "DC", attack=6, defense=defense + 2, pace=10, stamina=stamina, positioning=13, teamwork=11),
        Player("DR", "DR", attack=7, defense=defense, pace=11, stamina=stamina, positioning=12, teamwork=11),
        Player("DMC", "DMC", attack=8, defense=defense + 2, pace=10, stamina=stamina + 1, positioning=15, teamwork=13),
        Player("MC1", "MC", attack=midfield, defense=defense, pace=12, stamina=stamina + 1, positioning=12, teamwork=13),
        Player("MC2", "MC", attack=midfield, defense=defense, pace=12, stamina=stamina + 1, positioning=12, teamwork=13),
        Player("AML", "AML", attack=attack, defense=7, pace=14, stamina=stamina, positioning=10, teamwork=10),
        Player("AMR", "AMR", attack=attack, defense=7, pace=14, stamina=stamina, positioning=10, teamwork=10),
        Player("FC1", "FC", attack=attack + 2, defense=5, pace=13, stamina=stamina, positioning=11, teamwork=10),
        Player("FC2", "FC", attack=attack + 2, defense=5, pace=13, stamina=stamina, positioning=11, teamwork=10),
    ]
    return Team(name=name, players=players)


def compact_wibwob(name="compact", pressing=10):
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
    return WibWobMap(name=name, positions_by_zone=positions, pressing=pressing)


def central_overload_wibwob():
    tactic = compact_wibwob("central-overload", pressing=13)
    positions = {zone: dict(players) for zone, players in tactic.positions_by_zone.items()}
    positions[ATT_CENTER] = {
        "DL": Position(54, 42),
        "DC1": Position(48, 46),
        "DC2": Position(48, 54),
        "DR": Position(54, 58),
        "DMC": Position(60, 50),
        "MC1": Position(68, 47),
        "MC2": Position(68, 53),
        "AML": Position(78, 48),
        "AMR": Position(78, 52),
        "FC1": Position(88, 48),
        "FC2": Position(88, 52),
    }
    return WibWobMap(name="central-overload", positions_by_zone=positions, pressing=13)


def same_point_wibwob():
    tactic = compact_wibwob("same-point", pressing=13)
    positions = {zone: dict(players) for zone, players in tactic.positions_by_zone.items()}
    positions[ATT_CENTER] = {name: Position(82, 50) for name in positions[ATT_CENTER]}
    return WibWobMap(name="same-point", positions_by_zone=positions, pressing=13)


def extreme_wibwob():
    tactic = compact_wibwob("extreme", pressing=15)
    names = sorted(next(iter(tactic.positions_by_zone.values())).keys())
    positions = {zone: dict(players) for zone, players in tactic.positions_by_zone.items()}
    positions[DEF_LEFT] = {name: Position(18, 18 + idx * 6) for idx, name in enumerate(names)}
    positions[MID_RIGHT] = {name: Position(68, 82 - idx * 6) for idx, name in enumerate(names)}
    positions[ATT_CENTER] = {name: Position(88, 50) for name in names}
    return WibWobMap(name="extreme", positions_by_zone=positions, pressing=15)


def dmc_lateral_wibwob():
    tactic = compact_wibwob("dmc-lateral", pressing=11)
    positions = {zone: dict(players) for zone, players in tactic.positions_by_zone.items()}
    positions[MID_LEFT]["DMC"] = Position(44, 22)
    positions[MID_RIGHT]["DMC"] = Position(44, 78)
    positions[ATT_RIGHT]["DMC"] = Position(50, 82)
    return WibWobMap(name="dmc-lateral", positions_by_zone=positions, pressing=11)


def base_context(path=None):
    return IntegratedContext(
        weather="normal",
        home_advantage=1.05,
        ball_path=path
        or [
            BallStep(1, DEF_LEFT),
            BallStep(2, MID_CENTER),
            BallStep(3, MID_RIGHT),
            BallStep(4, ATT_CENTER),
            BallStep(5, MID_CENTER),
            BallStep(6, ATT_RIGHT),
            BallStep(7, ATT_CENTER),
        ],
    )


def test_same_seed_same_integrated_inputs_replay_identically():
    home = make_team("Home", attack=13, midfield=12, defense=11)
    away = make_team("Away", attack=11, midfield=11, defense=11)
    tactic = Tactic(mentality="balanced", tempo=10)

    first = simulate_integrated_match(home, away, tactic, tactic, compact_wibwob(), compact_wibwob(), base_context(), seed=101)
    second = simulate_integrated_match(home, away, tactic, tactic, compact_wibwob(), compact_wibwob(), base_context(), seed=101)

    assert first.score == second.score
    assert first.events == second.events
    assert first.match_stats == second.match_stats
    assert first.tactical_diagnostics == second.tactical_diagnostics


def test_central_overload_creates_more_central_attacks_but_concedes_more_wide_entries():
    home = make_team("Home", attack=12, midfield=13, defense=11)
    away = make_team("Away", attack=11, midfield=11, defense=11)
    tactic = Tactic(mentality="attacking", tempo=13)
    away_tactic = Tactic(mentality="balanced", tempo=10)

    compact = simulate_integrated_match(home, away, tactic, away_tactic, compact_wibwob(), compact_wibwob(), base_context(), seed=3)
    overloaded = simulate_integrated_match(home, away, tactic, away_tactic, central_overload_wibwob(), compact_wibwob(), base_context(), seed=3)

    assert overloaded.match_stats["Home"].central_attacks > compact.match_stats["Home"].central_attacks
    assert overloaded.match_stats["Away"].wide_entries > compact.match_stats["Away"].wide_entries
    assert "Home central overload created short passing options but exposed wide areas" in overloaded.tactical_diagnostics


def test_extreme_wibwob_late_arrivals_increase_opponent_chance_quality():
    home = make_team("Home", attack=12, midfield=12, defense=11)
    away = make_team("Away", attack=11, midfield=11, defense=11)
    tactic = Tactic(mentality="balanced", tempo=11)

    compact = simulate_integrated_match(home, away, tactic, tactic, compact_wibwob(), compact_wibwob(), base_context(), seed=4)
    extreme = simulate_integrated_match(home, away, tactic, tactic, extreme_wibwob(), compact_wibwob(), base_context(), seed=4)

    assert extreme.match_stats["Home"].late_arrivals > compact.match_stats["Home"].late_arrivals
    assert extreme.match_stats["Away"].average_chance_quality > compact.match_stats["Away"].average_chance_quality
    assert "Home extreme movement caused late defensive arrivals" in extreme.tactical_diagnostics


def test_same_point_congestion_reduces_shot_quality_despite_central_density():
    home = make_team("Home", attack=13, midfield=13, defense=10)
    away = make_team("Away", attack=10, midfield=10, defense=11)
    tactic = Tactic(mentality="attacking", tempo=13)

    overloaded = simulate_integrated_match(home, away, tactic, tactic, central_overload_wibwob(), compact_wibwob(), base_context(), seed=9)
    congested = simulate_integrated_match(home, away, tactic, tactic, same_point_wibwob(), compact_wibwob(), base_context(), seed=9)

    assert congested.match_stats["Home"].central_attacks >= overloaded.match_stats["Home"].central_attacks
    assert congested.match_stats["Home"].average_shot_quality < overloaded.match_stats["Home"].average_shot_quality
    assert "Home congestion reduced shot quality" in congested.tactical_diagnostics


def test_dmc_lateral_overload_reduces_central_protection_over_time():
    switch_path = [
        BallStep(1, MID_LEFT),
        BallStep(2, MID_RIGHT),
        BallStep(3, MID_LEFT),
        BallStep(4, MID_RIGHT),
        BallStep(5, ATT_RIGHT),
        BallStep(6, MID_CENTER),
        BallStep(7, ATT_CENTER),
    ]
    home = make_team("Home", attack=11, midfield=12, defense=12)
    away = make_team("Away", attack=12, midfield=12, defense=11)
    tactic = Tactic(mentality="balanced", tempo=11)

    compact = simulate_integrated_match(home, away, tactic, tactic, compact_wibwob(), compact_wibwob(), base_context(switch_path), seed=12)
    lateral = simulate_integrated_match(home, away, tactic, tactic, dmc_lateral_wibwob(), compact_wibwob(), base_context(switch_path), seed=12)

    assert lateral.match_stats["Home"].central_protection < compact.match_stats["Home"].central_protection
    assert lateral.match_stats["Away"].central_attacks > compact.match_stats["Away"].central_attacks
    assert "Home DMC protection degraded after repeated lateral switches" in lateral.tactical_diagnostics


def test_high_pressing_creates_early_turnovers_but_late_concession_risk():
    long_path = base_context().ball_path * 10
    home = make_team("Home", attack=12, midfield=12, defense=11, stamina=10)
    away = make_team("Away", attack=11, midfield=11, defense=11, stamina=10)
    tactic = Tactic(mentality="balanced", tempo=11)

    low_press = simulate_integrated_match(home, away, tactic, tactic, compact_wibwob(pressing=6), compact_wibwob(), base_context(long_path), seed=22)
    high_press = simulate_integrated_match(home, away, tactic, tactic, compact_wibwob(pressing=18), compact_wibwob(), base_context(long_path), seed=22)

    assert high_press.match_stats["Home"].early_turnovers > low_press.match_stats["Home"].early_turnovers
    assert high_press.match_stats["Away"].late_chance_quality > low_press.match_stats["Away"].late_chance_quality
    assert "Home high pressing created early turnovers but increased late fatigue risk" in high_press.tactical_diagnostics


def test_report_merges_match_and_wibwob_explanations():
    home = make_team("Home", attack=13, midfield=13, defense=10)
    away = make_team("Away", attack=12, midfield=11, defense=11)
    result = simulate_integrated_match(
        home,
        away,
        Tactic(mentality="attacking", tempo=14),
        Tactic(mentality="balanced", tempo=10),
        central_overload_wibwob(),
        compact_wibwob(),
        base_context(),
        seed=30,
    )

    assert result.report.scoreline.startswith("Home ")
    assert any("attacking mentality" in reason for reason in result.report.key_reasons)
    assert any("central overload" in reason for reason in result.report.key_reasons)
    assert any("wide areas" in reason for reason in result.report.key_reasons)


def test_cli_runs_integrated_demo_and_outputs_json_summary():
    spike_dir = Path(__file__).resolve().parents[1]

    completed = subprocess.run(
        [sys.executable, "run_integrated_simulation.py", "--seed", "42", "--home-wibwob", "overload"],
        cwd=spike_dir,
        check=True,
        capture_output=True,
        text=True,
    )

    payload = json.loads(completed.stdout)
    assert payload["seed"] == 42
    assert payload["home_wibwob"] == "overload"
    assert payload["scoreline"].startswith("Home ")
    assert payload["tactical_diagnostics"]
