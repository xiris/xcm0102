import type { MatchSide } from '../api/replaySessionRepository';
import type { ReplaySessionLobbySummary } from './replaySessionLobbyStatusViewModel';

export type HeadToHeadPrivateSetupPerspectiveSwitchInput = {
  summary: ReplaySessionLobbySummary | null;
  localSide: MatchSide;
};

export type HeadToHeadPrivateSetupPerspectiveOption = {
  side: MatchSide;
  label: string;
  managerLabel: string;
  assignmentLabel: string;
  selected: boolean;
};

export type HeadToHeadPrivateSetupPerspectiveSwitchViewModel = {
  title: string;
  selectedSide: MatchSide;
  helperText: string;
  privacyNotice: string;
  options: HeadToHeadPrivateSetupPerspectiveOption[];
};

const sideLabels: Record<MatchSide, string> = {
  home: 'Home perspective',
  away: 'Away perspective'
};

export function createHeadToHeadPrivateSetupPerspectiveSwitch(
  input: HeadToHeadPrivateSetupPerspectiveSwitchInput
): HeadToHeadPrivateSetupPerspectiveSwitchViewModel | null {
  if (input.summary === null) return null;

  return {
    title: 'Local private setup perspective',
    selectedSide: input.localSide,
    helperText: 'Perspective only changes this browser preview.',
    privacyNotice: 'No account or permission claim is made by this switch.',
    options: (['home', 'away'] as const).map((side) => {
      const owner = input.summary!.ownership.sides[side];
      return {
        side,
        label: sideLabels[side],
        managerLabel: owner?.displayName ?? 'Unassigned',
        assignmentLabel: owner ? 'Assigned' : 'Unassigned',
        selected: side === input.localSide
      };
    })
  };
}
