import type { Formation, PitchPoint, PlayerPosition } from './domain';

export type FormationSlot = {
  id: string;
  role: PlayerPosition;
  label: string;
  point: PitchPoint;
};

export type FormationGeometry = {
  formation: Formation;
  width: number;
  depth: number;
  slots: FormationSlot[];
};

const geometries: Record<Formation, FormationGeometry> = {
  '4-4-2': {
    formation: '4-4-2',
    width: 68,
    depth: 62,
    slots: [
      slot('gk', 'GK', 'GK', 8, 50),
      slot('dl', 'D', 'DL', 26, 18),
      slot('dc1', 'D', 'DC', 24, 40),
      slot('dc2', 'D', 'DC', 24, 60),
      slot('dr', 'D', 'DR', 26, 82),
      slot('ml', 'M', 'ML', 54, 18),
      slot('mc1', 'M', 'MC', 52, 40),
      slot('mc2', 'M', 'MC', 52, 60),
      slot('mr', 'M', 'MR', 54, 82),
      slot('fc1', 'F', 'FC', 78, 42),
      slot('fc2', 'F', 'FC', 78, 58)
    ]
  },
  '4-1-3-2': {
    formation: '4-1-3-2',
    width: 62,
    depth: 70,
    slots: [
      slot('gk', 'GK', 'GK', 8, 50),
      slot('dl', 'D', 'DL', 25, 20),
      slot('dc1', 'D', 'DC', 23, 40),
      slot('dc2', 'D', 'DC', 23, 60),
      slot('dr', 'D', 'DR', 25, 80),
      slot('dm', 'DM', 'DMC', 42, 50),
      slot('ml', 'M', 'ML', 58, 25),
      slot('mc', 'M', 'MC', 60, 50),
      slot('mr', 'M', 'MR', 58, 75),
      slot('fc1', 'F', 'FC', 82, 42),
      slot('fc2', 'F', 'FC', 82, 58)
    ]
  },
  '4-3-3': {
    formation: '4-3-3',
    width: 76,
    depth: 76,
    slots: [
      slot('gk', 'GK', 'GK', 8, 50),
      slot('dl', 'D', 'DL', 27, 16),
      slot('dc1', 'D', 'DC', 24, 40),
      slot('dc2', 'D', 'DC', 24, 60),
      slot('dr', 'D', 'DR', 27, 84),
      slot('mc1', 'M', 'MC', 55, 32),
      slot('mc2', 'M', 'MC', 52, 50),
      slot('mc3', 'M', 'MC', 55, 68),
      slot('fl', 'F', 'FL', 84, 18),
      slot('fc', 'F', 'FC', 86, 50),
      slot('fr', 'F', 'FR', 84, 82)
    ]
  },
  '3-5-2': {
    formation: '3-5-2',
    width: 72,
    depth: 68,
    slots: [
      slot('gk', 'GK', 'GK', 8, 50),
      slot('dc1', 'D', 'DC', 25, 30),
      slot('dc2', 'D', 'DC', 23, 50),
      slot('dc3', 'D', 'DC', 25, 70),
      slot('wbl', 'M', 'WBL', 52, 14),
      slot('mc1', 'M', 'MC', 52, 36),
      slot('mc2', 'M', 'MC', 50, 50),
      slot('mc3', 'M', 'MC', 52, 64),
      slot('wbr', 'M', 'WBR', 52, 86),
      slot('fc1', 'F', 'FC', 78, 42),
      slot('fc2', 'F', 'FC', 78, 58)
    ]
  },
  '5-3-2': {
    formation: '5-3-2',
    width: 58,
    depth: 55,
    slots: [
      slot('gk', 'GK', 'GK', 8, 50),
      slot('dl', 'D', 'DL', 24, 18),
      slot('dc1', 'D', 'DC', 22, 34),
      slot('dc2', 'D', 'DC', 20, 50),
      slot('dc3', 'D', 'DC', 22, 66),
      slot('dr', 'D', 'DR', 24, 82),
      slot('mc1', 'M', 'MC', 48, 34),
      slot('mc2', 'M', 'MC', 46, 50),
      slot('mc3', 'M', 'MC', 48, 66),
      slot('fc1', 'F', 'FC', 72, 42),
      slot('fc2', 'F', 'FC', 72, 58)
    ]
  }
};

function slot(id: string, role: PlayerPosition, label: string, x: number, y: number): FormationSlot {
  return { id, role, label, point: { x, y } };
}

export function getFormationGeometry(formation: Formation): FormationGeometry {
  return geometries[formation];
}
