import type { MatchEvent, Player, TacticBook, Team } from './domain';
import { getFormationGeometry } from './formationGeometry';
import { createSeededRng, type SeededRng } from './rng';

export type ChanceEngineOptions = {
  seed: number;
  team: Team;
  opponent: Team;
  tactic: TacticBook;
  opponentTactic: TacticBook;
  shotTarget: number;
  attackIntent: number;
  opponentDefensiveControl: number;
  opponentTransitionDelay: number;
  opponentLateArrivals: number;
};

export type ResolvedChance = {
  minute: number;
  teamId: string;
  creator: string;
  shooter: string;
  defender: string;
  goalkeeper: string;
  quality: number;
  outcome: 'goal' | 'save' | 'block' | 'miss';
  description: string;
};

export type TeamChanceResolution = {
  shots: number;
  shotsOnTarget: number;
  goals: number;
  xg: number;
  chances: ResolvedChance[];
  events: MatchEvent[];
};

const minuteBuckets = [8, 14, 19, 25, 31, 38, 44, 51, 57, 63, 69, 74, 81, 87];

export function resolveTeamChances(options: ChanceEngineOptions): TeamChanceResolution {
  const rng = createSeededRng(options.seed);
  const shotCount = Math.max(1, Math.round(options.shotTarget));
  const chances = Array.from({ length: shotCount }, (_unused, index) => resolveChance(options, rng, index));
  const events = chances.map((chance): MatchEvent => ({
    minute: chance.minute,
    teamId: chance.teamId,
    type: chance.outcome === 'goal' ? 'goal' : 'chance',
    description: chance.description
  }));
  return {
    shots: chances.length,
    shotsOnTarget: chances.filter((chance) => chance.outcome === 'goal' || chance.outcome === 'save').length,
    goals: chances.filter((chance) => chance.outcome === 'goal').length,
    xg: round(chances.reduce((sum, chance) => sum + chance.quality, 0), 3),
    chances,
    events
  };
}

function resolveChance(options: ChanceEngineOptions, rng: SeededRng, index: number): ResolvedChance {
  const creator = weightedPick(rng, attackingPlayers(options.team, options.tactic), (player) => player.attributes.passing * 1.4 + player.attributes.decisions + player.attributes.teamwork + player.attributes.anticipation * 0.4);
  const shooter = weightedPick(rng, shootingPlayers(options.team, options.tactic), (player) => player.attributes.finishing * 1.7 + player.attributes.positioning * 1.1 + player.attributes.anticipation + player.attributes.pace * 0.35);
  const defender = weightedPick(rng, defensivePlayers(options.opponent, options.opponentTactic), (player) => player.attributes.tackling * 1.4 + player.attributes.positioning + player.attributes.anticipation + player.attributes.decisions * 0.5);
  const goalkeeper = goalkeeperFor(options.opponent);

  const creation = (creator.attributes.passing + creator.attributes.decisions + creator.attributes.teamwork) / 60;
  const shooting = (shooter.attributes.finishing * 1.5 + shooter.attributes.positioning + shooter.attributes.anticipation + shooter.attributes.pace * 0.3) / 76;
  const pressure = (defender.attributes.tackling + defender.attributes.positioning + defender.attributes.anticipation) / 60;
  const keeper = goalkeeper ? (goalkeeper.attributes.positioning + goalkeeper.attributes.anticipation + goalkeeper.attributes.decisions) / 60 : 0.55;
  const tacticalBoost = (options.attackIntent - options.opponentDefensiveControl * 0.45 + options.opponentTransitionDelay / 24 + options.opponentLateArrivals / 18) * 0.08;
  const quality = clamp(0.05 + creation * 0.16 + shooting * 0.34 - pressure * 0.14 - keeper * 0.08 + tacticalBoost + rng.next() * 0.11, 0.03, 0.78);
  const onTargetChance = clamp(0.28 + shooting * 0.42 + creation * 0.12 - pressure * 0.14 + rng.next() * 0.12, 0.12, 0.9);
  const goalChance = clamp(quality * (0.48 + shooter.attributes.finishing / 65) - keeper * 0.11 - pressure * 0.07, 0.015, 0.48);

  let outcome: ResolvedChance['outcome'];
  if (rng.next() > onTargetChance) {
    outcome = 'miss';
  } else if (rng.next() < goalChance) {
    outcome = 'goal';
  } else if (rng.next() < pressure * 0.34) {
    outcome = 'block';
  } else {
    outcome = 'save';
  }

  const chance = {
    minute: (minuteBuckets[index % minuteBuckets.length] ?? 87) + rng.int(0, 3),
    teamId: options.team.id,
    creator: creator.name,
    shooter: shooter.name,
    defender: defender.name,
    goalkeeper: goalkeeper?.name ?? 'the goalkeeper',
    quality: round(quality, 3),
    outcome,
    description: ''
  } satisfies Omit<ResolvedChance, 'description'> & { description: string };

  return { ...chance, description: describeChance(chance, rng) };
}

