import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  applyHeadToHeadPrivateSetupDraftControlChange,
  createHeadToHeadPrivateSetupDraftControls,
  type HeadToHeadPrivateSetupDraftControlChange
} from '../../src/web/headToHeadPrivateSetupDraftControls';
import type { HeadToHeadPrivateSetupDraft } from '../../src/web/headToHeadPrivateSetupSelectionState';
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

const homeDraft: HeadToHeadPrivateSetupDraft = {
  side: 'home',
  clubId: 'internazionale-2002',
  tacticShellId: 'balanced-442',
  readinessIntent: 'editing'
};

describe('head-to-head private setup draft controls', () => {
  it('stays absent until a lobby summary is loaded', () => {
    expect(createHeadToHeadPrivateSetupDraftControls({ summary: null, localSide: 'home', drafts: [] })).toBeNull();
  });

  it('enables local browser-only controls for an assigned setup-side manager', () => {
    const controls = createHeadToHeadPrivateSetupDraftControls({
      summary: lobbySummary('setup', { home, away }),
      localSide: 'home',
      drafts: [homeDraft]
    });

    expect(controls).toEqual(expect.objectContaining({
      title: 'Local private setup draft controls',
      side: 'home',
      managerLabel: 'Chris Silva',
      enabled: true,
      disabledReason: null,
      helperText: 'Local browser draft only. Adjust sample setup labels before lock; nothing is submitted to the server.',
      persistenceNotice: 'Not submitted to the server. Refreshing or loading another lobby can discard this draft.'
    }));
    expect(controls?.currentDraft).toEqual(homeDraft);
    expect(controls?.clubOptions).toEqual([
      { id: 'internazionale-2002', label: 'Internazionale 2002' },
      { id: 'milan-2002', label: 'Milan 2002' }
    ]);
    expect(controls?.tacticShellOptions.map((option) => option.label)).toEqual([
      'Balanced 4-4-2 shell',
      'Attacking 4-2-3-1 shell',
      'Compact 4-5-1 shell'
    ]);
    expect(controls?.readinessOptions.map((option) => option.label)).toEqual(['Still editing', 'Ready to lock']);
  });

  it('disables controls when the local side has not been assigned', () => {
    const controls = createHeadToHeadPrivateSetupDraftControls({ summary: lobbySummary('setup', { home }), localSide: 'away', drafts: [] });

    expect(controls).toEqual(expect.objectContaining({
      side: 'away',
      managerLabel: 'Unassigned',
      enabled: false,
      disabledReason: 'Join this side before editing a local private setup draft.'
    }));
    expect(controls?.currentDraft).toEqual(expect.objectContaining({ side: 'away', clubId: 'milan-2002', tacticShellId: 'balanced-442', readinessIntent: 'editing' }));
  });

  it('disables controls after setup is locked while keeping the draft visible for preview history', () => {
    const controls = createHeadToHeadPrivateSetupDraftControls({ summary: lobbySummary('locked', { home, away }), localSide: 'home', drafts: [homeDraft] });

    expect(controls).toEqual(expect.objectContaining({
      enabled: false,
      disabledReason: 'Setup is locked; local draft controls are read-only history.',
      currentDraft: homeDraft
    }));
  });

  it('applies immutable local draft changes without touching opponent drafts', () => {
    const change: HeadToHeadPrivateSetupDraftControlChange = {
      clubId: 'milan-2002',
      tacticShellId: 'attacking-4231',
      readinessIntent: 'ready_to_lock'
    };

    const updated = applyHeadToHeadPrivateSetupDraftControlChange(homeDraft, change);

    expect(updated).toEqual({
      side: 'home',
      clubId: 'milan-2002',
      tacticShellId: 'attacking-4231',
      readinessIntent: 'ready_to_lock'
    });
    expect(homeDraft).toEqual({
      side: 'home',
      clubId: 'internazionale-2002',
      tacticShellId: 'balanced-442',
      readinessIntent: 'editing'
    });
  });

  it('keeps the controls source free of server persistence, storage, and submit language', () => {
    const source = readProjectFile('src/web/headToHeadPrivateSetupDraftControls.ts');

    expect(source).not.toContain('fetch(');
    expect(source).not.toContain('createReplaySession');
    expect(source).not.toContain('localStorage');
    expect(source).not.toContain('sessionStorage');
    expect(source).not.toContain('Submit setup');
    expect(source).not.toContain('Save setup');
  });
});
