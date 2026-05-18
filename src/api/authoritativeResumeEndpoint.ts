import type { MatchEvent } from '../simulation/domain';
import { resumeMatchAuthoritatively } from '../simulation/authoritativeResume';
import { translateManagerCommandsToMatchCommands } from '../simulation/authoritativeCommandAdapter';
import { createHistoricTeam } from '../simulation/historicSquads';
import type { ManagerCommand } from '../simulation/managerCommands';
import { createSampleMatchInput, createSampleTacticBook } from '../simulation/sampleData';

export type AuthoritativeResumeApiRequest = {
  seed?: unknown;
  currentMinute?: unknown;
  visibleEvents?: unknown;
  managerCommands?: unknown;
};

export function resumeMatchForApi(payload: unknown) {
  const parsed = parseRequest(payload);
  if (!parsed.ok) {
    return { ok: false as const, status: 400, body: { error: parsed.errors.join('; ') } };
  }

  try {
    const home = createHistoricTeam('home');
    const away = createHistoricTeam('away');
    const baseInput = createSampleMatchInput({
      seed: parsed.value.seed,
      home,
      away,
      homeTactic: createSampleTacticBook({ id: 'home-tactic', playerIds: home.players.map((player) => player.id) }),
      awayTactic: createSampleTacticBook({ id: 'away-tactic', playerIds: away.players.map((player) => player.id) })
    });
    const commands = translateManagerCommandsToMatchCommands(parsed.value.managerCommands, 'home');
    const result = resumeMatchAuthoritatively({
      baseInput,
      currentMinute: parsed.value.currentMinute,
      visibleEvents: parsed.value.visibleEvents,
      commands
    });

    return {
      ok: true as const,
      status: 200,
      body: {
        score: result.score,
        stats: result.stats,
        events: result.events,
        diagnostics: result.report.diagnostics,
        replay: result.report.replay,
        signature: result.signature,
        authoritative: true
      }
    };
  } catch (error) {
    return { ok: false as const, status: 400, body: { error: error instanceof Error ? error.message : 'authoritative resume failed' } };
  }
}

function parseRequest(payload: unknown) {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false as const, errors: ['request body must be a JSON object'] };
  }

  const body = payload as AuthoritativeResumeApiRequest;
  const errors: string[] = [];

  if (typeof body.seed !== 'number' || !Number.isInteger(body.seed)) {
    errors.push('seed must be an integer');
  }
  if (typeof body.currentMinute !== 'number' || !Number.isInteger(body.currentMinute) || body.currentMinute < 0 || body.currentMinute > 90) {
    errors.push('currentMinute must be an integer between 0 and 90');
  }
  if (!Array.isArray(body.visibleEvents) || !body.visibleEvents.every(isMatchEventLike)) {
    errors.push('visibleEvents must be an array of match events');
  }
  if (!Array.isArray(body.managerCommands) || !body.managerCommands.every(isManagerCommandLike)) {
    errors.push('managerCommands must be an array of manager commands');
  }

  if (errors.length > 0) return { ok: false as const, errors };

  return {
    ok: true as const,
    value: {
      seed: body.seed as number,
      currentMinute: body.currentMinute as number,
      visibleEvents: body.visibleEvents as MatchEvent[],
      managerCommands: body.managerCommands as ManagerCommand[]
    }
  };
}

function isMatchEventLike(value: unknown): value is MatchEvent {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const event = value as Record<string, unknown>;
  return typeof event.minute === 'number'
    && Number.isInteger(event.minute)
    && typeof event.type === 'string'
    && typeof event.description === 'string'
    && (event.teamId === undefined || typeof event.teamId === 'string')
    && (event.category === undefined || typeof event.category === 'string')
    && (event.outcome === undefined || typeof event.outcome === 'string')
    && (event.chainId === undefined || typeof event.chainId === 'string')
    && (event.sequence === undefined || typeof event.sequence === 'number');
}

function isManagerCommandLike(value: unknown): value is ManagerCommand {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const command = value as Record<string, unknown>;
  return typeof command.id === 'string'
    && typeof command.minute === 'number'
    && Number.isInteger(command.minute)
    && typeof command.action === 'string'
    && typeof command.eventType === 'string'
    && typeof command.eventDescription === 'string'
    && typeof command.effectSummary === 'string';
}
