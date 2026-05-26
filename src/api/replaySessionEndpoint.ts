import type { MatchEvent } from '../simulation/domain';
import { resumeMatchAuthoritatively } from '../simulation/authoritativeResume';
import { translateManagerCommandsToMatchCommands } from '../simulation/authoritativeCommandAdapter';
import type { ManagerCommand } from '../simulation/managerCommands';
import { simulateMatch } from '../simulation/simulateMatch';
import { buildSimulationMatchInputForApi } from './simulationEndpoint';
import type { MatchSide, ReplaySessionLobbyState, ReplaySessionOwnership, ReplaySessionRepository, ReplaySessionSideOwner } from './replaySessionRepository';

export type ReplaySessionApiResult =
  | { ok: true; status: 200; body: Record<string, unknown> }
  | { ok: false; status: 400 | 404; body: { error: string } };

export function createReplaySessionForApi(payload: unknown, repository: ReplaySessionRepository): ReplaySessionApiResult {
  const parsed = parseCreateSessionRequest(payload);
  if (!parsed.ok) return badRequest(parsed.errors.join('; '));
  const built = buildSimulationMatchInputForApi(payload);
  if (!built.ok) return badRequest(built.errors.join('; '));

  const initialResult = simulateMatch(built.input);
  const visibleEvents = initialResult.events.filter((event) => event.minute <= parsed.value.currentMinute);
  const createInput = {
    seed: built.input.seed,
    baseInput: built.input,
    initialResult,
    visibleEvents,
    ...(parsed.value.ownership === undefined ? {} : { ownership: parsed.value.ownership })
  };
  const session = repository.createSession(createInput);

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
    const session = repository.appendManagerCommand(parsed.value.sessionId, parsed.value.command, parsed.value.side);
    const commandCounts = {
      home: session.sideManagerCommands.home.length,
      away: session.sideManagerCommands.away.length
    };
    return {
      ok: true,
      status: 200,
      body: { sessionId: session.sessionId, commandCount: commandCounts.home + commandCounts.away, commandCounts }
    };
  } catch (error) {
    return isReplaySessionNotFound(error) ? notFound(error) : badRequest(error instanceof Error ? error.message : 'replay session command append failed');
  }
}

export function syncReplaySessionVisibleEventsForApi(payload: unknown, repository: ReplaySessionRepository): ReplaySessionApiResult {
  const parsed = parseVisibleEventsRequest(payload);
  if (!parsed.ok) return badRequest(parsed.errors.join('; '));

  try {
    const session = repository.replaceVisibleEvents(parsed.value.sessionId, parsed.value.visibleEvents);
    return {
      ok: true,
      status: 200,
      body: { sessionId: session.sessionId, visibleEventCount: session.visibleEvents.length }
    };
  } catch (error) {
    return notFound(error);
  }
}

export function getReplaySessionSummaryForApi(payload: unknown, repository: ReplaySessionRepository): ReplaySessionApiResult {
  const parsed = parseSessionIdRequest(payload);
  if (!parsed.ok) return badRequest(parsed.errors.join('; '));

  try {
    const session = repository.getSession(parsed.value.sessionId);
    const body: Record<string, unknown> = {
      sessionId: session.sessionId,
      seed: session.seed,
      ownership: session.ownership,
      lobbyState: session.ownership.lobbyState,
      commandCounts: {
        home: session.sideManagerCommands.home.length,
        away: session.sideManagerCommands.away.length
      },
      visibleEventCount: session.visibleEvents.length,
      resultPreview: {
        score: session.initialResult.score,
        teams: {
          home: session.baseInput.home.name,
          away: session.baseInput.away.name
        },
        stats: session.initialResult.stats,
        eventCount: session.initialResult.events.length,
        replay: session.initialResult.report.replay
      }
    };
    if (session.latestAuthoritativeSignature !== undefined) {
      body.latestAuthoritativeSignature = session.latestAuthoritativeSignature;
    }
    return { ok: true, status: 200, body };
  } catch (error) {
    return notFound(error);
  }
}

