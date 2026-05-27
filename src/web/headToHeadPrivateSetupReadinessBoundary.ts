import type { MatchSide } from '../api/replaySessionRepository';
import type { HeadToHeadPrivateSetupDraft, HeadToHeadPrivateSetupReadinessIntent } from './headToHeadPrivateSetupSelectionState';
import type { ReplaySessionLobbySummary } from './replaySessionLobbyStatusViewModel';

export type HeadToHeadPrivateSetupReadinessBoundaryInput = {
  summary: ReplaySessionLobbySummary | null;
  localSide: MatchSide;
  drafts?: HeadToHeadPrivateSetupDraft[];
  lockAvailable: boolean;
};

export type HeadToHeadPrivateSetupReadinessBoundaryViewModel = {
  title: string;
  side: MatchSide;
  managerLabel: string;
  draftReadinessLabel: string;
  serverLockLabel: string;
  helperText: string;
  advisoryNotice: string;
  persistenceNotice: string;
};

export function createHeadToHeadPrivateSetupReadinessBoundary(
  input: HeadToHeadPrivateSetupReadinessBoundaryInput
): HeadToHeadPrivateSetupReadinessBoundaryViewModel | null {
  if (input.summary === null) return null;

  const manager = input.summary.ownership.sides[input.localSide];
  const draft = input.drafts?.find((candidate) => candidate.side === input.localSide);
  const draftReadinessLabel = createDraftReadinessLabel(input.summary, manager !== undefined, draft?.readinessIntent ?? 'editing');

  return {
    title: 'Setup readiness boundary',
    side: input.localSide,
    managerLabel: manager?.displayName ?? 'Unassigned',
    draftReadinessLabel,
    serverLockLabel: createServerLockLabel(input.summary, input.lockAvailable),
    helperText: createHelperText(input.summary, manager !== undefined, draft?.readinessIntent ?? 'editing'),
    advisoryNotice: 'Readiness intent is saved with the private draft but never gates server-owned setup lock.',
    persistenceNotice: 'Private setup readiness can be submitted as a hidden side-scoped server draft; public summaries stay redacted until setup lock.'
  };
}

function createDraftReadinessLabel(
  summary: ReplaySessionLobbySummary,
  isAssigned: boolean,
  intent: HeadToHeadPrivateSetupReadinessIntent
): string {
  if (!isAssigned) return 'Unavailable';
  if (summary.lobbyState !== 'setup') return 'Archived preview';
  if (intent === 'ready_to_lock') return 'Ready to lock';
  return 'Still editing';
}

function createServerLockLabel(summary: ReplaySessionLobbySummary, lockAvailable: boolean): string {
  if (summary.lobbyState !== 'setup') return `Setup lock is no longer editable because the server state is ${summary.lobbyState}.`;
  if (lockAvailable) return 'Server lock remains available once both managers are assigned.';
  return 'Server lock is unavailable from the public lobby summary.';
}

function createHelperText(
  summary: ReplaySessionLobbySummary,
  isAssigned: boolean,
  intent: HeadToHeadPrivateSetupReadinessIntent
): string {
  if (!isAssigned) return 'Join this side before saving setup readiness.';
  if (summary.lobbyState !== 'setup') return 'Saved readiness is historical preview copy after setup is locked.';
  if (intent === 'ready_to_lock') return 'Ready means this private draft can be saved before the server-owned setup lock.';
  return 'Still editing is private setup state only; it does not disable the product Lock setup control.';
}
