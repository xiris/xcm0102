import type { MatchSide } from '../api/replaySessionRepository';
import type { ReplaySessionLobbySummary } from './replaySessionLobbyStatusViewModel';

export type HeadToHeadPrivateSetupClubId = 'internazionale-2002' | 'milan-2002';
export type HeadToHeadPrivateSetupTacticShellId = 'balanced-442' | 'attacking-4231' | 'compact-451';
export type HeadToHeadPrivateSetupReadinessIntent = 'editing' | 'ready_to_lock';

export type HeadToHeadPrivateSetupDraft = {
  side: MatchSide;
  clubId: HeadToHeadPrivateSetupClubId;
  tacticShellId: HeadToHeadPrivateSetupTacticShellId;
  readinessIntent: HeadToHeadPrivateSetupReadinessIntent;
};

export type HeadToHeadPrivateSetupSelectionStateInput = {
  summary: ReplaySessionLobbySummary | null;
  localSide: MatchSide;
  drafts?: HeadToHeadPrivateSetupDraft[];
};

export type HeadToHeadPrivateSetupSelectionSideCard = {
  side: MatchSide;
  title: string;
  managerLabel: string;
  detailsVisible: boolean;
  publicStatus: string;
  clubLabel: string;
  tacticShellLabel: string;
  readinessIntentLabel: string;
  privacyNote: string;
};

export type HeadToHeadPrivateSetupSelectionStateViewModel = {
  title: string;
  stateLabel: string;
  privacyNotice: string;
  sideCards: HeadToHeadPrivateSetupSelectionSideCard[];
};

const clubLabels: Record<HeadToHeadPrivateSetupClubId, string> = {
  'internazionale-2002': 'Internazionale 2002',
  'milan-2002': 'Milan 2002'
};

const defaultClubBySide: Record<MatchSide, HeadToHeadPrivateSetupClubId> = {
  home: 'internazionale-2002',
  away: 'milan-2002'
};

const tacticShellLabels: Record<HeadToHeadPrivateSetupTacticShellId, string> = {
  'balanced-442': 'Balanced 4-4-2 shell',
  'attacking-4231': 'Attacking 4-2-3-1 shell',
  'compact-451': 'Compact 4-5-1 shell'
};

const sideTitles: Record<MatchSide, string> = {
  home: 'Home setup selection',
  away: 'Away setup selection'
};

export function createHeadToHeadPrivateSetupSelectionState(
  input: HeadToHeadPrivateSetupSelectionStateInput
): HeadToHeadPrivateSetupSelectionStateViewModel | null {
  if (input.summary === null) return null;

  const draftsBySide = new Map<MatchSide, HeadToHeadPrivateSetupDraft>();
  for (const draft of input.drafts ?? []) {
    draftsBySide.set(draft.side, draft);
  }

  return {
    title: 'Private setup selection state',
    stateLabel: formatStateLabel(input.summary.lobbyState),
    privacyNotice: 'Local preview only. Opponent setup details stay hidden until a future lock/reveal contract.',
    sideCards: (['home', 'away'] as const).map((side) => createSelectionSideCard(input.summary!, input.localSide, side, draftsBySide.get(side)))
  };
}

