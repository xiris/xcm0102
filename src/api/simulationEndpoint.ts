import { createSampleMatchInput, createSampleTacticBook, createSampleTeam, type MovementStyle, type TeamQuality } from '../simulation/sampleData';
import { simulateMatch } from '../simulation/simulateMatch';

type SimulateMatchRequest = {
  seed?: unknown;
  homeQuality?: unknown;
  awayQuality?: unknown;
  homeFamiliarity?: unknown;
  awayFamiliarity?: unknown;
  homeMovement?: unknown;
  awayMovement?: unknown;
};

const qualities: TeamQuality[] = ['weak', 'average', 'strong'];
const movements: MovementStyle[] = ['compact', 'balanced', 'extreme'];

function isTeamQuality(value: unknown): value is TeamQuality {
  return typeof value === 'string' && qualities.includes(value as TeamQuality);
}

function isMovementStyle(value: unknown): value is MovementStyle {
  return typeof value === 'string' && movements.includes(value as MovementStyle);
}

function parseFamiliarity(value: unknown, fallback: number, field: string, errors: string[]): number {
  if (value === undefined) {
    return fallback;
  }
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
    errors.push(`${field} must be a number between 0 and 1`);
    return fallback;
  }
  return value;
}

function parseRequest(payload: unknown) {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false as const, errors: ['request body must be a JSON object'] };
  }

  const body = payload as SimulateMatchRequest;
  const errors: string[] = [];

  const seed = body.seed ?? 1;
  if (typeof seed !== 'number' || !Number.isInteger(seed)) {
    errors.push('seed must be an integer');
  }

  const homeQuality = body.homeQuality ?? 'average';
  if (!isTeamQuality(homeQuality)) {
    errors.push('homeQuality must be weak, average, or strong');
  }

  const awayQuality = body.awayQuality ?? 'average';
  if (!isTeamQuality(awayQuality)) {
    errors.push('awayQuality must be weak, average, or strong');
  }

  const homeMovement = body.homeMovement ?? 'balanced';
  if (!isMovementStyle(homeMovement)) {
    errors.push('homeMovement must be compact, balanced, or extreme');
  }

  const awayMovement = body.awayMovement ?? 'balanced';
  if (!isMovementStyle(awayMovement)) {
    errors.push('awayMovement must be compact, balanced, or extreme');
  }

  const homeFamiliarity = parseFamiliarity(body.homeFamiliarity, 0.7, 'homeFamiliarity', errors);
  const awayFamiliarity = parseFamiliarity(body.awayFamiliarity, 0.7, 'awayFamiliarity', errors);

  if (errors.length > 0) {
    return { ok: false as const, errors };
  }

  return {
    ok: true as const,
    value: {
      seed: seed as number,
      homeQuality: homeQuality as TeamQuality,
      awayQuality: awayQuality as TeamQuality,
      homeFamiliarity,
      awayFamiliarity,
      homeMovement: homeMovement as MovementStyle,
      awayMovement: awayMovement as MovementStyle
    }
  };
}

export function simulateMatchForApi(payload: unknown) {
  const parsed = parseRequest(payload === undefined ? {} : payload);
  if (!parsed.ok) {
    return { ok: false as const, status: 400, body: { error: parsed.errors.join('; ') } };
  }

  const home = createSampleTeam({ id: 'home', name: 'Home XI', quality: parsed.value.homeQuality });
  const away = createSampleTeam({ id: 'away', name: 'Away XI', quality: parsed.value.awayQuality });
  const result = simulateMatch(
    createSampleMatchInput({
      seed: parsed.value.seed,
      home,
      away,
      homeTactic: createSampleTacticBook({
        id: 'home-tactic',
        familiarity: parsed.value.homeFamiliarity,
        movement: parsed.value.homeMovement,
        playerIds: home.players.map((player) => player.id)
      }),
      awayTactic: createSampleTacticBook({
        id: 'away-tactic',
        familiarity: parsed.value.awayFamiliarity,
        movement: parsed.value.awayMovement,
        playerIds: away.players.map((player) => player.id)
      })
    })
  );

  return {
    ok: true as const,
    status: 200,
    body: {
      score: result.score,
      stats: result.stats,
      events: result.events,
      diagnostics: result.report.diagnostics,
      replay: result.report.replay
    }
  };
}
