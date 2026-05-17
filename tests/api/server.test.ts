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

  it('simulate match endpoint exposes historic team metadata and player attributes', async () => {
    const server = buildServer();
    const response = await server.inject({
      method: 'POST',
      url: '/api/simulate-match',
      payload: { seed: 7 }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().teams).toEqual({
      home: {
        id: 'home',
        name: 'Internazionale 2002',
        players: expect.arrayContaining([
          expect.objectContaining({ id: 'home-p11', name: 'Christian Vieri', position: 'F', attributes: expect.objectContaining({ finishing: 20 }) })
        ])
      },
      away: {
        id: 'away',
        name: 'Milan 2002',
        players: expect.arrayContaining([
          expect.objectContaining({ id: 'away-p7', name: 'Andrea Pirlo', position: 'M', attributes: expect.objectContaining({ passing: 20 }) })
        ])
      }
    });
  });

  it('simulate match endpoint returns categorized chance metadata', async () => {
    const server = buildServer();
    const response = await server.inject({
      method: 'POST',
      url: '/api/simulate-match',
      payload: { seed: 17, homeMentality: 'attacking', homeTransitionStyle: 'fast_break' }
    });

    expect(response.statusCode).toBe(200);
    const event = response.json().events.find((item: { category?: string; outcome?: string }) => item.category && item.outcome);
    expect(event).toEqual(expect.objectContaining({
      category: expect.stringMatching(/through_ball|counter_attack|cross|long_shot|set_piece/),
      outcome: expect.stringMatching(/goal|save|block|miss|foul|free_kick|corner|offside|yellow_card|red_card/),
      description: expect.any(String)
    }));
  });

  it('simulate match endpoint exposes event chain metadata', async () => {
    const server = buildServer();
    const response = await server.inject({
      method: 'POST',
      url: '/api/simulate-match',
      payload: { seed: 8, homePressing: 'high', awayPressing: 'high' }
    });

    expect(response.statusCode).toBe(200);
    const chainEvent = response.json().events.find((item: { chainId?: string; sequence?: number; type: string }) => item.chainId && ['foul', 'free_kick', 'corner', 'offside', 'yellow_card', 'red_card'].includes(item.type));
    expect(chainEvent).toEqual(expect.objectContaining({
      chainId: expect.any(String),
      sequence: expect.any(Number),
      description: expect.any(String)
    }));
  });

  it('simulate match endpoint accepts explicit slot assignments and applies mismatches', async () => {
    const server = buildServer();
    const response = await server.inject({
      method: 'POST',
      url: '/api/simulate-match',
      payload: {
        seed: 91,
        homeQuality: 'average',
        homeFormation: '4-4-2',
        homeAssignments: {
          gk: 'home-p11',
          dl: 'home-p2',
          dc1: 'home-p3',
          dc2: 'home-p4',
          dr: 'home-p5',
          ml: 'home-p6',
          mc1: 'home-p7',
          mc2: 'home-p8',
          mr: 'home-p9',
          fc1: 'home-p10',
          fc2: 'home-p1'
        }
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().diagnostics.join(' | ')).toMatch(/role mismatch|playing GK/i);
  });

  it('simulate match endpoint rejects invalid assignment maps', async () => {
    const server = buildServer();
    const response = await server.inject({
      method: 'POST',
      url: '/api/simulate-match',
      payload: {
        homeFormation: '4-4-2',
        homeAssignments: {
          gk: 'home-p1',
          dl: 'home-p2',
          dc1: 'home-p2',
          dc2: 'home-p4',
          dr: 'home-p5',
          ml: 'home-p6',
          mc1: 'home-p7',
          mc2: 'home-p8',
          mr: 'home-p9',
          fc1: 'home-p10',
          extra: 'home-p11'
        }
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toMatch(/homeAssignments.*missing|duplicate|unknown slot/);
  });
});
