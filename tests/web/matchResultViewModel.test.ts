import { describe, expect, it } from 'vitest';
import { createMatchResultViewModel, type WebMatchResult } from '../../src/web/matchResultViewModel';

const result: WebMatchResult = {
  score: { home: 2, away: 1 },
  stats: {
    home: {
      possession: 57,
      shots: 11,
      shotsOnTarget: 6,
      goals: 2,
      fatigue: 14,
      transitionDelay: 3,
      lateArrivals: 2,
      execution: 78,
      movementLoad: 62
    },
    away: {
      possession: 43,
      shots: 7,
      shotsOnTarget: 3,
      goals: 1,
      fatigue: 19,
      transitionDelay: 6,
      lateArrivals: 5,
      execution: 65,
      movementLoad: 71
    }
  },
  events: [
    { minute: 0, type: 'kickoff', description: 'Kickoff' },
    { minute: 12, teamId: 'home', type: 'goal', description: 'Home XI score' },
    { minute: 66, teamId: 'away', type: 'chance', description: 'Away XI chance' }
  ],
  diagnostics: ['Home movement created overloads', 'Away familiarity caused delays'],
  replay: { seed: 42, engineVersion: '0.1.0', commandCount: 0 }
};

describe('createMatchResultViewModel', () => {
  it('formats the scoreboard and stat rows for browser rendering', () => {
    const viewModel = createMatchResultViewModel(result);

    expect(viewModel.scoreTitle).toBe('Home XI 2 - 1 Away XI');
    expect(viewModel.statRows).toEqual([
      { label: 'Possession', home: '57%', away: '43%' },
      { label: 'Shots', home: '11', away: '7' },
      { label: 'Shots on target', home: '6', away: '3' },
      { label: 'Goals', home: '2', away: '1' },
      { label: 'Transition delay', home: '3', away: '6' },
      { label: 'Late arrivals', home: '2', away: '5' }
    ]);
  });

  it('formats event, diagnostic, and replay labels', () => {
    const viewModel = createMatchResultViewModel(result);

    expect(viewModel.events).toEqual(['0’ Kickoff', '12’ Home XI score', '66’ Away XI chance']);
    expect(viewModel.diagnostics).toEqual(['Home movement created overloads', 'Away familiarity caused delays']);
    expect(viewModel.replay).toEqual(['Seed: 42', 'Engine: 0.1.0', 'Commands: 0']);
  });
});
