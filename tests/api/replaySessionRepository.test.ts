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

const awayCommand: ManagerCommand = {
  id: 'cmd-060-01-adjust-defensive-line',
  minute: 60,
  action: 'Adjust defensive line',
  eventType: 'goal',
  eventDescription: 'Away tactical reset.',
  effectSummary: 'Recorded intent: adjust defensive line at 60’.'
};

describe('replay session repository', () => {
  it('joins an away manager to a setup head-to-head lobby with audit metadata', () => {
    const repository = createInMemoryReplaySessionRepository();
    const created = repository.createSession({
      seed: 42,
      baseInput: createSampleMatchInput({ seed: 42 }),
      initialResult: matchResultFixture(),
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'setup',
        sides: { home: { managerId: 'manager-home', displayName: 'Home Boss' } }
      }
    });

    const joined = repository.joinAwayManager(created.sessionId, { managerId: 'manager-away', displayName: 'Away Boss' });

    expect(joined.ownership).toEqual({
      mode: 'head_to_head',
      lobbyState: 'setup',
      sides: {
        home: { managerId: 'manager-home', displayName: 'Home Boss' },
        away: { managerId: 'manager-away', displayName: 'Away Boss' }
      }
    });
    expect(joined.auditLog.at(-1)).toEqual(expect.objectContaining({
      type: 'away_manager_joined',
      commandSide: 'away',
      managerId: 'manager-away',
      displayName: 'Away Boss'
    }));
  });

  it('rejects invalid away manager joins', () => {
    const repository = createInMemoryReplaySessionRepository();
    const baseInput = createSampleMatchInput({ seed: 42 });
    const initialResult = matchResultFixture();
    const setup = repository.createSession({
      seed: 42,
      baseInput,
      initialResult,
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'setup',
        sides: {
          home: { managerId: 'manager-home', displayName: 'Home Boss' },
          away: { managerId: 'manager-away', displayName: 'Away Boss' }
        }
      }
    });
    const locked = repository.createSession({
      seed: 43,
      baseInput,
      initialResult,
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'locked',
        sides: { home: { managerId: 'manager-home', displayName: 'Home Boss' } }
      }
    });
    const singleManager = repository.createSession({ seed: 44, baseInput, initialResult });

    expect(() => repository.joinAwayManager(setup.sessionId, { managerId: 'manager-next', displayName: 'Next Away' })).toThrow('Away manager is already assigned for replay session');
    expect(() => repository.joinAwayManager(locked.sessionId, { managerId: 'manager-away', displayName: 'Away Boss' })).toThrow('Away manager can only join setup lobbies');
    expect(() => repository.joinAwayManager(singleManager.sessionId, { managerId: 'manager-away', displayName: 'Away Boss' })).toThrow('Away manager can only join head-to-head lobbies');
  });

  it('transitions lobby state with audit metadata', () => {
    const repository = createInMemoryReplaySessionRepository();
    const initialResult = matchResultFixture();
    const baseInput = createSampleMatchInput({ seed: 42 });
    const created = repository.createSession({
      seed: 42,
      baseInput,
      initialResult,
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'setup',
        sides: {
          home: { managerId: 'manager-home', displayName: 'Home Boss' },
          away: { managerId: 'manager-away', displayName: 'Away Boss' }
        }
      }
    });

    const locked = repository.transitionLobbyState(created.sessionId, 'locked');
    const inMatch = repository.transitionLobbyState(created.sessionId, 'in_match');
    const complete = repository.transitionLobbyState(created.sessionId, 'complete');

    expect(locked.ownership.lobbyState).toBe('locked');
    expect(inMatch.ownership.lobbyState).toBe('in_match');
    expect(complete.ownership.lobbyState).toBe('complete');
    expect(complete.auditLog.filter((entry) => entry.type === 'lobby_state_transitioned')).toEqual([
      expect.objectContaining({ fromLobbyState: 'setup', toLobbyState: 'locked' }),
      expect.objectContaining({ fromLobbyState: 'locked', toLobbyState: 'in_match' }),
      expect.objectContaining({ fromLobbyState: 'in_match', toLobbyState: 'complete' })
    ]);

    const hydrated = createInMemoryReplaySessionRepository();
    hydrated.hydrateStorageRecords(repository.listStorageRecords());
    expect(hydrated.getSession(created.sessionId).ownership.lobbyState).toBe('complete');
    expect(hydrated.getSession(created.sessionId).auditLog.at(-1)).toEqual(expect.objectContaining({
      type: 'lobby_state_transitioned',
      fromLobbyState: 'in_match',
      toLobbyState: 'complete'
    }));
  });

  it('rejects setup lock until both head-to-head managers are assigned', () => {
    const repository = createInMemoryReplaySessionRepository();
    const setup = repository.createSession({
      seed: 42,
      baseInput: createSampleMatchInput({ seed: 42 }),
      initialResult: matchResultFixture(),
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'setup',
        sides: { home: { managerId: 'manager-home', displayName: 'Home Boss' } }
      }
    });

    expect(() => repository.transitionLobbyState(setup.sessionId, 'locked')).toThrow('Cannot lock setup until both managers are assigned');
    expect(repository.getSession(setup.sessionId).ownership.lobbyState).toBe('setup');
  });

  it('rejects invalid lobby transitions', () => {
    const repository = createInMemoryReplaySessionRepository();
    const initialResult = matchResultFixture();
    const baseInput = createSampleMatchInput({ seed: 42 });
    const setup = repository.createSession({
      seed: 42,
      baseInput,
      initialResult,
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'setup',
        sides: {
          home: { managerId: 'manager-home', displayName: 'Home Boss' },
          away: { managerId: 'manager-away', displayName: 'Away Boss' }
        }
      }
    });

    expect(() => repository.transitionLobbyState(setup.sessionId, 'in_match')).toThrow('Invalid replay session lobby transition: setup -> in_match');
    repository.transitionLobbyState(setup.sessionId, 'locked');
    expect(() => repository.transitionLobbyState(setup.sessionId, 'setup')).toThrow('Invalid replay session lobby transition: locked -> setup');
    repository.transitionLobbyState(setup.sessionId, 'in_match');
    repository.transitionLobbyState(setup.sessionId, 'complete');
    expect(() => repository.transitionLobbyState(setup.sessionId, 'in_match')).toThrow('Invalid replay session lobby transition: complete -> in_match');
  });

  it('rejects manager commands after completion', () => {
    const repository = createInMemoryReplaySessionRepository();
    const created = repository.createSession({ seed: 42, baseInput: createSampleMatchInput({ seed: 42 }), initialResult: matchResultFixture() });
    repository.transitionLobbyState(created.sessionId, 'complete');

    expect(() => repository.appendManagerCommand(created.sessionId, command)).toThrow('Replay session is complete and cannot accept manager commands');
  });

  it('stores ownership metadata and side-specific command logs', () => {
    const repository = createInMemoryReplaySessionRepository();
    const initialResult = matchResultFixture();
    const baseInput = createSampleMatchInput({ seed: 42 });

    const created = repository.createSession({
      seed: 42,
      baseInput,
      initialResult,
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'in_match',
        sides: {
          home: { managerId: 'manager-home', displayName: 'Home Boss' },
          away: { managerId: 'manager-away', displayName: 'Away Boss' }
        }
      }
    });
    repository.appendManagerCommand(created.sessionId, command, 'home');
    repository.appendManagerCommand(created.sessionId, awayCommand, 'away');

    const stored = repository.getSession(created.sessionId);
    expect(stored.ownership).toEqual({
      mode: 'head_to_head',
      lobbyState: 'in_match',
      sides: {
        home: { managerId: 'manager-home', displayName: 'Home Boss' },
        away: { managerId: 'manager-away', displayName: 'Away Boss' }
      }
    });
    expect(stored.sideManagerCommands).toEqual({ home: [command], away: [awayCommand] });
    expect(stored.managerCommands).toEqual([command]);
    expect(stored.auditLog.filter((entry) => entry.type === 'manager_command_appended')).toEqual([
      expect.objectContaining({ commandId: command.id, commandSide: 'home' }),
      expect.objectContaining({ commandId: awayCommand.id, commandSide: 'away' })
    ]);

    const records = repository.listStorageRecords();
    const hydrated = createInMemoryReplaySessionRepository();
    hydrated.hydrateStorageRecords(records);
    expect(hydrated.getSession(created.sessionId).ownership).toEqual(stored.ownership);
    expect(hydrated.getSession(created.sessionId).sideManagerCommands).toEqual(stored.sideManagerCommands);
  });

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

  it('exports and hydrates durable storage records', () => {
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

    const records = repository.listStorageRecords();
    expect(records).toHaveLength(1);
    const record = records[0];
    if (!record) throw new Error('expected exported replay session record');
    expect(record).toEqual(expect.objectContaining({
      schemaVersion: 1,
      sessionId: created.sessionId,
      seed: 42,
      baseInput,
      initialResult,
      visibleEvents: initialResult.events,
      managerCommands: [command],
      latestAuthoritativeSignature: '42|12|cmd|vh-test|3'
    }));
    expect(record.ownership).toEqual({
      mode: 'single_manager',
      lobbyState: 'in_match',
      sides: { home: { managerId: 'local-home', displayName: 'Local manager' } }
    });
    expect(record.sideManagerCommands).toEqual({ home: [command], away: [] });

    record.visibleEvents.length = 0;
    expect(repository.getSession(created.sessionId).visibleEvents).toHaveLength(3);

    const hydrated = createInMemoryReplaySessionRepository();
    hydrated.hydrateStorageRecords(repository.listStorageRecords());
    expect(hydrated.getSession(created.sessionId)).toEqual(repository.getSession(created.sessionId));

    const next = hydrated.createSession({ seed: 99, baseInput: createSampleMatchInput({ seed: 99 }), initialResult });
    expect(next.sessionId).toBe('rs-000002');
  });

  it('rejects unsupported replay session storage schema versions', () => {
    const repository = createInMemoryReplaySessionRepository();

    expect(() => repository.hydrateStorageRecords([{ schemaVersion: 999, sessionId: 'rs-bad' } as never])).toThrow('Unsupported replay session storage schema version: 999');
  });

  it('throws readable not-found errors for missing sessions', () => {
    const repository = createInMemoryReplaySessionRepository();

    expect(() => repository.getSession('rs-missing')).toThrow('Replay session not found: rs-missing');
    expect(() => repository.appendManagerCommand('rs-missing', command)).toThrow('Replay session not found: rs-missing');
  });
});
