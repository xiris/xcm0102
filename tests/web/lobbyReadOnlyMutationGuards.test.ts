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

describe('read-only lobby mutation guards', () => {
  it('keeps read-only lobby browser surfaces disconnected from the transition helper', () => {
    const readOnlySurfacePaths = [
      'src/web/MatchLab.tsx',
      'src/web/LobbyFixtureGallery.tsx',
      'app/lobby-fixtures/page.tsx'
    ];

    for (const relativePath of readOnlySurfacePaths) {
      expect(readProjectFile(relativePath), relativePath).not.toContain('transitionReplaySessionLobbyStateFromWeb');
    }
  });

  it('keeps the fixture gallery and Match Lab from rendering visible lobby mutation controls', () => {
    const gallerySource = readProjectFile('src/web/LobbyFixtureGallery.tsx');
    const matchLabButtonBlocks = extractButtonBlocks(readProjectFile('src/web/MatchLab.tsx'));
    const forbiddenMutationControlLabels = [
      'Lock setup',
      'Kick off match',
      'Complete match',
      'Ready',
      'Invite',
      'Join',
      'Rematch'
    ];

    expect(gallerySource).not.toContain('<button');

    for (const buttonBlock of matchLabButtonBlocks) {
      for (const label of forbiddenMutationControlLabels) {
        expect(buttonBlock, `${label} must remain out of Match Lab buttons until explicit mutation-control work`).not.toContain(label);
      }
    }
  });
});
