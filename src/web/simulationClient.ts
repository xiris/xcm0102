import type { WebMatchResult } from './matchResultViewModel';

export type TeamQuality = 'weak' | 'average' | 'strong';
export type MovementStyle = 'compact' | 'balanced' | 'extreme';

export type WebSimulationRequest = {
  seed: number;
  homeQuality: TeamQuality;
  awayQuality: TeamQuality;
  homeFamiliarity: number;
  awayFamiliarity: number;
  homeMovement: MovementStyle;
  awayMovement: MovementStyle;
};

export type WebSimulationResult = WebMatchResult;

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

export async function simulateMatchFromWeb(request: WebSimulationRequest, fetcher?: FetchLike): Promise<WebSimulationResult> {
  const response = await getFetch(fetcher)('/api/simulate-match', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request)
  });
  const payload = await response.json();

  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'error' in payload ? String(payload.error) : `HTTP ${response.status ?? 'error'}`;
    throw new Error(`Simulation request failed: ${message}`);
  }

  return payload as WebSimulationResult;
}
