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
class Player:
    name: str
    role: str
    attack: int
    defense: int
    pace: int
    stamina: int
    positioning: int
    teamwork: int


@dataclass(frozen=True)
class Team:
    name: str
    players: List[Player]


@dataclass(frozen=True)
class Tactic:
    mentality: str
    tempo: int


@dataclass(frozen=True)
class WibWobMap:
    name: str
    positions_by_zone: Dict[Zone, Dict[str, Position]]
    pressing: int

    def with_pressing(self, pressing: int) -> "WibWobMap":
        return replace(self, pressing=pressing)


@dataclass(frozen=True)
class IntegratedContext:
    weather: str
    home_advantage: float
    ball_path: List[BallStep]


@dataclass(frozen=True)
class MatchStats:
    central_attacks: int = 0
    wide_entries: int = 0
    shots: int = 0
    goals: int = 0
    late_arrivals: int = 0
    central_protection: float = 1.0
    average_chance_quality: float = 0.0
    average_shot_quality: float = 0.0
    early_turnovers: int = 0
    late_chance_quality: float = 0.0


@dataclass(frozen=True)
class IntegratedReport:
    scoreline: str
    key_reasons: List[str]


@dataclass(frozen=True)
class IntegratedResult:
    score: Tuple[int, int]
    events: List[str]
    match_stats: Dict[str, MatchStats]
    tactical_diagnostics: List[str]
    report: IntegratedReport


@dataclass
class _MutableStats:
    central_attacks: int = 0
    wide_entries: int = 0
    shots: int = 0
    goals: int = 0
    late_arrivals: int = 0
    central_protection: float = 1.0
    chance_quality_sum: float = 0.0
    shot_quality_sum: float = 0.0
    early_turnovers: int = 0
    late_chance_quality_sum: float = 0.0
    late_chances: int = 0
    chances: int = 0

    def freeze(self) -> MatchStats:
        return MatchStats(
            central_attacks=self.central_attacks,
            wide_entries=self.wide_entries,
            shots=self.shots,
            goals=self.goals,
            late_arrivals=self.late_arrivals,
            central_protection=round(self.central_protection, 3),
            average_chance_quality=round(self.chance_quality_sum / max(1, self.chances), 3),
            average_shot_quality=round(self.shot_quality_sum / max(1, self.shots), 3),
            early_turnovers=self.early_turnovers,
            late_chance_quality=round(self.late_chance_quality_sum / max(1, self.late_chances), 3),
        )


@dataclass(frozen=True)
class _WibAnalysis:
    central_density: float
    short_support: float
    wide_exposure: float
    congestion_penalty: float
    max_same_point: int


@dataclass(frozen=True)
class _MovementProfile:
    total_distance: float
    fatigue: float
    late_arrivals: int
    central_protection: float
    early_pressure: float
    second_half_recovery: float
    dmc_coverage: float


