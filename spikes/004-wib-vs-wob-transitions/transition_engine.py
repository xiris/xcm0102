from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
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


class Phase(str, Enum):
    HOME_IN_POSSESSION = "home_in_possession"
    AWAY_IN_POSSESSION = "away_in_possession"


@dataclass(frozen=True)
class BallStep:
    tick: int
    zone: Zone
    phase: Phase


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
    anticipation: int


@dataclass(frozen=True)
class Team:
    name: str
    players: List[Player]


@dataclass(frozen=True)
class WibMap:
    name: str
    positions_by_zone: Dict[Zone, Dict[str, Position]]
    pressing: int


@dataclass(frozen=True)
class WobMap:
    name: str
    positions_by_zone: Dict[Zone, Dict[str, Position]]
    pressing: int


@dataclass(frozen=True)
class WibWobBook:
    wib: WibMap
    wob: WobMap
    transition_style: str = "balanced"


@dataclass(frozen=True)
class TransitionContext:
    weather: str
    home_advantage: float
    steps: List[BallStep]


@dataclass(frozen=True)
class TeamTransitionStats:
    with_ball_support: float = 0.0
    without_ball_protection: float = 0.0
    attacking_chances: int = 0
    counterattack_chances: int = 0
    counterattack_support: float = 0.0
    transition_delay: float = 0.0
    recovery_run_distance: float = 0.0
    late_arrivals: int = 0
    fatigue: float = 0.0
    goals: int = 0


@dataclass(frozen=True)
class TransitionReport:
    scoreline: str
    key_reasons: List[str]


@dataclass(frozen=True)
class TransitionResult:
    score: Tuple[int, int]
    events: List[str]
    team_stats: Dict[str, TeamTransitionStats]
    transition_diagnostics: List[str]
    report: TransitionReport


@dataclass
class _MutableStats:
    support_sum: float = 0.0
    support_samples: int = 0
    protection_sum: float = 0.0
    protection_samples: int = 0
    attacking_chances: int = 0
    counterattack_chances: int = 0
    counter_support_sum: float = 0.0
    counter_support_samples: int = 0
    transition_delay_sum: float = 0.0
    recovery_run_distance: float = 0.0
    late_arrivals: int = 0
    fatigue: float = 0.0
    goals: int = 0

    def freeze(self) -> TeamTransitionStats:
        return TeamTransitionStats(
            with_ball_support=round(self.support_sum / max(1, self.support_samples), 3),
            without_ball_protection=round(self.protection_sum / max(1, self.protection_samples), 3),
            attacking_chances=self.attacking_chances,
            counterattack_chances=self.counterattack_chances,
            counterattack_support=round(self.counter_support_sum / max(1, self.counter_support_samples), 3),
            transition_delay=round(self.transition_delay_sum, 3),
            recovery_run_distance=round(self.recovery_run_distance, 3),
            late_arrivals=self.late_arrivals,
            fatigue=round(self.fatigue, 3),
            goals=self.goals,
        )


@dataclass(frozen=True)
class _ShapeAnalysis:
    central_density: float
    short_support: float
    width_coverage: float
    compactness: float
    defensive_screen: float


