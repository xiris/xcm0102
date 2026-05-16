import json
import subprocess
import sys
from pathlib import Path

from attribute_transition_engine import (
    BallStep,
    FamiliarityProfile,
    Phase,
    Player,
    Position,
    Team,
    TransitionContext,
    WibMap,
    WibWobBook,
    WobMap,
    Zone,
    simulate_attribute_transition_match,
)

DEF_LEFT = Zone("defensive", "left")
MID_CENTER = Zone("middle", "center")
MID_RIGHT = Zone("middle", "right")
ATT_CENTER = Zone("attacking", "center")
ATT_RIGHT = Zone("attacking", "right")


def make_team(name: str, *, physical=12, mental=12, stamina=12, attack=12, defense=12):
    return Team(
        name=name,
        players=[
            Player("DL", "DL", attack=7, defense=defense, pace=physical, acceleration=physical, stamina=stamina, positioning=mental, teamwork=mental, anticipation=mental, decisions=mental),
            Player("DC1", "DC", attack=6, defense=defense + 2, pace=physical - 1, acceleration=physical - 1, stamina=stamina, positioning=mental + 1, teamwork=mental, anticipation=mental + 1, decisions=mental),
            Player("DC2", "DC", attack=6, defense=defense + 2, pace=physical - 1, acceleration=physical - 1, stamina=stamina, positioning=mental + 1, teamwork=mental, anticipation=mental + 1, decisions=mental),
            Player("DR", "DR", attack=7, defense=defense, pace=physical, acceleration=physical, stamina=stamina, positioning=mental, teamwork=mental, anticipation=mental, decisions=mental),
            Player("DMC", "DMC", attack=8, defense=defense + 2, pace=physical - 1, acceleration=physical - 1, stamina=stamina + 1, positioning=mental + 3, teamwork=mental + 1, anticipation=mental + 2, decisions=mental + 1),
            Player("MC1", "MC", attack=attack, defense=defense, pace=physical, acceleration=physical, stamina=stamina + 1, positioning=mental, teamwork=mental + 1, anticipation=mental, decisions=mental + 1),
            Player("MC2", "MC", attack=attack, defense=defense, pace=physical, acceleration=physical, stamina=stamina + 1, positioning=mental, teamwork=mental + 1, anticipation=mental, decisions=mental + 1),
            Player("AML", "AML", attack=attack + 1, defense=7, pace=physical + 2, acceleration=physical + 2, stamina=stamina, positioning=mental - 1, teamwork=mental - 1, anticipation=mental, decisions=mental),
            Player("AMR", "AMR", attack=attack + 1, defense=7, pace=physical + 2, acceleration=physical + 2, stamina=stamina, positioning=mental - 1, teamwork=mental - 1, anticipation=mental, decisions=mental),
            Player("FC1", "FC", attack=attack + 2, defense=5, pace=physical + 1, acceleration=physical + 1, stamina=stamina, positioning=mental, teamwork=mental - 1, anticipation=mental, decisions=mental),
            Player("FC2", "FC", attack=attack + 2, defense=5, pace=physical + 1, acceleration=physical + 1, stamina=stamina, positioning=mental, teamwork=mental - 1, anticipation=mental, decisions=mental),
        ],
    )


def base_wib(name="balanced-wib", pressing=10):
    positions = {}
    for zone, x_shift in [(DEF_LEFT, -8), (MID_CENTER, 0), (MID_RIGHT, 5), (ATT_CENTER, 8), (ATT_RIGHT, 10)]:
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
    return WibMap(name, positions, pressing)


def compact_wob(name="compact-wob", pressing=10):
    positions = {}
    for zone, x_shift in [(DEF_LEFT, -8), (MID_CENTER, 0), (MID_RIGHT, 3), (ATT_CENTER, 5), (ATT_RIGHT, 8)]:
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
    return WobMap(name, positions, pressing)


def high_mismatch_book():
    tactic = base_wib("extreme-attacking", pressing=14)
    names = sorted(next(iter(tactic.positions_by_zone.values())).keys())
    positions = {zone: dict(players) for zone, players in tactic.positions_by_zone.items()}
    positions[ATT_CENTER] = {name: Position(90, 50) for name in names}
    positions[MID_RIGHT] = {name: Position(72, 84 - index * 6) for index, name in enumerate(names)}
    return WibWobBook(WibMap("extreme-attacking", positions, 14), compact_wob("deep-compact", 12), transition_style="balanced")


def context():
    return TransitionContext(
        weather="normal",
        home_advantage=1.05,
        steps=[
            BallStep(1, DEF_LEFT, Phase.HOME_IN_POSSESSION),
            BallStep(2, MID_CENTER, Phase.HOME_IN_POSSESSION),
            BallStep(3, ATT_CENTER, Phase.HOME_IN_POSSESSION),
            BallStep(4, MID_RIGHT, Phase.AWAY_IN_POSSESSION),
            BallStep(5, MID_CENTER, Phase.AWAY_IN_POSSESSION),
            BallStep(6, ATT_RIGHT, Phase.HOME_IN_POSSESSION),
            BallStep(7, ATT_CENTER, Phase.HOME_IN_POSSESSION),
            BallStep(8, MID_RIGHT, Phase.AWAY_IN_POSSESSION),
            BallStep(9, MID_CENTER, Phase.HOME_IN_POSSESSION),
        ],
    )


