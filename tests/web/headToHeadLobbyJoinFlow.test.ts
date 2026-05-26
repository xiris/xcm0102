import { describe, expect, it, vi } from 'vitest';
import { joinAwayManagerAndRefreshSummaryFromWeb } from '../../src/web/headToHeadLobbyJoinFlow';

describe('head-to-head lobby join flow', () => {
  it('joins the away manager then refreshes the lobby summary', async () => {
    const joinAwayManager = vi.fn().mockResolvedValue({ sessionId: 'rs-0001', lobbyState: 'setup' });
    const getSummary = vi.fn().mockResolvedValue({
      sessionId: 'rs-0001',
      seed: 311,
      lobbyState: 'setup',
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'setup',
        sides: {
          home: { managerId: 'home-chris-silva', displayName: 'Chris Silva' },
          away: { managerId: 'away-away-boss', displayName: 'Away Boss' }
        }
      },
      commandCounts: { home: 0, away: 0 },
      visibleEventCount: 0
    });

    const summary = await joinAwayManagerAndRefreshSummaryFromWeb({
      sessionId: 'rs-0001',
      awayManagerName: 'Away Boss',
      joinAwayManager,
      getSummary
    });

    expect(joinAwayManager).toHaveBeenCalledWith({ sessionId: 'rs-0001', managerId: 'away-away-boss', displayName: 'Away Boss' });
    expect(getSummary).toHaveBeenCalledWith('rs-0001');
    expect(summary.ownership.sides.away?.displayName).toBe('Away Boss');
  });
});
