import type { Formation, Mentality, Pressing, TransitionStyle } from '../simulation/domain';
import { getFormationGeometry } from '../simulation/formationGeometry';
import { createHistoricTeam } from '../simulation/historicSquads';
import { createSampleMatchInput, createSampleTacticBook, type MovementStyle, type TeamQuality } from '../simulation/sampleData';
import { simulateMatch } from '../simulation/simulateMatch';

type SimulateMatchRequest = {
  seed?: unknown;
  homeQuality?: unknown;
  awayQuality?: unknown;
  homeFamiliarity?: unknown;
  awayFamiliarity?: unknown;
  homeMovement?: unknown;
  awayMovement?: unknown;
  homeFormation?: unknown;
  awayFormation?: unknown;
  homeMentality?: unknown;
  awayMentality?: unknown;
  homePressing?: unknown;
  awayPressing?: unknown;
  homeTransitionStyle?: unknown;
  awayTransitionStyle?: unknown;
  homeAssignments?: unknown;
  awayAssignments?: unknown;
};

const qualities: TeamQuality[] = ['weak', 'average', 'strong'];
const movements: MovementStyle[] = ['compact', 'balanced', 'extreme'];
const formations: Formation[] = ['4-4-2', '4-1-3-2', '4-3-3', '3-5-2', '5-3-2'];
const mentalities: Mentality[] = ['defensive', 'balanced', 'attacking'];
const pressings: Pressing[] = ['low', 'medium', 'high'];
const transitionStyles: TransitionStyle[] = ['hold_shape', 'balanced', 'fast_break'];

function isTeamQuality(value: unknown): value is TeamQuality {
  return typeof value === 'string' && qualities.includes(value as TeamQuality);
}

function isMovementStyle(value: unknown): value is MovementStyle {
  return typeof value === 'string' && movements.includes(value as MovementStyle);
}

function pickOption<T extends string>(value: unknown, fallback: T, field: string, allowed: readonly T[], errors: string[]): T {
  if (value === undefined) {
    return fallback;
  }
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    errors.push(`${field} must be ${allowed.join(', ')}`);
    return fallback;
  }
  return value as T;
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

function parseAssignments(value: unknown, formation: Formation, playerIds: string[], field: string, errors: string[]): Record<string, string> | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    errors.push(`${field} must be an object keyed by formation slot id`);
    return undefined;
  }

  const assignments = value as Record<string, unknown>;
  const requiredSlots = getFormationGeometry(formation).slots.map((slot) => slot.id);
  const requiredSet = new Set(requiredSlots);
  const playerSet = new Set(playerIds);
  const result: Record<string, string> = {};

  for (const slotId of Object.keys(assignments)) {
    if (!requiredSet.has(slotId)) {
      errors.push(`${field} has unknown slot ${slotId}`);
      continue;
    }
    const playerId = assignments[slotId];
    if (typeof playerId !== 'string' || !playerSet.has(playerId)) {
      errors.push(`${field}.${slotId} must be one of ${playerIds.join(', ')}`);
      continue;
    }
    result[slotId] = playerId;
  }

  const missing = requiredSlots.filter((slotId) => !(slotId in result));
  if (missing.length > 0) {
    errors.push(`${field} missing slot assignments: ${missing.join(', ')}`);
  }

  const used = Object.values(result);
  const duplicates = [...new Set(used.filter((playerId, index) => used.indexOf(playerId) !== index))];
  if (duplicates.length > 0) {
    errors.push(`${field} has duplicate player assignments: ${duplicates.join(', ')}`);
  }

  return result;
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
  const homeFormation = pickOption(body.homeFormation, '4-4-2', 'homeFormation', formations, errors);
  const awayFormation = pickOption(body.awayFormation, '4-4-2', 'awayFormation', formations, errors);
  const homeMentality = pickOption(body.homeMentality, 'balanced', 'homeMentality', mentalities, errors);
  const awayMentality = pickOption(body.awayMentality, 'balanced', 'awayMentality', mentalities, errors);
  const homePressing = pickOption(body.homePressing, 'medium', 'homePressing', pressings, errors);
  const awayPressing = pickOption(body.awayPressing, 'medium', 'awayPressing', pressings, errors);
  const homeTransitionStyle = pickOption(body.homeTransitionStyle, 'balanced', 'homeTransitionStyle', transitionStyles, errors);
  const awayTransitionStyle = pickOption(body.awayTransitionStyle, 'balanced', 'awayTransitionStyle', transitionStyles, errors);
  const homePlayerIds = Array.from({ length: 11 }, (_unused, index) => `home-p${index + 1}`);
  const awayPlayerIds = Array.from({ length: 11 }, (_unused, index) => `away-p${index + 1}`);
  const homeAssignments = parseAssignments(body.homeAssignments, homeFormation, homePlayerIds, 'homeAssignments', errors);
  const awayAssignments = parseAssignments(body.awayAssignments, awayFormation, awayPlayerIds, 'awayAssignments', errors);

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
      awayMovement: awayMovement as MovementStyle,
      homeFormation,
      awayFormation,
      homeMentality,
      awayMentality,
      homePressing,
      awayPressing,
      homeTransitionStyle,
      awayTransitionStyle,
      homeAssignments,
      awayAssignments
    }
  };
}

export function simulateMatchForApi(payload: unknown) {
  const parsed = parseRequest(payload === undefined ? {} : payload);
  if (!parsed.ok) {
    return { ok: false as const, status: 400, body: { error: parsed.errors.join('; ') } };
  }

  const home = createHistoricTeam('home');
  const away = createHistoricTeam('away');
  const result = simulateMatch(
    createSampleMatchInput({
      seed: parsed.value.seed,
      home,
      away,
      homeTactic: createSampleTacticBook({
        id: 'home-tactic',
        formation: parsed.value.homeFormation,
        mentality: parsed.value.homeMentality,
        pressing: parsed.value.homePressing,
        transitionStyle: parsed.value.homeTransitionStyle,
        familiarity: parsed.value.homeFamiliarity,
        movement: parsed.value.homeMovement,
        playerIds: home.players.map((player) => player.id),
        assignments: parsed.value.homeAssignments
      }),
      awayTactic: createSampleTacticBook({
        id: 'away-tactic',
        formation: parsed.value.awayFormation,
        mentality: parsed.value.awayMentality,
        pressing: parsed.value.awayPressing,
        transitionStyle: parsed.value.awayTransitionStyle,
        familiarity: parsed.value.awayFamiliarity,
        movement: parsed.value.awayMovement,
        playerIds: away.players.map((player) => player.id),
        assignments: parsed.value.awayAssignments
      })
    })
  );

  return {
    ok: true as const,
    status: 200,
    body: {
      teams: { home, away },
      score: result.score,
      stats: result.stats,
      events: result.events,
      diagnostics: result.report.diagnostics,
      replay: result.report.replay
    }
  };
}
