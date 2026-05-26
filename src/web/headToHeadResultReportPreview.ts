import type { ReplaySessionLobbySummary } from './replaySessionLobbyStatusViewModel';

export type HeadToHeadResultReportPreviewRow = {
  label: string;
  home?: string;
  away?: string;
  value?: string;
};

export type HeadToHeadResultReportPreview = {
  title: string;
  scoreline: string;
  outcomeLabel: string;
  stateLabel: string;
  statRows: Array<{ label: string; home: string; away: string }>;
  metadataRows: Array<{ label: string; value: string }>;
  note: string;
};

export function createHeadToHeadResultReportPreview(summary: ReplaySessionLobbySummary): HeadToHeadResultReportPreview | null {
  if (summary.lobbyState !== 'complete' || summary.resultPreview === undefined) return null;

  const result = summary.resultPreview;
  const homeTeam = result.teams.home;
  const awayTeam = result.teams.away;
  const homeScore = result.score.home;
  const awayScore = result.score.away;

  return {
    title: 'Post-match report preview',
    scoreline: `${homeTeam} ${homeScore}–${awayScore} ${awayTeam}`,
    outcomeLabel: formatOutcome(homeTeam, awayTeam, homeScore, awayScore),
    stateLabel: 'Authoritative result closed',
    statRows: [
      { label: 'Shots', home: String(result.stats.home.shots), away: String(result.stats.away.shots) },
      { label: 'Shots on target', home: String(result.stats.home.shotsOnTarget), away: String(result.stats.away.shotsOnTarget) },
      { label: 'Possession', home: `${result.stats.home.possession}%`, away: `${result.stats.away.possession}%` },
      { label: 'Execution', home: result.stats.home.execution.toFixed(3), away: result.stats.away.execution.toFixed(3) }
    ],
    metadataRows: [
      { label: 'Events', value: String(result.eventCount) },
      { label: 'Replay seed', value: String(result.replay.seed) },
      { label: 'Commands', value: String(result.replay.commandCount) },
      { label: 'Engine', value: result.replay.engineVersion }
    ],
    note: 'Read-only preview. Rematch and full report pages remain follow-up slices.'
  };
}

function formatOutcome(homeTeam: string, awayTeam: string, homeScore: number, awayScore: number): string {
  if (homeScore === awayScore) return 'The match finished level.';
  const winner = homeScore > awayScore ? homeTeam : awayTeam;
  const margin = Math.abs(homeScore - awayScore);
  return `${winner} win by ${margin} ${margin === 1 ? 'goal' : 'goals'}.`;
}
