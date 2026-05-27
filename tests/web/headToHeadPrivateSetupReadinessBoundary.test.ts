import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createHeadToHeadPrivateSetupReadinessBoundary } from '../../src/web/headToHeadPrivateSetupReadinessBoundary';
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

const editingHomeDraft: HeadToHeadPrivateSetupDraft = {
  side: 'home',
  clubId: 'internazionale-2002',
  tacticShellId: 'balanced-442',
  readinessIntent: 'editing'
};

const readyHomeDraft: HeadToHeadPrivateSetupDraft = {
  ...editingHomeDraft,
  readinessIntent: 'ready_to_lock'
};

describe('head-to-head private setup readiness boundary', () => {
  it('stays absent until a lobby summary is loaded', () => {
    expect(createHeadToHeadPrivateSetupReadinessBoundary({ summary: null, localSide: 'home', drafts: [], lockAvailable: false })).toBeNull();
  });

  it('keeps server lock available when saved private setup readiness is still editing', () => {
    const boundary = createHeadToHeadPrivateSetupReadinessBoundary({
      summary: lobbySummary('setup', { home, away }),
      localSide: 'home',
      drafts: [editingHomeDraft],
      lockAvailable: true
    });

    expect(boundary).toEqual({
      title: 'Setup readiness boundary',
      side: 'home',
      managerLabel: 'Chris Silva',
      draftReadinessLabel: 'Still editing',
      serverLockLabel: 'Server lock remains available once both managers are assigned.',
      helperText: 'Still editing is private setup state only; it does not disable the product Lock setup control.',
      advisoryNotice: 'Readiness intent is saved with the private draft but never gates server-owned setup lock.',
      persistenceNotice: 'Private setup readiness can be submitted as a hidden side-scoped server draft; public summaries stay redacted until setup lock.'
    });
  });

  it('treats ready-to-lock as saveable private setup intent rather than a setup-lock gate', () => {
    const boundary = createHeadToHeadPrivateSetupReadinessBoundary({
      summary: lobbySummary('setup', { home, away }),
      localSide: 'home',
      drafts: [readyHomeDraft],
      lockAvailable: true
    });

    expect(boundary).toEqual(expect.objectContaining({
      draftReadinessLabel: 'Ready to lock',
      helperText: 'Ready means this private draft can be saved before the server-owned setup lock.',
      serverLockLabel: 'Server lock remains available once both managers are assigned.'
    }));
  });

  it('does not let an unassigned local side claim readiness', () => {
    const boundary = createHeadToHeadPrivateSetupReadinessBoundary({
      summary: lobbySummary('setup', { home }),
      localSide: 'away',
      drafts: [],
      lockAvailable: false
    });

    expect(boundary).toEqual(expect.objectContaining({
      side: 'away',
      managerLabel: 'Unassigned',
      draftReadinessLabel: 'Unavailable',
      serverLockLabel: 'Server lock is unavailable from the public lobby summary.',
      helperText: 'Join this side before saving setup readiness.'
    }));
  });

  it('archives readiness after setup has moved past the editable phase', () => {
    const boundary = createHeadToHeadPrivateSetupReadinessBoundary({
      summary: lobbySummary('in_match', { home, away }),
      localSide: 'home',
      drafts: [readyHomeDraft],
      lockAvailable: false
    });

    expect(boundary).toEqual(expect.objectContaining({
      draftReadinessLabel: 'Archived preview',
      serverLockLabel: 'Setup lock is no longer editable because the server state is in_match.',
      helperText: 'Saved readiness is historical preview copy after setup is locked.'
    }));
  });

  it('keeps the readiness boundary source pure and free of direct network/storage side effects', () => {
    const source = readProjectFile('src/web/headToHeadPrivateSetupReadinessBoundary.ts');

    expect(source).not.toContain('fetch(');
    expect(source).not.toContain('createReplaySession');
    expect(source).not.toContain('getReplaySession');
    expect(source).not.toContain('localStorage');
    expect(source).not.toContain('sessionStorage');
  });
});
