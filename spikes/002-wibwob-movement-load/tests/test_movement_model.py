import json
import subprocess
import sys
from pathlib import Path

from movement_model import (
    BallStep,
    PlayerProfile,
    Position,
    Zone,
    WibWobTactic,
    analyze_tactic,
    simulate_movement,
)


DEF_LEFT = Zone("defensive", "left")
DEF_CENTER = Zone("defensive", "center")
DEF_RIGHT = Zone("defensive", "right")
MID_LEFT = Zone("middle", "left")
MID_CENTER = Zone("middle", "center")
MID_RIGHT = Zone("middle", "right")
ATT_CENTER = Zone("attacking", "center")
ATT_RIGHT = Zone("attacking", "right")


def squad():
    return [
        PlayerProfile("DL", role="DL", pace=11, stamina=12, positioning=12, teamwork=11),
        PlayerProfile("DC1", role="DC", pace=10, stamina=12, positioning=13, teamwork=11),
        PlayerProfile("DC2", role="DC", pace=10, stamina=12, positioning=13, teamwork=11),
        PlayerProfile("DR", role="DR", pace=11, stamina=12, positioning=12, teamwork=11),
        PlayerProfile("DMC", role="DMC", pace=10, stamina=13, positioning=15, teamwork=13),
        PlayerProfile("MC1", role="MC", pace=12, stamina=13, positioning=12, teamwork=13),
        PlayerProfile("MC2", role="MC", pace=12, stamina=13, positioning=12, teamwork=13),
        PlayerProfile("AML", role="AML", pace=14, stamina=11, positioning=10, teamwork=10),
        PlayerProfile("AMR", role="AMR", pace=14, stamina=11, positioning=10, teamwork=10),
        PlayerProfile("FC1", role="FC", pace=13, stamina=11, positioning=11, teamwork=10),
        PlayerProfile("FC2", role="FC", pace=13, stamina=11, positioning=11, teamwork=10),
    ]


def compact_tactic():
    positions = {}
    for zone, x_shift in [(DEF_LEFT, -8), (MID_CENTER, 0), (ATT_CENTER, 8), (MID_RIGHT, 5)]:
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
    return WibWobTactic(name="compact", positions_by_zone=positions, pressing=10)


def extreme_tactic():
    tactic = compact_tactic()
    positions = dict(tactic.positions_by_zone)
    positions[DEF_LEFT] = {
        name: Position(18, 18 + idx * 6) for idx, name in enumerate(tactic.player_names)
    }
    positions[MID_RIGHT] = {
        name: Position(68, 82 - idx * 6) for idx, name in enumerate(tactic.player_names)
    }
    positions[ATT_CENTER] = {
        name: Position(88, 50) for name in tactic.player_names
    }
    return WibWobTactic(name="extreme", positions_by_zone=positions, pressing=15)


def narrow_overload_tactic():
    tactic = compact_tactic()
    positions = dict(tactic.positions_by_zone)
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
    return WibWobTactic(name="narrow-overload", positions_by_zone=positions, pressing=13)


def dmc_anchored_tactic():
    tactic = compact_tactic()
    positions = {zone: dict(players) for zone, players in tactic.positions_by_zone.items()}
    for zone in positions:
        positions[zone]["DMC"] = Position(44, 50)
    return WibWobTactic(name="dmc-anchor", positions_by_zone=positions, pressing=10)


def ball_path():
    return [
        BallStep(1, DEF_LEFT),
        BallStep(2, MID_CENTER),
        BallStep(3, MID_RIGHT),
        BallStep(4, ATT_CENTER),
        BallStep(5, DEF_LEFT),
        BallStep(6, MID_RIGHT),
        BallStep(7, ATT_CENTER),
    ]


