import type {
  Formation,
  MatchContext,
  MatchInput,
  Mentality,
  PitchPoint,
  Player,
  PlayerAttributes,
  Pressing,
  Team,
  TacticBook,
  TransitionStyle,
  WibWobMap
} from './domain';

export type TeamQuality = 'weak' | 'average' | 'strong';
export type MovementStyle = 'compact' | 'balanced' | 'extreme';

type TeamOptions = {
  id?: string;
  name?: string;
  quality?: TeamQuality;
};

type TacticOptions = {
  id?: string;
  name?: string;
  formation?: Formation;
  mentality?: Mentality;
  pressing?: Pressing;
  transitionStyle?: TransitionStyle;
  familiarity?: number;
  movement?: MovementStyle;
  playerIds?: string[];
};

type MatchOptions = {
  seed?: number;
  home?: Team;
  away?: Team;
  homeTactic?: TacticBook;
  awayTactic?: TacticBook;
  homeFamiliarity?: number;
  awayFamiliarity?: number;
  homeMovement?: MovementStyle;
  awayMovement?: MovementStyle;
  context?: MatchContext;
};

const qualityAttributes: Record<TeamQuality, PlayerAttributes> = {
  weak: {
    pace: 7,
    acceleration: 7,
    stamina: 7,
    positioning: 7,
    anticipation: 7,
    teamwork: 7,
    decisions: 7,
    finishing: 7,
    passing: 7,
    tackling: 7
  },
  average: {
    pace: 12,
    acceleration: 12,
    stamina: 12,
    positioning: 12,
    anticipation: 12,
    teamwork: 12,
    decisions: 12,
    finishing: 12,
    passing: 12,
    tackling: 12
  },
  strong: {
    pace: 17,
    acceleration: 17,
    stamina: 17,
    positioning: 17,
    anticipation: 17,
    teamwork: 17,
    decisions: 17,
    finishing: 17,
    passing: 17,
    tackling: 17
  }
};

const positions: Player['position'][] = ['GK', 'D', 'D', 'D', 'DM', 'M', 'M', 'AM', 'AM', 'F', 'F'];

export function createSampleTeam(options: TeamOptions = {}): Team {
  const id = options.id ?? 'sample-team';
  const quality = options.quality ?? 'average';
  const base = qualityAttributes[quality];

  return {
    id,
    name: options.name ?? `${quality.toUpperCase()} ${id}`,
    players: positions.map((position, index) => ({
      id: `${id}-p${index + 1}`,
      name: `${id} Player ${index + 1}`,
      position,
      attributes: { ...base }
    }))
  };
}

function pointFor(style: MovementStyle, phase: 'wib' | 'wob', index: number): PitchPoint {
  const lane = 20 + (index % 5) * 15;
  const row = 20 + Math.floor(index / 5) * 20;

  if (style === 'compact') {
    return phase === 'wib' ? { x: 58 + (index % 3) * 3, y: 42 + (index % 4) * 4 } : { x: 43 + (index % 3) * 3, y: 42 + (index % 4) * 4 };
  }

  if (style === 'extreme') {
    return phase === 'wib' ? { x: 82 + (index % 2) * 8, y: lane } : { x: 18 - (index % 2) * 8, y: 100 - lane };
  }

  return phase === 'wib' ? { x: 50 + row / 4, y: lane } : { x: 42 - row / 8, y: 100 - lane };
}

function createMap(style: MovementStyle, phase: 'wib' | 'wob', playerIds: string[]): WibWobMap {
  const zones = ['DEF_CENTER', 'MID_CENTER', 'ATT_CENTER'] as const;
  const map: WibWobMap = {};

  for (const zone of zones) {
    map[zone] = Object.fromEntries(playerIds.map((id, index) => [id, pointFor(style, phase, index)]));
  }

  return map;
}

export function createSampleTacticBook(options: TacticOptions = {}): TacticBook {
  const movement = options.movement ?? 'balanced';
  const playerIds = options.playerIds ?? Array.from({ length: 11 }, (_unused, index) => `player-${index + 1}`);
  return {
    id: options.id ?? 'sample-tactic',
    name: options.name ?? 'Sample Tactic Book',
    formation: options.formation ?? '4-4-2',
    mentality: options.mentality ?? 'balanced',
    pressing: options.pressing ?? 'medium',
    transitionStyle: options.transitionStyle ?? 'balanced',
    familiarity: options.familiarity ?? 0.7,
    wib: createMap(movement, 'wib', playerIds),
    wob: createMap(movement, 'wob', playerIds)
  };
}

export function createSampleMatchInput(options: MatchOptions = {}): MatchInput {
  const home = options.home ?? createSampleTeam({ id: 'home', quality: 'average' });
  const away = options.away ?? createSampleTeam({ id: 'away', quality: 'average' });

  return {
    seed: options.seed ?? 1,
    home,
    away,
    homeTactic:
      options.homeTactic ??
      createSampleTacticBook({
        id: 'home-tactic',
        familiarity: options.homeFamiliarity ?? 0.7,
        movement: options.homeMovement ?? 'balanced',
        playerIds: home.players.map((player) => player.id)
      }),
    awayTactic:
      options.awayTactic ??
      createSampleTacticBook({
        id: 'away-tactic',
        familiarity: options.awayFamiliarity ?? 0.7,
        movement: options.awayMovement ?? 'balanced',
        playerIds: away.players.map((player) => player.id)
      }),
    context: options.context ?? { weather: 'clear', pitch: 'normal', neutralVenue: false },
    commands: []
  };
}
