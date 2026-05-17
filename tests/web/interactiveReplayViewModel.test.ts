import { describe, expect, it } from 'vitest';
import { createInteractiveReplayViewModel } from '../../src/web/interactiveReplayViewModel';
import type { InteractiveMatchState } from '../../src/simulation/interactiveTimeline';

const state: InteractiveMatchState = {
  currentMinute: 54,
  visibleEvents: [
    { minute: 1, type: 'kickoff', description: 'Kickoff.' },
    { minute: 14, teamId: 'home', type: 'goal', description: 'Home score.' },
    { minute: 54, teamId: 'home', type: 'fatigue_warning', description: 'Vieri is tiring.' }
  ],
  pauseEvent: { minute: 54, teamId: 'home', type: 'fatigue_warning', description: 'Vieri is tiring.' },
  scoreSoFar: { home: 1, away: 0 },
  availableActions: ['Prepare substitution', 'Continue'],
  isComplete: false
};

describe('interactive replay view model', () => {
  it('formats minute, score, status, events, and actions', () => {
    expect(createInteractiveReplayViewModel(state)).toEqual({
      title: 'Interactive replay · 54’',
      scoreLine: 'Home XI 1 - 0 Away XI',
      status: 'Paused: Vieri is tiring.',
      events: ['1’ Kickoff.', '14’ Home score.', '54’ Vieri is tiring.'],
      actions: ['Prepare substitution', 'Continue'],
      continueLabel: 'Continue to next key event'
    });
  });

  it('formats full-time completion state', () => {
    const model = createInteractiveReplayViewModel({ ...state, currentMinute: 90, isComplete: true, pauseEvent: { minute: 90, type: 'full_time', description: 'Full time.' } });

    expect(model.title).toBe('Interactive replay · Full time');
    expect(model.status).toBe('Full time.');
    expect(model.continueLabel).toBe('Replay complete');
  });
});
