from __future__ import annotations

from dataclasses import dataclass, replace
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
    acceleration: int
    stamina: int
    positioning: int
    teamwork: int
    anticipation: int
    decisions: int


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
class FamiliarityProfile:
    tactic_id: str
    familiarity: float
    matches_played: int = 0

    def after_match(self, *, minutes_used: int, training_focus: float) -> "FamiliarityProfile":
        minutes_factor = min(1.0, max(0.0, minutes_used / 90.0))
        focus = min(1.0, max(0.0, training_focus))
        learning = (1.0 - self.familiarity) * (0.035 * minutes_factor + 0.025 * focus)
        new_value = min(0.94, self.familiarity + learning)
        return replace(self, familiarity=round(new_value, 4), matches_played=self.matches_played + 1)


@dataclass(frozen=True)
class TransitionContext:
    weather: str
    home_advantage: float
    steps: List[BallStep]


@dataclass(frozen=True)
class AttributeTransitionStats:
    transition_delay: float = 0.0
    late_arrivals: int = 0
    fatigue: float = 0.0
    second_half_recovery: float = 1.0
    wob_recovery_quality: float = 0.0
    counterattack_support: float = 0.0
    counterattack_chances: int = 0
    attacking_chances: int = 0
    goals: int = 0
    attribute_execution: float = 0.0
    familiarity: float = 0.0


@dataclass(frozen=True)
class AttributeTransitionReport:
    scoreline: str
    key_reasons: List[str]


@dataclass(frozen=True)
class AttributeTransitionResult:
    score: Tuple[int, int]
    events: List[str]
    team_stats: Dict[str, AttributeTransitionStats]
    diagnostics: List[str]
    report: AttributeTransitionReport


@dataclass
class _MutableStats:
    transition_delay: float = 0.0
    late_arrivals: int = 0
    fatigue: float = 0.0
    wob_recovery_quality_sum: float = 0.0
    wob_recovery_samples: int = 0
    counter_support_sum: float = 0.0
    counter_support_samples: int = 0
    counterattack_chances: int = 0
    attacking_chances: int = 0
    goals: int = 0
    attribute_execution: float = 0.0
    familiarity: float = 0.0

    def freeze(self) -> AttributeTransitionStats:
        recovery = max(0.0, 1.0 - self.fatigue / 130.0)
        return AttributeTransitionStats(
            transition_delay=round(self.transition_delay, 3),
            late_arrivals=self.late_arrivals,
            fatigue=round(self.fatigue, 3),
            second_half_recovery=round(recovery, 3),
            wob_recovery_quality=round(self.wob_recovery_quality_sum / max(1, self.wob_recovery_samples), 3),
            counterattack_support=round(self.counter_support_sum / max(1, self.counter_support_samples), 3),
            counterattack_chances=self.counterattack_chances,
            attacking_chances=self.attacking_chances,
            goals=self.goals,
            attribute_execution=round(self.attribute_execution, 3),
            familiarity=round(self.familiarity, 3),
        )


@dataclass(frozen=True)
class _Quality:
    physical: float
    stamina: float
    defensive_mental: float
    attacking_mental: float
    attack: float
    defense: float
    execution: float


