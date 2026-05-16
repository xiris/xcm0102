from __future__ import annotations

from dataclasses import dataclass, replace
import math
import random
from typing import Dict, List, Tuple


@dataclass(frozen=True, order=True)
class Zone:
    third: str
    lane: str


@dataclass(frozen=True)
class Position:
    x: float
    y: float

    def distance_to(self, other: "Position") -> float:
        return math.hypot(self.x - other.x, self.y - other.y)


@dataclass(frozen=True)
class BallStep:
    tick: int
    zone: Zone


@dataclass(frozen=True)
class PlayerProfile:
    name: str
    role: str
    pace: int
    stamina: int
    positioning: int
    teamwork: int


@dataclass(frozen=True)
class WibWobTactic:
    name: str
    positions_by_zone: Dict[Zone, Dict[str, Position]]
    pressing: int

    @property
    def player_names(self) -> List[str]:
        names = set()
        for zone_positions in self.positions_by_zone.values():
            names.update(zone_positions.keys())
        return sorted(names)

    def with_pressing(self, pressing: int) -> "WibWobTactic":
        return replace(self, pressing=pressing)

    def with_zone_position(self, zone: Zone, player_name: str, position: Position) -> "WibWobTactic":
        copied = {z: dict(players) for z, players in self.positions_by_zone.items()}
        if zone not in copied:
            copied[zone] = dict(next(iter(copied.values())))
        copied[zone][player_name] = position
        return replace(self, positions_by_zone=copied)


@dataclass(frozen=True)
class PlayerMetrics:
    total_distance: float
    fatigue_load: float
    late_arrivals: int
    uncovered_targets: int
    coverage_score: float


@dataclass(frozen=True)
class TeamMetrics:
    total_distance: float
    fatigue_load: float
    late_arrivals: int
    uncovered_targets: int
    central_protection: float
    early_pressure: float
    second_half_recovery: float
    wide_exposure: float


@dataclass(frozen=True)
class TacticAnalysis:
    central_density: float
    short_passing_support: float
    wide_exposure: float
    max_players_on_same_point: int
    congestion_penalty: float
    diagnostics: List[str]


@dataclass(frozen=True)
class MovementResult:
    events: List[str]
    team_metrics: TeamMetrics
    player_metrics: Dict[str, PlayerMetrics]
    diagnostics: List[str]


def analyze_tactic(tactic: WibWobTactic, zone: Zone) -> TacticAnalysis:
    positions = _positions_for_zone(tactic, zone)
    coords = list(positions.values())
    central_players = [p for p in coords if 35 <= p.y <= 65]
    wide_players = [p for p in coords if p.y <= 30 or p.y >= 70]
    central_density = round(len(central_players) / max(1, len(coords)), 3)

    support_pairs = 0
    for i, a in enumerate(coords):
        for b in coords[i + 1 :]:
            if a.distance_to(b) <= 12:
                support_pairs += 1
    short_passing_support = round(support_pairs / max(1, len(coords)), 3)

    wide_exposure = round((1.0 - len(wide_players) / max(1, len(coords))) + max(0.0, central_density - 0.55), 3)
    point_counts: Dict[Tuple[float, float], int] = {}
    for position in coords:
        key = (round(position.x, 1), round(position.y, 1))
        point_counts[key] = point_counts.get(key, 0) + 1
    max_same_point = max(point_counts.values()) if point_counts else 0
    congestion_penalty = round(max(0, max_same_point - 1) * 0.18, 3)

    diagnostics: List[str] = []
    if central_density > 0.70 and wide_exposure > 0.80:
        diagnostics.append("central overload improved short options but exposed wide zones")
    if max_same_point > 1:
        diagnostics.append(f"{max_same_point} players assigned to same point")

    return TacticAnalysis(
        central_density=central_density,
        short_passing_support=short_passing_support,
        wide_exposure=wide_exposure,
        max_players_on_same_point=max_same_point,
        congestion_penalty=congestion_penalty,
        diagnostics=diagnostics,
    )


