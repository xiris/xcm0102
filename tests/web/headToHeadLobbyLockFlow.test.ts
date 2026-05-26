import { describe, expect, it, vi } from 'vitest';
import { lockHeadToHeadSetupAndRefreshSummaryFromWeb } from '../../src/web/headToHeadLobbyLockFlow';

describe('head-to-head lobby lock flow', () => {
  it('locks setup then refreshes the lobby summary', async () => {
    const transition = vi.fn().mockResolvedValue({ sessionId: 'rs-0001', lobbyState: 'locked' });
    const getSummary = vi.fn().mockResolvedValue({
      sessionId: 'rs-0001',
      seed: 311,
      lobbyState: 'locked',
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'locked',
        sides: {
          home: { managerId: 'home-chris-silva', displayName: 'Chris Silva' },
          away: { managerId: 'away-away-boss', displayName: 'Away Boss' }
        }
      },
      commandCounts: { home: 0, away: 0 },
      visibleEventCount: 0
    });

    const summary = await lockHeadToHeadSetupAndRefreshSummaryFromWeb({ sessionId: 'rs-0001', transition, getSummary });

    expect(transition).toHaveBeenCalledWith({ sessionId: 'rs-0001', lobbyState: 'locked' });
    expect(getSummary).toHaveBeenCalledWith('rs-0001');
    expect(summary.lobbyState).toBe('locked');
  });

  it('preserves transition rejection copy', async () => {
    const transition = vi.fn().mockRejectedValue(new Error('Replay session request failed: Cannot lock setup until both managers are assigned'));
    const getSummary = vi.fn();

    await expect(lockHeadToHeadSetupAndRefreshSummaryFromWeb({ sessionId: 'rs-0001', transition, getSummary }))
      .rejects.toThrow('Replay session request failed: Cannot lock setup until both managers are assigned');
    expect(getSummary).not.toHaveBeenCalled();
  });
});
