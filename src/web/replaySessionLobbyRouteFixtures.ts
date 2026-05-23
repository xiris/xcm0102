import type { ReplaySessionLobbySummary } from './replaySessionLobbyStatusViewModel';

export type ReplaySessionLobbyRouteFixtures = {
  setup: ReplaySessionLobbySummary;
  locked: ReplaySessionLobbySummary;
  inMatch: ReplaySessionLobbySummary;
  complete: ReplaySessionLobbySummary;
};

const assignedSides = {
  home: { managerId: 'mgr-home', displayName: 'Home Manager' },
  away: { managerId: 'mgr-away', displayName: 'Away Manager' }
};

export function createReplaySessionLobbyRouteFixtures(): ReplaySessionLobbyRouteFixtures {
  return {
    setup: {
      sessionId: 'rs-fixture-setup',
      seed: 71,
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'setup',
        sides: assignedSides
      },
      lobbyState: 'setup',
      commandCounts: { home: 0, away: 0 },
      visibleEventCount: 0
    },
    locked: {
      sessionId: 'rs-fixture-locked',
      seed: 71,
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'locked',
        sides: assignedSides
      },
      lobbyState: 'locked',
      commandCounts: { home: 0, away: 0 },
      visibleEventCount: 0
    },
    inMatch: {
      sessionId: 'rs-fixture-in-match',
      seed: 71,
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'in_match',
        sides: assignedSides
      },
      lobbyState: 'in_match',
      commandCounts: { home: 2, away: 1 },
      visibleEventCount: 5,
      latestAuthoritativeSignature: 'fixture|in-match|signature'
    },
    complete: {
      sessionId: 'rs-fixture-complete',
      seed: 71,
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'complete',
        sides: assignedSides
      },
      lobbyState: 'complete',
      commandCounts: { home: 2, away: 1 },
      visibleEventCount: 8,
      latestAuthoritativeSignature: 'fixture|complete|signature'
    }
  };
}
