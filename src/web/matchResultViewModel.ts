export type WebTeamStats = {
  possession: number;
  shots: number;
  shotsOnTarget: number;
  goals: number;
  fatigue: number;
  transitionDelay: number;
  lateArrivals: number;
  execution: number;
  movementLoad: number;
};

export type WebMatchResult = {
  score: {
    home: number;
    away: number;
  };
  stats: {
    home: WebTeamStats;
    away: WebTeamStats;
  };
  events: Array<{
    minute: number;
    teamId?: string;
    type: string;
    description: string;
  }>;
  diagnostics: string[];
  replay: {
    seed: number;
    engineVersion: string;
    commandCount: number;
  };
};

export type StatRow = {
  label: string;
  home: string;
  away: string;
};

export type MatchResultViewModel = {
  scoreTitle: string;
  statRows: StatRow[];
  events: string[];
  diagnostics: string[];
  replay: string[];
};

function statRow(label: string, home: number, away: number, suffix = ''): StatRow {
  return {
    label,
    home: `${home}${suffix}`,
    away: `${away}${suffix}`
  };
}

export function createMatchResultViewModel(result: WebMatchResult): MatchResultViewModel {
  return {
    scoreTitle: `Home XI ${result.score.home} - ${result.score.away} Away XI`,
    statRows: [
      statRow('Possession', result.stats.home.possession, result.stats.away.possession, '%'),
      statRow('Shots', result.stats.home.shots, result.stats.away.shots),
      statRow('Shots on target', result.stats.home.shotsOnTarget, result.stats.away.shotsOnTarget),
      statRow('Goals', result.stats.home.goals, result.stats.away.goals),
      statRow('Transition delay', result.stats.home.transitionDelay, result.stats.away.transitionDelay),
      statRow('Late arrivals', result.stats.home.lateArrivals, result.stats.away.lateArrivals)
    ],
    events: result.events.map((event) => `${event.minute}’ ${event.description}`),
    diagnostics: result.diagnostics,
    replay: [`Seed: ${result.replay.seed}`, `Engine: ${result.replay.engineVersion}`, `Commands: ${result.replay.commandCount}`]
  };
}