def simulate_attribute_transition_match(
    home: Team,
    away: Team,
    home_book: WibWobBook,
    away_book: WibWobBook,
    home_familiarity: FamiliarityProfile,
    away_familiarity: FamiliarityProfile,
    context: TransitionContext,
    *,
    seed: int,
) -> AttributeTransitionResult:
    rng = random.Random(seed)
    teams = {home.name: home, away.name: away}
    books = {home.name: home_book, away.name: away_book}
    familiarity = {home.name: home_familiarity, away.name: away_familiarity}
    quality = {
        home.name: _team_quality(home, home_familiarity),
        away.name: _team_quality(away, away_familiarity),
    }
    stats = {home.name: _MutableStats(), away.name: _MutableStats()}
    for team in (home, away):
        stats[team.name].attribute_execution = quality[team.name].execution
        stats[team.name].familiarity = familiarity[team.name].familiarity

    events: List[str] = []
    diagnostics: List[str] = []
    score = {home.name: 0, away.name: 0}
    previous_phase = context.steps[0].phase

    current_positions = {
        home.name: _positions_for_map(home_book.wib, context.steps[0].zone),
        away.name: _positions_for_map(away_book.wob, context.steps[0].zone),
    }

    for index, step in enumerate(context.steps, start=1):
        attack_team, defend_team = _phase_teams(step.phase, home, away)
        attack_target = _positions_for_map(books[attack_team.name].wib, step.zone)
        defend_target = _positions_for_map(books[defend_team.name].wob, step.zone)

        for team, target, pressing in (
            (attack_team, attack_target, books[attack_team.name].wib.pressing),
            (defend_team, defend_target, books[defend_team.name].wob.pressing),
        ):
            move = _move_cost(teams[team.name], current_positions[team.name], target, pressing, quality[team.name], rng)
            stats[team.name].fatigue += move["fatigue"]
            stats[team.name].late_arrivals += int(move["late"])
            current_positions[team.name] = target

        if index > 1 and step.phase != previous_phase:
            new_attack, new_defense = attack_team, defend_team
            attack_delay = _transition_delay(teams[new_attack.name], books[new_attack.name].wob, books[new_attack.name].wib, step.zone, quality[new_attack.name], familiarity[new_attack.name])
            defense_delay = _transition_delay(teams[new_defense.name], books[new_defense.name].wib, books[new_defense.name].wob, step.zone, quality[new_defense.name], familiarity[new_defense.name])
            stats[new_attack.name].transition_delay += attack_delay
            stats[new_defense.name].transition_delay += defense_delay

            attack_late = _late_arrivals(teams[new_attack.name], books[new_attack.name].wob, books[new_attack.name].wib, step.zone, quality[new_attack.name], familiarity[new_attack.name])
            defense_late = _late_arrivals(teams[new_defense.name], books[new_defense.name].wib, books[new_defense.name].wob, step.zone, quality[new_defense.name], familiarity[new_defense.name])
            stats[new_attack.name].late_arrivals += attack_late
            stats[new_defense.name].late_arrivals += defense_late
            stats[new_attack.name].fatigue += attack_delay * max(0.6, 1.25 - quality[new_attack.name].stamina * 0.55)
            stats[new_defense.name].fatigue += defense_delay * max(0.6, 1.30 - quality[new_defense.name].stamina * 0.55)

            recovery = max(0.0, quality[new_defense.name].defensive_mental * 0.58 + familiarity[new_defense.name].familiarity * 0.42 - defense_delay * 0.035)
            counter_support = max(0.0, quality[new_attack.name].attacking_mental * 0.50 + quality[new_attack.name].physical * 0.22 + familiarity[new_attack.name].familiarity * 0.28 - attack_delay * 0.020)
            stats[new_defense.name].wob_recovery_quality_sum += recovery
            stats[new_defense.name].wob_recovery_samples += 1
            stats[new_attack.name].counter_support_sum += counter_support
            stats[new_attack.name].counter_support_samples += 1

            counter_quality = counter_support + defense_delay * 0.055 - recovery * 0.38
            threshold = 0.40
            if counter_quality > threshold or rng.random() < counter_quality * 0.60:
                stats[new_attack.name].counterattack_chances += 1
                events.append(f"{step.tick}: {new_attack.name} counter chance support {counter_support:.2f} vs recovery {recovery:.2f}")
                if rng.random() < max(0.02, counter_quality * 0.12):
                    stats[new_attack.name].goals += 1
                    score[new_attack.name] += 1
                    events.append(f"{step.tick}: GOAL {new_attack.name} from attribute-led transition")

        attack_quality = quality[attack_team.name].attack * 0.35 + quality[attack_team.name].execution * 0.22 + familiarity[attack_team.name].familiarity * 0.12
        if attack_team.name == home.name:
            attack_quality *= context.home_advantage
        if rng.random() < 0.18 + attack_quality * 0.22:
            stats[attack_team.name].attacking_chances += 1
            events.append(f"{step.tick}: {attack_team.name} built chance with execution {quality[attack_team.name].execution:.2f}")

        previous_phase = step.phase

    # Deterministic spike-level consequences to make the causal links observable.
    for team in (home, away):
        opponent = away if team.name == home.name else home
        q = quality[team.name]
        if q.physical > 0.72:
            stats[team.name].late_arrivals = max(0, stats[team.name].late_arrivals - 2)
            stats[team.name].transition_delay *= 0.82
        if q.stamina > 0.76:
            stats[team.name].fatigue *= 0.72
        if q.defensive_mental > 0.76:
            stats[team.name].wob_recovery_quality_sum += 0.25
            stats[team.name].wob_recovery_samples += 1
            stats[opponent.name].counterattack_chances = max(0, stats[opponent.name].counterattack_chances - 1)
        if q.attacking_mental > 0.76:
            stats[team.name].counter_support_sum += 0.30
            stats[team.name].counter_support_samples += 1
            stats[team.name].counterattack_chances += 1
        if familiarity[team.name].familiarity < 0.35:
            stats[team.name].transition_delay *= 1.45
            stats[team.name].late_arrivals += 2
            stats[team.name].fatigue *= 1.12

    frozen = {name: mutable.freeze() for name, mutable in stats.items()}

    for team in (home, away):
        q = quality[team.name]
        team_stats = frozen[team.name]
        opponent = away if team.name == home.name else home
        if q.physical > 0.72:
            diagnostics.append(f"{team.name} superior pace and acceleration reduced transition delay")
        if q.stamina > 0.76:
            diagnostics.append(f"{team.name} stamina protected repeated recovery runs")
        if q.defensive_mental > 0.76:
            diagnostics.append(f"{team.name} positioning and anticipation improved WOB recovery")
        if q.attacking_mental > 0.76:
            diagnostics.append(f"{team.name} teamwork and decisions improved WOB-to-WIB counter support")
        if familiarity[team.name].familiarity < 0.35:
            diagnostics.append(f"{team.name} low tactical familiarity slowed transition execution")
        if _transition_distance(books[team.name].wib, books[team.name].wob, _attacking_zone(context.steps)) > 300:
            diagnostics.append(f"{team.name} tactic geometry created long WIB/WOB recovery runs")
        if team_stats.attribute_execution < 0.45:
            diagnostics.append(f"{team.name} player attributes limited transition execution")
        if frozen[opponent.name].counterattack_chances > 0 and team_stats.wob_recovery_quality < 0.55:
            diagnostics.append(f"{team.name} weak WOB recovery invited opponent counters")

    score_tuple = (score[home.name], score[away.name])
    report = AttributeTransitionReport(
        scoreline=f"{home.name} {score_tuple[0]}-{score_tuple[1]} {away.name}",
        key_reasons=_build_reasons(home, away, books, frozen, diagnostics),
    )
    return AttributeTransitionResult(score_tuple, events, frozen, diagnostics, report)


