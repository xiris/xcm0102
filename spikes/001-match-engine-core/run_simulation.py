from __future__ import annotations

import argparse
import json
from dataclasses import asdict

from match_engine import MatchCommand, MatchContext, Player, Team, Tactic, simulate_match


def make_player(name: str, role: str, *, finishing=10, creativity=10, tackling=10, stamina=10, positioning=10, pace=10) -> Player:
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


def make_team(name: str, *, attack: int, midfield: int, defense: int, stamina: int = 10) -> Team:
    players = []
    for i in range(1, 12):
        if i <= 3:
            players.append(make_player(f"{name} attacker {i}", "ATT", finishing=attack, creativity=midfield, stamina=stamina, pace=attack))
        elif i <= 7:
            players.append(make_player(f"{name} mid {i}", "MID", creativity=midfield, tackling=defense, stamina=stamina, positioning=midfield))
        else:
            players.append(make_player(f"{name} defender {i}", "DEF", tackling=defense, positioning=defense, stamina=stamina, pace=defense))
    return Team(name=name, players=players)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run spike 001 deterministic match-engine demo.")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--weather", choices=["normal", "rain", "wind", "hot"], default="normal")
    parser.add_argument("--live-change", action="store_true", help="Switch Home to attacking at tick 45")
    args = parser.parse_args()

    home = make_team("Home", attack=13, midfield=12, defense=11, stamina=11)
    away = make_team("Away", attack=11, midfield=11, defense=12, stamina=10)
    home_tactic = Tactic(mentality="balanced", width=10, pressing=10, tempo=10)
    away_tactic = Tactic(mentality="defensive", width=8, pressing=7, tempo=7)
    context = MatchContext(weather=args.weather, referee_strictness=10, home_advantage=1.08)
    commands = []
    if args.live_change:
        commands.append(MatchCommand(tick=45, team="Home", tactic=Tactic(mentality="attacking", width=13, pressing=15, tempo=15)))

    result = simulate_match(home, away, home_tactic, away_tactic, context, seed=args.seed, commands=commands)
    payload = {
        "seed": args.seed,
        "scoreline": result.report.scoreline,
        "stats": {team: asdict(stats) for team, stats in result.team_stats.items()},
        "fatigue": result.fatigue,
        "diagnostics": result.diagnostics,
        "command_log": result.command_log,
        "key_reasons": result.report.key_reasons,
        "first_10_events": result.events[:10],
    }
    print(json.dumps(payload, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
