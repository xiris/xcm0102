import { describe, expect, it } from 'vitest';
import { createHeadToHeadManagerCockpitLayout } from '../../src/web/headToHeadManagerCockpitLayout';
import type { ReplaySessionLobbySummary } from '../../src/web/replaySessionLobbyStatusViewModel';

function createSummary(overrides: Partial<ReplaySessionLobbySummary> = {}): ReplaySessionLobbySummary {
  return {
    sessionId: 'rs-layout-001',
    seed: 311,
    lobbyState: 'setup',
    ownership: {
      mode: 'head_to_head',
      lobbyState: 'setup',
      sides: {
        home: { managerId: 'home-manager', displayName: 'Home Manager' }
      }
    },
    commandCounts: { home: 0, away: 0 },
    visibleEventCount: 0,
    ...overrides
  };
}

describe('createHeadToHeadManagerCockpitLayout', () => {
  it('creates an empty-session rail and station model before a lobby is selected', () => {
    const layout = createHeadToHeadManagerCockpitLayout({
      summary: null,
      stageLabel: 'No lobby selected',
      statusCopy: 'Create a head-to-head setup lobby or view an existing lobby by session ID.',
      errorCopy: null
    });

    expect(layout).toEqual({
      railTitle: 'Session rail',
      railHelper: 'Current lobby identity, manager assignment, phase, and next action.',
      rows: [
        { label: 'Phase', value: 'No lobby selected' },
        { label: 'Invite', value: 'No invite code yet' },
        { label: 'Home manager', value: 'Unassigned' },
        { label: 'Away manager', value: 'Unassigned' },
        { label: 'Next action', value: 'Create or load a lobby' },
        { label: 'Private setup', value: 'Hidden setup drafts appear after a setup lobby is loaded.' },
        { label: 'Status feed', value: 'Create a head-to-head setup lobby or view an existing lobby by session ID.' }
      ],
      stations: [
        { id: 'lobby-desk', label: 'Lobby desk', helperText: 'Create, load, or join the match room.' },
        { id: 'team-setup', label: 'Team setup', helperText: 'Save hidden club and tactic setup drafts.' },
        { id: 'match-controls', label: 'Match controls', helperText: 'Lock setup, kick off, and close the result.' },
        { id: 'report-room', label: 'Report room', helperText: 'Review the authoritative post-match report.' }
      ]
    });
  });

  it('summarizes an open setup lobby with missing away assignment', () => {
    const layout = createHeadToHeadManagerCockpitLayout({
      summary: createSummary(),
      stageLabel: 'Awaiting opponent',
      statusCopy: 'Created lobby rs-layout-001. Share the invite code with an opponent.',
      errorCopy: null
    });

    expect(layout.rows).toContainEqual({ label: 'Phase', value: 'Awaiting opponent' });
    expect(layout.rows).toContainEqual({ label: 'Invite', value: 'rs-layout-001' });
    expect(layout.rows).toContainEqual({ label: 'Home manager', value: 'Home Manager' });
    expect(layout.rows).toContainEqual({ label: 'Away manager', value: 'Unassigned' });
    expect(layout.rows).toContainEqual({ label: 'Next action', value: 'Invite away manager' });
    expect(layout.rows).toContainEqual({ label: 'Private setup', value: 'Hidden setup drafts unlock after both managers save and setup locks.' });
  });

  it('points complete lobbies toward report review without exposing rematch copy', () => {
    const layout = createHeadToHeadManagerCockpitLayout({
      summary: createSummary({
        lobbyState: 'complete',
        ownership: {
          mode: 'head_to_head',
          lobbyState: 'complete',
          sides: {
            home: { managerId: 'home-manager', displayName: 'Home Manager' },
            away: { managerId: 'away-manager', displayName: 'Away Manager' }
          }
        }
      }),
      stageLabel: 'Result closed',
      statusCopy: 'Completed match for lobby rs-layout-001.',
      errorCopy: null
    });

    expect(layout.rows).toContainEqual({ label: 'Phase', value: 'Result closed' });
    expect(layout.rows).toContainEqual({ label: 'Next action', value: 'Review report' });
    expect(layout.stations.map((station) => station.label)).toEqual(['Lobby desk', 'Team setup', 'Match controls', 'Report room']);
    expect(JSON.stringify(layout)).not.toMatch(/Rematch|Restart|New match/);
  });

  it('surfaces errors in the rail status feed without changing action policy', () => {
    const layout = createHeadToHeadManagerCockpitLayout({
      summary: createSummary(),
      stageLabel: 'Awaiting opponent',
      statusCopy: 'Private setup save failed.',
      errorCopy: 'Replay session request failed: setup is locked'
    });

    expect(layout.rows).toContainEqual({ label: 'Status feed', value: 'Replay session request failed: setup is locked' });
  });
});
