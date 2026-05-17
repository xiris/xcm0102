import { describe, expect, it } from 'vitest';
import { createHistoricTeam } from '../../src/simulation/historicSquads';
import { evaluatePlayerConditions } from '../../src/simulation/playerConditionEngine';
import { createSampleTacticBook } from '../../src/simulation/sampleData';

describe('player condition engine', () => {
  it('replays deterministic condition events for the same seed', () => {
    const team = createHistoricTeam('home');
    const tactic = createSampleTacticBook({ pressing: 'high', movement: 'extreme', playerIds: team.players.slice(0, 11).map((player) => player.id) });
    const first = evaluatePlayerConditions({ seed: 12, team, tactic, sideLabel: 'Home' });
    const second = evaluatePlayerConditions({ seed: 12, team, tactic, sideLabel: 'Home' });

    expect(first).toEqual(second);
  });

  it('high pressing and extreme movement create more fatigue than low pressing compact movement', () => {
    const team = createHistoricTeam('home');
    const playerIds = team.players.slice(0, 11).map((player) => player.id);
    const intense = evaluatePlayerConditions({ seed: 4, team, sideLabel: 'Home', tactic: createSampleTacticBook({ pressing: 'high', movement: 'extreme', playerIds }) });
    const conservative = evaluatePlayerConditions({ seed: 4, team, sideLabel: 'Home', tactic: createSampleTacticBook({ pressing: 'low', movement: 'compact', playerIds }) });

    expect(intense.averageFatigue).toBeGreaterThan(conservative.averageFatigue);
    expect(intense.profiles.some((profile) => profile.status === 'tired' || profile.status === 'injury_risk')).toBe(true);
  });

  it('recommends compatible bench substitutions for tired starters', () => {
    const team = createHistoricTeam('home');
    const tactic = createSampleTacticBook({ pressing: 'high', movement: 'extreme', playerIds: team.players.slice(0, 11).map((player) => player.id) });
    const result = evaluatePlayerConditions({ seed: 8, team, tactic, sideLabel: 'Home' });

    expect(result.substitutions.length).toBeGreaterThan(0);
    expect(result.substitutions[0]).toEqual(expect.objectContaining({
      minute: expect.any(Number),
      playerOut: expect.objectContaining({ id: expect.stringMatching(/^home-p/) }),
      playerIn: expect.objectContaining({ id: expect.stringMatching(/^home-p1[2-6]$/) })
    }));
  });

  it('emits fatigue, injury risk, and substitution event descriptions', () => {
    const team = createHistoricTeam('away');
    const tactic = createSampleTacticBook({ pressing: 'high', movement: 'extreme', playerIds: team.players.slice(0, 11).map((player) => player.id) });
    const result = evaluatePlayerConditions({ seed: 9, team, tactic, sideLabel: 'Away' });
    const text = result.events.map((event) => event.description).join(' | ');

    expect(result.events.some((event) => event.type === 'fatigue_warning')).toBe(true);
    expect(result.events.some((event) => event.type === 'substitution')).toBe(true);
    expect(text).toMatch(/tiring|struggling|replaces|injury/i);
  });
});
