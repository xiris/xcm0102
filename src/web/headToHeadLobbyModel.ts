import { createAssignmentState } from './assignmentState';
import type { WebReplaySessionCreateRequest } from './replaySessionClient';
import type { ReplaySessionLobbySummary } from './replaySessionLobbyStatusViewModel';
import { defaultTacticalState } from './tacticalPayload';

export type HeadToHeadLobbyRequestInput = {
  homeManagerName: string;
  seed?: number;
};

export type HeadToHeadLobbyReadModel = {
  title: string;
  inviteLabel: string;
  homeManagerLabel: string;
  awayManagerLabel: string;
  readinessLabel: string;
  readOnlyNotice: string;
};

export function createHeadToHeadLobbyRequest({ homeManagerName, seed = 311 }: HeadToHeadLobbyRequestInput): WebReplaySessionCreateRequest {
  const tacticalState = defaultTacticalState();
  const displayName = normalizeDisplayName(homeManagerName);
  return {
    ...tacticalState,
    seed,
    currentMinute: 0,
    homeAssignments: createAssignmentState('home', tacticalState.homeFormation).assignments,
    awayAssignments: createAssignmentState('away', tacticalState.awayFormation).assignments,
    ownership: {
      mode: 'head_to_head',
      lobbyState: 'setup',
      sides: {
        home: { managerId: `home-${slugify(displayName)}`, displayName }
      }
    }
  };
}

export function createHeadToHeadLobbyReadModel(summary: ReplaySessionLobbySummary): HeadToHeadLobbyReadModel {
  const homeManager = summary.ownership.sides.home?.displayName ?? 'waiting for home manager';
  const awayManager = summary.ownership.sides.away?.displayName ?? 'waiting for opponent';
  const hasHome = summary.ownership.sides.home !== undefined;
  const hasAway = summary.ownership.sides.away !== undefined;
  return {
    title: 'Head-to-head lobby',
    inviteLabel: `Invite code: ${summary.sessionId}`,
    homeManagerLabel: `Home manager: ${homeManager}`,
    awayManagerLabel: `Away manager: ${awayManager}`,
    readinessLabel: formatReadiness(summary, hasHome, hasAway),
    readOnlyNotice: 'This entry route can create, read, join, and lock setup. Kickoff and completion remain isolated follow-up actions.'
  };
}

function normalizeDisplayName(value: string): string {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized : 'Home Manager';
}

function slugify(value: string): string {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug.length > 0 ? slug : 'manager';
}

function formatReadiness(summary: ReplaySessionLobbySummary, hasHome: boolean, hasAway: boolean): string {
  if (summary.lobbyState !== 'setup') return `Lobby state: ${summary.lobbyState}.`;
  if (!hasHome) return 'Waiting for a home manager before setup can lock.';
  if (!hasAway) return 'Waiting for an away manager before setup can lock.';
  return 'Both managers are present; setup can lock through the guarded transition flow.';
}
