import type { MatchReport, MatchResult, TeamMatchStats } from '../simulation/domain';
import type { MatchSide, ReplaySessionLobbyState, ReplaySessionOwnership } from '../api/replaySessionRepository';

export type ReplaySessionLobbySummary = {
  sessionId: string;
  seed: number;
  ownership: ReplaySessionOwnership;
  lobbyState: ReplaySessionLobbyState;
  commandCounts: Record<MatchSide, number>;
  visibleEventCount: number;
  latestAuthoritativeSignature?: string;
  resultPreview?: {
    score: MatchResult['score'];
    teams: Record<MatchSide, string>;
    stats: Record<MatchSide, TeamMatchStats>;
    eventCount: number;
    replay: MatchReport['replay'];
  };
};

export type ReplaySessionLobbyStatusRow = {
  label: string;
  value: string;
};

export type ReplaySessionLobbySideCard = {
  side: MatchSide;
  title: string;
  managerLabel: string;
  assignmentLabel: 'Assigned' | 'Needs manager';
  commandCountLabel: string;
  readinessLabel: string;
  readinessTone: 'setup' | 'waiting' | 'active' | 'complete' | 'unassigned';
};

export type ReplaySessionLobbyAction = {
  id: 'lock_setup' | 'kickoff' | 'complete_match';
  label: string;
  targetLobbyState: Extract<ReplaySessionLobbyState, 'locked' | 'in_match' | 'complete'>;
  available: boolean;
  disabledReason?: string;
};

export type ReplaySessionLobbyActionAvailability = {
  headline: string;
  helperText: string;
  actions: ReplaySessionLobbyAction[];
};

export type ReplaySessionLobbyStatusViewModel = {
  title: string;
  eyebrow: string;
  stateLabel: string;
  stateTone: 'setup' | 'waiting' | 'active' | 'complete';
  rows: ReplaySessionLobbyStatusRow[];
  sideCards: ReplaySessionLobbySideCard[];
  actionAvailability: ReplaySessionLobbyActionAvailability;
  notes: string[];
};

const lobbyCopy: Record<ReplaySessionLobbyState, { label: string; tone: ReplaySessionLobbyStatusViewModel['stateTone']; note: string }> = {
  setup: {
    label: 'Setup open',
    tone: 'setup',
    note: 'Managers can still choose clubs, tactics, and lineups before locking setup.'
  },
  locked: {
    label: 'Locked for kickoff',
    tone: 'waiting',
    note: 'Pre-match setup has been locked; kickoff is waiting on the server-owned transition.'
  },
  in_match: {
    label: 'In match',
    tone: 'active',
    note: 'Match replay is active; in-match manager commands may still be recorded.'
  },
  complete: {
    label: 'Complete',
    tone: 'complete',
    note: 'The authoritative result is complete; late manager commands are rejected by the server.'
  }
};

export function createReplaySessionLobbyStatusViewModel(summary: ReplaySessionLobbySummary): ReplaySessionLobbyStatusViewModel {
  const state = lobbyCopy[summary.lobbyState];
  const rows: ReplaySessionLobbyStatusRow[] = [
    { label: 'Session', value: summary.sessionId },
    { label: 'Seed', value: String(summary.seed) },
    { label: 'Mode', value: formatMode(summary.ownership.mode) },
    { label: 'Home manager', value: summary.ownership.sides.home?.displayName ?? 'Unassigned' },
    { label: 'Away manager', value: summary.ownership.sides.away?.displayName ?? 'Unassigned' },
    { label: 'Command logs', value: `Home ${summary.commandCounts.home} · Away ${summary.commandCounts.away}` },
    { label: 'Visible events', value: String(summary.visibleEventCount) }
  ];

  if (summary.latestAuthoritativeSignature !== undefined) {
    rows.push({ label: 'Latest signature', value: summary.latestAuthoritativeSignature });
  }

  return {
    title: 'Replay session lobby',
    eyebrow: 'Read-only status',
    stateLabel: state.label,
    stateTone: state.tone,
    rows,
    sideCards: createSideCards(summary),
    actionAvailability: createActionAvailability(summary),
    notes: [
      state.note,
      'This panel is read-only. Lobby transitions still happen through tested server commands.'
    ]
  };
}

function createSideCards(summary: ReplaySessionLobbySummary): ReplaySessionLobbySideCard[] {
  const sides: MatchSide[] = ['home', 'away'];
  return sides.map((side) => createSideCard(summary, side));
}

