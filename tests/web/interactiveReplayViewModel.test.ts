import { describe, expect, it } from 'vitest';
import { createInteractiveReplayViewModel } from '../../src/web/interactiveReplayViewModel';
import type { InteractiveMatchState } from '../../src/simulation/interactiveTimeline';
import type { ManagerCommand } from '../../src/simulation/managerCommands';

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
      actions: ['Prepare substitution'],
      commands: [],
      effects: [
        'No outcome-affecting manager commands recorded yet.',
        'Projected state: pressing 0 · mentality 0 · fatigue relief +0 · defensive risk 0 · substitution intent 0'
      ],
      continueLabel: 'Continue to next key event'
    });
  });

  it('omits plain Continue from manager action buttons', () => {
    expect(createInteractiveReplayViewModel(state).actions).toEqual(['Prepare substitution']);
  });

  it('formats full-time completion state', () => {
    const model = createInteractiveReplayViewModel({ ...state, currentMinute: 90, isComplete: true, pauseEvent: { minute: 90, type: 'full_time', description: 'Full time.' } });

    expect(model.title).toBe('Interactive replay · Full time');
    expect(model.status).toBe('Full time.');
    expect(model.continueLabel).toBe('Replay complete');
  });

  it('formats manager command history as a timeline', () => {
    const commands: ManagerCommand[] = [
      {
        id: 'cmd-054-01-prepare-substitution',
        minute: 54,
        action: 'Prepare substitution',
        eventType: 'fatigue_warning',
        eventDescription: 'Vieri is tiring.',
        effectSummary: 'Recorded intent: prepare substitution at 54’.'
      }
    ];

    expect(createInteractiveReplayViewModel(state, commands).commands).toEqual([
      '54’ Prepare substitution — Recorded intent: prepare substitution at 54’.'
    ]);
  });

  it('formats projected command effects as replay diagnostics', () => {
    const commands: ManagerCommand[] = [
      {
        id: 'cmd-054-01-lower-tempo-pressing',
        minute: 54,
        action: 'Lower tempo/pressing',
        eventType: 'fatigue_warning',
        eventDescription: 'Vieri is tiring.',
        effectSummary: 'Recorded intent: lower tempo/pressing at 54’.'
      }
    ];

    expect(createInteractiveReplayViewModel(state, commands).effects).toEqual([
      '54’ Lower tempo/pressing reduced pressing load and fatigue pressure.',
      'Projected state: pressing -1 · mentality 0 · fatigue relief +2 · defensive risk 0 · substitution intent 0'
    ]);
  });
});
