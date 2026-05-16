from __future__ import annotations

import argparse
import json
from dataclasses import asdict

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


def make_team(name: str, *, quality: str) -> Team:
    presets = {
        "weak": dict(physical=8, mental=7, stamina=7, attack=10, defense=10),
        "average": dict(physical=12, mental=12, stamina=12, attack=12, defense=12),
        "elite": dict(physical=17, mental=18, stamina=18, attack=15, defense=15),
    }
    p = presets[quality]
    physical = p["physical"]
    mental = p["mental"]
    stamina = p["stamina"]
    attack = p["attack"]
    defense = p["defense"]
    return Team(
        name=name,
        players=[
            Player("DL", "DL", 7, defense, physical, physical, stamina, mental, mental, mental, mental),
            Player("DC1", "DC", 6, defense + 2, physical - 1, physical - 1, stamina, mental + 1, mental, mental + 1, mental),
            Player("DC2", "DC", 6, defense + 2, physical - 1, physical - 1, stamina, mental + 1, mental, mental + 1, mental),
            Player("DR", "DR", 7, defense, physical, physical, stamina, mental, mental, mental, mental),
            Player("DMC", "DMC", 8, defense + 2, physical - 1, physical - 1, stamina + 1, mental + 3, mental + 1, mental + 2, mental + 1),
            Player("MC1", "MC", attack, defense, physical, physical, stamina + 1, mental, mental + 1, mental, mental + 1),
            Player("MC2", "MC", attack, defense, physical, physical, stamina + 1, mental, mental + 1, mental, mental + 1),
            Player("AML", "AML", attack + 1, 7, physical + 2, physical + 2, stamina, mental - 1, mental - 1, mental, mental),
            Player("AMR", "AMR", attack + 1, 7, physical + 2, physical + 2, stamina, mental - 1, mental - 1, mental, mental),
            Player("FC1", "FC", attack + 2, 5, physical + 1, physical + 1, stamina, mental, mental - 1, mental, mental),
            Player("FC2", "FC", attack + 2, 5, physical + 1, physical + 1, stamina, mental, mental - 1, mental, mental),
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


def high_mismatch_book() -> WibWobBook:
    tactic = base_wib("extreme-attacking", 14)
    names = sorted(next(iter(tactic.positions_by_zone.values())).keys())
    positions = {zone: dict(players) for zone, players in tactic.positions_by_zone.items()}
    positions[ATT_CENTER] = {name: Position(90, 50) for name in names}
    positions[MID_RIGHT] = {name: Position(72, 84 - index * 6) for index, name in enumerate(names)}
    return WibWobBook(WibMap("extreme-attacking", positions, 14), compact_wob("deep-compact", 12), "balanced")


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
            BallStep(8, MID_RIGHT, Phase.AWAY_IN_POSSESSION),
            BallStep(9, MID_CENTER, Phase.HOME_IN_POSSESSION),
        ],
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Run spike 005 attribute/familiarity transition demo.")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--home-quality", choices=["weak", "average", "elite"], default="weak")
    parser.add_argument("--familiarity", type=float, default=0.20)
    args = parser.parse_args()

    result = simulate_attribute_transition_match(
        make_team("Home", quality=args.home_quality),
        make_team("Away", quality="average"),
        high_mismatch_book(),
        WibWobBook(base_wib(), compact_wob(), "balanced"),
        FamiliarityProfile("high-mismatch", args.familiarity, 0),
        FamiliarityProfile("balanced", 0.75, 12),
        context(),
        seed=args.seed,
    )
    print(json.dumps({
        "seed": args.seed,
        "home_quality": args.home_quality,
        "familiarity": args.familiarity,
        "scoreline": result.report.scoreline,
        "stats": {team: asdict(stats) for team, stats in result.team_stats.items()},
        "diagnostics": result.diagnostics,
        "key_reasons": result.report.key_reasons,
        "events": result.events[:10],
    }, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
