import type { MatchEvent, MatchReport, MatchResult } from '../simulation/domain';
import type { ManagerCommand } from '../simulation/managerCommands';

export type WebAuthoritativeResumeRequest = {
  seed: number;
  currentMinute: number;
  visibleEvents: MatchEvent[];
  managerCommands: ManagerCommand[];
};

export type WebAuthoritativeResumeResult = {
  authoritative: true;
  score: MatchResult['score'];
  stats: MatchResult['stats'];
  events: MatchEvent[];
  diagnostics: string[];
  replay: MatchReport['replay'];
  signature: string;
};

type FetchLike = (input: string, init: RequestInit) => Promise<{
  ok: boolean;
  status?: number;
  json: () => Promise<unknown>;
}>;

function getFetch(fetcher?: FetchLike): FetchLike {
  if (fetcher) {
    return fetcher;
  }
  return fetch as FetchLike;
}

export async function resumeMatchFromWeb(request: WebAuthoritativeResumeRequest, fetcher?: FetchLike): Promise<WebAuthoritativeResumeResult> {
  const response = await getFetch(fetcher)('/api/resume-match', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request)
  });
  const payload = await response.json();

  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'error' in payload ? String(payload.error) : `HTTP ${response.status ?? 'error'}`;
    throw new Error(`Authoritative resume request failed: ${message}`);
  }

  return payload as WebAuthoritativeResumeResult;
}
