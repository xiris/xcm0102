import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LobbyStatusCard } from '../../src/web/MatchLab';
import { createReplaySessionLobbyStatusViewModel } from '../../src/web/replaySessionLobbyStatusViewModel';

const baseSummary = {
  sessionId: 'rs-preview-001',
  seed: 71,
  ownership: {
    mode: 'single_manager' as const,
    lobbyState: 'in_match' as const,
    sides: {
      home: { managerId: 'local-home', displayName: 'Local manager' }
    }
  },
  lobbyState: 'in_match' as const,
  commandCounts: { home: 0, away: 0 },
  visibleEventCount: 5
};

describe('LobbyStatusCard action preview panel', () => {
  it('renders read-only future action preview copy without mutation buttons', () => {
    const status = createReplaySessionLobbyStatusViewModel(baseSummary);

    const markup = renderToStaticMarkup(LobbyStatusCard({ status }));

    expect(markup).toContain('Future lobby actions');
    expect(markup).toContain('Single-manager Match Lab sessions skip setup/lock controls and begin in match; only completion remains a future transition.');
    expect(markup).toContain('Complete match');
    expect(markup).toContain('Target: complete');
    expect(markup).toContain('Available');
    expect(markup).not.toContain('<button');
  });

  it('renders disabled setup copy when manager assignment is incomplete', () => {
    const status = createReplaySessionLobbyStatusViewModel({
      ...baseSummary,
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'setup',
        sides: { home: { managerId: 'mgr-home', displayName: 'Home Manager' } }
      },
      lobbyState: 'setup'
    });

    const markup = renderToStaticMarkup(LobbyStatusCard({ status }));

    expect(markup).toContain('Lock setup');
    expect(markup).toContain('Target: locked');
    expect(markup).toContain('Disabled');
    expect(markup).toContain('Assign both managers before locking setup.');
    expect(markup).not.toContain('<button');
  });

  it('renders no-transition copy for completed sessions', () => {
    const status = createReplaySessionLobbyStatusViewModel({
      ...baseSummary,
      ownership: {
        mode: 'single_manager',
        lobbyState: 'complete',
        sides: { home: { managerId: 'local-home', displayName: 'Local manager' } }
      },
      lobbyState: 'complete'
    });

    const markup = renderToStaticMarkup(LobbyStatusCard({ status }));

    expect(markup).toContain('The result is complete. No further lobby transitions are available.');
    expect(markup).toContain('No further lobby transitions available.');
    expect(markup).not.toContain('Target:');
    expect(markup).not.toContain('<button');
  });
});
