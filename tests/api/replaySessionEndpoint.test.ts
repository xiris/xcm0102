import { describe, expect, it } from 'vitest';
import {
  appendReplaySessionCommandForApi,
  createReplaySessionForApi,
  resumeReplaySessionForApi
} from '../../src/api/replaySessionEndpoint';
import { createInMemoryReplaySessionRepository } from '../../src/api/replaySessionRepository';

const command = {
  id: 'cmd-050-01-change-pressing',
  minute: 50,
  action: 'Change pressing',
  eventType: 'goal',
  eventDescription: 'Pause event.',
  effectSummary: 'Recorded intent: change pressing at 50’.'
};

describe('replay session API helpers', () => {
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