def test_same_seed_same_wibwob_map_replays_identically():
    result_a = simulate_movement(squad(), compact_tactic(), ball_path(), seed=7)
    result_b = simulate_movement(squad(), compact_tactic(), ball_path(), seed=7)

    assert result_a.events == result_b.events
    assert result_a.team_metrics == result_b.team_metrics
    assert result_a.player_metrics == result_b.player_metrics
    assert result_a.diagnostics == result_b.diagnostics


def test_extreme_zone_positions_create_more_movement_fatigue_than_compact_shape():
    compact = simulate_movement(squad(), compact_tactic(), ball_path(), seed=11)
    extreme = simulate_movement(squad(), extreme_tactic(), ball_path(), seed=11)

    assert extreme.team_metrics.total_distance > compact.team_metrics.total_distance * 1.8
    assert extreme.team_metrics.fatigue_load > compact.team_metrics.fatigue_load * 1.5
    assert "extreme movement load" in extreme.diagnostics


def test_far_zone_jumps_cause_late_arrivals_and_uncovered_targets():
    result = simulate_movement(squad(), extreme_tactic(), ball_path(), seed=12)

    assert result.team_metrics.late_arrivals >= 6
    assert result.team_metrics.uncovered_targets >= 3
    assert any("arrived late" in event for event in result.events)


def test_overloading_one_zone_improves_central_density_but_exposes_wide_areas():
    balanced = analyze_tactic(compact_tactic(), ATT_CENTER)
    overloaded = analyze_tactic(narrow_overload_tactic(), ATT_CENTER)

    assert overloaded.central_density > balanced.central_density
    assert overloaded.short_passing_support > balanced.short_passing_support
    assert overloaded.wide_exposure > balanced.wide_exposure
    assert "central overload improved short options but exposed wide zones" in overloaded.diagnostics


def test_multiple_players_same_target_creates_congestion_penalty():
    overloaded = analyze_tactic(extreme_tactic(), ATT_CENTER)

    assert overloaded.max_players_on_same_point == 11
    assert overloaded.congestion_penalty > 0
    assert "11 players assigned to same point" in overloaded.diagnostics


def test_dmc_protection_degrades_when_pulled_across_repeated_lateral_switches():
    lateral_switches = [
        BallStep(1, MID_LEFT),
        BallStep(2, MID_RIGHT),
        BallStep(3, MID_LEFT),
        BallStep(4, MID_RIGHT),
        BallStep(5, ATT_RIGHT),
    ]
    tactic = dmc_anchored_tactic().with_zone_position(MID_LEFT, "DMC", Position(46, 24)).with_zone_position(MID_RIGHT, "DMC", Position(46, 76))

    result = simulate_movement(squad(), tactic, lateral_switches, seed=21)

    dmc = result.player_metrics["DMC"]
    assert dmc.coverage_score < 0.75
    assert result.team_metrics.central_protection < 0.85
    assert "DMC protection degraded by repeated lateral shifts" in result.diagnostics


def test_high_pressing_improves_early_pressure_but_costs_second_half_recovery():
    low_press = compact_tactic().with_pressing(6)
    high_press = compact_tactic().with_pressing(18)
    long_path = ball_path() * 12

    low = simulate_movement(squad(), low_press, long_path, seed=4)
    high = simulate_movement(squad(), high_press, long_path, seed=4)

    assert high.team_metrics.early_pressure > low.team_metrics.early_pressure
    assert high.team_metrics.second_half_recovery < low.team_metrics.second_half_recovery
    assert "high pressing increased early pressure but reduced late recovery" in high.diagnostics


def test_cli_runs_option_a_demo_and_outputs_json_summary():
    spike_dir = Path(__file__).resolve().parents[1]

    completed = subprocess.run(
        [sys.executable, "run_movement_simulation.py", "--seed", "42", "--scenario", "overload"],
        cwd=spike_dir,
        check=True,
        capture_output=True,
        text=True,
    )

    payload = json.loads(completed.stdout)
    assert payload["scenario"] == "overload"
    assert payload["seed"] == 42
    assert payload["team_metrics"]["wide_exposure"] > 0
    assert payload["diagnostics"]
