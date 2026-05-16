import { describe, expect, it } from 'vitest';
import { buildServer } from '../../src/api/server';

describe('production API server', () => {
  it('health endpoint reports service status', async () => {
    const server = buildServer();
    const response = await server.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true, service: 'xcm0102-api' });
  });

  it('simulate match endpoint returns score stats events diagnostics and replay', async () => {
    const server = buildServer();
    const response = await server.inject({
      method: 'POST',
      url: '/api/simulate-match',
      payload: {
        seed: 42,
        homeQuality: 'weak',
        awayQuality: 'average',
        homeFamiliarity: 0.2,
        awayFamiliarity: 0.7,
        homeMovement: 'extreme',
        awayMovement: 'balanced'
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.score).toEqual({ home: expect.any(Number), away: expect.any(Number) });
    expect(body.stats.home.transitionDelay).toBeGreaterThan(0);
    expect(body.events.length).toBeGreaterThan(0);
    expect(body.diagnostics.join(' | ')).toMatch(/familiarity|movement|attributes|transition/i);
    expect(body.replay).toEqual({ seed: 42, engineVersion: expect.any(String), commandCount: 0 });
  });

  it('simulate match endpoint returns identical responses for identical requests', async () => {
    const server = buildServer();
    const request = {
      method: 'POST' as const,
      url: '/api/simulate-match',
      payload: { seed: 99, homeQuality: 'average', awayQuality: 'strong' }
    };

    const first = await server.inject(request);
    const second = await server.inject(request);

    expect(first.statusCode).toBe(200);
    expect(first.json()).toEqual(second.json());
  });

  it('simulate match endpoint rejects invalid requests', async () => {
    const server = buildServer();
    const response = await server.inject({
      method: 'POST',
      url: '/api/simulate-match',
      payload: { seed: 'bad', homeQuality: 'legendary', homeFamiliarity: 2 }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toMatch(/seed|homeQuality|homeFamiliarity/);
  });

  it('simulate match endpoint rejects non-object request bodies', async () => {
    const server = buildServer();
    const response = await server.inject({
      method: 'POST',
      url: '/api/simulate-match',
      payload: []
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toMatch(/JSON object/);
  });

  it('simulate match endpoint rejects JSON null request bodies', async () => {
    const server = buildServer();
    const response = await server.inject({
      method: 'POST',
      url: '/api/simulate-match',
      headers: { 'content-type': 'application/json' },
      payload: 'null'
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toMatch(/JSON object/);
  });

  it('simulate match endpoint accepts tactical editor options', async () => {
    const server = buildServer();
    const response = await server.inject({
      method: 'POST',
      url: '/api/simulate-match',
      payload: {
        seed: 123,
        homeQuality: 'average',
        awayQuality: 'average',
        homeFormation: '4-1-3-2',
        awayFormation: '4-4-2',
        homeMentality: 'attacking',
        awayMentality: 'defensive',
        homePressing: 'high',
        awayPressing: 'low',
        homeTransitionStyle: 'fast_break',
        awayTransitionStyle: 'hold_shape'
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.replay).toEqual({ seed: 123, engineVersion: expect.any(String), commandCount: 0 });
    expect(body.events.length).toBeGreaterThan(0);
  });

  it('simulate match endpoint rejects invalid tactical editor options', async () => {
    const server = buildServer();
    const response = await server.inject({
      method: 'POST',
      url: '/api/simulate-match',
      payload: {
        homeFormation: '2-2-6',
        homeMentality: 'reckless',
        awayPressing: 'constant',
        awayTransitionStyle: 'teleport'
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toMatch(/homeFormation|homeMentality|awayPressing|awayTransitionStyle/);
  });
});
