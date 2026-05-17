import { describe, expect, it } from 'vitest';
import { buildSimulationPayload, defaultTacticalState, type TacticalState } from '../../src/web/tacticalPayload';

describe('tactical payload builder', () => {
  it('builds a full simulation request from tactical UI state', () => {
    const state: TacticalState = {
      seed: 77,
      homeQuality: 'strong',
      awayQuality: 'weak',
      homeFamiliarity: 0.9,
      awayFamiliarity: 0.35,
      homeFormation: '4-1-3-2',
      awayFormation: '5-3-2',
      homeMentality: 'attacking',
      awayMentality: 'defensive',
      homePressing: 'high',
      awayPressing: 'low',
      homeTransitionStyle: 'fast_break',
      awayTransitionStyle: 'hold_shape',
      homeMovement: 'extreme',
      awayMovement: 'compact',
      homeAssignments: { gk: 'home-p11', fc1: 'home-p1' },
      awayAssignments: { gk: 'away-p1', fc1: 'away-p10' }
    };

    expect(buildSimulationPayload(state)).toEqual(state);
  });

  it('provides CM0102-style tactical defaults', () => {
    expect(defaultTacticalState()).toEqual({
      seed: 42,
      homeQuality: 'strong',
      awayQuality: 'average',
      homeFamiliarity: 0.8,
      awayFamiliarity: 0.5,
      homeFormation: '4-1-3-2',
      awayFormation: '4-4-2',
      homeMentality: 'attacking',
      awayMentality: 'balanced',
      homePressing: 'high',
      awayPressing: 'medium',
      homeTransitionStyle: 'fast_break',
      awayTransitionStyle: 'balanced',
      homeMovement: 'balanced',
      awayMovement: 'balanced',
      homeAssignments: {},
      awayAssignments: {}
    });
  });
});
