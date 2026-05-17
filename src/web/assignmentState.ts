import type { Formation, PlayerPosition } from './simulationClient';
import { getFormationGeometry } from '../simulation/formationGeometry';
import { createHistoricTeam } from '../simulation/historicSquads';
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

export function createSamplePlayers(side: AssignmentSide): AssignmentPlayer[] {
  return createHistoricTeam(side).players;
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

export function swapAssignments(state: AssignmentState, sourceSlotId: string, targetSlotId: string): AssignmentState {
  const sourcePlayerId = state.assignments[sourceSlotId];
  const targetPlayerId = state.assignments[targetSlotId];
  if (!sourcePlayerId || !targetPlayerId || sourceSlotId === targetSlotId) {
    return state;
  }
  return {
    ...state,
    assignments: {
      ...state.assignments,
      [sourceSlotId]: targetPlayerId,
      [targetSlotId]: sourcePlayerId
    }
  };
}

export function movePlayerToSlot(state: AssignmentState, playerId: string, targetSlotId: string): AssignmentState {
  const sourceSlotId = Object.entries(state.assignments).find(([, assignedPlayerId]) => assignedPlayerId === playerId)?.[0];
  if (!sourceSlotId) {
    return replaceAssignment(state, targetSlotId, playerId);
  }
  return swapAssignments(state, sourceSlotId, targetSlotId);
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
