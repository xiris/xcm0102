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
import { getFormationGeometry } from './formationGeometry';

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

function pointFor(base: PitchPoint, style: MovementStyle, phase: 'wib' | 'wob', zone: 'DEF_CENTER' | 'MID_CENTER' | 'ATT_CENTER', index: number): PitchPoint {
  const zonePush = zone === 'DEF_CENTER' ? -8 : zone === 'ATT_CENTER' ? 10 : 0;
  const phasePush = phase === 'wib' ? 8 : -8;
  const compactness = style === 'compact' ? 0.45 : style === 'extreme' ? 1.65 : 1;
  const horizontal = (phasePush + zonePush) * compactness;
  const vertical = (base.y - 50) * (style === 'compact' ? -0.12 : style === 'extreme' ? 0.28 : 0.05);
  const alternatingRun = style === 'extreme' ? (index % 2 === 0 ? 5 : -5) : 0;

  return {
    x: Math.max(2, Math.min(98, Math.round((base.x + horizontal) * 10) / 10)),
    y: Math.max(2, Math.min(98, Math.round((base.y + vertical + alternatingRun) * 10) / 10))
  };
}

function createMap(formation: Formation, style: MovementStyle, phase: 'wib' | 'wob', playerIds: string[]): WibWobMap {
  const zones = ['DEF_CENTER', 'MID_CENTER', 'ATT_CENTER'] as const;
  const map: WibWobMap = {};
  const slots = getFormationGeometry(formation).slots;

  for (const zone of zones) {
    map[zone] = Object.fromEntries(playerIds.map((id, index) => {
      const slot = slots[index % slots.length];
      if (!slot) {
        throw new Error(`Formation ${formation} has no slot for player index ${index}`);
      }
      return [id, pointFor(slot.point, style, phase, zone, index)];
    }));
  }

  return map;
}

export function createSampleTacticBook(options: TacticOptions = {}): TacticBook {
  const movement = options.movement ?? 'balanced';
  const formation = options.formation ?? '4-4-2';
  const playerIds = options.playerIds ?? Array.from({ length: 11 }, (_unused, index) => `player-${index + 1}`);
  return {
    id: options.id ?? 'sample-tactic',
    name: options.name ?? 'Sample Tactic Book',
    formation,
    mentality: options.mentality ?? 'balanced',
    pressing: options.pressing ?? 'medium',
    transitionStyle: options.transitionStyle ?? 'balanced',
    familiarity: options.familiarity ?? 0.7,
    wib: createMap(formation, movement, 'wib', playerIds),
    wob: createMap(formation, movement, 'wob', playerIds)
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
