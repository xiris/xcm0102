import { describe, expect, it, vi } from 'vitest';
import { completeHeadToHeadMatchAndRefreshSummaryFromWeb } from '../../src/web/headToHeadLobbyCompletionFlow';

describe('head-to-head lobby completion flow', () => {
  it('completes an in-match lobby then refreshes the lobby summary', async () => {
    const transition = vi.fn().mockResolvedValue({ sessionId: 'rs-0001', lobbyState: 'complete' });
    const getSummary = vi.fn().mockResolvedValue({
      sessionId: 'rs-0001',
      seed: 311,
      lobbyState: 'complete',
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'complete',
        sides: {
          home: { managerId: 'home-chris-silva', displayName: 'Chris Silva' },
          away: { managerId: 'away-away-boss', displayName: 'Away Boss' }
        }
      },
      commandCounts: { home: 0, away: 0 },
      visibleEventCount: 0
    });

    const summary = await completeHeadToHeadMatchAndRefreshSummaryFromWeb({ sessionId: 'rs-0001', transition, getSummary });

    expect(transition).toHaveBeenCalledWith({ sessionId: 'rs-0001', lobbyState: 'complete' });
    expect(getSummary).toHaveBeenCalledWith('rs-0001');
    expect(summary.lobbyState).toBe('complete');
  });

  it('preserves premature completion rejection copy', async () => {
    const transition = vi.fn().mockRejectedValue(new Error('Replay session request failed: Invalid replay session lobby transition: locked -> complete'));
    const getSummary = vi.fn();

    await expect(completeHeadToHeadMatchAndRefreshSummaryFromWeb({ sessionId: 'rs-0001', transition, getSummary }))
      .rejects.toThrow('Replay session request failed: Invalid replay session lobby transition: locked -> complete');
    expect(getSummary).not.toHaveBeenCalled();
  });
});
