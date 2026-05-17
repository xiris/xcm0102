import { getFormationGeometry } from '../simulation/formationGeometry';
import { scoreRoleSuitability } from '../simulation/roleSuitability';
import type { PlayerPosition } from './simulationClient';
import type { AssignmentState } from './assignmentState';

export type PitchSuitability = 'natural' | 'acceptable' | 'risky' | 'severe';

export type PitchAssignmentMarker = {
  slotId: string;
  label: string;
  role: PlayerPosition;
  playerId: string;
  playerName: string;
  playerPosition: PlayerPosition;
  left: string;
  top: string;
  suitability: PitchSuitability;
};

export type PitchAssignmentViewModel = {
  title: string;
  markers: PitchAssignmentMarker[];
};

export function createPitchAssignmentViewModel(state: AssignmentState): PitchAssignmentViewModel {
  const geometry = getFormationGeometry(state.formation);
  const playersById = new Map(state.players.map((player) => [player.id, player]));
  return {
    title: `${teamTitle(state.side)} · ${state.formation}`,
    markers: geometry.slots.map((slot) => {
      const playerId = state.assignments[slot.id];
      const player = playerId ? playersById.get(playerId) : undefined;
      if (!player || !playerId) {
        throw new Error(`Missing assignment for slot ${slot.id}`);
      }
      return {
        slotId: slot.id,
        label: slot.label,
        role: slot.role,
        playerId,
        playerName: player.name,
        playerPosition: player.position,
        left: `${slot.point.y}%`,
        top: `${100 - slot.point.x}%`,
        suitability: suitabilityLabel(scoreRoleSuitability(player, slot.role))
      };
    })
  };
}

function teamTitle(side: AssignmentState['side']): string {
  return side === 'home' ? 'Internazionale 2002' : 'Milan 2002';
}

function suitabilityLabel(score: number): PitchSuitability {
  if (score >= 0.95) return 'natural';
  if (score >= 0.7) return 'acceptable';
  if (score >= 0.45) return 'risky';
  return 'severe';
}
