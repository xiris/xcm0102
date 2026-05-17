import type { Player, PlayerAttributes, PlayerPosition, Team } from './domain';

export type HistoricSide = 'home' | 'away';

type HistoricPlayerSeed = {
  name: string;
  position: PlayerPosition;
  attributes: PlayerAttributes;
};

export type HistoricSquadSummary = {
  side: HistoricSide;
  teamId: string;
  name: string;
  playerCount: number;
};

const inter2002: HistoricPlayerSeed[] = [
  { name: 'Francesco Toldo', position: 'GK', attributes: attrs(9, 10, 14, 18, 17, 14, 16, 5, 9, 7) },
  { name: 'Javier Zanetti', position: 'D', attributes: attrs(16, 15, 19, 17, 17, 18, 17, 8, 15, 17) },
  { name: 'Ivan Cordoba', position: 'D', attributes: attrs(18, 17, 16, 16, 16, 15, 15, 6, 11, 18) },
  { name: 'Marco Materazzi', position: 'D', attributes: attrs(11, 10, 15, 16, 15, 14, 13, 8, 11, 19) },
  { name: 'Francesco Coco', position: 'D', attributes: attrs(15, 14, 15, 14, 14, 14, 13, 7, 13, 14) },
  { name: 'Luigi Di Biagio', position: 'DM', attributes: attrs(11, 10, 16, 16, 16, 17, 16, 10, 16, 17) },
  { name: 'Sergio Conceicao', position: 'M', attributes: attrs(15, 15, 15, 13, 14, 14, 14, 10, 15, 11) },
  { name: 'Emre Belozoglu', position: 'M', attributes: attrs(14, 15, 15, 14, 15, 15, 15, 11, 16, 12) },
  { name: 'Alvaro Recoba', position: 'AM', attributes: attrs(14, 15, 12, 13, 15, 13, 14, 17, 18, 7) },
  { name: 'Hernan Crespo', position: 'F', attributes: attrs(15, 15, 14, 17, 17, 14, 16, 19, 13, 8) },
  { name: 'Christian Vieri', position: 'F', attributes: attrs(13, 13, 15, 18, 18, 15, 17, 20, 12, 7) }
];

const milan2002: HistoricPlayerSeed[] = [
  { name: 'Dida', position: 'GK', attributes: attrs(10, 12, 14, 17, 17, 14, 15, 5, 9, 7) },
  { name: 'Alessandro Nesta', position: 'D', attributes: attrs(15, 14, 16, 20, 19, 17, 18, 7, 13, 20) },
  { name: 'Paolo Maldini', position: 'D', attributes: attrs(14, 13, 17, 20, 20, 19, 19, 8, 15, 19) },
  { name: 'Alessandro Costacurta', position: 'D', attributes: attrs(10, 9, 14, 18, 18, 17, 17, 6, 12, 17) },
  { name: 'Kakha Kaladze', position: 'D', attributes: attrs(14, 13, 16, 15, 15, 15, 14, 7, 13, 15) },
  { name: 'Gennaro Gattuso', position: 'DM', attributes: attrs(13, 13, 20, 16, 17, 19, 16, 7, 12, 19) },
  { name: 'Andrea Pirlo', position: 'M', attributes: attrs(11, 12, 14, 16, 18, 16, 19, 12, 20, 11) },
  { name: 'Clarence Seedorf', position: 'M', attributes: attrs(14, 14, 17, 16, 17, 17, 18, 14, 18, 13) },
  { name: 'Rui Costa', position: 'AM', attributes: attrs(12, 13, 13, 15, 18, 15, 18, 14, 20, 8) },
  { name: 'Andriy Shevchenko', position: 'F', attributes: attrs(18, 18, 16, 18, 18, 15, 17, 19, 14, 8) },
  { name: 'Filippo Inzaghi', position: 'F', attributes: attrs(13, 14, 15, 20, 19, 14, 16, 19, 11, 7) }
];

const teams: Record<HistoricSide, { teamId: string; name: string; players: HistoricPlayerSeed[] }> = {
  home: { teamId: 'home', name: 'Internazionale 2002', players: inter2002 },
  away: { teamId: 'away', name: 'Milan 2002', players: milan2002 }
};

export function createHistoricTeam(side: HistoricSide): Team {
  const team = teams[side];
  return {
    id: team.teamId,
    name: team.name,
    players: team.players.map((player, index): Player => ({
      id: `${team.teamId}-p${index + 1}`,
      name: player.name,
      position: player.position,
      attributes: { ...player.attributes }
    }))
  };
}

export function getHistoricSquadSummary(): HistoricSquadSummary[] {
  return (['home', 'away'] as const).map((side) => {
    const team = teams[side];
    return { side, teamId: team.teamId, name: team.name, playerCount: team.players.length };
  });
}

function attrs(
  pace: number,
  acceleration: number,
  stamina: number,
  positioning: number,
  anticipation: number,
  teamwork: number,
  decisions: number,
  finishing: number,
  passing: number,
  tackling: number
): PlayerAttributes {
  return { pace, acceleration, stamina, positioning, anticipation, teamwork, decisions, finishing, passing, tackling };
}