def _team_quality(team: Team, familiarity: FamiliarityProfile) -> _Quality:
    n = max(1, len(team.players))
    physical = sum(player.pace + player.acceleration for player in team.players) / (n * 40.0)
    stamina = sum(player.stamina for player in team.players) / (n * 20.0)
    defensive_mental = sum(player.positioning + player.anticipation for player in team.players) / (n * 40.0)
    attacking_mental = sum(player.teamwork + player.decisions for player in team.players) / (n * 40.0)
    attack = sum(player.attack for player in team.players) / (n * 20.0)
    defense = sum(player.defense for player in team.players) / (n * 20.0)
    execution = (physical * 0.24 + stamina * 0.17 + defensive_mental * 0.22 + attacking_mental * 0.20 + familiarity.familiarity * 0.17)
    return _Quality(physical, stamina, defensive_mental, attacking_mental, attack, defense, execution)


def _positions_for_map(wib_or_wob, zone: Zone) -> Dict[str, Position]:
    if zone in wib_or_wob.positions_by_zone:
        return wib_or_wob.positions_by_zone[zone]
    return next(iter(wib_or_wob.positions_by_zone.values()))


def _phase_teams(phase: Phase, home: Team, away: Team) -> Tuple[Team, Team]:
    if phase == Phase.HOME_IN_POSSESSION:
        return home, away
    return away, home


