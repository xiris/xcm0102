import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createHeadToHeadPrivateSetupPerspectiveSwitch } from '../../src/web/headToHeadPrivateSetupPerspectiveSwitch';
import type { ReplaySessionLobbySummary } from '../../src/web/replaySessionLobbyStatusViewModel';

const projectRoot = join(__dirname, '..', '..');

function readProjectFile(relativePath: string): string {
  return readFileSync(join(projectRoot, relativePath), 'utf8');
}

function lobbySummary(state: ReplaySessionLobbySummary['lobbyState'], sides: ReplaySessionLobbySummary['ownership']['sides']): ReplaySessionLobbySummary {
  return {
    sessionId: 'rs-000001',
    seed: 311,
    lobbyState: state,
    ownership: { mode: 'head_to_head', lobbyState: state, sides },
    commandCounts: { home: 0, away: 0 },
    visibleEventCount: 0
  };
}

const home = { managerId: 'home-chris', displayName: 'Chris Silva' };
const away = { managerId: 'away-boss', displayName: 'Away Boss' };

describe('head-to-head private setup perspective switch', () => {
  it('stays absent until a lobby summary is loaded', () => {
    expect(createHeadToHeadPrivateSetupPerspectiveSwitch({ summary: null, localSide: 'home' })).toBeNull();
  });

  it('describes a browser-local home perspective with assignment-aware side options', () => {
    const viewModel = createHeadToHeadPrivateSetupPerspectiveSwitch({ summary: lobbySummary('setup', { home }), localSide: 'home' });

    expect(viewModel).toEqual({
      title: 'Local private setup perspective',
      selectedSide: 'home',
      helperText: 'Perspective only changes this browser preview.',
      privacyNotice: 'No account or permission claim is made by this switch.',
      options: [
        { side: 'home', label: 'Home perspective', managerLabel: 'Chris Silva', assignmentLabel: 'Assigned', selected: true },
        { side: 'away', label: 'Away perspective', managerLabel: 'Unassigned', assignmentLabel: 'Unassigned', selected: false }
      ]
    });
  });

  it('can select the away perspective without exposing account or permission semantics', () => {
    const viewModel = createHeadToHeadPrivateSetupPerspectiveSwitch({ summary: lobbySummary('setup', { home, away }), localSide: 'away' });

    expect(viewModel?.selectedSide).toBe('away');
    expect(viewModel?.options).toEqual([
      { side: 'home', label: 'Home perspective', managerLabel: 'Chris Silva', assignmentLabel: 'Assigned', selected: false },
      { side: 'away', label: 'Away perspective', managerLabel: 'Away Boss', assignmentLabel: 'Assigned', selected: true }
    ]);
    expect(viewModel?.privacyNotice).toContain('No account or permission claim');
  });

  it('keeps the helper source free of server persistence, storage, and submit language', () => {
    const source = readProjectFile('src/web/headToHeadPrivateSetupPerspectiveSwitch.ts');

    expect(source).not.toContain('fetch(');
    expect(source).not.toContain('createReplaySession');
    expect(source).not.toContain('localStorage');
    expect(source).not.toContain('sessionStorage');
    expect(source).not.toContain('Submit setup');
    expect(source).not.toContain('Save setup');
  });
});
