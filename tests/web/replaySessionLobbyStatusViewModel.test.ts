import { describe, expect, it } from 'vitest';
import { createReplaySessionLobbyStatusViewModel } from '../../src/web/replaySessionLobbyStatusViewModel';

const summary = {
  sessionId: 'rs-000042',
  seed: 71,
  ownership: {
    mode: 'head_to_head' as const,
    lobbyState: 'locked' as const,
    sides: {
      home: { managerId: 'mgr-home', displayName: 'Home Manager' },
      away: { managerId: 'mgr-away', displayName: 'Away Manager' }
    }
  },
  lobbyState: 'locked' as const,
  commandCounts: { home: 2, away: 1 },
  visibleEventCount: 5,
  latestAuthoritativeSignature: '71|50|cmd|vh-abcd|8'
};

describe('createReplaySessionLobbyStatusViewModel', () => {
  it('formats read-only lobby ownership state and session counts', () => {
    expect(createReplaySessionLobbyStatusViewModel(summary)).toEqual({
      title: 'Replay session lobby',
      eyebrow: 'Read-only status',
      stateLabel: 'Locked for kickoff',
      stateTone: 'waiting',
      rows: [
        { label: 'Session', value: 'rs-000042' },
        { label: 'Seed', value: '71' },
        { label: 'Mode', value: 'Head-to-head' },
        { label: 'Home manager', value: 'Home Manager' },
        { label: 'Away manager', value: 'Away Manager' },
        { label: 'Command logs', value: 'Home 2 · Away 1' },
        { label: 'Visible events', value: '5' },
        { label: 'Latest signature', value: '71|50|cmd|vh-abcd|8' }
      ],
      sideCards: [
        {
          side: 'home',
          title: 'Home side',
          managerLabel: 'Home Manager',
          assignmentLabel: 'Assigned',
          commandCountLabel: '2 commands',
          readinessLabel: 'Locked for kickoff',
          readinessTone: 'waiting'
        },
        {
          side: 'away',
          title: 'Away side',
          managerLabel: 'Away Manager',
          assignmentLabel: 'Assigned',
          commandCountLabel: '1 command',
          readinessLabel: 'Locked for kickoff',
          readinessTone: 'waiting'
        }
      ],
      actionAvailability: {
        headline: 'Future lobby actions',
        helperText: 'Setup is locked. A future Kick off match control can request the server-owned in-match transition.',
        actions: [
          {
            id: 'kickoff',
            label: 'Kick off match',
            targetLobbyState: 'in_match',
            available: true
          }
        ]
      },
      notes: [
        'Pre-match setup has been locked; kickoff is waiting on the server-owned transition.',
        'This panel is read-only. Lobby transitions still happen through tested server commands.'
      ]
    });
  });

  it('uses compatibility labels for a single-manager in-match session without an away owner or signature', () => {
    const { latestAuthoritativeSignature: _signature, ...summaryWithoutSignature } = summary;

    expect(createReplaySessionLobbyStatusViewModel({
      ...summaryWithoutSignature,
      ownership: {
        mode: 'single_manager',
        lobbyState: 'in_match',
        sides: { home: { managerId: 'local-home', displayName: 'Local manager' } }
      },
      lobbyState: 'in_match',
      commandCounts: { home: 0, away: 0 }
    })).toEqual({
      title: 'Replay session lobby',
      eyebrow: 'Read-only status',
      stateLabel: 'In match',
      stateTone: 'active',
      rows: [
        { label: 'Session', value: 'rs-000042' },
        { label: 'Seed', value: '71' },
        { label: 'Mode', value: 'Single manager' },
        { label: 'Home manager', value: 'Local manager' },
        { label: 'Away manager', value: 'Unassigned' },
        { label: 'Command logs', value: 'Home 0 · Away 0' },
        { label: 'Visible events', value: '5' }
      ],
      sideCards: [
        {
          side: 'home',
          title: 'Home side',
          managerLabel: 'Local manager',
          assignmentLabel: 'Assigned',
          commandCountLabel: '0 commands',
          readinessLabel: 'In-match commands available',
          readinessTone: 'active'
        },
        {
          side: 'away',
          title: 'Away side',
          managerLabel: 'Unassigned',
          assignmentLabel: 'Needs manager',
          commandCountLabel: '0 commands',
          readinessLabel: 'AI/default side for this single-manager session',
          readinessTone: 'unassigned'
        }
      ],
      actionAvailability: {
        headline: 'Future lobby actions',
        helperText: 'Single-manager Match Lab sessions skip setup/lock controls and begin in match; only completion remains a future transition.',
        actions: [
          {
            id: 'complete_match',
            label: 'Complete match',
            targetLobbyState: 'complete',
            available: true
          }
        ]
      },
      notes: [
        'Match replay is active; in-match manager commands may still be recorded.',
        'This panel is read-only. Lobby transitions still happen through tested server commands.'
      ]
    });
  });

  it('formats side readiness cards for a head-to-head locked lobby', () => {
    expect(createReplaySessionLobbyStatusViewModel(summary).sideCards).toEqual([
      {
        side: 'home',
        title: 'Home side',
        managerLabel: 'Home Manager',
        assignmentLabel: 'Assigned',
        commandCountLabel: '2 commands',
        readinessLabel: 'Locked for kickoff',
        readinessTone: 'waiting'
      },
      {
        side: 'away',
        title: 'Away side',
        managerLabel: 'Away Manager',
        assignmentLabel: 'Assigned',
        commandCountLabel: '1 command',
        readinessLabel: 'Locked for kickoff',
        readinessTone: 'waiting'
      }
    ]);
  });

  it('formats lobby action availability for setup, locked, in-match, and complete summaries', () => {
    expect(createReplaySessionLobbyStatusViewModel({
      ...summary,
      lobbyState: 'setup',
      ownership: { ...summary.ownership, lobbyState: 'setup' }
    }).actionAvailability).toEqual({
      headline: 'Future lobby actions',
      helperText: 'Both managers are assigned. A future Lock setup control can request the server-owned locked transition.',
      actions: [
        {
          id: 'lock_setup',
          label: 'Lock setup',
          targetLobbyState: 'locked',
          available: true
        }
      ]
    });

    expect(createReplaySessionLobbyStatusViewModel(summary).actionAvailability).toEqual({
      headline: 'Future lobby actions',
      helperText: 'Setup is locked. A future Kick off match control can request the server-owned in-match transition.',
      actions: [
        {
          id: 'kickoff',
          label: 'Kick off match',
          targetLobbyState: 'in_match',
          available: true
        }
      ]
    });

    expect(createReplaySessionLobbyStatusViewModel({
      ...summary,
      lobbyState: 'in_match',
      ownership: { ...summary.ownership, lobbyState: 'in_match' }
    }).actionAvailability).toEqual({
      headline: 'Future lobby actions',
      helperText: 'The match is active. A future Complete match control can close the authoritative lobby state.',
      actions: [
        {
          id: 'complete_match',
          label: 'Complete match',
          targetLobbyState: 'complete',
          available: true
        }
      ]
    });

    expect(createReplaySessionLobbyStatusViewModel({
      ...summary,
      lobbyState: 'complete',
      ownership: { ...summary.ownership, lobbyState: 'complete' }
    }).actionAvailability).toEqual({
      headline: 'Future lobby actions',
      helperText: 'The result is complete. No further lobby transitions are available.',
      actions: []
    });
  });

  it('formats lobby action availability disabled copy for missing managers and single-manager compatibility', () => {
    expect(createReplaySessionLobbyStatusViewModel({
      ...summary,
      lobbyState: 'setup',
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'setup',
        sides: { home: { managerId: 'mgr-home', displayName: 'Home Manager' } }
      }
    }).actionAvailability).toEqual({
      headline: 'Future lobby actions',
      helperText: 'Manager assignment is incomplete. Future setup controls should stay disabled until both sides are assigned.',
      actions: [
        {
          id: 'lock_setup',
          label: 'Lock setup',
          targetLobbyState: 'locked',
          available: false,
          disabledReason: 'Assign both managers before locking setup.'
        }
      ]
    });

    expect(createReplaySessionLobbyStatusViewModel({
      ...summary,
      lobbyState: 'setup',
      ownership: {
        mode: 'single_manager',
        lobbyState: 'setup',
        sides: {}
      },
      commandCounts: { home: 0, away: 0 }
    }).actionAvailability).toEqual({
      headline: 'Future lobby actions',
      helperText: 'Home manager assignment is incomplete. Future setup controls should stay disabled until the home side is assigned.',
      actions: [
        {
          id: 'lock_setup',
          label: 'Lock setup',
          targetLobbyState: 'locked',
          available: false,
          disabledReason: 'Assign the home manager before locking setup.'
        }
      ]
    });

    expect(createReplaySessionLobbyStatusViewModel({
      ...summary,
      lobbyState: 'in_match',
      ownership: {
        mode: 'single_manager',
        lobbyState: 'in_match',
        sides: { home: { managerId: 'local-home', displayName: 'Local manager' } }
      },
      commandCounts: { home: 0, away: 0 }
    }).actionAvailability).toEqual({
      headline: 'Future lobby actions',
      helperText: 'Single-manager Match Lab sessions skip setup/lock controls and begin in match; only completion remains a future transition.',
      actions: [
        {
          id: 'complete_match',
          label: 'Complete match',
          targetLobbyState: 'complete',
          available: true
        }
      ]
    });
  });
});
