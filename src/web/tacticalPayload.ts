import type { WebSimulationRequest } from './simulationClient';

export type TacticalState = WebSimulationRequest;

export function defaultTacticalState(): TacticalState {
  return {
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
    awayMovement: 'balanced'
  };
}

export function buildSimulationPayload(state: TacticalState): WebSimulationRequest {
  return { ...state };
}
