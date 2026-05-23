import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = join(__dirname, '..', '..');

function readProjectFile(relativePath: string): string {
  return readFileSync(join(projectRoot, relativePath), 'utf8');
}

function extractButtonBlocks(source: string): string[] {
  return source.match(/<button[\s\S]*?<\/button>/g) ?? [];
}

describe('guarded lobby mutation controls', () => {
  it('keeps fixture-gallery browser surfaces disconnected from transition helpers and mutation buttons', () => {
    const readOnlySurfacePaths = [
      'src/web/LobbyFixtureGallery.tsx',
      'app/lobby-fixtures/page.tsx'
    ];

    for (const relativePath of readOnlySurfacePaths) {
      const source = readProjectFile(relativePath);
      expect(source, relativePath).not.toContain('transitionReplaySessionLobbyStateFromWeb');
      expect(source, relativePath).not.toContain('applyReplaySessionLobbyTransitionFromWeb');
      expect(source, relativePath).not.toContain('<button');
    }
  });

  it('keeps visible Match Lab lobby mutation controls behind the explicit component and flow helper', () => {
    const source = readProjectFile('src/web/MatchLab.tsx');
    const matchLabButtonBlocks = extractButtonBlocks(source);
    const forbiddenInlineMutationControlLabels = [
      'Lock setup',
      'Kick off match',
      'Complete match',
      'Ready',
      'Invite',
      'Join',
      'Rematch'
    ];

    expect(source).toContain('<LobbyMutationControls');
    expect(source).toContain('applyReplaySessionLobbyTransitionFromWeb');
    expect(source).not.toContain('transitionReplaySessionLobbyStateFromWeb');

    for (const buttonBlock of matchLabButtonBlocks) {
      for (const label of forbiddenInlineMutationControlLabels) {
        expect(buttonBlock, `${label} must stay inside LobbyMutationControls, not inline Match Lab buttons`).not.toContain(label);
      }
    }
  });
});
