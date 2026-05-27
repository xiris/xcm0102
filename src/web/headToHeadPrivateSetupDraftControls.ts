import type { MatchSide } from '../api/replaySessionRepository';
import type {
  HeadToHeadPrivateSetupClubId,
  HeadToHeadPrivateSetupDraft,
  HeadToHeadPrivateSetupReadinessIntent,
  HeadToHeadPrivateSetupTacticShellId
} from './headToHeadPrivateSetupSelectionState';
import type { ReplaySessionLobbySummary } from './replaySessionLobbyStatusViewModel';

export type HeadToHeadPrivateSetupDraftOption<T extends string> = {
  id: T;
  label: string;
};

export type HeadToHeadPrivateSetupDraftControlsInput = {
  summary: ReplaySessionLobbySummary | null;
  localSide: MatchSide;
  drafts?: HeadToHeadPrivateSetupDraft[];
};

export type HeadToHeadPrivateSetupDraftControlChange = Partial<Pick<HeadToHeadPrivateSetupDraft, 'clubId' | 'tacticShellId' | 'readinessIntent'>>;

export type HeadToHeadPrivateSetupDraftControlsViewModel = {
  title: string;
  side: MatchSide;
  managerLabel: string;
  enabled: boolean;
  disabledReason: string | null;
  helperText: string;
  persistenceNotice: string;
  currentDraft: HeadToHeadPrivateSetupDraft;
  clubOptions: HeadToHeadPrivateSetupDraftOption<HeadToHeadPrivateSetupClubId>[];
  tacticShellOptions: HeadToHeadPrivateSetupDraftOption<HeadToHeadPrivateSetupTacticShellId>[];
  readinessOptions: HeadToHeadPrivateSetupDraftOption<HeadToHeadPrivateSetupReadinessIntent>[];
};

const clubOptions: HeadToHeadPrivateSetupDraftOption<HeadToHeadPrivateSetupClubId>[] = [
  { id: 'internazionale-2002', label: 'Internazionale 2002' },
  { id: 'milan-2002', label: 'Milan 2002' }
];

const tacticShellOptions: HeadToHeadPrivateSetupDraftOption<HeadToHeadPrivateSetupTacticShellId>[] = [
  { id: 'balanced-442', label: 'Balanced 4-4-2 shell' },
  { id: 'attacking-4231', label: 'Attacking 4-2-3-1 shell' },
  { id: 'compact-451', label: 'Compact 4-5-1 shell' }
];

const readinessOptions: HeadToHeadPrivateSetupDraftOption<HeadToHeadPrivateSetupReadinessIntent>[] = [
  { id: 'editing', label: 'Still editing' },
  { id: 'ready_to_lock', label: 'Ready to lock' }
];

const defaultClubBySide: Record<MatchSide, HeadToHeadPrivateSetupClubId> = {
  home: 'internazionale-2002',
  away: 'milan-2002'
};

export function createHeadToHeadPrivateSetupDraftControls(
  input: HeadToHeadPrivateSetupDraftControlsInput
): HeadToHeadPrivateSetupDraftControlsViewModel | null {
  if (input.summary === null) return null;

  const manager = input.summary.ownership.sides[input.localSide];
  const currentDraft = input.drafts?.find((draft) => draft.side === input.localSide) ?? createDefaultDraft(input.localSide);
  const disabledReason = createDisabledReason(input.summary, manager !== undefined);

  return {
    title: 'Local private setup draft controls',
    side: input.localSide,
    managerLabel: manager?.displayName ?? 'Unassigned',
    enabled: disabledReason === null,
    disabledReason,
    helperText: 'Local browser draft only. Adjust sample setup labels before lock; nothing is submitted to the server.',
    persistenceNotice: 'Not submitted to the server. Refreshing or loading another lobby can discard this draft.',
    currentDraft,
    clubOptions,
    tacticShellOptions,
    readinessOptions
  };
}

export function applyHeadToHeadPrivateSetupDraftControlChange(
  draft: HeadToHeadPrivateSetupDraft,
  change: HeadToHeadPrivateSetupDraftControlChange
): HeadToHeadPrivateSetupDraft {
  return {
    ...draft,
    ...change,
    side: draft.side
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

function createDisabledReason(summary: ReplaySessionLobbySummary, isAssigned: boolean): string | null {
  if (!isAssigned) return 'Join this side before editing a local private setup draft.';
  if (summary.lobbyState === 'setup') return null;
  if (summary.lobbyState === 'locked') return 'Setup is locked; local draft controls are read-only history.';
  if (summary.lobbyState === 'in_match') return 'Match is in progress; local setup draft controls are read-only history.';
  return 'Result is complete; local setup draft controls are archived.';
}
