from __future__ import annotations

import argparse
import json
from dataclasses import asdict

from movement_model import BallStep, PlayerProfile, Position, WibWobTactic, Zone, analyze_tactic, simulate_movement

DEF_LEFT = Zone("defensive", "left")
MID_CENTER = Zone("middle", "center")
MID_RIGHT = Zone("middle", "right")
ATT_CENTER = Zone("attacking", "center")


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


def compact_tactic(pressing: int = 10) -> WibWobTactic:
    positions = {}
    for zone, x_shift in [(DEF_LEFT, -8), (MID_CENTER, 0), (MID_RIGHT, 5), (ATT_CENTER, 8)]:
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
    return WibWobTactic(name="compact", positions_by_zone=positions, pressing=pressing)


def overload_tactic() -> WibWobTactic:
    tactic = compact_tactic(pressing=14)
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
    return WibWobTactic(name="overload", positions_by_zone=positions, pressing=14)


def extreme_tactic() -> WibWobTactic:
    tactic = compact_tactic(pressing=15)
    positions = {zone: dict(players) for zone, players in tactic.positions_by_zone.items()}
    positions[DEF_LEFT] = {name: Position(18, 18 + idx * 6) for idx, name in enumerate(tactic.player_names)}
    positions[MID_RIGHT] = {name: Position(68, 82 - idx * 6) for idx, name in enumerate(tactic.player_names)}
    positions[ATT_CENTER] = {name: Position(88, 50) for name in tactic.player_names}
    return WibWobTactic(name="extreme", positions_by_zone=positions, pressing=15)


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


def main() -> None:
    parser = argparse.ArgumentParser(description="Run spike 002 Option A WIB/WOB movement-load demo.")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--scenario", choices=["compact", "overload", "extreme"], default="overload")
    args = parser.parse_args()

    tactic = {
        "compact": compact_tactic,
        "overload": overload_tactic,
        "extreme": extreme_tactic,
    }[args.scenario]()

    result = simulate_movement(squad(), tactic, ball_path(), seed=args.seed)
    analysis = analyze_tactic(tactic, ATT_CENTER)
    payload = {
        "seed": args.seed,
        "scenario": args.scenario,
        "team_metrics": asdict(result.team_metrics),
        "attacking_zone_analysis": asdict(analysis),
        "diagnostics": result.diagnostics,
        "first_10_events": result.events[:10],
    }
    print(json.dumps(payload, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
