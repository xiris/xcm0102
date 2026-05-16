from __future__ import annotations

import argparse
import json
from dataclasses import asdict

from transition_engine import BallStep, Phase, Player, Position, Team, TransitionContext, WibMap, WibWobBook, WobMap, Zone, simulate_transition_match

DEF_LEFT = Zone("defensive", "left")
MID_CENTER = Zone("middle", "center")
MID_RIGHT = Zone("middle", "right")
ATT_CENTER = Zone("attacking", "center")
ATT_RIGHT = Zone("attacking", "right")


def make_team(name: str, *, attack=12, midfield=12, defense=11, stamina=11) -> Team:
    return Team(
        name=name,
        players=[
            Player("DL", "DL", 7, defense, 11, stamina, 12, 11, 11),
            Player("DC1", "DC", 6, defense + 2, 10, stamina, 13, 11, 12),
            Player("DC2", "DC", 6, defense + 2, 10, stamina, 13, 11, 12),
            Player("DR", "DR", 7, defense, 11, stamina, 12, 11, 11),
            Player("DMC", "DMC", 8, defense + 2, 10, stamina + 1, 15, 13, 14),
            Player("MC1", "MC", midfield, defense, 12, stamina + 1, 12, 13, 12),
            Player("MC2", "MC", midfield, defense, 12, stamina + 1, 12, 13, 12),
            Player("AML", "AML", attack, 7, 14, stamina, 10, 10, 11),
            Player("AMR", "AMR", attack, 7, 14, stamina, 10, 10, 11),
            Player("FC1", "FC", attack + 2, 5, 13, stamina, 11, 10, 10),
            Player("FC2", "FC", attack + 2, 5, 13, stamina, 11, 10, 10),
        ],
    )


def base_wib(name="balanced-wib", pressing=10) -> WibMap:
    positions = {}
    for zone, x_shift in [(DEF_LEFT, -8), (MID_CENTER, 0), (MID_RIGHT, 5), (ATT_CENTER, 8), (ATT_RIGHT, 10)]:
        positions[zone] = {
            "DL": Position(22 + x_shift, 20), "DC1": Position(25 + x_shift, 42), "DC2": Position(25 + x_shift, 58), "DR": Position(22 + x_shift, 80),
            "DMC": Position(38 + x_shift, 50), "MC1": Position(50 + x_shift, 42), "MC2": Position(50 + x_shift, 58),
            "AML": Position(63 + x_shift, 30), "AMR": Position(63 + x_shift, 70), "FC1": Position(76 + x_shift, 45), "FC2": Position(76 + x_shift, 55),
        }
    return WibMap(name, positions, pressing)


def compact_wob(name="compact-wob", pressing=10) -> WobMap:
    positions = {}
    for zone, x_shift in [(DEF_LEFT, -8), (MID_CENTER, 0), (MID_RIGHT, 3), (ATT_CENTER, 5), (ATT_RIGHT, 8)]:
        positions[zone] = {
            "DL": Position(26 + x_shift, 28), "DC1": Position(28 + x_shift, 44), "DC2": Position(28 + x_shift, 56), "DR": Position(26 + x_shift, 72),
            "DMC": Position(40 + x_shift, 50), "MC1": Position(48 + x_shift, 43), "MC2": Position(48 + x_shift, 57),
            "AML": Position(56 + x_shift, 35), "AMR": Position(56 + x_shift, 65), "FC1": Position(66 + x_shift, 45), "FC2": Position(66 + x_shift, 55),
        }
    return WobMap(name, positions, pressing)


def overload_wib() -> WibMap:
    tactic = base_wib("attacking-overload", 13)
    positions = {zone: dict(players) for zone, players in tactic.positions_by_zone.items()}
    positions[ATT_CENTER] = {name: Position(x, y) for name, x, y in [
        ("DL", 50, 38), ("DC1", 48, 45), ("DC2", 48, 55), ("DR", 50, 62), ("DMC", 60, 50),
        ("MC1", 68, 45), ("MC2", 68, 55), ("AML", 78, 47), ("AMR", 78, 53), ("FC1", 88, 48), ("FC2", 88, 52),
    ]}
    return WibMap("attacking-overload", positions, 13)


def extreme_wib() -> WibMap:
    tactic = base_wib("extreme-attacking", 14)
    names = sorted(next(iter(tactic.positions_by_zone.values())).keys())
    positions = {zone: dict(players) for zone, players in tactic.positions_by_zone.items()}
    positions[ATT_CENTER] = {name: Position(90, 50) for name in names}
    positions[MID_RIGHT] = {name: Position(72, 84 - index * 6) for index, name in enumerate(names)}
    return WibMap("extreme-attacking", positions, 14)


def pick_book(style: str) -> WibWobBook:
    if style == "balanced":
        return WibWobBook(base_wib(), compact_wob(), "balanced")
    if style == "overload":
        return WibWobBook(overload_wib(), compact_wob(), "balanced")
    if style == "high-mismatch":
        return WibWobBook(extreme_wib(), compact_wob("deep-compact", 12), "slow-recover")
    if style == "slow-break":
        return WibWobBook(base_wib(), compact_wob(), "slow-break")
    raise ValueError(style)


def context() -> TransitionContext:
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
        ],
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Run spike 004 WIB vs WOB transition demo.")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--home-style", choices=["balanced", "overload", "high-mismatch", "slow-break"], default="high-mismatch")
    args = parser.parse_args()

    result = simulate_transition_match(
        make_team("Home", attack=13, midfield=13, defense=11),
        make_team("Away", attack=11, midfield=11, defense=11),
        pick_book(args.home_style),
        pick_book("balanced"),
        context(),
        seed=args.seed,
    )
    print(json.dumps({
        "seed": args.seed,
        "home_style": args.home_style,
        "scoreline": result.report.scoreline,
        "stats": {team: asdict(stats) for team, stats in result.team_stats.items()},
        "transition_diagnostics": result.transition_diagnostics,
        "key_reasons": result.report.key_reasons,
        "events": result.events[:10],
    }, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
