import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createProductEntryModeSelector } from '../../src/web/productEntryModeSelector';

function readProjectFile(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('createProductEntryModeSelector', () => {
  it('makes the root route a product mode selector instead of the old Match Lab stack', () => {
    const selector = createProductEntryModeSelector();

    expect(selector.hero).toEqual({
      eyebrow: 'XCM0102 Online',
      title: 'XCM0102 Manager Console',
      summary: 'Choose the multiplayer manager cockpit or open the single-player simulation lab sandbox.'
    });
    expect(selector.modes).toEqual([
      {
        id: 'head-to-head-cockpit',
        eyebrow: 'Product loop',
        title: 'Head-to-head manager cockpit',
        summary: 'Create a lobby, join an opponent, privately save setup, lock, kick off, and review the result.',
        href: '/head-to-head-lobby',
        cta: 'Open manager cockpit',
        tone: 'primary'
      },
      {
        id: 'simulation-lab',
        eyebrow: 'Sandbox',
        title: 'Single-player simulation lab',
        summary: 'Use the older tactical sandbox for deterministic simulation, assignments, and replay experiments.',
        href: '/match-lab',
        cta: 'Open simulation lab',
        tone: 'secondary'
      }
    ]);
    expect(JSON.stringify(selector)).not.toMatch(/Live desk|Tactical board/);
  });

  it('routes the default page to the selector and preserves Match Lab under /match-lab', () => {
    const rootSource = readProjectFile('app/page.tsx');
    const matchLabRouteSource = readProjectFile('app/match-lab/page.tsx');

    expect(rootSource).toContain('createProductEntryModeSelector');
    expect(rootSource).not.toContain('MatchLab');
    expect(matchLabRouteSource).toContain('MatchLab');
  });
});
