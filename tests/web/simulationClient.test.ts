import { describe, expect, it, vi } from 'vitest';
import { simulateMatchFromWeb, type WebSimulationRequest } from '../../src/web/simulationClient';

const request: WebSimulationRequest = {
  seed: 42,
  homeQuality: 'strong',
  awayQuality: 'average',
  homeFamiliarity: 0.8,
  awayFamiliarity: 0.4,
  homeMovement: 'compact',
  awayMovement: 'extreme'
};

describe('simulateMatchFromWeb', () => {
  it('sends a JSON POST request to the server-authoritative simulation endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ score: { home: 2, away: 1 } })
    });

    const result = await simulateMatchFromWeb(request, fetchMock);

    expect(fetchMock).toHaveBeenCalledWith('/api/simulate-match', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request)
    });
    expect(result.score).toEqual({ home: 2, away: 1 });
  });

  it('throws a readable error when the API rejects the request', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'seed must be an integer' })
    });

    await expect(simulateMatchFromWeb(request, fetchMock)).rejects.toThrow('Simulation request failed: seed must be an integer');
  });
});
