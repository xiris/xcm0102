import type { MatchEvent, Player, TacticBook, Team } from './domain';
import { getFormationGeometry } from './formationGeometry';
import { createSeededRng } from './rng';

export type PlayerConditionStatus = 'fresh' | 'tired' | 'injury_risk';

export type PlayerConditionProfile = {
  player: Player;
  fatigue: number;
  status: PlayerConditionStatus;
};

export type SubstitutionRecommendation = {
  minute: number;
  playerOut: Player;
  playerIn: Player;
  reason: string;
};

export type PlayerConditionResult = {
  averageFatigue: number;
  profiles: PlayerConditionProfile[];
  substitutions: SubstitutionRecommendation[];
  events: MatchEvent[];
};

export type PlayerConditionOptions = {
  seed: number;
  team: Team;
  tactic: TacticBook;
  sideLabel: 'Home' | 'Away';
};

export function evaluatePlayerConditions(options: PlayerConditionOptions): PlayerConditionResult {
  const rng = createSeededRng(options.seed);
  const starters = assignedStarters(options.team, options.tactic);
  const bench = options.team.players.filter((player) => !starters.some((starter) => starter.id === player.id));
  const intensity = pressingLoad(options.tactic.pressing) + movementLoad(options.tactic);
  const profiles = starters.map((player, index): PlayerConditionProfile => {
    const roleLoad = player.position === 'M' || player.position === 'AM' ? 7 : player.position === 'F' ? 5 : player.position === 'D' ? 4 : 2;
    const fatigue = round(Math.max(0, 28 + intensity + roleLoad - player.attributes.stamina * 1.15 + rng.int(0, 8) + index * 0.2));
    const status: PlayerConditionStatus = fatigue >= 28 ? 'injury_risk' : fatigue >= 21 ? 'tired' : 'fresh';
    return { player, fatigue, status };
  });
  const averageFatigue = round(profiles.reduce((sum, profile) => sum + profile.fatigue, 0) / Math.max(1, profiles.length));
  const substitutions = recommendSubstitutions(profiles, bench, rng);
  const events = buildConditionEvents(options, profiles, substitutions);
  return { averageFatigue, profiles, substitutions, events };
}

function assignedStarters(team: Team, tactic: TacticBook): Player[] {
  const byId = new Map(team.players.map((player) => [player.id, player]));
  return getFormationGeometry(tactic.formation).slots.flatMap((slot) => {
    const playerId = tactic.assignments[slot.id];
    const player = playerId ? byId.get(playerId) : undefined;
    return player ? [player] : [];
  });
}

function recommendSubstitutions(profiles: PlayerConditionProfile[], bench: Player[], rng: ReturnType<typeof createSeededRng>): SubstitutionRecommendation[] {
  const usedBench = new Set<string>();
  return profiles
    .filter((profile) => profile.status !== 'fresh')
    .sort((a, b) => b.fatigue - a.fatigue)
    .slice(0, 3)
    .flatMap((profile, index) => {
      const replacement = bench.find((player) => !usedBench.has(player.id) && isCompatibleReplacement(profile.player, player));
      if (!replacement) return [];
      usedBench.add(replacement.id);
      return [{
        minute: Math.min(88, 58 + index * 9 + rng.int(0, 5)),
        playerOut: profile.player,
        playerIn: replacement,
        reason: profile.status === 'injury_risk' ? 'injury risk' : 'fatigue'
      }];
    });
}

function buildConditionEvents(options: PlayerConditionOptions, profiles: PlayerConditionProfile[], substitutions: SubstitutionRecommendation[]): MatchEvent[] {
  const mostTired = [...profiles].sort((a, b) => b.fatigue - a.fatigue)[0];
  const events: MatchEvent[] = [];
  if (mostTired && mostTired.status !== 'fresh') {
    events.push({
      minute: 54,
      teamId: options.team.id,
      type: 'fatigue_warning',
      description: `${mostTired.player.name} is tiring and struggling to recover his position.`
    });
  }
  const injuryRisk = profiles.find((profile) => profile.status === 'injury_risk');
  if (injuryRisk) {
    events.push({
      minute: 63,
      teamId: options.team.id,
      type: 'injury',
      description: `${injuryRisk.player.name} is carrying an injury risk after a heavy workload.`
    });
  }
  for (const substitution of substitutions) {
    events.push({
      minute: substitution.minute,
      teamId: options.team.id,
      type: 'substitution',
      description: `${options.sideLabel} substitution: ${substitution.playerIn.name} replaces ${substitution.playerOut.name} (${substitution.reason}).`
    });
  }
  return events;
}

function isCompatibleReplacement(playerOut: Player, playerIn: Player): boolean {
  if (playerOut.position === playerIn.position) return true;
  if (playerOut.position === 'AM' && (playerIn.position === 'M' || playerIn.position === 'F')) return true;
  if (playerOut.position === 'DM' && (playerIn.position === 'M' || playerIn.position === 'D')) return true;
  if (playerOut.position === 'M' && (playerIn.position === 'DM' || playerIn.position === 'AM')) return true;
  return false;
}

function pressingLoad(pressing: TacticBook['pressing']): number {
  return pressing === 'high' ? 20 : pressing === 'medium' ? 11 : 4;
}

function movementLoad(tactic: TacticBook): number {
  const distinctX = new Set(Object.values(tactic.wib).flatMap((zone) => zone ? Object.values(zone).map((point) => Math.round(point.x / 10)) : [])).size;
  const movement = distinctX > 6 ? 10 : distinctX > 4 ? 6 : 3;
  return movement + (tactic.transitionStyle === 'fast_break' ? 3 : 0);
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
