import { describe, expect, it } from 'vitest';
import { createHeadToHeadPrivateSetupShell } from '../../src/web/headToHeadPrivateSetupShell';
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

describe('head-to-head private setup shell', () => {
  it('stays absent until a lobby summary is selected', () => {
    expect(createHeadToHeadPrivateSetupShell(null)).toBeNull();
  });

  it('previews side setup spaces without implying hidden state exists yet', () => {
    const shell = createHeadToHeadPrivateSetupShell(lobbySummary('setup', { home }));

    expect(shell).toEqual(expect.objectContaining({
      title: 'Private setup preview',
      helperText: 'Preview-only setup spaces for future club, lineup, and tactic selection. No hidden choices are stored yet.',
      notes: expect.arrayContaining([
        'The shell is derived from the public lobby summary only; no private tactic, lineup, bench, or set-piece payload exists yet.',
        'Setup lock, kickoff, and completion remain server-owned transitions.'
      ])
    }));
    expect(shell?.sideCards).toEqual([
      expect.objectContaining({
        side: 'home',
        title: 'Home private setup',
        managerLabel: 'Chris Silva',
        clubLabel: 'Internazionale 2002',
        privacyLabel: 'Private setup shell ready',
        readinessLabel: 'Waiting for away manager before setup can be locked.'
      }),
      expect.objectContaining({
        side: 'away',
        title: 'Away private setup',
        managerLabel: 'Unassigned',
        clubLabel: 'Milan 2002',
        privacyLabel: 'Awaiting away manager',
        readinessLabel: 'Invite an away manager before their private setup shell can be represented.'
      })
    ]);
  });

  it('marks both assigned setup spaces as ready for a future private setup flow', () => {
    const shell = createHeadToHeadPrivateSetupShell(lobbySummary('setup', { home, away }));

    expect(shell?.stateLabel).toBe('Setup open');
    expect(shell?.sideCards).toEqual([
      expect.objectContaining({ managerLabel: 'Chris Silva', readinessLabel: 'Manager assigned; future lineup and tactic choices stay private until lock/reveal.' }),
      expect.objectContaining({ managerLabel: 'Away Boss', readinessLabel: 'Manager assigned; future lineup and tactic choices stay private until lock/reveal.' })
    ]);
  });

  it('freezes, closes, and archives setup copy as the lobby advances', () => {
    expect(createHeadToHeadPrivateSetupShell(lobbySummary('locked', { home, away }))?.sideCards[0]).toEqual(expect.objectContaining({
      privacyLabel: 'Setup locked',
      readinessLabel: 'Pre-match setup is frozen for kickoff; future hidden choices would reveal together.'
    }));
    expect(createHeadToHeadPrivateSetupShell(lobbySummary('in_match', { home, away }))?.sideCards[0]).toEqual(expect.objectContaining({
      privacyLabel: 'Match in progress',
      readinessLabel: 'Pre-match setup is closed; live tactical decisions remain a later slice.'
    }));
    expect(createHeadToHeadPrivateSetupShell(lobbySummary('complete', { home, away }))?.sideCards[0]).toEqual(expect.objectContaining({
      privacyLabel: 'Setup archived',
      readinessLabel: 'Setup is read-only historical context for the completed result.'
    }));
  });
});
