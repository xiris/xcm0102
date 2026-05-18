import type { MatchEvent } from '../simulation/domain';
import { resumeMatchAuthoritatively } from '../simulation/authoritativeResume';
import { translateManagerCommandsToMatchCommands } from '../simulation/authoritativeCommandAdapter';
import { createHistoricTeam } from '../simulation/historicSquads';
import type { ManagerCommand } from '../simulation/managerCommands';
import { createSampleMatchInput, createSampleTacticBook } from '../simulation/sampleData';
import { simulateMatch } from '../simulation/simulateMatch';
import type { ReplaySessionRepository } from './replaySessionRepository';

export type ReplaySessionApiResult =
  | { ok: true; status: 200; body: Record<string, unknown> }
  | { ok: false; status: 400 | 404; body: { error: string } };

export function createReplaySessionForApi(payload: unknown, repository: ReplaySessionRepository): ReplaySessionApiResult {
  const parsed = parseCreateSessionRequest(payload);
  if (!parsed.ok) return badRequest(parsed.errors.join('; '));

  const baseInput = createDemoMatchInput(parsed.value.seed);
  const initialResult = simulateMatch(baseInput);
  const visibleEvents = initialResult.events.filter((event) => event.minute <= parsed.value.currentMinute);
  const session = repository.createSession({ seed: parsed.value.seed, initialResult, visibleEvents });

  return {
    ok: true,
    status: 200,
    body: {
      sessionId: session.sessionId,
      score: initialResult.score,
      visibleEventCount: session.visibleEvents.length,
      replay: initialResult.report.replay
    }
  };
}

export function appendReplaySessionCommandForApi(payload: unknown, repository: ReplaySessionRepository): ReplaySessionApiResult {
  const parsed = parseAppendCommandRequest(payload);
  if (!parsed.ok) return badRequest(parsed.errors.join('; '));

  try {
    const session = repository.appendManagerCommand(parsed.value.sessionId, parsed.value.command);
    return {
      ok: true,
      status: 200,
      body: { sessionId: session.sessionId, commandCount: session.managerCommands.length }
    };
  } catch (error) {
    return notFound(error);
  }
}

export function resumeReplaySessionForApi(payload: unknown, repository: ReplaySessionRepository): ReplaySessionApiResult {
  const parsed = parseResumeSessionRequest(payload);
  if (!parsed.ok) return badRequest(parsed.errors.join('; '));

  try {
    const session = repository.getSession(parsed.value.sessionId);
    const commands = translateManagerCommandsToMatchCommands(session.managerCommands, 'home');
    const result = resumeMatchAuthoritatively({
      baseInput: createDemoMatchInput(session.seed),
      currentMinute: parsed.value.currentMinute,
      visibleEvents: session.visibleEvents,
      commands
    });
    repository.recordAuthoritativeResume(session.sessionId, {
      currentMinute: parsed.value.currentMinute,
      eventCount: result.events.length,
      signature: result.signature
    });

    return {
      ok: true,
      status: 200,
      body: {
        sessionId: session.sessionId,
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
    return error instanceof Error && error.message.startsWith('Replay session not found:') ? notFound(error) : badRequest(error instanceof Error ? error.message : 'replay session resume failed');
  }
}

function createDemoMatchInput(seed: number) {
  const home = createHistoricTeam('home');
  const away = createHistoricTeam('away');
  return createSampleMatchInput({
    seed,
    home,
    away,
    homeTactic: createSampleTacticBook({ id: 'home-tactic', playerIds: home.players.map((player) => player.id) }),
    awayTactic: createSampleTacticBook({ id: 'away-tactic', playerIds: away.players.map((player) => player.id) })
  });
}

function parseCreateSessionRequest(payload: unknown) {
  const body = asObject(payload);
  if (!body.ok) return body;
  const errors: string[] = [];
  if (typeof body.value.seed !== 'number' || !Number.isInteger(body.value.seed)) errors.push('seed must be an integer');
  if (body.value.currentMinute !== undefined && !isMinute(body.value.currentMinute)) errors.push('currentMinute must be an integer between 0 and 90');
  if (errors.length > 0) return { ok: false as const, errors };
  return { ok: true as const, value: { seed: body.value.seed as number, currentMinute: (body.value.currentMinute ?? 0) as number } };
}

function parseAppendCommandRequest(payload: unknown) {
  const body = asObject(payload);
  if (!body.ok) return body;
  const errors: string[] = [];
  if (typeof body.value.sessionId !== 'string' || body.value.sessionId.length === 0) errors.push('sessionId must be a non-empty string');
  if (!isManagerCommandLike(body.value.command)) errors.push('command must be a manager command');
  if (errors.length > 0) return { ok: false as const, errors };
  return { ok: true as const, value: { sessionId: body.value.sessionId as string, command: body.value.command as ManagerCommand } };
}

function parseResumeSessionRequest(payload: unknown) {
  const body = asObject(payload);
  if (!body.ok) return body;
  const errors: string[] = [];
  if (typeof body.value.sessionId !== 'string' || body.value.sessionId.length === 0) errors.push('sessionId must be a non-empty string');
  if (!isMinute(body.value.currentMinute)) errors.push('currentMinute must be an integer between 0 and 90');
  if (errors.length > 0) return { ok: false as const, errors };
  return { ok: true as const, value: { sessionId: body.value.sessionId as string, currentMinute: body.value.currentMinute as number } };
}

function asObject(payload: unknown) {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false as const, errors: ['request body must be a JSON object'] };
  }
  return { ok: true as const, value: payload as Record<string, unknown> };
}

function isMinute(value: unknown): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 90;
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

function badRequest(error: string): ReplaySessionApiResult {
  return { ok: false, status: 400, body: { error } };
}

function notFound(error: unknown): ReplaySessionApiResult {
  return { ok: false, status: 404, body: { error: error instanceof Error ? error.message : 'Replay session not found' } };
}
