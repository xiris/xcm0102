import type { Formation, PlayerPosition } from '../simulation/domain';
import { getFormationGeometry } from '../simulation/formationGeometry';

export type FormationPreview = {
  title: string;
  summary: string;
  slots: Array<{
    label: string;
    role: PlayerPosition;
    x: number;
    y: number;
  }>;
  lines: Array<{
    label: PlayerPosition;
    slots: string[];
  }>;
};

const lineOrder: PlayerPosition[] = ['GK', 'D', 'DM', 'M', 'AM', 'F'];

export function createFormationPreview(formation: Formation): FormationPreview {
  const geometry = getFormationGeometry(formation);
  return {
    title: formation,
    summary: `11 slots · width ${geometry.width} · depth ${geometry.depth}`,
    slots: geometry.slots.map((slot) => ({ label: slot.label, role: slot.role, x: slot.point.x, y: slot.point.y })),
    lines: lineOrder
      .map((role) => ({ label: role, slots: geometry.slots.filter((slot) => slot.role === role).map((slot) => slot.label) }))
      .filter((line) => line.slots.length > 0)
  };
}