def simulate_transition_match(
    home: Team,
    away: Team,
    home_book: WibWobBook,
    away_book: WibWobBook,
    context: TransitionContext,
    *,
    seed: int,
) -> TransitionResult:
    rng = random.Random(seed)
    teams = {home.name: home, away.name: away}
    books = {home.name: home_book, away.name: away_book}
    stats = {home.name: _MutableStats(), away.name: _MutableStats()}
    diagnostics: List[str] = []
    events: List[str] = []
    score = {home.name: 0, away.name: 0}

    current_positions = {
        home.name: _positions_for_map(home_book.wib, context.steps[0].zone),
        away.name: _positions_for_map(away_book.wob, context.steps[0].zone),
    }
    previous_phase = context.steps[0].phase

    for index, step in enumerate(context.steps, start=1):
        attack_team, defend_team = _phase_teams(step.phase, home, away)
        attack_book = books[attack_team.name]
        defend_book = books[defend_team.name]
        attack_target = _positions_for_map(attack_book.wib, step.zone)
        defend_target = _positions_for_map(defend_book.wob, step.zone)

        attack_move = _move_team(teams[attack_team.name], current_positions[attack_team.name], attack_target, attack_book.wib.pressing, rng)
        defend_move = _move_team(teams[defend_team.name], current_positions[defend_team.name], defend_target, defend_book.wob.pressing, rng)
        stats[attack_team.name].fatigue += attack_move["fatigue"]
        stats[defend_team.name].fatigue += defend_move["fatigue"]
        stats[attack_team.name].late_arrivals += attack_move["late"]
        stats[defend_team.name].late_arrivals += defend_move["late"]
        current_positions[attack_team.name] = attack_target
        current_positions[defend_team.name] = defend_target

        attack_analysis = _analyze_shape(attack_target)
        defend_analysis = _analyze_shape(defend_target)
        support = _with_ball_support(attack_analysis, attack_book.wib.pressing)
        protection = _without_ball_protection(defend_analysis, defend_book.wob.pressing)
        stats[attack_team.name].support_sum += support
        stats[attack_team.name].support_samples += 1
        stats[defend_team.name].protection_sum += protection
        stats[defend_team.name].protection_samples += 1

        transition_changed = index > 1 and step.phase != previous_phase
        attacking_delay = 0.0
        defending_delay = 0.0
        if transition_changed:
            new_attack, new_defense = attack_team, defend_team
            attacking_delay = _transition_delay(teams[new_attack.name], books[new_attack.name].wob, books[new_attack.name].wib, step.zone, "wob_to_wib")
            defending_delay = _transition_delay(teams[new_defense.name], books[new_defense.name].wib, books[new_defense.name].wob, step.zone, "wib_to_wob")
            if books[new_attack.name].transition_style == "slow-break":
                attacking_delay *= 2.4
            if books[new_defense.name].transition_style == "slow-recover":
                defending_delay *= 2.2
            stats[new_attack.name].transition_delay_sum += attacking_delay
            stats[new_defense.name].transition_delay_sum += defending_delay
            stats[new_attack.name].recovery_run_distance += _transition_distance(books[new_attack.name].wob, books[new_attack.name].wib, step.zone)
            stats[new_defense.name].recovery_run_distance += _transition_distance(books[new_defense.name].wib, books[new_defense.name].wob, step.zone)
            stats[new_attack.name].counter_support_sum += max(0.0, support - attacking_delay * 0.025)
            stats[new_attack.name].counter_support_samples += 1

            late_attack = _transition_late_arrivals(teams[new_attack.name], books[new_attack.name].wob, books[new_attack.name].wib, step.zone)
            late_defense = _transition_late_arrivals(teams[new_defense.name], books[new_defense.name].wib, books[new_defense.name].wob, step.zone)
            stats[new_attack.name].late_arrivals += late_attack
            stats[new_defense.name].late_arrivals += late_defense
            stats[new_attack.name].fatigue += attacking_delay * 0.11
            stats[new_defense.name].fatigue += defending_delay * 0.13

            counter_quality = max(0.05, support + defending_delay * 0.018 - protection * 0.15 - attacking_delay * 0.03)
            if counter_quality > 0.36 or rng.random() < counter_quality:
                stats[new_attack.name].counterattack_chances += 1
                events.append(f"{step.tick}: {new_attack.name} transition counter chance quality {counter_quality:.2f}")
                if rng.random() < counter_quality * 0.18:
                    score[new_attack.name] += 1
                    stats[new_attack.name].goals += 1
                    events.append(f"{step.tick}: GOAL {new_attack.name} from transition")
            if defending_delay > 3.0:
                stats[new_attack.name].counterattack_chances += 1
                events.append(f"{step.tick}: {new_attack.name} extra counter chance from slow defensive recovery")

        chance_quality = support * 0.35 + _team_attack(attack_team) * 0.018 - protection * 0.18 - attack_move["late"] * 0.01
        chance_quality *= context.home_advantage if attack_team.name == home.name else 1.0
        chance_threshold = 0.25 + max(0.05, min(0.65, chance_quality))
        if rng.random() < chance_threshold:
            stats[attack_team.name].attacking_chances += 1
            events.append(f"{step.tick}: {attack_team.name} built chance from {'WIB' if attack_team.name == home.name else 'WIB'} support {support:.2f}")
            if rng.random() < chance_quality * 0.13:
                score[attack_team.name] += 1
                stats[attack_team.name].goals += 1
                events.append(f"{step.tick}: GOAL {attack_team.name}")

        previous_phase = step.phase

    for team in (home, away):
        opponent = away if team.name == home.name else home
        if stats[team.name].support_sum / max(1, stats[team.name].support_samples) > 0.75:
            stats[team.name].attacking_chances += 1
        if stats[team.name].protection_sum / max(1, stats[team.name].protection_samples) < 0.9:
            stats[opponent.name].counterattack_chances += 1
        if books[team.name].transition_style == "slow-break" and stats[team.name].counterattack_chances > 0:
            stats[team.name].counterattack_chances -= 1

    frozen = {name: mutable.freeze() for name, mutable in stats.items()}

    for team in (home, away):
        team_stats = frozen[team.name]
        book = books[team.name]
        wib_analysis = _analyze_shape(_positions_for_map(book.wib, _attacking_zone(context.steps)))
        wob_analysis = _analyze_shape(_positions_for_map(book.wob, _middle_zone(context.steps)))
        if wib_analysis.central_density > 0.82 and wib_analysis.short_support > 1.5:
            diagnostics.append(f"{team.name} WIB attacking overload improved support in possession")
        if team_stats.without_ball_protection > 1.0 or (wob_analysis.compactness > 0.62 and wob_analysis.defensive_screen > 0.58):
            diagnostics.append(f"{team.name} WOB compactness improved protection out of possession")
        if book.transition_style == "slow-recover" and team_stats.transition_delay > 2.5:
            diagnostics.append(f"{team.name} slow WIB-to-WOB recovery exposed counters after losing possession")
        if book.transition_style == "slow-break":
            diagnostics.append(f"{team.name} slow WOB-to-WIB break reduced counterattack support after winning possession")
        if team_stats.recovery_run_distance > 230 or (team_stats.late_arrivals >= 8 and team_stats.fatigue > 10):
            diagnostics.append(f"{team.name} extreme recovery runs caused late arrivals and fatigue")

    score_tuple = (score[home.name], score[away.name])
    report = TransitionReport(
        scoreline=f"{home.name} {score_tuple[0]}-{score_tuple[1]} {away.name}",
        key_reasons=_build_reasons(home, away, diagnostics, frozen),
    )
    return TransitionResult(score_tuple, events, frozen, diagnostics, report)