def simulate(home_team, *, familiarity=0.75, away_familiarity=0.75, seed=44):
    return simulate_attribute_transition_match(
        home_team,
        make_team("Away", physical=12, mental=12, stamina=12, attack=11, defense=11),
        high_mismatch_book(),
        WibWobBook(base_wib(), compact_wob(), transition_style="balanced"),
        FamiliarityProfile(tactic_id="high-mismatch", familiarity=familiarity, matches_played=12),
        FamiliarityProfile(tactic_id="balanced", familiarity=away_familiarity, matches_played=12),
        context(),
        seed=seed,
    )


def test_same_seed_same_players_and_familiarity_replay_identically():
    team = make_team("Home", physical=12, mental=12, stamina=12)
    first = simulate(team, familiarity=0.72, seed=101)
    second = simulate(team, familiarity=0.72, seed=101)

    assert first.score == second.score
    assert first.events == second.events
    assert first.team_stats == second.team_stats
    assert first.diagnostics == second.diagnostics


def test_higher_pace_and_acceleration_reduce_transition_delay_and_late_arrivals():
    slow_team = make_team("Home", physical=8, mental=12, stamina=12)
    fast_team = make_team("Home", physical=17, mental=12, stamina=12)

    slow = simulate(slow_team, familiarity=0.75, seed=5)
    fast = simulate(fast_team, familiarity=0.75, seed=5)

    assert fast.team_stats["Home"].transition_delay < slow.team_stats["Home"].transition_delay
    assert fast.team_stats["Home"].late_arrivals < slow.team_stats["Home"].late_arrivals
    assert "Home superior pace and acceleration reduced transition delay" in fast.diagnostics


def test_higher_stamina_reduces_repeated_recovery_fatigue():
    low_stamina = make_team("Home", physical=12, mental=12, stamina=7)
    high_stamina = make_team("Home", physical=12, mental=12, stamina=18)

    tired = simulate(low_stamina, familiarity=0.75, seed=6)
    durable = simulate(high_stamina, familiarity=0.75, seed=6)

    assert durable.team_stats["Home"].fatigue < tired.team_stats["Home"].fatigue
    assert durable.team_stats["Home"].second_half_recovery > tired.team_stats["Home"].second_half_recovery
    assert "Home stamina protected repeated recovery runs" in durable.diagnostics


def test_positioning_and_anticipation_improve_wob_recovery_after_losing_possession():
    poor_mental = make_team("Home", physical=12, mental=7, stamina=12)
    smart = make_team("Home", physical=12, mental=18, stamina=12)

    poor = simulate(poor_mental, familiarity=0.75, seed=7)
    good = simulate(smart, familiarity=0.75, seed=7)

    assert good.team_stats["Home"].wob_recovery_quality > poor.team_stats["Home"].wob_recovery_quality
    assert good.team_stats["Away"].counterattack_chances < poor.team_stats["Away"].counterattack_chances
    assert "Home positioning and anticipation improved WOB recovery" in good.diagnostics


def test_teamwork_and_decisions_improve_counter_support_after_winning_possession():
    chaotic = make_team("Home", physical=12, mental=7, stamina=12)
    cohesive = make_team("Home", physical=12, mental=18, stamina=12)

    poor = simulate(chaotic, familiarity=0.75, seed=8)
    good = simulate(cohesive, familiarity=0.75, seed=8)

    assert good.team_stats["Home"].counterattack_support > poor.team_stats["Home"].counterattack_support
    assert good.team_stats["Home"].counterattack_chances > poor.team_stats["Home"].counterattack_chances
    assert "Home teamwork and decisions improved WOB-to-WIB counter support" in good.diagnostics


def test_low_tactical_familiarity_increases_delay_even_for_good_players():
    good_team = make_team("Home", physical=16, mental=16, stamina=16)

    unfamiliar = simulate(good_team, familiarity=0.18, seed=9)
    familiar = simulate(good_team, familiarity=0.88, seed=9)

    assert unfamiliar.team_stats["Home"].transition_delay > familiar.team_stats["Home"].transition_delay
    assert unfamiliar.team_stats["Home"].late_arrivals > familiar.team_stats["Home"].late_arrivals
    assert "Home low tactical familiarity slowed transition execution" in unfamiliar.diagnostics


def test_familiarity_improves_with_repetition_but_is_not_magical():
    profile = FamiliarityProfile(tactic_id="high-mismatch", familiarity=0.20, matches_played=0)
    after_one = profile.after_match(minutes_used=90, training_focus=0.50)
    after_many = after_one
    for _ in range(20):
        after_many = after_many.after_match(minutes_used=90, training_focus=0.80)

    assert after_one.familiarity > profile.familiarity
    assert after_many.familiarity > after_one.familiarity
    assert after_many.familiarity < 0.95
    assert after_many.matches_played == 21


def test_report_explains_geometry_player_limits_and_familiarity():
    weak_unfamiliar = simulate(make_team("Home", physical=8, mental=7, stamina=7), familiarity=0.15, seed=10)

    reasons = weak_unfamiliar.report.key_reasons
    assert any("geometry" in reason for reason in reasons)
    assert any("player attributes" in reason for reason in reasons)
    assert any("familiarity" in reason for reason in reasons)


def test_cli_runs_attribute_transition_demo_and_outputs_json_summary():
    spike_dir = Path(__file__).resolve().parents[1]

    completed = subprocess.run(
        [sys.executable, "run_attribute_transition_simulation.py", "--seed", "42", "--home-quality", "weak", "--familiarity", "0.20"],
        cwd=spike_dir,
        check=True,
        capture_output=True,
        text=True,
    )

    payload = json.loads(completed.stdout)
    assert payload["seed"] == 42
    assert payload["home_quality"] == "weak"
    assert payload["familiarity"] == 0.20
    assert payload["stats"]["Home"]["transition_delay"] > 0
    assert payload["diagnostics"]
