import { describe, expect, it, vi } from 'vitest';
import { applyReplaySessionLobbyTransitionFromWeb } from '../../src/web/replaySessionLobbyMutationFlow';
import { createReplaySessionLobbyRouteFixtures } from '../../src/web/replaySessionLobbyRouteFixtures';
import { createReplaySessionLobbyStatusViewModel } from '../../src/web/replaySessionLobbyStatusViewModel';

const fixtures = createReplaySessionLobbyRouteFixtures();

describe('replay session lobby mutation flow', () => {
  it('transitions through the browser client and refreshes the server summary', async () => {
    const action = createReplaySessionLobbyStatusViewModel(fixtures.setup).actionAvailability.actions[0]!;
    const refreshedSummary = { ...fixtures.locked, sessionId: fixtures.setup.sessionId };
    const transition = vi.fn().mockResolvedValue({
      sessionId: fixtures.setup.sessionId,
      lobbyState: 'locked',
      ownership: refreshedSummary.ownership
    });
    const getSummary = vi.fn().mockResolvedValue(refreshedSummary);

    const result = await applyReplaySessionLobbyTransitionFromWeb({
      sessionId: fixtures.setup.sessionId,
      action,
      transition,
      getSummary
    });

    expect(transition).toHaveBeenCalledWith({ sessionId: fixtures.setup.sessionId, lobbyState: 'locked' });
    expect(getSummary).toHaveBeenCalledWith(fixtures.setup.sessionId);
    expect(result).toBe(refreshedSummary);
  });

  it('preserves exact transition failure copy for display', async () => {
    const action = createReplaySessionLobbyStatusViewModel(fixtures.complete).actionAvailability.actions[0] ?? {
      id: 'kickoff' as const,
      label: 'Kick off match',
      targetLobbyState: 'in_match' as const,
      available: true
    };
    const transition = vi.fn().mockRejectedValue(new Error('Replay session request failed: Invalid replay session lobby transition: complete -> in_match'));
    const getSummary = vi.fn();

    await expect(applyReplaySessionLobbyTransitionFromWeb({
      sessionId: fixtures.complete.sessionId,
      action,
      transition,
      getSummary
    })).rejects.toThrow('Replay session request failed: Invalid replay session lobby transition: complete -> in_match');
    expect(getSummary).not.toHaveBeenCalled();
  });
});
