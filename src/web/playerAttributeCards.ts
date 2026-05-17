import type { AssignmentState } from './assignmentState';

export type PlayerAttributeCard = {
  id: string;
  name: string;
  position: string;
  primary: string;
  attributes: string[];
};

export function createPlayerAttributeCards(state: AssignmentState): PlayerAttributeCard[] {
  return state.players.map((player) => {
    const attributes = player.attributes;
    return {
      id: player.id,
      name: player.name,
      position: player.position,
      primary: primaryAttribute(player.position, attributes),
      attributes: [
        `PAC ${attributes.pace}`,
        `STA ${attributes.stamina}`,
        `POS ${attributes.positioning}`,
        `DEC ${attributes.decisions}`,
        `FIN ${attributes.finishing}`,
        `PAS ${attributes.passing}`,
        `TCK ${attributes.tackling}`
      ]
    };
  });
}

function primaryAttribute(position: string, attributes: AssignmentState['players'][number]['attributes']): string {
  if (position === 'GK') return `POS ${attributes.positioning}`;
  if (position === 'D' || position === 'DM') return `TCK ${attributes.tackling}`;
  if (position === 'M' || position === 'AM') return `PAS ${attributes.passing}`;
  return `FIN ${attributes.finishing}`;
}
