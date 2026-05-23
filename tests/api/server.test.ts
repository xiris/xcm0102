import { describe, expect, it } from 'vitest';
import { buildServer } from '../../src/api/server';
import { createHistoricTeam } from '../../src/simulation/historicSquads';
import { createSampleMatchInput, createSampleTacticBook } from '../../src/simulation/sampleData';
import { simulateMatch } from '../../src/simulation/simulateMatch';

function authoritativeResumeFixture(seed = 71) {
  const home = createHistoricTeam('home');
  const away = createHistoricTeam('away');
  const input = createSampleMatchInput({
    seed,
    home,
    away,
    homeTactic: createSampleTacticBook({ id: 'home-tactic', playerIds: home.players.map((player) => player.id) }),
    awayTactic: createSampleTacticBook({ id: 'away-tactic', playerIds: away.players.map((player) => player.id) })
  });
  const original = simulateMatch(input);
  return {
    currentMinute: 50,
    visibleEvents: original.events.filter((event) => event.minute <= 50)
  };
}

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

  it('authoritative resume endpoint returns deterministic resumed replay signatures', async () => {
    const server = buildServer();
    const fixture = authoritativeResumeFixture(71);
    const request = {
      method: 'POST' as const,
      url: '/api/resume-match',
      payload: {
        seed: 71,
        currentMinute: fixture.currentMinute,
        visibleEvents: fixture.visibleEvents,
        managerCommands: [
          {
            id: 'cmd-050-01-change-pressing',
            minute: 50,
            action: 'Change pressing',
            eventType: 'goal',
            eventDescription: 'Pause event.',
            effectSummary: 'Recorded intent: change pressing at 50’.'
          }
        ]
      }
    };

    const first = await server.inject(request);
    const second = await server.inject(request);

    expect(first.statusCode).toBe(200);
    expect(first.json()).toEqual(second.json());
    expect(first.json()).toEqual(expect.objectContaining({
      score: { home: expect.any(Number), away: expect.any(Number) },
      events: expect.arrayContaining(fixture.visibleEvents),
      diagnostics: expect.arrayContaining([
        '50’ home change_pressing command set pressing to high for regenerated future simulation.'
      ]),
      signature: expect.stringContaining('vh-')
    }));
  });

  it('authoritative resume endpoint rejects forged visible history', async () => {
    const server = buildServer();
    const fixture = authoritativeResumeFixture(71);
    const response = await server.inject({
      method: 'POST',
      url: '/api/resume-match',
      payload: {
        seed: 71,
        currentMinute: fixture.currentMinute,
        visibleEvents: [
          ...fixture.visibleEvents,
          { minute: 20, teamId: 'home', type: 'goal', description: 'Forged.' }
        ],
        managerCommands: []
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toMatch(/visible event history/i);
  });

  it('authoritative resume endpoint rejects malformed resume request bodies', async () => {
    const server = buildServer();
    const response = await server.inject({ method: 'POST', url: '/api/resume-match', payload: { currentMinute: 'late', visibleEvents: 'nope' } });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toMatch(/seed|currentMinute|visibleEvents|managerCommands/);
  });

  it('replay session endpoints create command and resume from stored state', async () => {
    const server = buildServer();
    const created = await server.inject({
      method: 'POST',
      url: '/api/replay-sessions',
      payload: { seed: 71, currentMinute: 50 }
    });

    expect(created.statusCode).toBe(200);
    const sessionId = created.json().sessionId as string;
    expect(sessionId).toMatch(/^rs-/);

    const appended = await server.inject({
      method: 'POST',
      url: `/api/replay-sessions/${sessionId}/commands`,
      payload: {
        command: {
          id: 'cmd-050-01-change-pressing',
          minute: 50,
          action: 'Change pressing',
          eventType: 'goal',
          eventDescription: 'Pause event.',
          effectSummary: 'Recorded intent: change pressing at 50’.'
        }
      }
    });

    expect(appended.statusCode).toBe(200);
    expect(appended.json()).toEqual({ sessionId, commandCount: 1, commandCounts: { home: 1, away: 0 } });

    const synced = await server.inject({
      method: 'POST',
      url: `/api/replay-sessions/${sessionId}/visible-events`,
      payload: { visibleEvents: [] }
    });

    expect(synced.statusCode).toBe(200);
    expect(synced.json()).toEqual({ sessionId, visibleEventCount: 0 });

    const resumeSession = await server.inject({
      method: 'POST',
      url: '/api/replay-sessions',
      payload: { seed: 71, currentMinute: 50 }
    });
    const resumeSessionId = resumeSession.json().sessionId as string;
    await server.inject({
      method: 'POST',
      url: `/api/replay-sessions/${resumeSessionId}/commands`,
      payload: {
        command: {
          id: 'cmd-050-01-change-pressing',
          minute: 50,
          action: 'Change pressing',
          eventType: 'goal',
          eventDescription: 'Pause event.',
          effectSummary: 'Recorded intent: change pressing at 50’.'
        }
      }
    });

    const resumed = await server.inject({
      method: 'POST',
      url: `/api/replay-sessions/${resumeSessionId}/resume`,
      payload: { currentMinute: 50 }
    });

    expect(resumed.statusCode).toBe(200);
    expect(resumed.json()).toEqual(expect.objectContaining({
      sessionId: resumeSessionId,
      authoritative: true,
      signature: expect.stringContaining('vh-'),
      diagnostics: expect.arrayContaining([
        '50’ home change_pressing command set pressing to high for regenerated future simulation.'
      ])
    }));
  });

  it('replay session routes preserve away-side commands and expose lobby summary', async () => {
    const server = buildServer();
    const created = await server.inject({
      method: 'POST',
      url: '/api/replay-sessions',
      payload: { seed: 71, currentMinute: 50 }
    });
    const sessionId = created.json().sessionId as string;

    const appended = await server.inject({
      method: 'POST',
      url: `/api/replay-sessions/${sessionId}/commands`,
      payload: {
        side: 'away',
        command: {
          id: 'cmd-050-02-adjust-defensive-line',
          minute: 50,
          action: 'Adjust defensive line',
          eventType: 'goal',
          eventDescription: 'Away pause event.',
          effectSummary: 'Recorded intent: adjust defensive line at 50’.'
        }
      }
    });

    expect(appended.statusCode).toBe(200);
    expect(appended.json()).toEqual({ sessionId, commandCount: 1, commandCounts: { home: 0, away: 1 } });

    const resumed = await server.inject({
      method: 'POST',
      url: `/api/replay-sessions/${sessionId}/resume`,
      payload: { currentMinute: 50 }
    });

    expect(resumed.statusCode).toBe(200);
    expect(resumed.json()).toEqual(expect.objectContaining({
      sessionId,
      authoritative: true,
      diagnostics: expect.arrayContaining([
        '50’ away change_transition_style command set transition style to hold_shape for regenerated future simulation.'
      ])
    }));

    const summary = await server.inject({ method: 'GET', url: `/api/replay-sessions/${sessionId}` });

    expect(summary.statusCode).toBe(200);
    expect(summary.json()).toEqual({
      sessionId,
      seed: 71,
      ownership: {
        mode: 'single_manager',
        lobbyState: 'in_match',
        sides: { home: { managerId: 'local-home', displayName: 'Local manager' } }
      },
      lobbyState: 'in_match',
      commandCounts: { home: 0, away: 1 },
      visibleEventCount: expect.any(Number),
      latestAuthoritativeSignature: resumed.json().signature
    });
    expect(summary.json()).not.toHaveProperty('baseInput');
    expect(summary.json()).not.toHaveProperty('visibleEvents');
    expect(summary.json()).not.toHaveProperty('sideManagerCommands');
    expect(summary.json()).not.toHaveProperty('auditLog');
  });

  it('replay session routes create setup lobbies and advance to in-match readiness', async () => {
    const server = buildServer();
    const created = await server.inject({
      method: 'POST',
      url: '/api/replay-sessions',
      payload: {
        seed: 72,
        currentMinute: 0,
        ownership: {
          mode: 'head_to_head',
          lobbyState: 'setup',
          sides: {
            home: { managerId: 'manager-home', displayName: 'Home Boss' },
            away: { managerId: 'manager-away', displayName: 'Away Boss' }
          }
        }
      }
    });
    expect(created.statusCode).toBe(200);
    const sessionId = created.json().sessionId as string;

    const setupSummary = await server.inject({ method: 'GET', url: `/api/replay-sessions/${sessionId}` });
    expect(setupSummary.json()).toEqual(expect.objectContaining({
      sessionId,
      lobbyState: 'setup',
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'setup',
        sides: {
          home: { managerId: 'manager-home', displayName: 'Home Boss' },
          away: { managerId: 'manager-away', displayName: 'Away Boss' }
        }
      },
      commandCounts: { home: 0, away: 0 }
    }));

    const locked = await server.inject({
      method: 'PATCH',
      url: `/api/replay-sessions/${sessionId}/lobby-state`,
      payload: { lobbyState: 'locked' }
    });
    expect(locked.statusCode).toBe(200);
    expect(locked.json()).toEqual(expect.objectContaining({ sessionId, lobbyState: 'locked' }));

    const inMatch = await server.inject({
      method: 'PATCH',
      url: `/api/replay-sessions/${sessionId}/lobby-state`,
      payload: { lobbyState: 'in_match' }
    });
    expect(inMatch.statusCode).toBe(200);
    expect(inMatch.json()).toEqual(expect.objectContaining({ sessionId, lobbyState: 'in_match' }));

    const inMatchSummary = await server.inject({ method: 'GET', url: `/api/replay-sessions/${sessionId}` });
    expect(inMatchSummary.json()).toEqual(expect.objectContaining({
      sessionId,
      lobbyState: 'in_match',
      ownership: expect.objectContaining({ lobbyState: 'in_match' })
    }));
  });

  it('replay session lobby-state route rejects direct setup to in-match transitions', async () => {
    const server = buildServer();
    const created = await server.inject({
      method: 'POST',
      url: '/api/replay-sessions',
      payload: {
        seed: 72,
        currentMinute: 0,
        ownership: {
          mode: 'head_to_head',
          lobbyState: 'setup',
          sides: {
            home: { managerId: 'manager-home', displayName: 'Home Boss' },
            away: { managerId: 'manager-away', displayName: 'Away Boss' }
          }
        }
      }
    });
    const sessionId = created.json().sessionId as string;

    const response = await server.inject({
      method: 'PATCH',
      url: `/api/replay-sessions/${sessionId}/lobby-state`,
      payload: { lobbyState: 'in_match' }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: 'Invalid replay session lobby transition: setup -> in_match' });
  });

  it('replay session lobby-state route completes sessions and rejects late commands', async () => {
    const server = buildServer();
    const created = await server.inject({ method: 'POST', url: '/api/replay-sessions', payload: { seed: 71, currentMinute: 50 } });
    const sessionId = created.json().sessionId as string;

    const transitioned = await server.inject({
      method: 'PATCH',
      url: `/api/replay-sessions/${sessionId}/lobby-state`,
      payload: { lobbyState: 'complete' }
    });

    expect(transitioned.statusCode).toBe(200);
    expect(transitioned.json()).toEqual({
      sessionId,
      lobbyState: 'complete',
      ownership: {
        mode: 'single_manager',
        lobbyState: 'complete',
        sides: { home: { managerId: 'local-home', displayName: 'Local manager' } }
      }
    });

    const summary = await server.inject({ method: 'GET', url: `/api/replay-sessions/${sessionId}` });
    expect(summary.json()).toEqual(expect.objectContaining({ lobbyState: 'complete' }));

    const lateCommand = await server.inject({
      method: 'POST',
      url: `/api/replay-sessions/${sessionId}/commands`,
      payload: {
        command: {
          id: 'cmd-050-01-change-pressing',
          minute: 50,
          action: 'Change pressing',
          eventType: 'goal',
          eventDescription: 'Pause event.',
          effectSummary: 'Recorded intent: change pressing at 50’.'
        }
      }
    });

    expect(lateCommand.statusCode).toBe(400);
    expect(lateCommand.json()).toEqual({ error: 'Replay session is complete and cannot accept manager commands' });
  });

  it('replay session routes reject invalid command sides', async () => {
    const server = buildServer();
    const created = await server.inject({ method: 'POST', url: '/api/replay-sessions', payload: { seed: 71, currentMinute: 50 } });
    const sessionId = created.json().sessionId as string;

    const response = await server.inject({
      method: 'POST',
      url: `/api/replay-sessions/${sessionId}/commands`,
      payload: {
        side: 'bench',
        command: {
          id: 'cmd-050-01-change-pressing',
          minute: 50,
          action: 'Change pressing',
          eventType: 'goal',
          eventDescription: 'Pause event.',
          effectSummary: 'Recorded intent: change pressing at 50’.'
        }
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: 'side must be home or away' });
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

  it('simulate match endpoint exposes condition and substitution events', async () => {
    const server = buildServer();
    const response = await server.inject({
      method: 'POST',
      url: '/api/simulate-match',
      payload: { seed: 18, homePressing: 'high', awayPressing: 'high', homeMovement: 'extreme', awayMovement: 'extreme' }
    });

    expect(response.statusCode).toBe(200);
    const events = response.json().events as Array<{ type: string; description: string }>;
    expect(events.some((event) => event.type === 'fatigue_warning')).toBe(true);
    expect(events.some((event) => event.type === 'substitution')).toBe(true);
    expect(events.map((event) => event.description).join(' | ')).toMatch(/tiring|struggling|replaces|injury/i);
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
