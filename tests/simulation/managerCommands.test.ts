import { describe, expect, it } from 'vitest';
import { appendManagerCommand, createManagerCommand } from '../../src/simulation/managerCommands';
import type { MatchEvent } from '../../src/simulation/domain';

const pauseEvent: MatchEvent = {
  minute: 54,
  teamId: 'home',
  type: 'fatigue_warning',
  description: 'Christian Vieri is tiring.'
};

describe('manager commands', () => {
  it('creates deterministic command records from pause actions', () => {
    expect(createManagerCommand({ action: 'Prepare substitution', pauseEvent, commandIndex: 0 })).toEqual({
      id: 'cmd-054-01-prepare-substitution',
      minute: 54,
      action: 'Prepare substitution',
      eventType: 'fatigue_warning',
      eventDescription: 'Christian Vieri is tiring.',
      effectSummary: 'Recorded intent: prepare substitution at 54’.'
    });
  });

  it('does not create history records for continue-only actions', () => {
    expect(createManagerCommand({ action: 'Continue', pauseEvent, commandIndex: 0 })).toBeNull();
    expect(createManagerCommand({ action: 'Confirm substitution and continue', pauseEvent, commandIndex: 0 })).toEqual(expect.objectContaining({ action: 'Confirm substitution and continue' }));
  });

  it('appends commands while preserving immutable history order', () => {
    const first = appendManagerCommand([], { action: 'Prepare substitution', pauseEvent });
    const second = appendManagerCommand(first, { action: 'Lower tempo/pressing', pauseEvent });

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(2);
    expect(second.map((command) => command.id)).toEqual([
      'cmd-054-01-prepare-substitution',
      'cmd-054-02-lower-tempo-pressing'
    ]);
  });

  it('does not append duplicate action records for the same pause event', () => {
    const first = appendManagerCommand([], { action: 'Prepare substitution', pauseEvent });
    const duplicate = appendManagerCommand(first, { action: 'Prepare substitution', pauseEvent });

    expect(duplicate).toBe(first);
    expect(duplicate).toHaveLength(1);
  });

  it('keeps distinct actions at the same pause event', () => {
    const first = appendManagerCommand([], { action: 'Prepare substitution', pauseEvent });
    const second = appendManagerCommand(first, { action: 'Lower tempo/pressing', pauseEvent });

    expect(second).toHaveLength(2);
  });
});
