import { describe, expect, it } from 'vitest';
import { createHeadToHeadPrivateSetupSelectionState, type HeadToHeadPrivateSetupDraft } from '../../src/web/headToHeadPrivateSetupSelectionState';
import type { ReplaySessionLobbySummary } from '../../src/web/replaySessionLobbyStatusViewModel';

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
  readinessIntent: 'ready_to_lock'
};

const awayDraft: HeadToHeadPrivateSetupDraft = {
  side: 'away',
  clubId: 'milan-2002',
  tacticShellId: 'compact-451',
  readinessIntent: 'editing'
};

describe('head-to-head private setup selection state', () => {
  it('stays absent until a lobby summary is selected', () => {
    expect(createHeadToHeadPrivateSetupSelectionState({ summary: null, localSide: 'home', drafts: [] })).toBeNull();
  });

  it('shows local home draft details and redacts opponent details before lock', () => {
    const state = createHeadToHeadPrivateSetupSelectionState({
      summary: lobbySummary('setup', { home, away }),
      localSide: 'home',
      drafts: [homeDraft, awayDraft]
    });

    expect(state).toEqual(expect.objectContaining({
      title: 'Private setup selection state',
      privacyNotice: 'Local preview only. Opponent setup details stay hidden until a future lock/reveal contract.'
    }));
    expect(state?.sideCards).toEqual([
      expect.objectContaining({
        side: 'home',
        managerLabel: 'Chris Silva',
        detailsVisible: true,
        publicStatus: 'Local setup draft ready',
        clubLabel: 'Internazionale 2002',
        tacticShellLabel: 'Balanced 4-4-2 shell',
        readinessIntentLabel: 'Ready to lock',
        privacyNote: 'Visible only to the local manager in this preview contract.'
      }),
      expect.objectContaining({
        side: 'away',
        managerLabel: 'Away Boss',
        detailsVisible: false,
        publicStatus: 'Opponent setup hidden',
        clubLabel: 'Hidden until lock',
        tacticShellLabel: 'Hidden until lock',
        readinessIntentLabel: 'Private',
        privacyNote: 'Opponent club, tactic, lineup, bench, and set pieces are not exposed before lock.'
      })
    ]);
  });

  it('mirrors privacy from the away local perspective', () => {
    const state = createHeadToHeadPrivateSetupSelectionState({
      summary: lobbySummary('setup', { home, away }),
      localSide: 'away',
      drafts: [homeDraft, awayDraft]
    });

    expect(state?.sideCards).toEqual([
      expect.objectContaining({ side: 'home', detailsVisible: false, clubLabel: 'Hidden until lock', tacticShellLabel: 'Hidden until lock' }),
      expect.objectContaining({ side: 'away', detailsVisible: true, clubLabel: 'Milan 2002', tacticShellLabel: 'Compact 4-5-1 shell', readinessIntentLabel: 'Still editing' })
    ]);
  });

  it('uses safe local defaults when the local side has no draft yet', () => {
    const state = createHeadToHeadPrivateSetupSelectionState({
      summary: lobbySummary('setup', { home }),
      localSide: 'home',
      drafts: []
    });

    expect(state?.sideCards[0]).toEqual(expect.objectContaining({
      detailsVisible: true,
      publicStatus: 'Local setup not submitted',
      clubLabel: 'Internazionale 2002',
      tacticShellLabel: 'Balanced 4-4-2 shell',
      readinessIntentLabel: 'Not submitted'
    }));
    expect(state?.sideCards[1]).toEqual(expect.objectContaining({
      managerLabel: 'Unassigned',
      detailsVisible: false,
      publicStatus: 'Awaiting manager assignment'
    }));
  });

  it('keeps later lobby states public-preview only without claiming hidden persistence exists', () => {
    expect(createHeadToHeadPrivateSetupSelectionState({ summary: lobbySummary('locked', { home, away }), localSide: 'home', drafts: [homeDraft, awayDraft] })?.sideCards[1]).toEqual(expect.objectContaining({
      detailsVisible: true,
      publicStatus: 'Setup locked preview',
      clubLabel: 'Milan 2002',
      tacticShellLabel: 'Compact 4-5-1 shell',
      readinessIntentLabel: 'Locked preview',
      privacyNote: 'Preview labels only; authoritative hidden setup persistence remains future work.'
    }));
    expect(createHeadToHeadPrivateSetupSelectionState({ summary: lobbySummary('in_match', { home, away }), localSide: 'home', drafts: [] })?.stateLabel).toBe('Match in progress');
    expect(createHeadToHeadPrivateSetupSelectionState({ summary: lobbySummary('complete', { home, away }), localSide: 'home', drafts: [] })?.stateLabel).toBe('Complete');
  });
});