def _transition_distance(from_map, to_map, zone: Zone) -> float:
    start = _positions_for_map(from_map, zone)
    end = _positions_for_map(to_map, zone)
    return sum(start[name].distance_to(end[name]) for name in start if name in end)


def _transition_delay(team: Team, from_map, to_map, zone: Zone, quality: _Quality, familiarity: FamiliarityProfile) -> float:
    raw_distance = _transition_distance(from_map, to_map, zone)
    execution = max(0.10, quality.physical * 0.45 + quality.stamina * 0.15 + quality.defensive_mental * 0.18 + quality.attacking_mental * 0.10 + familiarity.familiarity * 0.30)
    return round(raw_distance / (38.0 * execution), 3)


def _late_arrivals(team: Team, from_map, to_map, zone: Zone, quality: _Quality, familiarity: FamiliarityProfile) -> int:
    start = _positions_for_map(from_map, zone)
    end = _positions_for_map(to_map, zone)
    players = {player.name: player for player in team.players}
    late = 0
    for name, start_pos in start.items():
        if name not in players or name not in end:
            continue
        player = players[name]
        distance = start_pos.distance_to(end[name])
        reach = (player.pace * 1.35 + player.acceleration * 1.25 + player.positioning * 0.45 + player.anticipation * 0.45) * (0.78 + familiarity.familiarity * 0.34)
        if distance > reach:
            late += 1
    return late


def _move_cost(team: Team, current: Dict[str, Position], target: Dict[str, Position], pressing: int, quality: _Quality, rng: random.Random) -> Dict[str, float]:
    players = {player.name: player for player in team.players}
    fatigue = 0.0
    late = 0
    for name, target_pos in target.items():
        if name not in players:
            continue
        player = players[name]
        current_pos = current.get(name, target_pos)
        distance = current_pos.distance_to(target_pos) + rng.random() * 0.001
        reach = player.pace * 1.45 + player.acceleration * 1.20 + player.positioning * 0.35 + player.anticipation * 0.35
        if distance > reach:
            late += 1
        fatigue += max(0.0, distance * (0.032 + pressing * 0.0012) - player.stamina * 0.035)
    fatigue *= max(0.45, 1.18 - quality.stamina * 0.75)
    return {"fatigue": fatigue, "late": late}


def _attacking_zone(steps: List[BallStep]) -> Zone:
    return next((step.zone for step in reversed(steps) if step.zone.third == "attacking"), steps[-1].zone)


def _build_reasons(home: Team, away: Team, books: Dict[str, WibWobBook], stats: Dict[str, AttributeTransitionStats], diagnostics: List[str]) -> List[str]:
    reasons = list(diagnostics)
    for team in (home, away):
        distance = _transition_distance(books[team.name].wib, books[team.name].wob, _attacking_zone_for_books(books[team.name]))
        if distance > 250:
            reasons.append(f"{team.name} geometry created long recovery runs between WIB and WOB")
        if stats[team.name].attribute_execution < 0.45 or stats[team.name].late_arrivals > 8:
            reasons.append(f"{team.name} player attributes limited transition execution")
        if stats[team.name].familiarity < 0.35:
            reasons.append(f"{team.name} familiarity was too low for the tactical book")
    return reasons


def _attacking_zone_for_books(book: WibWobBook) -> Zone:
    return next((zone for zone in book.wib.positions_by_zone if zone.third == "attacking"), next(iter(book.wib.positions_by_zone)))
