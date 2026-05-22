import type { MatchSide, ReplaySessionLobbyState, ReplaySessionOwnership } from '../api/replaySessionRepository';
import type { MatchEvent, MatchReport, MatchResult } from '../simulation/domain';
import type { ManagerCommand } from '../simulation/managerCommands';
import type { ReplaySessionLobbySummary } from './replaySessionLobbyStatusViewModel';
import type { WebSimulationRequest } from './simulationClient';

export type WebReplaySessionCreateRequest = WebSimulationRequest & {
  seed: number;
  currentMinute?: number;
};

export type WebReplaySessionCreateResult = {
  sessionId: string;
  score: MatchResult['score'];
  visibleEventCount: number;
  replay: MatchReport['replay'];
};

export type WebReplaySessionCommandRequest = {
  sessionId: string;
  command: ManagerCommand;
  side?: MatchSide;
};

export type WebReplaySessionCommandResult = {
  sessionId: string;
  commandCount: number;
  commandCounts?: Record<MatchSide, number>;
};

export type WebReplaySessionVisibleEventsRequest = {
  sessionId: string;
  visibleEvents: MatchEvent[];
};

export type WebReplaySessionVisibleEventsResult = {
  sessionId: string;
  visibleEventCount: number;
};

export type WebReplaySessionResumeRequest = {
  sessionId: string;
  currentMinute: number;
};

export type WebReplaySessionResumeResult = {
  sessionId: string;
  authoritative: true;
  score: MatchResult['score'];
  stats: MatchResult['stats'];
  events: MatchEvent[];
  diagnostics: string[];
  replay: MatchReport['replay'];
  signature: string;
};

export type WebReplaySessionLobbyStateRequest = {
  sessionId: string;
  lobbyState: ReplaySessionLobbyState;
};

export type WebReplaySessionLobbyStateResult = {
  sessionId: string;
  lobbyState: ReplaySessionLobbyState;
  ownership: ReplaySessionOwnership;
};

type FetchLike = (input: string, init: RequestInit) => Promise<{
  ok: boolean;
  status?: number;
  json: () => Promise<unknown>;
}>;

function getFetch(fetcher?: FetchLike): FetchLike {
  return fetcher ?? fetch as FetchLike;
}

export async function createReplaySessionFromWeb(request: WebReplaySessionCreateRequest, fetcher?: FetchLike): Promise<WebReplaySessionCreateResult> {
  return postJson('/api/replay-sessions', request, fetcher) as Promise<WebReplaySessionCreateResult>;
}

export async function appendReplaySessionCommandFromWeb(request: WebReplaySessionCommandRequest, fetcher?: FetchLike): Promise<WebReplaySessionCommandResult> {
  const { sessionId, command, side } = request;
  return postJson(`/api/replay-sessions/${sessionId}/commands`, side === undefined ? { command } : { command, side }, fetcher) as Promise<WebReplaySessionCommandResult>;
}

export async function syncReplaySessionVisibleEventsFromWeb(request: WebReplaySessionVisibleEventsRequest, fetcher?: FetchLike): Promise<WebReplaySessionVisibleEventsResult> {
  const { sessionId, visibleEvents } = request;
  return postJson(`/api/replay-sessions/${sessionId}/visible-events`, { visibleEvents }, fetcher) as Promise<WebReplaySessionVisibleEventsResult>;
}

export async function resumeReplaySessionFromWeb(request: WebReplaySessionResumeRequest, fetcher?: FetchLike): Promise<WebReplaySessionResumeResult> {
  const { sessionId, currentMinute } = request;
  return postJson(`/api/replay-sessions/${sessionId}/resume`, { currentMinute }, fetcher) as Promise<WebReplaySessionResumeResult>;
}

export async function getReplaySessionSummaryFromWeb(sessionId: string, fetcher?: FetchLike): Promise<ReplaySessionLobbySummary> {
  return getJson(`/api/replay-sessions/${sessionId}`, fetcher) as Promise<ReplaySessionLobbySummary>;
}

export async function transitionReplaySessionLobbyStateFromWeb(request: WebReplaySessionLobbyStateRequest, fetcher?: FetchLike): Promise<WebReplaySessionLobbyStateResult> {
  const { sessionId, lobbyState } = request;
  return patchJson(`/api/replay-sessions/${sessionId}/lobby-state`, { lobbyState }, fetcher) as Promise<WebReplaySessionLobbyStateResult>;
}

async function getJson(url: string, fetcher?: FetchLike): Promise<unknown> {
  const response = await getFetch(fetcher)(url, {
    method: 'GET',
    headers: { 'content-type': 'application/json' }
  });
  return parseJsonResponse(response);
}

async function postJson(url: string, body: unknown, fetcher?: FetchLike): Promise<unknown> {
  const response = await getFetch(fetcher)(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  return parseJsonResponse(response);
}

async function patchJson(url: string, body: unknown, fetcher?: FetchLike): Promise<unknown> {
  const response = await getFetch(fetcher)(url, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  return parseJsonResponse(response);
}

async function parseJsonResponse(response: Awaited<ReturnType<FetchLike>>): Promise<unknown> {
  const payload = await response.json();

  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'error' in payload ? String(payload.error) : `HTTP ${response.status ?? 'error'}`;
    throw new Error(`Replay session request failed: ${message}`);
  }

  return payload;
}
