from __future__ import annotations

import argparse
import json
from dataclasses import asdict

from integrated_engine import BallStep, IntegratedContext, Player, Position, Tactic, Team, WibWobMap, Zone, simulate_integrated_match

DEF_LEFT = Zone("defensive", "left")
MID_LEFT = Zone("middle", "left")
MID_CENTER = Zone("middle", "center")
MID_RIGHT = Zone("middle", "right")
ATT_CENTER = Zone("attacking", "center")
ATT_RIGHT = Zone("attacking", "right")


def make_team(name: str, *, attack=12, midfield=12, defense=11, stamina=11) -> Team:
    return Team(
        name=name,
        players=[
            Player("DL", "DL", 7, defense, 11, stamina, 12, 11),
            Player("DC1", "DC", 6, defense + 2, 10, stamina, 13, 11),
            Player("DC2", "DC", 6, defense + 2, 10, stamina, 13, 11),
            Player("DR", "DR", 7, defense, 11, stamina, 12, 11),
            Player("DMC", "DMC", 8, defense + 2, 10, stamina + 1, 15, 13),
            Player("MC1", "MC", midfield, defense, 12, stamina + 1, 12, 13),
            Player("MC2", "MC", midfield, defense, 12, stamina + 1, 12, 13),
            Player("AML", "AML", attack, 7, 14, stamina, 10, 10),
            Player("AMR", "AMR", attack, 7, 14, stamina, 10, 10),
            Player("FC1", "FC", attack + 2, 5, 13, stamina, 11, 10),
            Player("FC2", "FC", attack + 2, 5, 13, stamina, 11, 10),
        ],
    )


def compact_wibwob(name="compact", pressing=10) -> WibWobMap:
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


def overload_wibwob() -> WibWobMap:
    tactic = compact_wibwob("overload", pressing=13)
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
    return WibWobMap("overload", positions, pressing=13)


def same_point_wibwob() -> WibWobMap:
    tactic = overload_wibwob()
    positions = {zone: dict(players) for zone, players in tactic.positions_by_zone.items()}
    positions[ATT_CENTER] = {name: Position(82, 50) for name in positions[ATT_CENTER]}
    return WibWobMap("same-point", positions, pressing=13)


def extreme_wibwob() -> WibWobMap:
    tactic = compact_wibwob("extreme", pressing=15)
    names = sorted(next(iter(tactic.positions_by_zone.values())).keys())
    positions = {zone: dict(players) for zone, players in tactic.positions_by_zone.items()}
    positions[DEF_LEFT] = {name: Position(18, 18 + idx * 6) for idx, name in enumerate(names)}
    positions[MID_RIGHT] = {name: Position(68, 82 - idx * 6) for idx, name in enumerate(names)}
    positions[ATT_CENTER] = {name: Position(88, 50) for name in names}
    return WibWobMap("extreme", positions, pressing=15)


def context() -> IntegratedContext:
    return IntegratedContext(
        weather="normal",
        home_advantage=1.05,
        ball_path=[
            BallStep(1, DEF_LEFT),
            BallStep(2, MID_CENTER),
            BallStep(3, MID_RIGHT),
            BallStep(4, ATT_CENTER),
            BallStep(5, MID_CENTER),
            BallStep(6, ATT_RIGHT),
            BallStep(7, ATT_CENTER),
        ],
    )


def pick_wibwob(name: str) -> WibWobMap:
    return {
        "compact": compact_wibwob,
        "overload": overload_wibwob,
        "same-point": same_point_wibwob,
        "extreme": extreme_wibwob,
    }[name]()


def main() -> None:
    parser = argparse.ArgumentParser(description="Run spike 003 integrated match + WIB/WOB demo.")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--home-wibwob", choices=["compact", "overload", "same-point", "extreme"], default="overload")
    args = parser.parse_args()

    result = simulate_integrated_match(
        make_team("Home", attack=13, midfield=13, defense=11),
        make_team("Away", attack=11, midfield=11, defense=11),
        Tactic("attacking", tempo=13),
        Tactic("balanced", tempo=10),
        pick_wibwob(args.home_wibwob),
        compact_wibwob(),
        context(),
        seed=args.seed,
    )
    print(json.dumps({
        "seed": args.seed,
        "home_wibwob": args.home_wibwob,
        "scoreline": result.report.scoreline,
        "stats": {team: asdict(stats) for team, stats in result.match_stats.items()},
        "tactical_diagnostics": result.tactical_diagnostics,
        "key_reasons": result.report.key_reasons,
        "first_10_events": result.events[:10],
    }, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