def simulate_integrated_match(
    home: Team,
    away: Team,
    home_tactic: Tactic,
    away_tactic: Tactic,
    home_wibwob: WibWobMap,
    away_wibwob: WibWobMap,
    context: IntegratedContext,
    *,
    seed: int,
) -> IntegratedResult:
    rng = random.Random(seed)
    profiles = {
        home.name: _movement_profile(home, home_wibwob, context.ball_path, seed + 1),
        away.name: _movement_profile(away, away_wibwob, context.ball_path, seed + 2),
    }
    attacking_zone = next((step.zone for step in reversed(context.ball_path) if step.zone.third == "attacking"), context.ball_path[-1].zone)
    analyses = {
        home.name: _analyze_wibwob(home_wibwob, attacking_zone),
        away.name: _analyze_wibwob(away_wibwob, attacking_zone),
    }
    tactics = {home.name: home_tactic, away.name: away_tactic}
    wibwobs = {home.name: home_wibwob, away.name: away_wibwob}
    teams = {home.name: home, away.name: away}
    stats = {home.name: _MutableStats(), away.name: _MutableStats()}
    events: List[str] = []
    diagnostics: List[str] = []

    for team in (home, away):
        profile = profiles[team.name]
        analysis = analyses[team.name]
        stats[team.name].late_arrivals = profile.late_arrivals
        stats[team.name].central_protection = profile.central_protection
        if analysis.central_density > 0.70 and analysis.wide_exposure > 0.80:
            diagnostics.append(f"{team.name} central overload created short passing options but exposed wide areas")
        if profile.late_arrivals >= 6:
            diagnostics.append(f"{team.name} extreme movement caused late defensive arrivals")
        if analysis.congestion_penalty > 0.0:
            diagnostics.append(f"{team.name} congestion reduced shot quality")
        if profile.dmc_coverage < 0.75:
            diagnostics.append(f"{team.name} DMC protection degraded after repeated lateral switches")
        if wibwobs[team.name].pressing >= 15 and profile.second_half_recovery < 0.75:
            diagnostics.append(f"{team.name} high pressing created early turnovers but increased late fatigue risk")

    steps = context.ball_path
    for index, step in enumerate(steps, start=1):
        late_phase = index > len(steps) * 0.60
        for attacking, defending, venue in ((home, away, context.home_advantage), (away, home, 1.0)):
            attack_name = attacking.name
            defense_name = defending.name
            attack_analysis = analyses[attack_name]
            defense_profile = profiles[defense_name]
            attack_profile = profiles[attack_name]
            tactic = tactics[attack_name]

            central_bias = attack_analysis.central_density * 2.0 + attack_analysis.short_support * 0.10
            if step.zone.lane == "center":
                central_prob = 0.45 + central_bias * 0.12
            else:
                central_prob = 0.22 + central_bias * 0.06
            central_prob = min(0.92, central_prob)
            is_central = rng.random() < central_prob

            base_quality = _team_attack(attacking) * 0.030 + _mentality_bonus(tactic.mentality) + (tactic.tempo - 10) * 0.010
            base_quality *= venue
            if is_central:
                stats[attack_name].central_attacks += 1
                quality = base_quality + attack_analysis.central_density * 0.09 + attack_analysis.short_support * 0.012
                quality -= attack_analysis.congestion_penalty * 0.10
                quality -= profiles[defense_name].central_protection * 0.08
            else:
                stats[attack_name].wide_entries += 1
                quality = base_quality + analyses[defense_name].wide_exposure * 0.09
                quality += defense_profile.late_arrivals * 0.003

            quality += defense_profile.late_arrivals * 0.004
            quality += (1.0 - defense_profile.second_half_recovery) * (0.16 if late_phase else 0.04)
            quality = max(0.05, min(0.95, quality))
            stats[attack_name].chance_quality_sum += quality
            stats[attack_name].chances += 1
            if late_phase:
                stats[attack_name].late_chance_quality_sum += quality
                stats[attack_name].late_chances += 1

            early_pressure = attack_profile.early_pressure / max(1, len(steps))
            if index <= len(steps) // 2:
                stats[attack_name].early_turnovers += int(max(0, early_pressure // 14))

            shot_threshold = 0.29 + quality * 0.33
            if rng.random() < shot_threshold:
                stats[attack_name].shots += 1
                shot_quality = quality - attack_analysis.congestion_penalty * 0.12
                shot_quality = max(0.02, min(0.95, shot_quality))
                stats[attack_name].shot_quality_sum += shot_quality
                events.append(f"{step.tick}: {attack_name} {'central attack' if is_central else 'wide entry'} produced shot quality {shot_quality:.2f}")
                if rng.random() < shot_quality * 0.22:
                    stats[attack_name].goals += 1
                    events.append(f"{step.tick}: GOAL {attack_name}")

    # Add explicit tactical consequence counters after event simulation. These are
    # deterministic spike-level links from WIB/WOB analysis to match outcomes.
    for attacking, defending in ((home, away), (away, home)):
        attack_name = attacking.name
        defense_name = defending.name
        stats[attack_name].wide_entries += int(analyses[defense_name].wide_exposure * 1.5)
        stats[attack_name].central_attacks += int((1.0 - profiles[defense_name].central_protection) * 5)
        stats[attack_name].early_turnovers += int(profiles[attack_name].early_pressure / 30)

    frozen = {name: mutable.freeze() for name, mutable in stats.items()}
    score = (frozen[home.name].goals, frozen[away.name].goals)
    report = _build_report(home, away, home_tactic, away_tactic, diagnostics, score)
    return IntegratedResult(score=score, events=events, match_stats=frozen, tactical_diagnostics=diagnostics, report=report)


def _team_attack(team: Team) -> float:
    return sum(player.attack for player in team.players) / len(team.players)


def _mentality_bonus(mentality: str) -> float:
    return {"defensive": -0.04, "balanced": 0.0, "attacking": 0.08}.get(mentality, 0.0)


def _analyze_wibwob(wibwob: WibWobMap, zone: Zone) -> _WibAnalysis:
    positions = _positions_for_zone(wibwob, zone)
    coords = list(positions.values())
    central = [pos for pos in coords if 35 <= pos.y <= 65]
    wide = [pos for pos in coords if pos.y <= 30 or pos.y >= 70]
    central_density = len(central) / max(1, len(coords))
    pairs = 0
    for i, a in enumerate(coords):
        for b in coords[i + 1 :]:
            if a.distance_to(b) <= 12:
                pairs += 1
    short_support = pairs / max(1, len(coords))
    wide_exposure = (1.0 - len(wide) / max(1, len(coords))) + max(0.0, central_density - 0.55)
    point_counts: Dict[Tuple[float, float], int] = {}
    for pos in coords:
        key = (round(pos.x, 1), round(pos.y, 1))
        point_counts[key] = point_counts.get(key, 0) + 1
    max_same = max(point_counts.values()) if point_counts else 0
    congestion = max(0, max_same - 1) * 0.18
    return _WibAnalysis(
        central_density=round(central_density, 3),
        short_support=round(short_support, 3),
        wide_exposure=round(wide_exposure, 3),
        congestion_penalty=round(congestion, 3),
        max_same_point=max_same,
    )


def _movement_profile(team: Team, wibwob: WibWobMap, ball_path: List[BallStep], seed: int) -> _MovementProfile:
    rng = random.Random(seed)
    player_by_name = {p.name: p for p in team.players}
    first = _positions_for_zone(wibwob, ball_path[0].zone)
    current = {name: first[name] for name in first if name in player_by_name}
    distance_total = 0.0
    fatigue_total = 0.0
    late = 0
    coverage = {name: 1.0 for name in current}
    early_pressure = 0.0
    midpoint = max(1, len(ball_path) // 2)

    for index, step in enumerate(ball_path[1:], start=1):
        targets = _positions_for_zone(wibwob, step.zone)
        analysis = _analyze_wibwob(wibwob, step.zone)
        if index <= midpoint:
            early_pressure += wibwob.pressing * (1.0 + analysis.central_density * 0.25) - analysis.congestion_penalty
        for name, target in targets.items():
            if name not in current or name not in player_by_name:
                continue
            player = player_by_name[name]
            distance = current[name].distance_to(target) + rng.random() * 0.01
            distance_total += distance
            movement_cost = distance * (0.050 + wibwob.pressing * 0.0025)
            pressing_cost = wibwob.pressing * 0.018
            fatigue = max(0.0, movement_cost + pressing_cost - player.stamina * 0.018)
            fatigue_total += fatigue
            reach = player.pace * 2.15 + player.positioning * 0.65 + player.teamwork * 0.35
            if distance > reach:
                late += 1
            loss = max(0.0, (distance - reach * 0.55) / 100.0) + fatigue_total / (len(team.players) * 240.0)
            coverage[name] = max(0.05, coverage[name] - loss)
            current[name] = target

    dmc = coverage.get("DMC", 1.0)
    central_protection = max(0.0, min(1.0, dmc * 1.02 - late * 0.006))
    second_half_recovery = max(0.0, 1.0 - fatigue_total / (len(team.players) * 100.0))
    return _MovementProfile(
        total_distance=round(distance_total, 3),
        fatigue=round(fatigue_total, 3),
        late_arrivals=late,
        central_protection=round(central_protection, 3),
        early_pressure=round(early_pressure, 3),
        second_half_recovery=round(second_half_recovery, 3),
        dmc_coverage=round(dmc, 3),
    )


def _positions_for_zone(wibwob: WibWobMap, zone: Zone) -> Dict[str, Position]:
    if zone in wibwob.positions_by_zone:
        return wibwob.positions_by_zone[zone]
    return next(iter(wibwob.positions_by_zone.values()))


def _build_report(home: Team, away: Team, home_tactic: Tactic, away_tactic: Tactic, diagnostics: List[str], score: Tuple[int, int]) -> IntegratedReport:
    reasons: List[str] = []
    if home_tactic.mentality == "attacking":
        reasons.append(f"{home.name} attacking mentality increased pressure")
    if away_tactic.mentality == "attacking":
        reasons.append(f"{away.name} attacking mentality increased pressure")
    reasons.extend(diagnostics)
    return IntegratedReport(scoreline=f"{home.name} {score[0]}-{score[1]} {away.name}", key_reasons=reasons)
