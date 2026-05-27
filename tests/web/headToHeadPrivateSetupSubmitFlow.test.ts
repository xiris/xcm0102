import { describe, expect, it, vi } from 'vitest';
import { submitHeadToHeadPrivateSetupDraftAndRefreshSummaryFromWeb } from '../../src/web/headToHeadPrivateSetupSubmitFlow';

describe('head-to-head private setup submit flow', () => {
  it('submits the local side draft then refreshes the authoritative lobby summary', async () => {
    const submit = vi.fn().mockResolvedValue({
      sessionId: 'rs-0001',
      side: 'home',
      stored: true,
      revealState: 'hidden_until_lock'
    });
    const getSummary = vi.fn().mockResolvedValue({
      sessionId: 'rs-0001',
      seed: 311,
      lobbyState: 'setup',
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'setup',
        sides: {
          home: { managerId: 'home-manager', displayName: 'Home Manager' },
          away: { managerId: 'away-manager', displayName: 'Away Manager' }
        }
      },
      commandCounts: { home: 0, away: 0 },
      visibleEventCount: 0
    });

    const summary = await submitHeadToHeadPrivateSetupDraftAndRefreshSummaryFromWeb({
      sessionId: 'rs-0001',
      side: 'home',
      draft: {
        side: 'home',
        clubId: 'internazionale-2002',
        tacticShellId: 'attacking-4231',
        readinessIntent: 'ready_to_lock'
      },
      submit,
      getSummary
    });

    expect(submit).toHaveBeenCalledWith({
      sessionId: 'rs-0001',
      side: 'home',
      draft: {
        clubId: 'internazionale-2002',
        tacticShellId: 'attacking-4231',
        readinessIntent: 'ready_to_lock'
      }
    });
    expect(getSummary).toHaveBeenCalledWith('rs-0001');
    expect(summary.lobbyState).toBe('setup');
  });

  it('preserves private setup submission rejection copy and does not refresh', async () => {
    const submit = vi.fn().mockRejectedValue(new Error('Replay session request failed: Private setup drafts can only be stored while setup is open'));
    const getSummary = vi.fn();

    await expect(submitHeadToHeadPrivateSetupDraftAndRefreshSummaryFromWeb({
      sessionId: 'rs-0001',
      side: 'away',
      draft: {
        side: 'away',
        clubId: 'milan-2002',
        tacticShellId: 'compact-451',
        readinessIntent: 'editing'
      },
      submit,
      getSummary
    })).rejects.toThrow('Replay session request failed: Private setup drafts can only be stored while setup is open');
    expect(getSummary).not.toHaveBeenCalled();
  });
});
