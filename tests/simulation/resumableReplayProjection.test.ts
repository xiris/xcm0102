import { describe, expect, it } from 'vitest';
import { projectRemainingReplay } from '../../src/simulation/resumableReplayProjection';
import type { MatchEvent } from '../../src/simulation/domain';
import type { ManagerCommand } from '../../src/simulation/managerCommands';

const sourceEvents: MatchEvent[] = [
  { minute: 1, type: 'kickoff', description: 'Kickoff.' },
  { minute: 12, teamId: 'away', type: 'free_kick', description: 'Away free kick pressure.' },
  { minute: 30, teamId: 'home', type: 'goal', description: 'Home goal.' },
  { minute: 54, teamId: 'home', type: 'fatigue_warning', description: 'Home striker is tiring.' },
  { minute: 66, teamId: 'home', type: 'fatigue_warning', description: 'Home winger is tiring.' },
  { minute: 72, teamId: 'away', type: 'chance', description: 'Away counter chance.' },
  { minute: 90, type: 'full_time', description: 'Full time.' }
];

const baseCommand: ManagerCommand = {
  id: 'cmd-054-01-lower-tempo-pressing',
  minute: 54,
  action: 'Lower tempo/pressing',
  eventType: 'fatigue_warning',
  eventDescription: 'Home striker is tiring.',
  effectSummary: 'Recorded intent: lower tempo/pressing at 54’.'
};

describe('resumable replay projection', () => {
  it('preserves the original timeline when no commands are recorded', () => {
    const projection = projectRemainingReplay({ sourceEvents, currentMinute: 54, commands: [] });

    expect(projection.events).toEqual(sourceEvents);
    expect(projection.score).toEqual({ home: 1, away: 0 });
    expect(projection.signature).toBe('no-commands|54|7');
  });

  it('suppresses one future fatigue warning after a lower-tempo command', () => {
    const projection = projectRemainingReplay({ sourceEvents, currentMinute: 54, commands: [baseCommand] });

    expect(projection.events.some((event) => event.minute === 66 && event.type === 'fatigue_warning')).toBe(false);
    expect(projection.diagnostics).toContain('54’ Lower tempo/pressing suppressed future fatigue warning at 66’.');
  });

  it('suppresses one future away pressure event after a defensive-line command', () => {
    const projection = projectRemainingReplay({
      sourceEvents,
      currentMinute: 54,
      commands: [{ ...baseCommand, id: 'cmd-054-01-adjust-defensive-line', action: 'Adjust defensive line' }]
    });

    expect(projection.events.some((event) => event.minute === 72 && event.teamId === 'away')).toBe(false);
    expect(projection.diagnostics).toContain('54’ Adjust defensive line reduced away pressure event at 72’.');
  });

  it('injects deterministic tactical-shift events for proactive commands', () => {
    const projection = projectRemainingReplay({
      sourceEvents,
      currentMinute: 54,
      commands: [
        { ...baseCommand, id: 'cmd-054-01-change-mentality', action: 'Change mentality' },
        { ...baseCommand, id: 'cmd-054-02-change-pressing', action: 'Change pressing' }
      ]
    });

    expect(projection.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ minute: 55, teamId: 'home', type: 'tactical_shift', description: 'Home mentality changed after manager command.' }),
      expect.objectContaining({ minute: 56, teamId: 'home', type: 'tactical_shift', description: 'Home pressing changed after manager command.' })
    ]));
    expect(projection.signature).toBe('cmd-054-01-change-mentality|cmd-054-02-change-pressing|54|9');
  });

  it('does not rewrite events that are already visible at the current minute', () => {
    const projection = projectRemainingReplay({ sourceEvents, currentMinute: 70, commands: [baseCommand] });

    expect(projection.events.some((event) => event.minute === 66 && event.type === 'fatigue_warning')).toBe(true);
    expect(projection.diagnostics).not.toContain('54’ Lower tempo/pressing suppressed future fatigue warning at 66’.');
  });

  it('keeps no-command source order exactly as provided', () => {
    const unsortedSameMinuteEvents: MatchEvent[] = [
      { minute: 12, type: 'corner', description: 'Original second same-minute event.' },
      { minute: 1, type: 'kickoff', description: 'Kickoff.' },
      { minute: 12, type: 'free_kick', description: 'Original first same-minute event.' }
    ];

    expect(projectRemainingReplay({ sourceEvents: unsortedSameMinuteEvents, currentMinute: 1, commands: [] }).events).toEqual(unsortedSameMinuteEvents);
  });

  it('preserves visible same-minute source order when command projection changes future events', () => {
    const sameMinuteVisibleEvents: MatchEvent[] = [
      { minute: 12, type: 'corner', description: 'Visible corner first.' },
      { minute: 12, type: 'free_kick', description: 'Visible free kick second.' },
      { minute: 80, teamId: 'away', type: 'chance', description: 'Away future pressure.' }
    ];

    const projection = projectRemainingReplay({
      sourceEvents: sameMinuteVisibleEvents,
      currentMinute: 54,
      commands: [{ ...baseCommand, id: 'cmd-054-01-adjust-defensive-line', action: 'Adjust defensive line' }]
    });

    expect(projection.events.slice(0, 2)).toEqual(sameMinuteVisibleEvents.slice(0, 2));
    expect(projection.events.some((event) => event.minute === 80 && event.type === 'chance')).toBe(false);
  });

  it('does not inject tactical shifts when no future minute remains', () => {
    const projection = projectRemainingReplay({
      sourceEvents,
      currentMinute: 89,
      commands: [{ ...baseCommand, minute: 89, id: 'cmd-089-01-change-pressing', action: 'Change pressing' }]
    });

    expect(projection.events.some((event) => event.type === 'tactical_shift' && event.minute <= 89)).toBe(false);
    expect(projection.events.some((event) => event.type === 'tactical_shift')).toBe(false);
  });

  it('uses the remaining future minute for proactive commands after non-proactive commands', () => {
    const projection = projectRemainingReplay({
      sourceEvents,
      currentMinute: 88,
      commands: [
        { ...baseCommand, minute: 88, id: 'cmd-088-01-lower-tempo-pressing', action: 'Lower tempo/pressing' },
        { ...baseCommand, minute: 88, id: 'cmd-088-02-change-pressing', action: 'Change pressing' }
      ]
    });

    expect(projection.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ minute: 89, teamId: 'home', type: 'tactical_shift', description: 'Home pressing changed after manager command.' })
    ]));
  });

  it('uses an available late minute after an earlier proactive command', () => {
    const projection = projectRemainingReplay({
      sourceEvents,
      currentMinute: 54,
      commands: [
        { ...baseCommand, id: 'cmd-054-01-change-mentality', action: 'Change mentality' },
        { ...baseCommand, minute: 88, id: 'cmd-088-02-change-pressing', action: 'Change pressing' }
      ]
    });

    expect(projection.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ minute: 55, teamId: 'home', type: 'tactical_shift', description: 'Home mentality changed after manager command.' }),
      expect.objectContaining({ minute: 89, teamId: 'home', type: 'tactical_shift', description: 'Home pressing changed after manager command.' })
    ]));
  });
});
