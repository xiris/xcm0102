import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { LobbyMutationControls } from '../../src/web/LobbyMutationControls';
import { createReplaySessionLobbyRouteFixtures } from '../../src/web/replaySessionLobbyRouteFixtures';
import { createReplaySessionLobbyStatusViewModel } from '../../src/web/replaySessionLobbyStatusViewModel';

const fixtures = createReplaySessionLobbyRouteFixtures();

describe('LobbyMutationControls', () => {
  it('renders available lobby transition buttons from the action availability model', () => {
    const status = createReplaySessionLobbyStatusViewModel(fixtures.setup);

    const markup = renderToStaticMarkup(LobbyMutationControls({ status, onTransition: vi.fn() }));

    expect(markup).toContain('Lobby transition controls');
    expect(markup).toContain('Both managers are assigned. A future Lock setup control can request the server-owned locked transition.');
    expect(markup).toContain('<button');
    expect(markup).toContain('type="button"');
    expect(markup).toContain('Lock setup');
    expect(markup).toContain('Target: locked');
    expect(markup).not.toContain('disabled=""');
  });

  it('renders disabled controls with existing disabled reason copy', () => {
    const status = createReplaySessionLobbyStatusViewModel({
      ...fixtures.setup,
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'setup',
        sides: { home: { managerId: 'mgr-home', displayName: 'Home Manager' } }
      }
    });

    const markup = renderToStaticMarkup(LobbyMutationControls({ status, onTransition: vi.fn() }));

    expect(markup).toContain('Lock setup');
    expect(markup).toContain('disabled=""');
    expect(markup).toContain('Assign both managers before locking setup.');
  });

  it('renders no mutation buttons for completed sessions', () => {
    const status = createReplaySessionLobbyStatusViewModel(fixtures.complete);

    const markup = renderToStaticMarkup(LobbyMutationControls({ status, onTransition: vi.fn() }));

    expect(markup).toContain('Lobby transition controls');
    expect(markup).toContain('The result is complete. No further lobby transitions are available.');
    expect(markup).toContain('No lobby transition controls are available.');
    expect(markup).not.toContain('<button');
  });
});
