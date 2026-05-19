import { describe, expect, it } from 'vitest';
import {
  appendReplaySessionCommandForApi,
  createReplaySessionForApi,
  resumeReplaySessionForApi,
  syncReplaySessionVisibleEventsForApi
} from '../../src/api/replaySessionEndpoint';
import { createInMemoryReplaySessionRepository } from '../../src/api/replaySessionRepository';
import { simulateMatchForApi } from '../../src/api/simulationEndpoint';

const command = {
  id: 'cmd-050-01-change-pressing',
  minute: 50,
  action: 'Change pressing',
  eventType: 'goal',
  eventDescription: 'Pause event.',
  effectSummary: 'Recorded intent: change pressing at 50’.'
};

describe('replay session API helpers', () => {
  it('preserves custom tactical payloads for session creation and resume parity', () => {
    const repository = createInMemoryReplaySessionRepository();
    const customPayload = {
      seed: 73,
      homeQuality: 'weak',
      awayQuality: 'strong',
      homeFamiliarity: 0.2,
      awayFamiliarity: 0.95,
      homeMovement: 'compact',
      awayMovement: 'extreme',
      homeFormation: '5-3-2',
      awayFormation: '3-5-2',
      homeMentality: 'defensive',
      awayMentality: 'attacking',
      homePressing: 'low',
      awayPressing: 'high',
      homeTransitionStyle: 'hold_shape',
      awayTransitionStyle: 'fast_break',
      homeAssignments: {
        gk: 'home-p1',
        dl: 'home-p2',
        dc1: 'home-p3',
        dc2: 'home-p4',
        dc3: 'home-p5',
        dr: 'home-p6',
        mc1: 'home-p7',
        mc2: 'home-p8',
        mc3: 'home-p9',
        fc1: 'home-p10',
        fc2: 'home-p11'
      },
      awayAssignments: {
        gk: 'away-p1',
        dc1: 'away-p2',
        dc2: 'away-p3',
        dc3: 'away-p4',
        wbl: 'away-p5',
        mc1: 'away-p6',
        mc2: 'away-p7',
        mc3: 'away-p8',
        wbr: 'away-p9',
        fc1: 'away-p10',
        fc2: 'away-p11'
      },
      currentMinute: 45
    };
    const simulated = simulateMatchForApi(customPayload);
    expect(simulated.status).toBe(200);
    if (!simulated.ok) throw new Error('expected simulation to pass');

    const created = createReplaySessionForApi(customPayload, repository);

    expect(created.status).toBe(200);
    expect(created.body).toEqual(expect.objectContaining({
      score: simulated.body.score,
      replay: simulated.body.replay
    }));
    if (!created.ok) throw new Error('expected session creation to pass');
    const sessionId = created.body.sessionId as string;
    const stored = repository.getSession(sessionId);
    expect(stored.initialResult.stats).toEqual(simulated.body.stats);
    expect(stored.initialResult.events).toEqual(simulated.body.events);

    const synced = syncReplaySessionVisibleEventsForApi({ sessionId, visibleEvents: stored.visibleEvents }, repository);
    expect(synced.status).toBe(200);
    const resumed = resumeReplaySessionForApi({ sessionId, currentMinute: 45 }, repository);

    expect(resumed.status).toBe(200);
    expect(resumed.body).toEqual(expect.objectContaining({
      sessionId,
      authoritative: true,
      replay: expect.objectContaining({ seed: 73 })
    }));
  });

  it('creates a demo session appends commands and resumes from stored server state', () => {
    const repository = createInMemoryReplaySessionRepository();

    const created = createReplaySessionForApi({ seed: 71, currentMinute: 50 }, repository);
    expect(created.status).toBe(200);
    expect(created.body).toEqual(expect.objectContaining({
      sessionId: expect.stringMatching(/^rs-/),
      score: { home: expect.any(Number), away: expect.any(Number) },
      visibleEventCount: expect.any(Number),
      replay: { seed: 71, engineVersion: expect.any(String), commandCount: 0 }
    }));

    if (!created.ok) throw new Error('expected session creation to pass');
    const sessionId = created.body.sessionId as string;
    const appended = appendReplaySessionCommandForApi({ sessionId, command }, repository);

    expect(appended).toEqual({
      ok: true,
      status: 200,
      body: { sessionId, commandCount: 1 }
    });

    const storedBeforeSync = repository.getSession(sessionId);
    const synced = syncReplaySessionVisibleEventsForApi({ sessionId, visibleEvents: storedBeforeSync.visibleEvents }, repository);

    expect(synced).toEqual({
      ok: true,
      status: 200,
      body: { sessionId, visibleEventCount: storedBeforeSync.visibleEvents.length }
    });

    const resumed = resumeReplaySessionForApi({ sessionId, currentMinute: 50 }, repository);

    expect(resumed.status).toBe(200);
    expect(resumed.body).toEqual(expect.objectContaining({
      sessionId,
      score: { home: expect.any(Number), away: expect.any(Number) },
      events: expect.any(Array),
      diagnostics: expect.arrayContaining([
        '50’ home change_pressing command set pressing to high for regenerated future simulation.'
      ]),
      signature: expect.stringContaining('vh-'),
      authoritative: true
    }));

    if (!resumed.ok) throw new Error('expected session resume to pass');
    const resumedEvents = resumed.body.events as unknown[];
    const resumedSignature = resumed.body.signature as string;
    const stored = repository.getSession(sessionId);
    expect(stored.latestAuthoritativeSignature).toBe(resumedSignature);
    expect(stored.auditLog.at(-1)).toEqual(expect.objectContaining({
      type: 'authoritative_resume_recorded',
      currentMinute: 50,
      eventCount: resumedEvents.length,
      signature: resumedSignature
    }));
  });

  it('rejects malformed session requests and missing sessions', () => {
    const repository = createInMemoryReplaySessionRepository();

    expect(createReplaySessionForApi({ seed: 'bad' }, repository)).toEqual({
      ok: false,
      status: 400,
      body: { error: expect.stringMatching(/seed/) }
    });
    expect(appendReplaySessionCommandForApi({ sessionId: 'rs-missing', command }, repository)).toEqual({
      ok: false,
      status: 404,
      body: { error: 'Replay session not found: rs-missing' }
    });
    expect(resumeReplaySessionForApi({ sessionId: 'rs-missing', currentMinute: 50 }, repository)).toEqual({
      ok: false,
      status: 404,
      body: { error: 'Replay session not found: rs-missing' }
    });
  });
});
