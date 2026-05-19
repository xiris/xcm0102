import { describe, expect, it } from 'vitest';
import { createInMemoryReplaySessionRepository } from '../../src/api/replaySessionRepository';
import { createSampleMatchInput } from '../../src/simulation/sampleData';
import type { MatchResult } from '../../src/simulation/domain';
import type { ManagerCommand } from '../../src/simulation/managerCommands';

function matchResultFixture(): MatchResult {
  return {
    score: { home: 1, away: 0 },
    stats: {
      home: { shots: 8, shotsOnTarget: 4, goals: 1, possession: 55, fatigue: 12, transitionDelay: 1, lateArrivals: 0, execution: 72, movementLoad: 11 },
      away: { shots: 5, shotsOnTarget: 2, goals: 0, possession: 45, fatigue: 18, transitionDelay: 2, lateArrivals: 1, execution: 64, movementLoad: 9 }
    },
    events: [
      { minute: 0, type: 'kickoff', description: 'Kickoff.' },
      { minute: 12, teamId: 'home', type: 'goal', description: 'Home scores.' },
      { minute: 90, type: 'full_time', description: 'Full time.' }
    ],
    report: { diagnostics: ['diagnostic'], replay: { seed: 42, engineVersion: 'test', commandCount: 0 } }
  };
}

const command: ManagerCommand = {
  id: 'cmd-012-01-change-pressing',
  minute: 12,
  action: 'Change pressing',
  eventType: 'goal',
  eventDescription: 'Home scores.',
  effectSummary: 'Recorded intent: change pressing at 12’.'
};

describe('replay session repository', () => {
  it('stores match result visible events commands and authoritative audit metadata', () => {
    const repository = createInMemoryReplaySessionRepository();
    const initialResult = matchResultFixture();
    const baseInput = createSampleMatchInput({ seed: 42 });

    const created = repository.createSession({
      seed: 42,
      baseInput,
      initialResult,
      visibleEvents: initialResult.events.filter((event) => event.minute <= 12)
    });
    repository.appendManagerCommand(created.sessionId, command);
    repository.replaceVisibleEvents(created.sessionId, initialResult.events);
    repository.recordAuthoritativeResume(created.sessionId, { currentMinute: 12, eventCount: 3, signature: '42|12|cmd|vh-test|3' });

    const stored = repository.getSession(created.sessionId);

    expect(stored).toEqual(expect.objectContaining({
      sessionId: expect.stringMatching(/^rs-/),
      seed: 42,
      baseInput,
      initialResult,
      visibleEvents: initialResult.events,
      managerCommands: [command],
      latestAuthoritativeSignature: '42|12|cmd|vh-test|3',
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    }));
    expect(stored.auditLog.map((entry) => entry.type)).toEqual([
      'session_created',
      'manager_command_appended',
      'visible_events_replaced',
      'authoritative_resume_recorded'
    ]);
    expect(stored.auditLog.at(-1)).toEqual(expect.objectContaining({
      currentMinute: 12,
      eventCount: 3,
      signature: '42|12|cmd|vh-test|3'
    }));
  });

  it('throws readable not-found errors for missing sessions', () => {
    const repository = createInMemoryReplaySessionRepository();

    expect(() => repository.getSession('rs-missing')).toThrow('Replay session not found: rs-missing');
    expect(() => repository.appendManagerCommand('rs-missing', command)).toThrow('Replay session not found: rs-missing');
  });
});
