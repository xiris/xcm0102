import { describe, expect, it } from 'vitest';
import { createHeadToHeadLobbyReadModel, createHeadToHeadLobbyRequest } from '../../src/web/headToHeadLobbyModel';
import type { ReplaySessionLobbySummary } from '../../src/web/replaySessionLobbyStatusViewModel';

describe('head-to-head lobby model', () => {
  it('creates setup lobby requests for a named home manager with the away side unassigned', () => {
    const request = createHeadToHeadLobbyRequest({ homeManagerName: 'Chris Silva', seed: 311 });

    expect(request.seed).toBe(311);
    expect(request.currentMinute).toBe(0);
    expect(request.ownership).toEqual({
      mode: 'head_to_head',
      lobbyState: 'setup',
      sides: {
        home: { managerId: 'home-chris-silva', displayName: 'Chris Silva' }
      }
    });
    expect(Object.keys(request.homeAssignments)).toEqual(['gk', 'dl', 'dc1', 'dc2', 'dr', 'dm', 'ml', 'mc', 'mr', 'fc1', 'fc2']);
    expect(Object.keys(request.awayAssignments)).toEqual(['gk', 'dl', 'dc1', 'dc2', 'dr', 'ml', 'mc1', 'mc2', 'mr', 'fc1', 'fc2']);
  });

  it('formats read-only join copy while the away manager is still missing', () => {
    const summary: ReplaySessionLobbySummary = {
      sessionId: 'rs-000123',
      seed: 311,
      lobbyState: 'setup',
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'setup',
        sides: {
          home: { managerId: 'home-chris-silva', displayName: 'Chris Silva' }
        }
      },
      commandCounts: { home: 0, away: 0 },
      visibleEventCount: 0
    };

    expect(createHeadToHeadLobbyReadModel(summary)).toEqual({
      title: 'Head-to-head lobby',
      inviteLabel: 'Invite code: rs-000123',
      homeManagerLabel: 'Home manager: Chris Silva',
      awayManagerLabel: 'Away manager: waiting for opponent',
      readinessLabel: 'Waiting for an away manager before setup can lock.',
      readOnlyNotice: 'This entry route can create, read, join, and lock setup. Kickoff and completion remain isolated follow-up actions.'
    });
  });
});
