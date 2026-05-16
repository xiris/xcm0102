import { createSampleMatchInput, createSampleTeam, createSampleTacticBook, type MovementStyle, type TeamQuality } from '../simulation/sampleData';
import { simulateMatch } from '../simulation/simulateMatch';
import type { Mentality } from '../simulation/domain';

type CliOptions = {
  seed: number;
  homeQuality: TeamQuality;
  awayQuality: TeamQuality;
  homeFamiliarity: number;
  awayFamiliarity: number;
  homeMovement: MovementStyle;
  awayMovement: MovementStyle;
  homeMentality: Mentality;
  awayMentality: Mentality;
};

const defaults: CliOptions = {
  seed: 42,
  homeQuality: 'average',
  awayQuality: 'average',
  homeFamiliarity: 0.7,
  awayFamiliarity: 0.7,
  homeMovement: 'balanced',
  awayMovement: 'balanced',
  homeMentality: 'balanced',
  awayMentality: 'balanced'
};

function readOptions(argv: string[]): CliOptions {
  const options = { ...defaults };
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined) {
      continue;
    }
    index += 1;
    switch (key) {
      case '--seed':
        options.seed = Number(value);
        break;
      case '--home-quality':
        options.homeQuality = value as TeamQuality;
        break;
      case '--away-quality':
        options.awayQuality = value as TeamQuality;
        break;
      case '--home-familiarity':
        options.homeFamiliarity = Number(value);
        break;
      case '--away-familiarity':
        options.awayFamiliarity = Number(value);
        break;
      case '--home-movement':
        options.homeMovement = value as MovementStyle;
        break;
      case '--away-movement':
        options.awayMovement = value as MovementStyle;
        break;
      case '--home-mentality':
        options.homeMentality = value as Mentality;
        break;
      case '--away-mentality':
        options.awayMentality = value as Mentality;
        break;
    }
  }
  return options;
}

const options = readOptions(process.argv.slice(2));
const input = createSampleMatchInput({
  seed: options.seed,
  home: createSampleTeam({ id: 'home', name: 'Home XI', quality: options.homeQuality }),
  away: createSampleTeam({ id: 'away', name: 'Away XI', quality: options.awayQuality }),
  homeTactic: createSampleTacticBook({
    id: 'home-tactic',
    mentality: options.homeMentality,
    familiarity: options.homeFamiliarity,
    movement: options.homeMovement
  }),
  awayTactic: createSampleTacticBook({
    id: 'away-tactic',
    mentality: options.awayMentality,
    familiarity: options.awayFamiliarity,
    movement: options.awayMovement
  })
});

const result = simulateMatch(input);

console.log(
  JSON.stringify(
    {
      options,
      score: result.score,
      stats: result.stats,
      events: result.events.slice(0, 8),
      diagnostics: result.report.diagnostics,
      replay: result.report.replay
    },
    null,
    2
  )
);
