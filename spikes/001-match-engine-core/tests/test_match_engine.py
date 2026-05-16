import json
import statistics
import subprocess
import sys
from pathlib import Path

from match_engine import (
    MatchContext,
    MatchCommand,
    Player,
    Team,
    Tactic,
    simulate_match,
)


def make_player(name: str, role: str, *, finishing=10, creativity=10, tackling=10, stamina=10, positioning=10, pace=10):
    return Player(
        name=name,
        role=role,
        finishing=finishing,
        creativity=creativity,
        tackling=tackling,
        stamina=stamina,
        positioning=positioning,
        pace=pace,
    )


def make_team(name: str, *, attack=10, midfield=10, defense=10, stamina=10):
    players = []
    for i in range(1, 12):
        if i <= 3:
            players.append(make_player(f"{name} attacker {i}", "ATT", finishing=attack, creativity=midfield, stamina=stamina, pace=attack))
        elif i <= 7:
            players.append(make_player(f"{name} mid {i}", "MID", creativity=midfield, tackling=defense, stamina=stamina, positioning=midfield))
        else:
            players.append(make_player(f"{name} defender {i}", "DEF", tackling=defense, positioning=defense, stamina=stamina, pace=defense))
    return Team(name=name, players=players)


def default_context(**overrides):
    data = dict(weather="normal", referee_strictness=10, home_advantage=1.0)
    data.update(overrides)
    return MatchContext(**data)


def test_same_seed_same_inputs_replays_identically():
    home = make_team("Home", attack=13, midfield=12, defense=11)
    away = make_team("Away", attack=11, midfield=11, defense=12)
    tactic = Tactic(mentality="balanced", width=10, pressing=10, tempo=10)

    first = simulate_match(home, away, tactic, tactic, default_context(), seed=42)
    second = simulate_match(home, away, tactic, tactic, default_context(), seed=42)

    assert first.score == second.score
    assert first.events == second.events
    assert first.diagnostics == second.diagnostics


def test_attacking_tactic_creates_more_shots_than_defensive_tactic_over_many_seeds():
    home = make_team("Home", attack=12, midfield=12, defense=11)
    away = make_team("Away", attack=11, midfield=11, defense=11)
    attacking = Tactic(mentality="attacking", width=12, pressing=14, tempo=14)
    defensive = Tactic(mentality="defensive", width=8, pressing=6, tempo=7)

    attacking_shots = []
    defensive_shots = []
    for seed in range(50):
        attacking_result = simulate_match(home, away, attacking, defensive, default_context(), seed=seed)
        defensive_result = simulate_match(home, away, defensive, attacking, default_context(), seed=seed)
        attacking_shots.append(attacking_result.team_stats["Home"].shots)
        defensive_shots.append(defensive_result.team_stats["Home"].shots)

    assert statistics.mean(attacking_shots) > statistics.mean(defensive_shots) + 1.0


def test_rain_reduces_total_chances_and_increases_fatigue_cost():
    home = make_team("Home", attack=12, midfield=12, defense=12, stamina=10)
    away = make_team("Away", attack=12, midfield=12, defense=12, stamina=10)
    tactic = Tactic(mentality="balanced", width=10, pressing=12, tempo=12)

    normal = simulate_match(home, away, tactic, tactic, default_context(weather="normal"), seed=7)
    rainy = simulate_match(home, away, tactic, tactic, default_context(weather="rain"), seed=7)

    assert rainy.total_shots < normal.total_shots
    assert rainy.fatigue["Home"] > normal.fatigue["Home"]
    assert "rain reduced chance quality" in rainy.diagnostics


def test_live_tactical_change_affects_remaining_match_ticks():
    home = make_team("Home", attack=12, midfield=12, defense=11)
    away = make_team("Away", attack=11, midfield=11, defense=11)
    balanced = Tactic(mentality="balanced", width=10, pressing=10, tempo=10)
    attacking = Tactic(mentality="attacking", width=13, pressing=15, tempo=15)

    unchanged = simulate_match(home, away, balanced, balanced, default_context(), seed=99)
    changed = simulate_match(
        home,
        away,
        balanced,
        balanced,
        default_context(),
        seed=99,
        commands=[MatchCommand(tick=45, team="Home", tactic=attacking)],
    )

    assert changed.team_stats["Home"].second_half_pressure > unchanged.team_stats["Home"].second_half_pressure
    assert changed.command_log == ["45: Home changed to attacking"]


def test_report_explains_major_causes_not_just_score():
    home = make_team("Home", attack=15, midfield=14, defense=10)
    away = make_team("Away", attack=9, midfield=9, defense=9)
    home_tactic = Tactic(mentality="attacking", width=12, pressing=14, tempo=14)
    away_tactic = Tactic(mentality="defensive", width=7, pressing=5, tempo=6)

    result = simulate_match(home, away, home_tactic, away_tactic, default_context(home_advantage=1.1), seed=5)

    assert result.report.scoreline.startswith("Home ")
    assert any("attacking mentality" in reason for reason in result.report.key_reasons)
    assert any("home advantage" in reason for reason in result.report.key_reasons)
    assert result.report.stat_summary["Home"].shots == result.team_stats["Home"].shots


def test_cli_runs_seeded_demo_and_outputs_json_summary():
    spike_dir = Path(__file__).resolve().parents[1]

    completed = subprocess.run(
        [sys.executable, "run_simulation.py", "--seed", "42"],
        cwd=spike_dir,
        check=True,
        capture_output=True,
        text=True,
    )

    payload = json.loads(completed.stdout)
    assert payload["scoreline"].startswith("Home ")
    assert payload["seed"] == 42
    assert payload["stats"]["Home"]["shots"] >= 0
    assert payload["key_reasons"]
