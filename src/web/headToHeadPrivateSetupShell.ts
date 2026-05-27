import type { MatchSide } from '../api/replaySessionRepository';
import { createHeadToHeadPrivateSetupSelectionState, type HeadToHeadPrivateSetupDraft, type HeadToHeadPrivateSetupSelectionSideCard } from './headToHeadPrivateSetupSelectionState';
import type { ReplaySessionLobbySummary } from './replaySessionLobbyStatusViewModel';

export type HeadToHeadPrivateSetupShellSideCard = {
  side: MatchSide;
  title: string;
  managerLabel: string;
  clubLabel: string;
  privacyLabel: string;
  readinessLabel: string;
  selectionStatusLabel: string;
  selectionClubLabel: string;
  selectionTacticLabel: string;
  selectionReadinessLabel: string;
  selectionPrivacyNote: string;
};

export type HeadToHeadPrivateSetupShellOptions = {
  localSide?: MatchSide;
  drafts?: HeadToHeadPrivateSetupDraft[];
};

export type HeadToHeadPrivateSetupShellViewModel = {
  title: string;
  stateLabel: string;
  helperText: string;
  sideCards: HeadToHeadPrivateSetupShellSideCard[];
  notes: string[];
};

const fixtureClubs: Record<MatchSide, string> = {
  home: 'Internazionale 2002',
  away: 'Milan 2002'
};

const sideTitles: Record<MatchSide, string> = {
  home: 'Home private setup',
  away: 'Away private setup'
};

export function createHeadToHeadPrivateSetupShell(
  summary: ReplaySessionLobbySummary | null,
  options: HeadToHeadPrivateSetupShellOptions = {}
): HeadToHeadPrivateSetupShellViewModel | null {
  if (summary === null) return null;

  const selectionState = createHeadToHeadPrivateSetupSelectionState({
    summary,
    localSide: options.localSide ?? 'home',
    drafts: options.drafts ?? []
  });

  return {
    title: 'Private setup preview',
    stateLabel: formatStateLabel(summary.lobbyState),
    helperText: 'Preview-only setup spaces for future club, lineup, and tactic selection. No hidden choices are stored yet.',
    sideCards: (['home', 'away'] as const).map((side) => createSideCard(summary, side, selectionState?.sideCards.find((card) => card.side === side))),
    notes: [
      'The shell is derived from the public lobby summary only; no private tactic, lineup, bench, or set-piece payload exists yet.',
      'Setup lock, kickoff, and completion remain server-owned transitions.'
    ]
  };
}

function createSideCard(
  summary: ReplaySessionLobbySummary,
  side: MatchSide,
  selectionCard: HeadToHeadPrivateSetupSelectionSideCard | undefined
): HeadToHeadPrivateSetupShellSideCard {
  const owner = summary.ownership.sides[side];
  const stateCopy = createStateCopy(summary, side, owner !== undefined);

  return {
    side,
    title: sideTitles[side],
    managerLabel: owner?.displayName ?? 'Unassigned',
    clubLabel: fixtureClubs[side],
    privacyLabel: stateCopy.privacyLabel,
    readinessLabel: stateCopy.readinessLabel,
    selectionStatusLabel: selectionCard?.publicStatus ?? 'Selection unavailable',
    selectionClubLabel: selectionCard?.clubLabel ?? 'Hidden until assigned',
    selectionTacticLabel: selectionCard?.tacticShellLabel ?? 'Hidden until assigned',
    selectionReadinessLabel: selectionCard?.readinessIntentLabel ?? 'Unavailable',
    selectionPrivacyNote: selectionCard?.privacyNote ?? 'A manager must join before this private setup space can be represented.'
  };
}

function createStateCopy(summary: ReplaySessionLobbySummary, side: MatchSide, isAssigned: boolean): { privacyLabel: string; readinessLabel: string } {
  if (summary.lobbyState === 'setup') {
    if (!isAssigned) {
      return side === 'away'
        ? {
            privacyLabel: 'Awaiting away manager',
            readinessLabel: 'Invite an away manager before their private setup shell can be represented.'
          }
        : {
            privacyLabel: 'Awaiting home manager',
            readinessLabel: 'Assign a home manager before private setup can be represented.'
          };
    }

    const hasAway = summary.ownership.sides.away !== undefined;
    return {
      privacyLabel: 'Private setup shell ready',
      readinessLabel: hasAway
        ? 'Manager assigned; future lineup and tactic choices stay private until lock/reveal.'
        : 'Waiting for away manager before setup can be locked.'
    };
  }

  if (summary.lobbyState === 'locked') {
    return {
      privacyLabel: 'Setup locked',
      readinessLabel: 'Pre-match setup is frozen for kickoff; future hidden choices would reveal together.'
    };
  }

  if (summary.lobbyState === 'in_match') {
    return {
      privacyLabel: 'Match in progress',
      readinessLabel: 'Pre-match setup is closed; live tactical decisions remain a later slice.'
    };
  }

  return {
    privacyLabel: 'Setup archived',
    readinessLabel: 'Setup is read-only historical context for the completed result.'
  };
}

function formatStateLabel(state: ReplaySessionLobbySummary['lobbyState']): string {
  if (state === 'setup') return 'Setup open';
  if (state === 'locked') return 'Setup locked';
  if (state === 'in_match') return 'Match in progress';
  return 'Complete';
}