export function transitionReplaySessionLobbyStateForApi(payload: unknown, repository: ReplaySessionRepository): ReplaySessionApiResult {
  const parsed = parseLobbyStateTransitionRequest(payload);
  if (!parsed.ok) return badRequest(parsed.errors.join('; '));

  try {
    const session = repository.transitionLobbyState(parsed.value.sessionId, parsed.value.lobbyState);
    return {
      ok: true,
      status: 200,
      body: {
        sessionId: session.sessionId,
        lobbyState: session.ownership.lobbyState,
        ownership: session.ownership
      }
    };
  } catch (error) {
    return isReplaySessionNotFound(error) ? notFound(error) : badRequest(error instanceof Error ? error.message : 'replay session lobby transition failed');
  }
}

export function joinAwayManagerForApi(payload: unknown, repository: ReplaySessionRepository): ReplaySessionApiResult {
  const parsed = parseJoinAwayManagerRequest(payload);
  if (!parsed.ok) return badRequest(parsed.errors.join('; '));

  try {
    const session = repository.joinAwayManager(parsed.value.sessionId, parsed.value.owner);
    return {
      ok: true,
      status: 200,
      body: {
        sessionId: session.sessionId,
        lobbyState: session.ownership.lobbyState,
        ownership: session.ownership
      }
    };
  } catch (error) {
    return isReplaySessionNotFound(error) ? notFound(error) : badRequest(error instanceof Error ? error.message : 'replay session away manager join failed');
  }
}

