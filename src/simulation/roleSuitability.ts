import type { Player, PlayerPosition } from './domain';

export type RoleSuitabilityInput = {
  player: Player;
  slotRole: PlayerPosition;
  slotLabel: string;
};

export type RoleSuitabilitySummary = {
  average: number;
  mismatches: string[];
};

const adjacentRoles: Partial<Record<PlayerPosition, PlayerPosition[]>> = {
  D: ['DM'],
  DM: ['D', 'M'],
  M: ['DM', 'AM'],
  AM: ['M', 'F'],
  F: ['AM'],
  GK: []
};

export function scoreRoleSuitability(player: Player, slotRole: PlayerPosition): number {
  if (player.position === slotRole) {
    return 1;
  }

  if (adjacentRoles[slotRole]?.includes(player.position)) {
    return 0.78;
  }

  if (player.position === 'GK' || slotRole === 'GK') {
    return 0.25;
  }

  if ((player.position === 'F' && (slotRole === 'D' || slotRole === 'DM')) || ((player.position === 'D' || player.position === 'DM') && slotRole === 'F')) {
    return 0.35;
  }

  return 0.55;
}

export function summarizeRoleSuitability(assignments: RoleSuitabilityInput[]): RoleSuitabilitySummary {
  if (assignments.length === 0) {
    return { average: 1, mismatches: [] };
  }

  const scored = assignments.map((assignment) => ({ ...assignment, score: scoreRoleSuitability(assignment.player, assignment.slotRole) }));
  const average = scored.reduce((sum, assignment) => sum + assignment.score, 0) / scored.length;
  return {
    average: Math.round(average * 1000) / 1000,
    mismatches: scored.filter((assignment) => assignment.score < 0.7).map((assignment) => `${assignment.player.name} playing ${assignment.slotLabel}`)
  };
}