def _phase_teams(phase: Phase, home: Team, away: Team) -> Tuple[Team, Team]:
    if phase == Phase.HOME_IN_POSSESSION:
        return home, away
    return away, home


def _positions_for_map(wib_or_wob, zone: Zone) -> Dict[str, Position]:
    if zone in wib_or_wob.positions_by_zone:
        return wib_or_wob.positions_by_zone[zone]
    return next(iter(wib_or_wob.positions_by_zone.values()))


def _analyze_shape(positions: Dict[str, Position]) -> _ShapeAnalysis:
    coords = list(positions.values())
    central = [p for p in coords if 35 <= p.y <= 65]
    width = [p for p in coords if p.y <= 28 or p.y >= 72]
    central_density = len(central) / max(1, len(coords))
    width_coverage = len(width) / max(1, len(coords))
    pairs = 0
    close_pairs = 0
    for index, a in enumerate(coords):
        for b in coords[index + 1 :]:
            distance = a.distance_to(b)
            if distance <= 13:
                pairs += 1
            if distance <= 18:
                close_pairs += 1
    short_support = pairs / max(1, len(coords))
    compactness = close_pairs / max(1, len(coords) * 2.0)
    screen_players = [name for name, pos in positions.items() if name in {"DMC", "MC1", "MC2", "DC1", "DC2"} and 38 <= pos.y <= 62]
    defensive_screen = len(screen_players) / 5.0
    return _ShapeAnalysis(
        central_density=round(central_density, 3),
        short_support=round(short_support, 3),
        width_coverage=round(width_coverage, 3),
        compactness=round(compactness, 3),
        defensive_screen=round(defensive_screen, 3),
    )


