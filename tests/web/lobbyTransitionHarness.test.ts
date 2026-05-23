import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LobbyTransitionHarness } from '../../src/web/LobbyTransitionHarness';

const projectRoot = join(__dirname, '..', '..');

function readProjectFile(relativePath: string): string {
  return readFileSync(join(projectRoot, relativePath), 'utf8');
}

describe('LobbyTransitionHarness', () => {
  it('renders the browser harness shell with setup creation and invalid transition controls', () => {
    const markup = renderToStaticMarkup(createElement(LobbyTransitionHarness));

    expect(markup).toContain('Lobby transition harness');
    expect(markup).toContain('Create setup lobby');
    expect(markup).toContain('Try invalid kickoff');
    expect(markup).toContain('No setup lobby has been created yet.');
  });

  it('wires the route through existing lobby mutation controls and flow helpers', () => {
    const pageSource = readProjectFile('app/lobby-transition-harness/page.tsx');
    const componentSource = readProjectFile('src/web/LobbyTransitionHarness.tsx');

    expect(pageSource).toContain('LobbyTransitionHarness');
    expect(componentSource).toContain("import { LobbyMutationControls } from './LobbyMutationControls';");
    expect(componentSource).toContain("import { applyReplaySessionLobbyTransitionFromWeb } from './replaySessionLobbyMutationFlow';");
    expect(componentSource).toContain('createLobbyTransitionHarnessSetupRequest');
    expect(componentSource).toContain('Try invalid kickoff');
    expect(componentSource).toContain('Invalid kickoff rejected:');
  });
});
