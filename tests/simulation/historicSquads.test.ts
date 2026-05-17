import { describe, expect, it } from 'vitest';
import { createHistoricTeam, getHistoricSquadSummary } from '../../src/simulation/historicSquads';

describe('historic squad fixtures', () => {
  it('creates Internazionale 2002 with stable home ids and distinctive attributes', () => {
    const team = createHistoricTeam('home');

    expect(team.name).toBe('Internazionale 2002');
    expect(team.players).toHaveLength(11);
    expect(team.players[0]).toMatchObject({ id: 'home-p1', name: 'Francesco Toldo', position: 'GK' });
    expect(team.players[10]).toMatchObject({ id: 'home-p11', name: 'Christian Vieri', position: 'F' });
    expect(team.players[10]?.attributes.finishing).toBeGreaterThan(team.players[10]?.attributes.tackling ?? 0);
    expect(new Set(team.players.map((player) => player.id)).size).toBe(11);
  });

  it('creates Milan 2002 with stable away ids and distinctive attributes', () => {
    const team = createHistoricTeam('away');

    expect(team.name).toBe('Milan 2002');
    expect(team.players[0]).toMatchObject({ id: 'away-p1', name: 'Dida', position: 'GK' });
    expect(team.players[6]).toMatchObject({ id: 'away-p7', name: 'Andrea Pirlo', position: 'M' });
    expect(team.players[6]?.attributes.passing).toBeGreaterThanOrEqual(18);
    expect(team.players[9]?.name).toBe('Andriy Shevchenko');
  });

  it('summarizes available sample squads for UI/docs metadata', () => {
    expect(getHistoricSquadSummary()).toEqual([
      { side: 'home', teamId: 'home', name: 'Internazionale 2002', playerCount: 11 },
      { side: 'away', teamId: 'away', name: 'Milan 2002', playerCount: 11 }
    ]);
  });
});