function attackingPlayers(team: Team, tactic: TacticBook): Player[] {
  return assignedPlayers(team, tactic).filter((player) => player.position !== 'GK' && player.position !== 'D');
}

function shootingPlayers(team: Team, tactic: TacticBook): Player[] {
  const attackers = assignedPlayers(team, tactic).filter((player) => ['F', 'AM', 'M'].includes(player.position));
  return attackers.length > 0 ? attackers : team.players.filter((player) => player.position !== 'GK');
}

function defensivePlayers(team: Team, tactic: TacticBook): Player[] {
  const defenders = assignedPlayers(team, tactic).filter((player) => ['D', 'DM', 'M'].includes(player.position));
  return defenders.length > 0 ? defenders : team.players.filter((player) => player.position !== 'GK');
}

function assignedPlayers(team: Team, tactic: TacticBook): Player[] {
  const playersById = new Map(team.players.map((player) => [player.id, player]));
  const assigned = getFormationGeometry(tactic.formation).slots.flatMap((slot) => {
    const id = tactic.assignments[slot.id];
    const player = id ? playersById.get(id) : undefined;
    return player ? [player] : [];
  });
  return assigned.length > 0 ? assigned : team.players;
}

function goalkeeperFor(team: Team): Player | undefined {
  return team.players.find((player) => player.position === 'GK');
}

function weightedPick<T>(rng: SeededRng, items: T[], weight: (item: T) => number): T {
  if (items.length === 0) {
    throw new Error('Cannot pick from an empty weighted list');
  }
  const weights = items.map((item) => Math.max(0.1, weight(item)));
  const total = weights.reduce((sum, value) => sum + value, 0);
  let roll = rng.next() * total;
  for (let index = 0; index < items.length; index += 1) {
    roll -= weights[index] ?? 0;
    if (roll <= 0) {
      return items[index] as T;
    }
  }
  return items[items.length - 1] as T;
}

function describeChance(chance: Omit<ResolvedChance, 'description'>, rng: SeededRng): string {
  const templates: Record<ResolvedChance['outcome'], string[]> = {
    goal: [
      `${chance.creator} slips the ball through and ${chance.shooter} finishes with conviction.`,
      `${chance.shooter} times the run, meets ${chance.creator}'s pass, and buries it.`,
      `${chance.creator} opens the defence; ${chance.shooter} takes one touch and scores.`
    ],
    save: [
      `${chance.creator} finds ${chance.shooter}, but ${chance.goalkeeper} gets down to save.`,
      `${chance.shooter} drives the shot on target and ${chance.goalkeeper} turns it away.`,
      `${chance.creator} creates a yard for ${chance.shooter}; ${chance.goalkeeper} is equal to it.`
    ],
    block: [
      `${chance.shooter} pulls the trigger, but ${chance.defender} throws himself into the block.`,
      `${chance.creator} tees up ${chance.shooter}; ${chance.defender} reads it and blocks.`,
      `${chance.defender} closes fast as ${chance.shooter} shoots, taking the sting out of it.`
    ],
    miss: [
      `${chance.creator} picks out ${chance.shooter}, who drags the effort wide.`,
      `${chance.shooter} gets into space from ${chance.creator}'s pass but cannot hit the target.`,
      `${chance.creator} spots the run; ${chance.shooter}'s finish flashes past the post.`
    ]
  };
  return rng.pick(templates[chance.outcome]);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, decimals = 3): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
