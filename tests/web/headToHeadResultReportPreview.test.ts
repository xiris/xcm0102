import { describe, expect, it } from 'vitest';
import { createHeadToHeadResultReportPreview } from '../../src/web/headToHeadResultReportPreview';
import type { ReplaySessionLobbySummary } from '../../src/web/replaySessionLobbyStatusViewModel';

const completeSummary: ReplaySessionLobbySummary = {
  sessionId: 'rs-000001',
  seed: 71,
  lobbyState: 'complete',
  ownership: {
    mode: 'head_to_head',
    lobbyState: 'complete',
    sides: {
      home: { managerId: 'home-manager', displayName: 'Chris Silva' },
      away: { managerId: 'away-manager', displayName: 'Away Boss' }
    }
  },
  commandCounts: { home: 2, away: 1 },
  visibleEventCount: 5,
  resultPreview: {
    score: { home: 2, away: 1 },
    teams: { home: 'Internazionale 2002', away: 'Milan 2002' },
    stats: {
      home: { shots: 14, shotsOnTarget: 8, goals: 2, possession: 54, fatigue: 18.25, transitionDelay: 4.5, lateArrivals: 1, execution: 0.72, movementLoad: 23.4 },
      away: { shots: 9, shotsOnTarget: 4, goals: 1, possession: 46, fatigue: 20.5, transitionDelay: 5.25, lateArrivals: 0, execution: 0.68, movementLoad: 21.2 }
    },
    eventCount: 34,
    replay: { seed: 71, engineVersion: 'production-sim-foundation-0.1.0', commandCount: 3 }
  }
};

describe('head-to-head result report preview', () => {
  it('formats a completed result preview from lobby summary metadata', () => {
    expect(createHeadToHeadResultReportPreview(completeSummary)).toEqual({
      title: 'Post-match report preview',
      scoreline: 'Internazionale 2002 2–1 Milan 2002',
      outcomeLabel: 'Internazionale 2002 win by 1 goal.',
      stateLabel: 'Authoritative result closed',
      statRows: [
        { label: 'Shots', home: '14', away: '9' },
        { label: 'Shots on target', home: '8', away: '4' },
        { label: 'Possession', home: '54%', away: '46%' },
        { label: 'Execution', home: '0.720', away: '0.680' }
      ],
      metadataRows: [
        { label: 'Events', value: '34' },
        { label: 'Replay seed', value: '71' },
        { label: 'Commands', value: '3' },
        { label: 'Engine', value: 'production-sim-foundation-0.1.0' }
      ],
      note: 'Read-only preview. New match flow and full report pages remain follow-up slices.'
    });
  });

  it('does not create a report preview before completion or without result metadata', () => {
    const { resultPreview: _resultPreview, ...summaryWithoutResultPreview } = completeSummary;

    expect(createHeadToHeadResultReportPreview({ ...completeSummary, lobbyState: 'in_match' })).toBeNull();
    expect(createHeadToHeadResultReportPreview(summaryWithoutResultPreview)).toBeNull();
  });
});
