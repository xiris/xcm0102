import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LobbyFixtureGallery } from '../../src/web/LobbyFixtureGallery';
import LobbyFixturesPage from '../../app/lobby-fixtures/page';

describe('LobbyFixtureGallery', () => {
  it('renders every read-only lobby fixture state without mutation buttons', () => {
    const markup = renderToStaticMarkup(LobbyFixtureGallery());

    expect(markup).toContain('Lobby fixture gallery');
    expect(markup).toContain('Read-only route fixture gallery');
    expect(markup).toContain('This gallery renders route-shaped lobby summaries without calling transition helpers or exposing mutation controls.');

    expect(markup).toContain('Setup open');
    expect(markup).toContain('Locked for kickoff');
    expect(markup).toContain('In match');
    expect(markup).toContain('Complete');

    expect(markup).toContain('Lock setup');
    expect(markup).toContain('Target: locked');
    expect(markup).toContain('Kick off match');
    expect(markup).toContain('Target: in_match');
    expect(markup).toContain('Complete match');
    expect(markup).toContain('Target: complete');
    expect(markup).toContain('No further lobby transitions available.');
    expect(markup).not.toContain('<button');
  });

  it('exposes the read-only fixture gallery through a static route', () => {
    const markup = renderToStaticMarkup(LobbyFixturesPage());

    expect(markup).toContain('Lobby fixture gallery');
    expect(markup).toContain('Read-only route fixture gallery');
    expect(markup).toContain('Lock setup');
    expect(markup).toContain('Kick off match');
    expect(markup).toContain('No further lobby transitions available.');
    expect(markup).not.toContain('<button');
  });
});