def simulate_movement(players: List[PlayerProfile], tactic: WibWobTactic, ball_path: List[BallStep], *, seed: int) -> MovementResult:
    if not ball_path:
        raise ValueError("ball_path must contain at least one step")

    rng = random.Random(seed)
    player_by_name = {player.name: player for player in players}
    first_positions = _positions_for_zone(tactic, ball_path[0].zone)
    current_positions = {name: first_positions[name] for name in tactic.player_names if name in first_positions}

    distance_by_player = {name: 0.0 for name in current_positions}
    fatigue_by_player = {name: 0.0 for name in current_positions}
    late_by_player = {name: 0 for name in current_positions}
    uncovered_by_player = {name: 0 for name in current_positions}
    coverage_by_player = {name: 1.0 for name in current_positions}
    events: List[str] = []
    diagnostics: List[str] = []
    early_pressure_total = 0.0

    midpoint = max(1, len(ball_path) // 2)
    for index, step in enumerate(ball_path[1:], start=1):
        targets = _positions_for_zone(tactic, step.zone)
        analysis = analyze_tactic(tactic, step.zone)
        for diagnostic in analysis.diagnostics:
            if diagnostic not in diagnostics:
                diagnostics.append(diagnostic)

        for name, target in targets.items():
            if name not in current_positions or name not in player_by_name:
                continue
            player = player_by_name[name]
            distance = current_positions[name].distance_to(target)
            jitter = rng.random() * 0.01
            distance_by_player[name] += distance + jitter

            movement_cost = distance * (0.050 + tactic.pressing * 0.0025)
            pressing_cost = tactic.pressing * 0.018
            stamina_discount = player.stamina * 0.018
            fatigue = max(0.0, movement_cost + pressing_cost - stamina_discount)
            fatigue_by_player[name] += fatigue

            reach_budget = player.pace * 2.15 + player.positioning * 0.65 + player.teamwork * 0.35
            if distance > reach_budget:
                late_by_player[name] += 1
                uncovered_by_player[name] += 1
                events.append(f"{step.tick}: {name} arrived late moving {distance:.1f} to {step.zone.third}/{step.zone.lane}")

            coverage_loss = max(0.0, (distance - reach_budget * 0.55) / 100.0) + fatigue_by_player[name] / 180.0
            coverage_by_player[name] = max(0.05, coverage_by_player[name] - coverage_loss)
            current_positions[name] = target

        if index <= midpoint:
            early_pressure_total += tactic.pressing * (1.0 + analysis.central_density * 0.25) - analysis.congestion_penalty

    total_distance = round(sum(distance_by_player.values()), 3)
    fatigue_load = round(sum(fatigue_by_player.values()), 3)
    late_arrivals = sum(late_by_player.values())
    uncovered_targets = sum(uncovered_by_player.values())

    final_analysis = analyze_tactic(tactic, ball_path[-1].zone)
    dmc_coverage = coverage_by_player.get("DMC", 1.0)
    central_protection = round(max(0.0, min(1.0, dmc_coverage * (1.05 - final_analysis.congestion_penalty * 0.04))), 3)
    if total_distance > len(players) * len(ball_path) * 25:
        diagnostics.append("extreme movement load")
    if dmc_coverage < 0.75:
        diagnostics.append("DMC protection degraded by repeated lateral shifts")
    if tactic.pressing >= 15 and fatigue_load > len(players) * 10:
        diagnostics.append("high pressing increased early pressure but reduced late recovery")

    second_half_recovery = round(max(0.0, 1.0 - fatigue_load / (len(players) * 100.0)), 3)
    team_metrics = TeamMetrics(
        total_distance=total_distance,
        fatigue_load=fatigue_load,
        late_arrivals=late_arrivals,
        uncovered_targets=uncovered_targets,
        central_protection=central_protection,
        early_pressure=round(early_pressure_total, 3),
        second_half_recovery=second_half_recovery,
        wide_exposure=final_analysis.wide_exposure,
    )

    player_metrics = {
        name: PlayerMetrics(
            total_distance=round(distance_by_player[name], 3),
            fatigue_load=round(fatigue_by_player[name], 3),
            late_arrivals=late_by_player[name],
            uncovered_targets=uncovered_by_player[name],
            coverage_score=round(coverage_by_player[name], 3),
        )
        for name in sorted(distance_by_player)
    }

    return MovementResult(events=events, team_metrics=team_metrics, player_metrics=player_metrics, diagnostics=diagnostics)


def _positions_for_zone(tactic: WibWobTactic, zone: Zone) -> Dict[str, Position]:
    if zone in tactic.positions_by_zone:
        return tactic.positions_by_zone[zone]
    # Spike fallback: if a test asks for a zone not explicitly authored, use the
    # first authored screen as a base. Production should validate all zones.
    return next(iter(tactic.positions_by_zone.values()))