export function resumeReplaySessionForApi(payload: unknown, repository: ReplaySessionRepository): ReplaySessionApiResult {
  const parsed = parseResumeSessionRequest(payload);
  if (!parsed.ok) return badRequest(parsed.errors.join('; '));

  try {
    const session = repository.getSession(parsed.value.sessionId);
    const homeCommands = translateManagerCommandsToMatchCommands(session.sideManagerCommands.home, session.baseInput.home.id);
    const awayCommands = translateManagerCommandsToMatchCommands(session.sideManagerCommands.away, session.baseInput.away.id);
    const commands = [...homeCommands, ...awayCommands].sort((left, right) => left.minute - right.minute);
    const result = resumeMatchAuthoritatively({
      baseInput: session.baseInput,
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

function parseCreateSessionRequest(payload: unknown) {
  const body = asObject(payload);
  if (!body.ok) return body;
  const errors: string[] = [];
  if (typeof body.value.seed !== 'number' || !Number.isInteger(body.value.seed)) errors.push('seed must be an integer');
  if (body.value.currentMinute !== undefined && !isMinute(body.value.currentMinute)) errors.push('currentMinute must be an integer between 0 and 90');
  if (body.value.ownership !== undefined && !isReplaySessionOwnership(body.value.ownership)) {
    errors.push('ownership must include mode single_manager or head_to_head lobbyState setup locked in_match or complete and valid side owners');
  }
  if (errors.length > 0) return { ok: false as const, errors };
  return {
    ok: true as const,
    value: {
      seed: body.value.seed as number,
      currentMinute: (body.value.currentMinute ?? 0) as number,
      ownership: body.value.ownership as ReplaySessionOwnership | undefined
    }
  };
}

function parseAppendCommandRequest(payload: unknown) {
  const body = asObject(payload);
  if (!body.ok) return body;
  const errors: string[] = [];
  if (typeof body.value.sessionId !== 'string' || body.value.sessionId.length === 0) errors.push('sessionId must be a non-empty string');
  if (body.value.side !== undefined && !isMatchSide(body.value.side)) errors.push('side must be home or away');
  if (!isManagerCommandLike(body.value.command)) errors.push('command must be a manager command');
  if (errors.length > 0) return { ok: false as const, errors };
  return { ok: true as const, value: { sessionId: body.value.sessionId as string, side: (body.value.side ?? 'home') as MatchSide, command: body.value.command as ManagerCommand } };
}

function parseVisibleEventsRequest(payload: unknown) {
  const body = asObject(payload);
  if (!body.ok) return body;
  const errors: string[] = [];
  if (typeof body.value.sessionId !== 'string' || body.value.sessionId.length === 0) errors.push('sessionId must be a non-empty string');
  if (!Array.isArray(body.value.visibleEvents) || !body.value.visibleEvents.every(isMatchEventLike)) errors.push('visibleEvents must be an array of match events');
  if (errors.length > 0) return { ok: false as const, errors };
  return { ok: true as const, value: { sessionId: body.value.sessionId as string, visibleEvents: body.value.visibleEvents as MatchEvent[] } };
}

function parseSessionIdRequest(payload: unknown) {
  const body = asObject(payload);
  if (!body.ok) return body;
  const errors: string[] = [];
  if (typeof body.value.sessionId !== 'string' || body.value.sessionId.length === 0) errors.push('sessionId must be a non-empty string');
  if (errors.length > 0) return { ok: false as const, errors };
  return { ok: true as const, value: { sessionId: body.value.sessionId as string } };
}

function parseLobbyStateTransitionRequest(payload: unknown) {
  const body = asObject(payload);
  if (!body.ok) return body;
  const errors: string[] = [];
  if (typeof body.value.sessionId !== 'string' || body.value.sessionId.length === 0) errors.push('sessionId must be a non-empty string');
  if (!isReplaySessionLobbyState(body.value.lobbyState)) errors.push('lobbyState must be setup locked in_match or complete');
  if (errors.length > 0) return { ok: false as const, errors };
  return { ok: true as const, value: { sessionId: body.value.sessionId as string, lobbyState: body.value.lobbyState as ReplaySessionLobbyState } };
}

function parseJoinAwayManagerRequest(payload: unknown) {
  const body = asObject(payload);
  if (!body.ok) return body;
  const errors: string[] = [];
  if (typeof body.value.sessionId !== 'string' || body.value.sessionId.length === 0) errors.push('sessionId must be a non-empty string');
  if (typeof body.value.managerId !== 'string' || body.value.managerId.length === 0) errors.push('managerId must be a non-empty string');
  if (typeof body.value.displayName !== 'string' || body.value.displayName.length === 0) errors.push('displayName must be a non-empty string');
  if (errors.length > 0) return { ok: false as const, errors };
  const owner: ReplaySessionSideOwner = {
    managerId: body.value.managerId as string,
    displayName: body.value.displayName as string
  };
  return { ok: true as const, value: { sessionId: body.value.sessionId as string, owner } };
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

function isMatchSide(value: unknown): value is MatchSide {
  return value === 'home' || value === 'away';
}

function isReplaySessionOwnership(value: unknown): value is ReplaySessionOwnership {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const ownership = value as Record<string, unknown>;
  if (ownership.mode !== 'single_manager' && ownership.mode !== 'head_to_head') return false;
  if (!isReplaySessionLobbyState(ownership.lobbyState)) return false;
  if (ownership.sides === null || typeof ownership.sides !== 'object' || Array.isArray(ownership.sides)) return false;
  const sides = ownership.sides as Record<string, unknown>;
  return isOptionalSideOwner(sides.home) && isOptionalSideOwner(sides.away);
}

function isOptionalSideOwner(value: unknown): boolean {
  if (value === undefined) return true;
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const owner = value as Record<string, unknown>;
  return typeof owner.managerId === 'string'
    && owner.managerId.length > 0
    && typeof owner.displayName === 'string'
    && owner.displayName.length > 0;
}

function isReplaySessionLobbyState(value: unknown): value is ReplaySessionLobbyState {
  return value === 'setup' || value === 'locked' || value === 'in_match' || value === 'complete';
}

function isMinute(value: unknown): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 90;
}

function isMatchEventLike(value: unknown): value is MatchEvent {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const event = value as Record<string, unknown>;
  return typeof event.minute === 'number'
    && Number.isInteger(event.minute)
    && event.minute >= 0
    && event.minute <= 90
    && typeof event.type === 'string'
    && typeof event.description === 'string'
    && (event.teamId === undefined || typeof event.teamId === 'string');
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

function isReplaySessionNotFound(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith('Replay session not found:');
}
