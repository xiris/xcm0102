import type { Formation, PlayerPosition } from '../simulation/domain';
import { getFormationGeometry } from '../simulation/formationGeometry';

export type FormationPreviewOptions = {
  assignments?: Record<string, string>;
  players?: Array<{ id: string; name: string }>;
};

export type FormationPreview = {
  title: string;
  summary: string;
  slots: Array<{
    id: string;
    label: string;
    display: string;
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

export function createFormationPreview(formation: Formation, options: FormationPreviewOptions = {}): FormationPreview {
  const geometry = getFormationGeometry(formation);
  const playerNames = new Map((options.players ?? []).map((player) => [player.id, player.name]));
  const slots = geometry.slots.map((slot) => {
    const playerId = options.assignments?.[slot.id];
    const playerName = playerId ? playerNames.get(playerId) : undefined;
    const display = playerName ? `${slot.label} — ${playerName}` : slot.label;
    return { id: slot.id, label: slot.label, display, role: slot.role, x: slot.point.x, y: slot.point.y };
  });

  return {
    title: formation,
    summary: `11 slots · width ${geometry.width} · depth ${geometry.depth}`,
    slots,
    lines: lineOrder
      .map((role) => ({ label: role, slots: slots.filter((slot) => slot.role === role).map((slot) => slot.display) }))
      .filter((line) => line.slots.length > 0)
  };
}
