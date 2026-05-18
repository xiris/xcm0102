import { describe, expect, it, vi } from 'vitest';
import { resumeMatchFromWeb, type WebAuthoritativeResumeRequest } from '../../src/web/authoritativeResumeClient';

const visibleEvents = [
  { minute: 1, type: 'kickoff' as const, description: 'Kickoff.' },
  { minute: 50, teamId: 'home', type: 'goal' as const, description: 'Home score.' }
];

const request: WebAuthoritativeResumeRequest = {
  seed: 71,
  currentMinute: 50,
  visibleEvents,
  managerCommands: [
    {
      id: 'cmd-050-01-change-pressing',
      minute: 50,
      action: 'Change pressing',
      eventType: 'goal',
      eventDescription: 'Home score.',
      effectSummary: 'Recorded intent: change pressing at 50’.'
    }
  ]
};

describe('resumeMatchFromWeb', () => {
  it('sends visible replay history and manager commands to the authoritative resume endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        authoritative: true,
        score: { home: 2, away: 1 },
        stats: { home: {}, away: {} },
        events: visibleEvents,
        diagnostics: ['50’ home change_pressing command set pressing to high for regenerated future simulation.'],
        replay: { seed: 71, engineVersion: 'test-engine', commandCount: 1 },
        signature: '71|50|cmd|vh-abcd|8'
      })
    });

    const result = await resumeMatchFromWeb(request, fetchMock);

    expect(fetchMock).toHaveBeenCalledWith('/api/resume-match', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request)
    });
    expect(result.authoritative).toBe(true);
    expect(result.score).toEqual({ home: 2, away: 1 });
    expect(result.signature).toBe('71|50|cmd|vh-abcd|8');
  });

  it('throws a readable error when the authoritative resume API rejects the request', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'visible event history does not match server replay' })
    });

    await expect(resumeMatchFromWeb(request, fetchMock)).rejects.toThrow('Authoritative resume request failed: visible event history does not match server replay');
  });
});