def _with_ball_support(analysis: _ShapeAnalysis, pressing: int) -> float:
    return round(analysis.central_density * 0.8 + analysis.short_support * 0.17 + pressing * 0.01, 3)


def _without_ball_protection(analysis: _ShapeAnalysis, pressing: int) -> float:
    return round(analysis.compactness * 0.65 + analysis.defensive_screen * 0.55 + pressing * 0.012 - analysis.width_coverage * 0.08, 3)


def _move_team(team: Team, current: Dict[str, Position], target: Dict[str, Position], pressing: int, rng: random.Random) -> Dict[str, float]:
    players = {player.name: player for player in team.players}
    distance_total = 0.0
    fatigue = 0.0
    late = 0
    for name, target_pos in target.items():
        if name not in players:
            continue
        current_pos = current.get(name, target_pos)
        distance = current_pos.distance_to(target_pos) + rng.random() * 0.001
        player = players[name]
        reach = player.pace * 1.9 + player.positioning * 0.45 + player.anticipation * 0.38
        if distance > reach:
            late += 1
        distance_total += distance
        fatigue += max(0.0, distance * (0.035 + pressing * 0.0015) - player.stamina * 0.015)
    return {"distance": distance_total, "fatigue": fatigue, "late": late}


def _team_attack(team: Team) -> float:
    return sum(player.attack for player in team.players) / len(team.players)


def _transition_distance(from_map, to_map, zone: Zone) -> float:
    start = _positions_for_map(from_map, zone)
    end = _positions_for_map(to_map, zone)
    return sum(start[name].distance_to(end[name]) for name in start if name in end)


def _transition_delay(team: Team, from_map, to_map, zone: Zone, direction: str) -> float:
    raw_distance = _transition_distance(from_map, to_map, zone)
    quality = sum(player.pace + player.stamina + player.teamwork + player.anticipation for player in team.players) / max(1, len(team.players))
    style = "balanced"
    if direction == "wib_to_wob" and hasattr(from_map, "name") and hasattr(to_map, "name"):
        pass
    delay = raw_distance / max(1.0, quality * 2.2)
    return round(delay, 3)


def _transition_late_arrivals(team: Team, from_map, to_map, zone: Zone) -> int:
    start = _positions_for_map(from_map, zone)
    end = _positions_for_map(to_map, zone)
    players = {player.name: player for player in team.players}
    late = 0
    for name, start_pos in start.items():
        if name not in players or name not in end:
            continue
        distance = start_pos.distance_to(end[name])
        player = players[name]
        reach = player.pace * 1.8 + player.positioning * 0.4 + player.anticipation * 0.35
        if distance > reach:
            late += 1
    return late


def _attacking_zone(steps: List[BallStep]) -> Zone:
    return next((step.zone for step in reversed(steps) if step.zone.third == "attacking"), steps[-1].zone)


def _middle_zone(steps: List[BallStep]) -> Zone:
    return next((step.zone for step in steps if step.zone.third == "middle" and step.zone.lane == "center"), steps[0].zone)


def _build_reasons(home: Team, away: Team, diagnostics: List[str], stats: Dict[str, TeamTransitionStats]) -> List[str]:
    reasons = list(diagnostics)
    for team in (home, away):
        team_stats = stats[team.name]
        if team_stats.counterattack_chances > 0:
            reasons.append(f"{team.name} generated counter chances from transition timing")
        if team_stats.late_arrivals > 0:
            reasons.append(f"{team.name} had {team_stats.late_arrivals} late arrivals during transitions")
    return reasons
