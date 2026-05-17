import { describe, expect, it } from 'vitest';
import { createInteractiveMatchState, isPauseEventType } from '../../src/simulation/interactiveTimeline';
import type { MatchResult } from '../../src/simulation/domain';

const result: MatchResult = {
  score: { home: 2, away: 1 },
  stats: {
    home: { possession: 52, shots: 8, shotsOnTarget: 4, goals: 2, fatigue: 12, transitionDelay: 2, lateArrivals: 1, execution: 0.8, movementLoad: 20 },
    away: { possession: 48, shots: 7, shotsOnTarget: 3, goals: 1, fatigue: 15, transitionDelay: 3, lateArrivals: 2, execution: 0.7, movementLoad: 22 }
  },
  events: [
    { minute: 1, type: 'kickoff', description: 'Kickoff.' },
    { minute: 8, teamId: 'home', type: 'chance', description: 'Early chance.' },
    { minute: 14, teamId: 'home', type: 'goal', description: 'Home score.' },
    { minute: 32, teamId: 'away', type: 'yellow_card', description: 'Away booking.' },
    { minute: 54, teamId: 'home', type: 'fatigue_warning', description: 'Home player is tiring.' },
    { minute: 67, teamId: 'home', type: 'substitution', description: 'Home substitution.' },
    { minute: 72, teamId: 'away', type: 'goal', description: 'Away score.' },
    { minute: 80, teamId: 'home', type: 'goal', description: 'Home score again.' },
    { minute: 90, type: 'full_time', description: 'Full time.' }
  ],
  report: { diagnostics: [], replay: { seed: 1, engineVersion: 'test', commandCount: 0 } }
};

describe('interactive match timeline', () => {
  it('reveals kickoff through the first pause-worthy event', () => {
    const state = createInteractiveMatchState(result, { currentMinute: 0 });

    expect(state.currentMinute).toBe(14);
    expect(state.pauseEvent).toEqual(expect.objectContaining({ minute: 14, type: 'goal' }));
    expect(state.visibleEvents.map((event) => event.description)).toEqual(['Kickoff.', 'Early chance.', 'Home score.']);
    expect(state.scoreSoFar).toEqual({ home: 1, away: 0 });
    expect(state.isComplete).toBe(false);
  });

  it('continues from a paused minute to the next pause-worthy event', () => {
    const state = createInteractiveMatchState(result, { currentMinute: 14 });

    expect(state.currentMinute).toBe(32);
    expect(state.visibleEvents.map((event) => event.minute)).toEqual([1, 8, 14, 32]);
    expect(state.pauseEvent?.type).toBe('yellow_card');
  });

  it('computes score so far from revealed goal events only', () => {
    expect(createInteractiveMatchState(result, { currentMinute: 54 }).scoreSoFar).toEqual({ home: 1, away: 0 });
    expect(createInteractiveMatchState(result, { currentMinute: 90 }).scoreSoFar).toEqual({ home: 2, away: 1 });
  });

  it('offers manager action labels for tactical and condition pause events', () => {
    expect(createInteractiveMatchState(result, { currentMinute: 31 }).availableActions).toContain('Reduce pressing or change mentality');
    expect(createInteractiveMatchState(result, { currentMinute: 53 }).availableActions).toContain('Prepare substitution');
    expect(createInteractiveMatchState(result, { currentMinute: 66 }).availableActions).toContain('Confirm substitution and continue');
  });

  it('classifies CM-style key events as pause-worthy', () => {
    expect(isPauseEventType('chance')).toBe(false);
    expect(isPauseEventType('goal')).toBe(true);
    expect(isPauseEventType('free_kick')).toBe(true);
    expect(isPauseEventType('injury')).toBe(true);
    expect(isPauseEventType('full_time')).toBe(true);
  });
});
