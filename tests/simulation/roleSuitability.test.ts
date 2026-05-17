import { describe, expect, it } from 'vitest';
import { scoreRoleSuitability, summarizeRoleSuitability } from '../../src/simulation/roleSuitability';
import type { Player } from '../../src/simulation/domain';

function player(position: Player['position']): Player {
  return {
    id: `p-${position}`,
    name: `${position} Player`,
    position,
    attributes: {
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
    }
  };
}

describe('role suitability', () => {
  it('scores natural role matches as perfect', () => {
    expect(scoreRoleSuitability(player('D'), 'D')).toBe(1);
  });

  it('scores adjacent role matches as usable but imperfect', () => {
    expect(scoreRoleSuitability(player('DM'), 'D')).toBe(0.78);
    expect(scoreRoleSuitability(player('M'), 'AM')).toBe(0.78);
  });

  it('scores severe mismatches as costly', () => {
    expect(scoreRoleSuitability(player('GK'), 'F')).toBe(0.25);
    expect(scoreRoleSuitability(player('F'), 'D')).toBe(0.35);
  });

  it('summarizes average suitability and mismatch labels', () => {
    const summary = summarizeRoleSuitability([
      { player: player('D'), slotRole: 'D', slotLabel: 'DC' },
      { player: player('F'), slotRole: 'D', slotLabel: 'DL' }
    ]);

    expect(summary.average).toBe(0.675);
    expect(summary.mismatches).toEqual(['F Player playing DL']);
  });
});
