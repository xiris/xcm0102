import { describe, expect, it, vi } from 'vitest';
import {
  appendReplaySessionCommandFromWeb,
  createReplaySessionFromWeb,
  getReplaySessionSummaryFromWeb,
  joinAwayManagerFromWeb,
  resumeReplaySessionFromWeb,
  syncReplaySessionVisibleEventsFromWeb,
  transitionReplaySessionLobbyStateFromWeb
} from '../../src/web/replaySessionClient';
import { defaultTacticalState } from '../../src/web/tacticalPayload';

const visibleEvents = [
  { minute: 1, type: 'kickoff' as const, description: 'Kickoff.' },
  { minute: 50, teamId: 'home', type: 'goal' as const, description: 'Home score.' }
];

const command = {
  id: 'cmd-050-01-change-pressing',
  minute: 50,
  action: 'Change pressing',
  eventType: 'goal' as const,
  eventDescription: 'Home score.',
  effectSummary: 'Recorded intent: change pressing at 50’.'
};

describe('replay session web client', () => {
  it('creates appends synchronizes and resumes replay sessions through session-owned routes', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ sessionId: 'rs-0001', score: { home: 1, away: 1 }, visibleEventCount: 0, replay: { seed: 71, engineVersion: 'test-engine', commandCount: 0 } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ sessionId: 'rs-0001', commandCount: 1 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ sessionId: 'rs-0001', visibleEventCount: 2 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ sessionId: 'rs-0001', authoritative: true, score: { home: 2, away: 1 }, stats: { home: {}, away: {} }, events: visibleEvents, diagnostics: ['ok'], replay: { seed: 71, engineVersion: 'test-engine', commandCount: 1 }, signature: '71|50|cmd|vh-abcd|8' }) });

    const simulationRequest = { ...defaultTacticalState(), seed: 71, homeMentality: 'defensive' as const, awayPressing: 'high' as const };
    const created = await createReplaySessionFromWeb(simulationRequest, fetchMock);
    const appended = await appendReplaySessionCommandFromWeb({ sessionId: created.sessionId, command }, fetchMock);
    const synced = await syncReplaySessionVisibleEventsFromWeb({ sessionId: created.sessionId, visibleEvents }, fetchMock);
    const resumed = await resumeReplaySessionFromWeb({ sessionId: created.sessionId, currentMinute: 50 }, fetchMock);

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/replay-sessions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(simulationRequest)
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/replay-sessions/rs-0001/commands', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ command })
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/replay-sessions/rs-0001/visible-events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ visibleEvents })
    });
    expect(fetchMock).toHaveBeenNthCalledWith(4, '/api/replay-sessions/rs-0001/resume', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ currentMinute: 50 })
    });
    expect(appended.commandCount).toBe(1);
    expect(synced.visibleEventCount).toBe(2);
    expect(resumed.signature).toBe('71|50|cmd|vh-abcd|8');
  });

  it('posts side-aware command append requests for future head-to-head lobbies', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ sessionId: 'rs-0001', commandCount: 1, commandCounts: { home: 0, away: 1 } })
    });

    const appended = await appendReplaySessionCommandFromWeb({ sessionId: 'rs-0001', side: 'away', command }, fetchMock);

    expect(fetchMock).toHaveBeenCalledWith('/api/replay-sessions/rs-0001/commands', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ command, side: 'away' })
    });
    expect(appended).toEqual({ sessionId: 'rs-0001', commandCount: 1, commandCounts: { home: 0, away: 1 } });
  });

  it('gets read-only replay session summaries for lobby status panels', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        sessionId: 'rs-0001',
        seed: 71,
        ownership: {
          mode: 'single_manager',
          lobbyState: 'in_match',
          sides: { home: { managerId: 'local-home', displayName: 'Local manager' } }
        },
        lobbyState: 'in_match',
        commandCounts: { home: 1, away: 0 },
        visibleEventCount: 2,
        latestAuthoritativeSignature: '71|50|cmd|vh-abcd|8'
      })
    });

    const summary = await getReplaySessionSummaryFromWeb('rs-0001', fetchMock);

    expect(fetchMock).toHaveBeenCalledWith('/api/replay-sessions/rs-0001', {
      method: 'GET',
      headers: { 'content-type': 'application/json' }
    });
    expect(summary.commandCounts).toEqual({ home: 1, away: 0 });
    expect(summary.latestAuthoritativeSignature).toBe('71|50|cmd|vh-abcd|8');
  });

  it('joins an away manager from the browser client and preserves rejection copy', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sessionId: 'rs-0001',
          lobbyState: 'setup',
          ownership: {
            mode: 'head_to_head',
            lobbyState: 'setup',
            sides: {
              home: { managerId: 'manager-home', displayName: 'Home Boss' },
              away: { managerId: 'manager-away', displayName: 'Away Boss' }
            }
          }
        })
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Away manager is already assigned for replay session' })
      });

    const joined = await joinAwayManagerFromWeb({ sessionId: 'rs-0001', managerId: 'manager-away', displayName: 'Away Boss' }, fetchMock);

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/replay-sessions/rs-0001/join-away', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ managerId: 'manager-away', displayName: 'Away Boss' })
    });
    expect(joined.ownership.sides.away?.displayName).toBe('Away Boss');
    await expect(joinAwayManagerFromWeb({ sessionId: 'rs-0001', managerId: 'manager-next', displayName: 'Next Away' }, fetchMock))
      .rejects.toThrow('Replay session request failed: Away manager is already assigned for replay session');
  });

  it('transitions replay session lobby state from the browser client', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        sessionId: 'rs-0001',
        lobbyState: 'locked',
        ownership: {
          mode: 'head_to_head',
          lobbyState: 'locked',
          sides: {
            home: { managerId: 'manager-home', displayName: 'Home Boss' },
            away: { managerId: 'manager-away', displayName: 'Away Boss' }
          }
        }
      })
    });

    const transitioned = await transitionReplaySessionLobbyStateFromWeb({
      sessionId: 'rs-0001',
      lobbyState: 'locked'
    }, fetchMock);

    expect(fetchMock).toHaveBeenCalledWith('/api/replay-sessions/rs-0001/lobby-state', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lobbyState: 'locked' })
    });
    expect(transitioned.lobbyState).toBe('locked');
    expect(transitioned.ownership.mode).toBe('head_to_head');
    expect(transitioned.ownership.sides.away?.displayName).toBe('Away Boss');
  });

  it.each([
    ['setup direct kickoff', 'Invalid replay session lobby transition: setup -> in_match', 'in_match' as const],
    ['in-match rollback', 'Invalid replay session lobby transition: in_match -> locked', 'locked' as const],
    ['complete rollback', 'Invalid replay session lobby transition: complete -> in_match', 'in_match' as const]
  ])('preserves invalid lobby transition rejection copy for %s', async (_caseName, serverError, lobbyState) => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: serverError })
    });

    await expect(transitionReplaySessionLobbyStateFromWeb({
      sessionId: 'rs-0001',
      lobbyState
    }, fetchMock)).rejects.toThrow(`Replay session request failed: ${serverError}`);
  });

  it('throws readable session errors from server payloads', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Replay session not found: rs-missing' })
    });

    await expect(resumeReplaySessionFromWeb({ sessionId: 'rs-missing', currentMinute: 50 }, fetchMock)).rejects.toThrow('Replay session request failed: Replay session not found: rs-missing');
  });
});
