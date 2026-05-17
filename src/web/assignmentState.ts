import type { Formation, PlayerPosition } from './simulationClient';
import { getFormationGeometry } from '../simulation/formationGeometry';
import { scoreRoleSuitability } from '../simulation/roleSuitability';

export type AssignmentSide = 'home' | 'away';

export type AssignmentPlayer = {
  id: string;
  name: string;
  position: PlayerPosition;
  attributes: {
    pace: number;
    acceleration: number;
    stamina: number;
    positioning: number;
    anticipation: number;
    teamwork: number;
    decisions: number;
    finishing: number;
    passing: number;
    tackling: number;
  };
};

export type AssignmentState = {
  side: AssignmentSide;
  formation: Formation;
  players: AssignmentPlayer[];
  assignments: Record<string, string>;
};

const samplePositions: PlayerPosition[] = ['GK', 'D', 'D', 'D', 'DM', 'M', 'M', 'AM', 'AM', 'F', 'F'];
const previewAttributes = {
  pace: 12,
  acceleration: 12,
  stamina: 12,
  positioning: 12,
  anticipation: 12,
  teamwork: 12,
  decisions: 12,
  finishing: 12,
  passing: 12,
  tackling: 12
};

export function createSamplePlayers(side: AssignmentSide): AssignmentPlayer[] {
  const label = side === 'home' ? 'Home' : 'Away';
  return samplePositions.map((position, index) => ({
    id: `${side}-p${index + 1}`,
    name: `${label} Player ${index + 1}`,
    position,
    attributes: { ...previewAttributes }
  }));
}

export function createDefaultAssignments(formation: Formation, players: AssignmentPlayer[]): Record<string, string> {
  return Object.fromEntries(getFormationGeometry(formation).slots.map((slot, index) => {
    const player = players[index];
    if (!player) {
      throw new Error(`Cannot assign ${formation} slot ${slot.id} without a player`);
    }
    return [slot.id, player.id];
  }));
}

export function createAssignmentState(side: AssignmentSide, formation: Formation): AssignmentState {
  const players = createSamplePlayers(side);
  return {
    side,
    formation,
    players,
    assignments: createDefaultAssignments(formation, players)
  };
}

export function replaceAssignment(state: AssignmentState, slotId: string, playerId: string): AssignmentState {
  return {
    ...state,
    assignments: {
      ...state.assignments,
      [slotId]: playerId
    }
  };
}

export function resetAssignmentsForFormation(state: AssignmentState, formation: Formation): AssignmentState {
  return {
    ...state,
    formation,
    assignments: createDefaultAssignments(formation, state.players)
  };
}

export function roleMismatchWarnings(state: AssignmentState): string[] {
  const playersById = new Map(state.players.map((player) => [player.id, player]));
  return getFormationGeometry(state.formation).slots.flatMap((slot) => {
    const playerId = state.assignments[slot.id];
    const player = playerId ? playersById.get(playerId) : undefined;
    if (!player || scoreRoleSuitability(player, slot.role) >= 0.7) {
      return [];
    }
    return [`${player.name} is out of position at ${slot.label}`];
  });
}
