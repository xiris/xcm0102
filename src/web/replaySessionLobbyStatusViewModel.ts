import type { MatchSide, ReplaySessionLobbyState, ReplaySessionOwnership } from '../api/replaySessionRepository';

export type ReplaySessionLobbySummary = {
  sessionId: string;
  seed: number;
  ownership: ReplaySessionOwnership;
  lobbyState: ReplaySessionLobbyState;
  commandCounts: Record<MatchSide, number>;
  visibleEventCount: number;
  latestAuthoritativeSignature?: string;
};

export type ReplaySessionLobbyStatusRow = {
  label: string;
  value: string;
};

export type ReplaySessionLobbyStatusViewModel = {
  title: string;
  eyebrow: string;
  stateLabel: string;
  stateTone: 'setup' | 'waiting' | 'active' | 'complete';
  rows: ReplaySessionLobbyStatusRow[];
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
    notes: [
      state.note,
      'This panel is read-only. Lobby transitions still happen through tested server commands.'
    ]
  };
}

function formatMode(mode: ReplaySessionOwnership['mode']): string {
  return mode === 'head_to_head' ? 'Head-to-head' : 'Single manager';
}
