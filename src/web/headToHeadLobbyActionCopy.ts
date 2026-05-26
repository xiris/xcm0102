import type { ReplaySessionLobbySummary } from './replaySessionLobbyStatusViewModel';

export type HeadToHeadLobbyActionState = {
  enabled: boolean;
  helperText: string;
};

export type HeadToHeadLobbyActionCopy = {
  stageLabel: string;
  joinAway: HeadToHeadLobbyActionState;
  lockSetup: HeadToHeadLobbyActionState;
  kickOff: HeadToHeadLobbyActionState;
  completeMatch: HeadToHeadLobbyActionState;
};

export type HeadToHeadLobbyActionCopyInput = {
  summary: ReplaySessionLobbySummary | null;
  hasSessionId: boolean;
};

export function createHeadToHeadLobbyActionCopy({ summary, hasSessionId }: HeadToHeadLobbyActionCopyInput): HeadToHeadLobbyActionCopy {
  if (summary === null) {
    return {
      stageLabel: 'No lobby selected',
      joinAway: {
        enabled: hasSessionId,
        helperText: hasSessionId
          ? 'Paste an invite code and join as the away manager.'
          : 'Create or enter a lobby session ID before joining as away manager.'
      },
      lockSetup: { enabled: false, helperText: 'Assign both managers before locking setup.' },
      kickOff: { enabled: false, helperText: 'Lock setup before kicking off the match.' },
      completeMatch: { enabled: false, helperText: 'Kick off before completing the match.' }
    };
  }

  const hasHome = summary.ownership.sides.home !== undefined;
  const hasAway = summary.ownership.sides.away !== undefined;

  if (summary.lobbyState === 'setup') {
    return {
      stageLabel: hasHome && hasAway ? 'Ready to lock setup' : 'Awaiting opponent',
      joinAway: hasAway
        ? { enabled: false, helperText: 'Away side is already assigned for this lobby.' }
        : { enabled: hasSessionId, helperText: 'Invite code is ready. The away manager can join while setup is still open.' },
      lockSetup: hasHome && hasAway
        ? { enabled: true, helperText: 'Both managers are assigned. Lock setup when tactics and lineups are ready.' }
        : { enabled: false, helperText: 'Assign both managers before locking setup.' },
      kickOff: { enabled: false, helperText: 'Lock setup before kicking off the match.' },
      completeMatch: { enabled: false, helperText: 'Kick off before completing the match.' }
    };
  }

  if (summary.lobbyState === 'locked') {
    return {
      stageLabel: 'Ready for kickoff',
      joinAway: { enabled: false, helperText: 'Setup is locked; away assignment is closed.' },
      lockSetup: { enabled: false, helperText: 'Setup is already locked.' },
      kickOff: { enabled: true, helperText: 'Setup is locked. Kick off when both managers are ready to start.' },
      completeMatch: { enabled: false, helperText: 'Kick off before completing the match.' }
    };
  }

  if (summary.lobbyState === 'in_match') {
    return {
      stageLabel: 'Match in progress',
      joinAway: { enabled: false, helperText: 'Match is in progress; away assignment is closed.' },
      lockSetup: { enabled: false, helperText: 'Setup is already locked.' },
      kickOff: { enabled: false, helperText: 'Match is already in progress.' },
      completeMatch: { enabled: true, helperText: 'The match is in progress. Complete it to close the authoritative result.' }
    };
  }

  return {
    stageLabel: 'Result closed',
    joinAway: { enabled: false, helperText: 'Result is closed; away assignment is no longer available.' },
    lockSetup: { enabled: false, helperText: 'Result is closed; setup cannot be changed.' },
    kickOff: { enabled: false, helperText: 'Result is already closed.' },
    completeMatch: { enabled: false, helperText: 'Result is already closed and ready for report review.' }
  };
}
