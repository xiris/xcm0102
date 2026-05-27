import type { ReplaySessionLobbySummary } from './replaySessionLobbyStatusViewModel';

export type HeadToHeadManagerCockpitLayoutRow = {
  label: 'Phase' | 'Invite' | 'Home manager' | 'Away manager' | 'Next action' | 'Private setup' | 'Status feed';
  value: string;
};

export type HeadToHeadManagerCockpitStation = {
  id: 'lobby-desk' | 'team-setup' | 'match-controls' | 'report-room';
  label: 'Lobby desk' | 'Team setup' | 'Match controls' | 'Report room';
  helperText: string;
};

export type HeadToHeadManagerCockpitLayout = {
  railTitle: 'Session rail';
  railHelper: string;
  rows: HeadToHeadManagerCockpitLayoutRow[];
  stations: HeadToHeadManagerCockpitStation[];
};

export type HeadToHeadManagerCockpitLayoutInput = {
  summary: ReplaySessionLobbySummary | null;
  stageLabel: string;
  statusCopy: string;
  errorCopy: string | null;
};

export function createHeadToHeadManagerCockpitLayout({
  summary,
  stageLabel,
  statusCopy,
  errorCopy
}: HeadToHeadManagerCockpitLayoutInput): HeadToHeadManagerCockpitLayout {
  const homeManager = summary?.ownership.sides.home?.displayName ?? 'Unassigned';
  const awayManager = summary?.ownership.sides.away?.displayName ?? 'Unassigned';

  return {
    railTitle: 'Session rail',
    railHelper: 'Current lobby identity, manager assignment, phase, and next action.',
    rows: [
      { label: 'Phase', value: stageLabel },
      { label: 'Invite', value: summary?.sessionId ?? 'No invite code yet' },
      { label: 'Home manager', value: homeManager },
      { label: 'Away manager', value: awayManager },
      { label: 'Next action', value: formatNextAction(summary, stageLabel) },
      { label: 'Private setup', value: formatPrivateSetupState(summary) },
      { label: 'Status feed', value: errorCopy ?? statusCopy }
    ],
    stations: [
      { id: 'lobby-desk', label: 'Lobby desk', helperText: 'Create, load, or join the match room.' },
      { id: 'team-setup', label: 'Team setup', helperText: 'Save hidden club and tactic setup drafts.' },
      { id: 'match-controls', label: 'Match controls', helperText: 'Lock setup, kick off, and close the result.' },
      { id: 'report-room', label: 'Report room', helperText: 'Review the authoritative post-match report.' }
    ]
  };
}

function formatNextAction(summary: ReplaySessionLobbySummary | null, stageLabel: string): string {
  if (summary === null) return 'Create or load a lobby';
  if (summary.lobbyState === 'complete') return 'Review report';
  if (summary.lobbyState === 'in_match') return 'Complete match';
  if (summary.lobbyState === 'locked') return 'Kick off match';
  if (summary.ownership.sides.away === undefined) return 'Invite away manager';
  if (stageLabel === 'Ready to lock setup') return 'Lock setup';
  return 'Prepare private setup';
}

function formatPrivateSetupState(summary: ReplaySessionLobbySummary | null): string {
  if (summary === null) return 'Hidden setup drafts appear after a setup lobby is loaded.';
  if (summary.lobbyState === 'setup') return 'Hidden setup drafts unlock after both managers save and setup locks.';
  if (summary.lobbyState === 'locked') return 'Setup drafts are revealed from the server-owned locked summary.';
  if (summary.lobbyState === 'in_match') return 'Setup is locked and carried into the active match.';
  return 'Setup choices are historical report context.';
}
