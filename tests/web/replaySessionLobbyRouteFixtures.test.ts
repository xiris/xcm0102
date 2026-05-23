import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LobbyStatusCard } from '../../src/web/MatchLab';
import { createReplaySessionLobbyRouteFixtures } from '../../src/web/replaySessionLobbyRouteFixtures';
import { createReplaySessionLobbyStatusViewModel } from '../../src/web/replaySessionLobbyStatusViewModel';

describe('replay session lobby route fixtures', () => {
  it('returns route-shaped lobby summary fixtures for each preview state', () => {
    const fixtures = createReplaySessionLobbyRouteFixtures();

    expect(Object.keys(fixtures)).toEqual(['setup', 'locked', 'inMatch', 'complete']);
    expect(fixtures.setup.lobbyState).toBe('setup');
    expect(fixtures.setup.ownership.lobbyState).toBe('setup');
    expect(fixtures.setup.sessionId).toBe('rs-fixture-setup');
    expect(fixtures.setup.seed).toBe(71);
    expect(fixtures.setup.commandCounts).toEqual({ home: 0, away: 0 });
    expect(fixtures.setup.visibleEventCount).toBe(0);

    expect(fixtures.locked.lobbyState).toBe('locked');
    expect(fixtures.locked.ownership.lobbyState).toBe('locked');
    expect(fixtures.locked.commandCounts).toEqual({ home: 0, away: 0 });

    expect(fixtures.inMatch.lobbyState).toBe('in_match');
    expect(fixtures.inMatch.ownership.lobbyState).toBe('in_match');
    expect(fixtures.inMatch.commandCounts).toEqual({ home: 2, away: 1 });
    expect(fixtures.inMatch.latestAuthoritativeSignature).toBe('fixture|in-match|signature');

    expect(fixtures.complete.lobbyState).toBe('complete');
    expect(fixtures.complete.ownership.lobbyState).toBe('complete');
    expect(fixtures.complete.visibleEventCount).toBe(8);
  });

  it('renders read-only preview copy for every route fixture state', () => {
    const fixtures = createReplaySessionLobbyRouteFixtures();

    const setupMarkup = renderFixture(fixtures.setup);
    expect(setupMarkup).toContain('Lock setup');
    expect(setupMarkup).toContain('Target: locked');
    expect(setupMarkup).toContain('Available');

    const lockedMarkup = renderFixture(fixtures.locked);
    expect(lockedMarkup).toContain('Kick off match');
    expect(lockedMarkup).toContain('Target: in_match');
    expect(lockedMarkup).toContain('Available');

    const inMatchMarkup = renderFixture(fixtures.inMatch);
    expect(inMatchMarkup).toContain('Complete match');
    expect(inMatchMarkup).toContain('Target: complete');
    expect(inMatchMarkup).toContain('Available');

    const completeMarkup = renderFixture(fixtures.complete);
    expect(completeMarkup).toContain('The result is complete. No further lobby transitions are available.');
    expect(completeMarkup).toContain('No further lobby transitions available.');
    expect(completeMarkup).not.toContain('Target:');

    for (const markup of [setupMarkup, lockedMarkup, inMatchMarkup, completeMarkup]) {
      expect(markup).toContain('Future lobby actions');
      expect(markup).not.toContain('<button');
    }
  });
});

function renderFixture(summary: ReturnType<typeof createReplaySessionLobbyRouteFixtures>[keyof ReturnType<typeof createReplaySessionLobbyRouteFixtures>]): string {
  return renderToStaticMarkup(LobbyStatusCard({
    status: createReplaySessionLobbyStatusViewModel(summary)
  }));
}
