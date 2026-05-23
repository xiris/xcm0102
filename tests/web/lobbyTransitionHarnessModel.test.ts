import { describe, expect, it } from 'vitest';
import { createLobbyTransitionHarnessSetupRequest } from '../../src/web/lobbyTransitionHarnessModel';

describe('lobby transition harness model', () => {
  it('builds a head-to-head setup replay-session request from default tactical state', () => {
    const request = createLobbyTransitionHarnessSetupRequest(211);

    expect(request.seed).toBe(211);
    expect(request.currentMinute).toBe(0);
    expect(request.homeFormation).toBe('4-1-3-2');
    expect(request.awayFormation).toBe('4-4-2');
    expect(Object.keys(request.homeAssignments)).toEqual(['gk', 'dl', 'dc1', 'dc2', 'dr', 'dm', 'ml', 'mc', 'mr', 'fc1', 'fc2']);
    expect(Object.keys(request.awayAssignments)).toEqual(['gk', 'dl', 'dc1', 'dc2', 'dr', 'ml', 'mc1', 'mc2', 'mr', 'fc1', 'fc2']);
    expect(request.ownership).toEqual({
      mode: 'head_to_head',
      lobbyState: 'setup',
      sides: {
        home: { managerId: 'harness-home', displayName: 'Harness Home Manager' },
        away: { managerId: 'harness-away', displayName: 'Harness Away Manager' }
      }
    });
  });
});
