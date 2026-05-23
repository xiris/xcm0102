import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = join(__dirname, '..', '..');

function readProjectFile(relativePath: string): string {
  return readFileSync(join(projectRoot, relativePath), 'utf8');
}

describe('Match Lab lobby mutation control integration', () => {
  it('wires visible lobby mutation controls through the explicit control component and transition flow', () => {
    const source = readProjectFile('src/web/MatchLab.tsx');

    expect(source).toContain("import { LobbyMutationControls } from './LobbyMutationControls';");
    expect(source).toContain("import { applyReplaySessionLobbyTransitionFromWeb } from './replaySessionLobbyMutationFlow';");
    expect(source).toContain('<LobbyMutationControls');
    expect(source).toContain('requestLobbyTransition');
    expect(source).toContain('setReplaySessionSummary(summary)');
    expect(source).toContain('Replay session lobby transitioned to');
  });
});
