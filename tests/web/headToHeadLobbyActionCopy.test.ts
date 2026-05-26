import { describe, expect, it } from 'vitest';
import { createHeadToHeadLobbyActionCopy } from '../../src/web/headToHeadLobbyActionCopy';
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

describe('head-to-head lobby action copy', () => {
  it('guides setup lobbies from away join toward setup lock', () => {
    expect(createHeadToHeadLobbyActionCopy({ summary: lobbySummary('setup', { home }), hasSessionId: true })).toEqual(expect.objectContaining({
      stageLabel: 'Awaiting opponent',
      joinAway: expect.objectContaining({ enabled: true, helperText: 'Invite code is ready. The away manager can join while setup is still open.' }),
      lockSetup: expect.objectContaining({ enabled: false, helperText: 'Assign both managers before locking setup.' }),
      kickOff: expect.objectContaining({ enabled: false, helperText: 'Lock setup before kicking off the match.' }),
      completeMatch: expect.objectContaining({ enabled: false, helperText: 'Kick off before completing the match.' })
    }));
  });

  it('blocks duplicate away joins once both managers are assigned and enables setup lock', () => {
    expect(createHeadToHeadLobbyActionCopy({ summary: lobbySummary('setup', { home, away }), hasSessionId: true })).toEqual(expect.objectContaining({
      stageLabel: 'Ready to lock setup',
      joinAway: expect.objectContaining({ enabled: false, helperText: 'Away side is already assigned for this lobby.' }),
      lockSetup: expect.objectContaining({ enabled: true, helperText: 'Both managers are assigned. Lock setup when tactics and lineups are ready.' })
    }));
  });

  it('enables only kickoff when setup is locked', () => {
    expect(createHeadToHeadLobbyActionCopy({ summary: lobbySummary('locked', { home, away }), hasSessionId: true })).toEqual(expect.objectContaining({
      stageLabel: 'Ready for kickoff',
      joinAway: expect.objectContaining({ enabled: false, helperText: 'Setup is locked; away assignment is closed.' }),
      lockSetup: expect.objectContaining({ enabled: false, helperText: 'Setup is already locked.' }),
      kickOff: expect.objectContaining({ enabled: true, helperText: 'Setup is locked. Kick off when both managers are ready to start.' }),
      completeMatch: expect.objectContaining({ enabled: false, helperText: 'Kick off before completing the match.' })
    }));
  });

  it('enables only completion during in-match state', () => {
    expect(createHeadToHeadLobbyActionCopy({ summary: lobbySummary('in_match', { home, away }), hasSessionId: true })).toEqual(expect.objectContaining({
      stageLabel: 'Match in progress',
      kickOff: expect.objectContaining({ enabled: false, helperText: 'Match is already in progress.' }),
      completeMatch: expect.objectContaining({ enabled: true, helperText: 'The match is in progress. Complete it to close the authoritative result.' })
    }));
  });

  it('closes all transition actions after completion', () => {
    expect(createHeadToHeadLobbyActionCopy({ summary: lobbySummary('complete', { home, away }), hasSessionId: true })).toEqual(expect.objectContaining({
      stageLabel: 'Result closed',
      joinAway: expect.objectContaining({ enabled: false, helperText: 'Result is closed; away assignment is no longer available.' }),
      lockSetup: expect.objectContaining({ enabled: false, helperText: 'Result is closed; setup cannot be changed.' }),
      kickOff: expect.objectContaining({ enabled: false, helperText: 'Result is already closed.' }),
      completeMatch: expect.objectContaining({ enabled: false, helperText: 'Result is already closed and ready for report review.' })
    }));
  });
});