function createSideCard(summary: ReplaySessionLobbySummary, side: MatchSide): ReplaySessionLobbySideCard {
  const owner = summary.ownership.sides[side];
  const isAssigned = owner !== undefined;
  const readiness = formatSideReadiness(summary, side, isAssigned);

  return {
    side,
    title: `${capitalize(side)} side`,
    managerLabel: owner?.displayName ?? 'Unassigned',
    assignmentLabel: isAssigned ? 'Assigned' : 'Needs manager',
    commandCountLabel: formatCommandCount(summary.commandCounts[side]),
    readinessLabel: readiness.label,
    readinessTone: readiness.tone
  };
}

function createActionAvailability(summary: ReplaySessionLobbySummary): ReplaySessionLobbyActionAvailability {
  const requiredManagersAssigned = hasRequiredManagers(summary);

  if (summary.lobbyState === 'setup') {
    if (!requiredManagersAssigned) {
      return {
        headline: 'Future lobby actions',
        helperText: summary.ownership.mode === 'head_to_head'
          ? 'Manager assignment is incomplete. Future setup controls should stay disabled until both sides are assigned.'
          : 'Home manager assignment is incomplete. Future setup controls should stay disabled until the home side is assigned.',
        actions: [{
          id: 'lock_setup',
          label: 'Lock setup',
          targetLobbyState: 'locked',
          available: false,
          disabledReason: summary.ownership.mode === 'head_to_head'
            ? 'Assign both managers before locking setup.'
            : 'Assign the home manager before locking setup.'
        }]
      };
    }

    return {
      headline: 'Future lobby actions',
      helperText: summary.ownership.mode === 'single_manager'
        ? 'Single-manager setup can lock once the home manager is assigned, though Match Lab sessions usually skip setup/lock and begin in match.'
        : 'Both managers are assigned. A future Lock setup control can request the server-owned locked transition.',
      actions: [{
        id: 'lock_setup',
        label: 'Lock setup',
        targetLobbyState: 'locked',
        available: true
      }]
    };
  }

  if (summary.lobbyState === 'locked') {
    return {
      headline: 'Future lobby actions',
      helperText: 'Setup is locked. A future Kick off match control can request the server-owned in-match transition.',
      actions: [{
        id: 'kickoff',
        label: 'Kick off match',
        targetLobbyState: 'in_match',
        available: requiredManagersAssigned,
        ...(requiredManagersAssigned ? {} : { disabledReason: 'Assign required managers before kickoff.' })
      }]
    };
  }

  if (summary.lobbyState === 'in_match') {
    return {
      headline: 'Future lobby actions',
      helperText: summary.ownership.mode === 'single_manager'
        ? 'Single-manager Match Lab sessions skip setup/lock controls and begin in match; only completion remains a future transition.'
        : 'The match is active. A future Complete match control can close the authoritative lobby state.',
      actions: [{
        id: 'complete_match',
        label: 'Complete match',
        targetLobbyState: 'complete',
        available: true
      }]
    };
  }

  return {
    headline: 'Future lobby actions',
    helperText: 'The result is complete. No further lobby transitions are available.',
    actions: []
  };
}

function hasRequiredManagers(summary: ReplaySessionLobbySummary): boolean {
  const hasHome = summary.ownership.sides.home !== undefined;
  const hasAway = summary.ownership.sides.away !== undefined;
  return summary.ownership.mode === 'head_to_head' ? hasHome && hasAway : hasHome;
}

function formatSideReadiness(summary: ReplaySessionLobbySummary, side: MatchSide, isAssigned: boolean): { label: string; tone: ReplaySessionLobbySideCard['readinessTone'] } {
  if (!isAssigned) {
    if (summary.ownership.mode === 'single_manager' && side === 'away') {
      return { label: 'AI/default side for this single-manager session', tone: 'unassigned' };
    }
    return { label: 'Waiting for manager assignment', tone: 'unassigned' };
  }

  if (summary.lobbyState === 'setup') return { label: 'Setup still open', tone: 'setup' };
  if (summary.lobbyState === 'locked') return { label: 'Locked for kickoff', tone: 'waiting' };
  if (summary.lobbyState === 'complete') return { label: 'Result complete', tone: 'complete' };
  return { label: 'In-match commands available', tone: 'active' };
}

function formatCommandCount(count: number): string {
  return `${count} ${count === 1 ? 'command' : 'commands'}`;
}

function capitalize(value: MatchSide): string {
  return value === 'home' ? 'Home' : 'Away';
}

function formatMode(mode: ReplaySessionOwnership['mode']): string {
  return mode === 'head_to_head' ? 'Head-to-head' : 'Single manager';
}
