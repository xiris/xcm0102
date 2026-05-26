import { describe, expect, it, vi } from 'vitest';
import { kickOffHeadToHeadMatchAndRefreshSummaryFromWeb } from '../../src/web/headToHeadLobbyKickoffFlow';

describe('head-to-head lobby kickoff flow', () => {
  it('kicks off a locked lobby then refreshes the lobby summary', async () => {
    const transition = vi.fn().mockResolvedValue({ sessionId: 'rs-0001', lobbyState: 'in_match' });
    const getSummary = vi.fn().mockResolvedValue({
      sessionId: 'rs-0001',
      seed: 311,
      lobbyState: 'in_match',
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'in_match',
        sides: {
          home: { managerId: 'home-chris-silva', displayName: 'Chris Silva' },
          away: { managerId: 'away-away-boss', displayName: 'Away Boss' }
        }
      },
      commandCounts: { home: 0, away: 0 },
      visibleEventCount: 0
    });

    const summary = await kickOffHeadToHeadMatchAndRefreshSummaryFromWeb({ sessionId: 'rs-0001', transition, getSummary });

    expect(transition).toHaveBeenCalledWith({ sessionId: 'rs-0001', lobbyState: 'in_match' });
    expect(getSummary).toHaveBeenCalledWith('rs-0001');
    expect(summary.lobbyState).toBe('in_match');
  });

  it('preserves premature kickoff rejection copy', async () => {
    const transition = vi.fn().mockRejectedValue(new Error('Replay session request failed: Invalid replay session lobby transition: setup -> in_match'));
    const getSummary = vi.fn();

    await expect(kickOffHeadToHeadMatchAndRefreshSummaryFromWeb({ sessionId: 'rs-0001', transition, getSummary }))
      .rejects.toThrow('Replay session request failed: Invalid replay session lobby transition: setup -> in_match');
    expect(getSummary).not.toHaveBeenCalled();
  });
});
