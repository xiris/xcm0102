import { describe, expect, it } from 'vitest';
import { translateManagerCommandsToMatchCommands } from '../../src/simulation/authoritativeCommandAdapter';
import type { ManagerCommand } from '../../src/simulation/managerCommands';

function command(action: string, minute = 54): ManagerCommand {
  return {
    id: `cmd-${minute}-${action}`,
    minute,
    action,
    eventType: 'goal',
    eventDescription: 'Pause event.',
    effectSummary: `Recorded intent: ${action}.`
  };
}

describe('authoritative manager command adapter', () => {
  it('maps mentality manager actions to typed home match commands', () => {
    expect(translateManagerCommandsToMatchCommands([command('Change mentality')], 'home')).toEqual([
      { minute: 54, teamId: 'home', type: 'change_mentality', value: 'attacking' }
    ]);
  });

  it('ignores continue and review-only manager actions', () => {
    expect(translateManagerCommandsToMatchCommands([
      command('Continue'),
      command('Review formation'),
      command('Review match report')
    ], 'away')).toEqual([]);
  });

  it('maps pressing and transition-style manager actions while preserving order', () => {
    expect(translateManagerCommandsToMatchCommands([
      command('Lower tempo/pressing', 54),
      command('Change pressing', 60),
      command('Adjust defensive line', 67),
      command('Reduce pressing or change mentality', 72)
    ], 'home')).toEqual([
      { minute: 54, teamId: 'home', type: 'change_pressing', value: 'low' },
      { minute: 60, teamId: 'home', type: 'change_pressing', value: 'high' },
      { minute: 67, teamId: 'home', type: 'change_transition_style', value: 'hold_shape' },
      { minute: 72, teamId: 'home', type: 'change_pressing', value: 'low' },
      { minute: 72, teamId: 'home', type: 'change_mentality', value: 'defensive' }
    ]);
  });
});
