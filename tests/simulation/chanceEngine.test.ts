import { describe, expect, it } from 'vitest';
import { resolveTeamChances } from '../../src/simulation/chanceEngine';
import { createHistoricTeam } from '../../src/simulation/historicSquads';
import { createSampleTacticBook, createSampleTeam } from '../../src/simulation/sampleData';

function highPressureOptions(seed = 1) {
  const attacking = createHistoricTeam('home');
  const defending = createHistoricTeam('away');
  return {
    seed,
    team: attacking,
    opponent: defending,
    tactic: createSampleTacticBook({
      id: 'home-tactic',
      formation: '4-1-3-2',
      mentality: 'attacking',
      pressing: 'high',
      transitionStyle: 'fast_break',
      familiarity: 0.85,
      playerIds: attacking.players.map((player) => player.id)
    }),
    opponentTactic: createSampleTacticBook({
      id: 'away-tactic',
      formation: '4-4-2',
      mentality: 'balanced',
      familiarity: 0.55,
      playerIds: defending.players.map((player) => player.id)
    }),
    shotTarget: 9,
    attackIntent: 1.55,
    opponentDefensiveControl: 0.9,
    opponentTransitionDelay: 9,
    opponentLateArrivals: 2
  };
}

describe('chance engine', () => {
  it('resolves the same chances for the same seed and input', () => {
    const options = highPressureOptions(44);

    expect(resolveTeamChances(options)).toEqual(resolveTeamChances(options));
  });

  it('turns elite finishing into more goals than poor finishing over a seed sample', () => {
    const strong = createSampleTeam({ id: 'strong', quality: 'average' });
    const weak = createSampleTeam({ id: 'weak', quality: 'average' });
    strong.players = strong.players.map((player) => ({ ...player, attributes: { ...player.attributes, finishing: player.position === 'F' ? 20 : 14, positioning: 18, anticipation: 18 } }));
    weak.players = weak.players.map((player) => ({ ...player, attributes: { ...player.attributes, finishing: player.position === 'F' ? 4 : 7, positioning: 8, anticipation: 8 } }));
    const opponent = createSampleTeam({ id: 'opponent', quality: 'average' });

    const totalGoals = (team: typeof strong) => Array.from({ length: 25 }, (_unused, index) => resolveTeamChances({
      seed: index + 1,
      team,
      opponent,
      tactic: createSampleTacticBook({ mentality: 'attacking', playerIds: team.players.map((player) => player.id) }),
      opponentTactic: createSampleTacticBook({ playerIds: opponent.players.map((player) => player.id) }),
      shotTarget: 8,
      attackIntent: 1.4,
      opponentDefensiveControl: 0.8,
      opponentTransitionDelay: 8,
      opponentLateArrivals: 2
    }).goals).reduce((sum, goals) => sum + goals, 0);

    expect(totalGoals(strong)).toBeGreaterThan(totalGoals(weak));
  });

  it('uses varied non-robotic commentary templates for repeated chances', () => {
    const result = resolveTeamChances({ ...highPressureOptions(9), shotTarget: 12 });
    const uniqueDescriptions = new Set(result.events.map((event) => event.description.replace(/Francesco Toldo|Javier Zanetti|Ivan Cordoba|Marco Materazzi|Francesco Coco|Luigi Di Biagio|Sergio Conceicao|Emre Belozoglu|Alvaro Recoba|Hernan Crespo|Christian Vieri/g, '[player]')));

    expect(result.events.length).toBeGreaterThanOrEqual(6);
    expect(uniqueDescriptions.size).toBeGreaterThanOrEqual(4);
    expect(result.events.some((event) => /Vieri|Crespo|Recoba|Conceicao|Belozoglu/.test(event.description))).toBe(true);
  });
});