function createSelectionSideCard(
  summary: ReplaySessionLobbySummary,
  localSide: MatchSide,
  side: MatchSide,
  draft: HeadToHeadPrivateSetupDraft | undefined
): HeadToHeadPrivateSetupSelectionSideCard {
  const managerLabel = summary.ownership.sides[side]?.displayName ?? 'Unassigned';
  const isAssigned = summary.ownership.sides[side] !== undefined;
  const isLocalSide = side === localSide;
  const detailsVisible = shouldShowDetails(summary.lobbyState, isLocalSide, isAssigned);

  if (!isAssigned) {
    return {
      side,
      title: sideTitles[side],
      managerLabel,
      detailsVisible: false,
      publicStatus: 'Awaiting manager assignment',
      clubLabel: 'Hidden until assigned',
      tacticShellLabel: 'Hidden until assigned',
      readinessIntentLabel: 'Unavailable',
      privacyNote: 'A manager must join before this private setup space can be represented.'
    };
  }

  if (!detailsVisible) {
    return {
      side,
      title: sideTitles[side],
      managerLabel,
      detailsVisible: false,
      publicStatus: 'Opponent setup hidden',
      clubLabel: 'Hidden until lock',
      tacticShellLabel: 'Hidden until lock',
      readinessIntentLabel: 'Private',
      privacyNote: 'Opponent club, tactic, lineup, bench, and set pieces are not exposed before lock.'
    };
  }

  const effectiveDraft = draft ?? createDefaultDraft(side);
  const isDefaultDraft = draft === undefined;

  return {
    side,
    title: sideTitles[side],
    managerLabel,
    detailsVisible: true,
    publicStatus: createVisibleStatus(summary.lobbyState, isLocalSide, isDefaultDraft, effectiveDraft.readinessIntent),
    clubLabel: clubLabels[effectiveDraft.clubId],
    tacticShellLabel: tacticShellLabels[effectiveDraft.tacticShellId],
    readinessIntentLabel: createReadinessIntentLabel(summary.lobbyState, isDefaultDraft, effectiveDraft.readinessIntent),
    privacyNote: createVisiblePrivacyNote(summary.lobbyState, isLocalSide)
  };
}

function createDefaultDraft(side: MatchSide): HeadToHeadPrivateSetupDraft {
  return {
    side,
    clubId: defaultClubBySide[side],
    tacticShellId: 'balanced-442',
    readinessIntent: 'editing'
  };
}

function shouldShowDetails(state: ReplaySessionLobbySummary['lobbyState'], isLocalSide: boolean, isAssigned: boolean): boolean {
  if (!isAssigned) return false;
  if (isLocalSide) return true;
  return state !== 'setup';
}

function createVisibleStatus(
  state: ReplaySessionLobbySummary['lobbyState'],
  isLocalSide: boolean,
  isDefaultDraft: boolean,
  intent: HeadToHeadPrivateSetupReadinessIntent
): string {
  if (state === 'locked') return 'Setup locked preview';
  if (state === 'in_match') return 'Match setup archived for live match';
  if (state === 'complete') return 'Setup archived for report';
  if (isDefaultDraft) return isLocalSide ? 'Local setup not submitted' : 'Opponent setup preview placeholder';
  if (isLocalSide && intent === 'ready_to_lock') return 'Local setup draft ready';
  if (isLocalSide) return 'Local setup draft in progress';
  return 'Opponent setup preview placeholder';
}

function createReadinessIntentLabel(
  state: ReplaySessionLobbySummary['lobbyState'],
  isDefaultDraft: boolean,
  intent: HeadToHeadPrivateSetupReadinessIntent
): string {
  if (state === 'locked') return 'Locked preview';
  if (state === 'in_match') return 'In-match historical preview';
  if (state === 'complete') return 'Completed historical preview';
  if (isDefaultDraft) return 'Not submitted';
  if (intent === 'ready_to_lock') return 'Ready to lock';
  return 'Still editing';
}

function createVisiblePrivacyNote(state: ReplaySessionLobbySummary['lobbyState'], isLocalSide: boolean): string {
  if (state !== 'setup') return 'Preview labels only; authoritative hidden setup persistence remains future work.';
  if (isLocalSide) return 'Visible only to the local manager in this preview contract.';
  return 'Post-lock preview label only; real simultaneous reveal remains future work.';
}

function formatStateLabel(state: ReplaySessionLobbySummary['lobbyState']): string {
  if (state === 'setup') return 'Setup open';
  if (state === 'locked') return 'Setup locked';
  if (state === 'in_match') return 'Match in progress';
  return 'Complete';
}
