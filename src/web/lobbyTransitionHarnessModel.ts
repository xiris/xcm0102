import { createAssignmentState } from './assignmentState';
import type { WebReplaySessionCreateRequest } from './replaySessionClient';
import { defaultTacticalState } from './tacticalPayload';

export function createLobbyTransitionHarnessSetupRequest(seed = 211): WebReplaySessionCreateRequest {
  const tacticalState = defaultTacticalState();
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
        home: { managerId: 'harness-home', displayName: 'Harness Home Manager' },
        away: { managerId: 'harness-away', displayName: 'Harness Away Manager' }
      }
    }
  };
}
