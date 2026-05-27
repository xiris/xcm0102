import { describe, expect, it } from 'vitest';
import { POST as appendReplaySessionCommandRoute } from '../../app/api/replay-sessions/[sessionId]/commands/route';
import { POST as joinAwayManagerRoute } from '../../app/api/replay-sessions/[sessionId]/join-away/route';
import { PATCH as transitionReplaySessionLobbyStateRoute } from '../../app/api/replay-sessions/[sessionId]/lobby-state/route';
import { POST as submitPrivateSetupRoute } from '../../app/api/replay-sessions/[sessionId]/private-setup/route';
import { GET as getReplaySessionRoute } from '../../app/api/replay-sessions/[sessionId]/route';
import { POST as createReplaySessionRoute } from '../../app/api/replay-sessions/route';

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
}

describe('Next replay session routes', () => {
  it('joins an away manager through the Next route wrapper', async () => {
    const created = await createReplaySessionRoute(jsonRequest('http://localhost/api/replay-sessions', {
      seed: 181,
      currentMinute: 0,
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'setup',
        sides: { home: { managerId: 'manager-home', displayName: 'Home Boss' } }
      }
    }));
    expect(created.status).toBe(200);
    const createdBody = await created.json();
    const sessionId = createdBody.sessionId as string;

    const joined = await joinAwayManagerRoute(
      jsonRequest(`http://localhost/api/replay-sessions/${sessionId}/join-away`, { managerId: 'manager-away', displayName: 'Away Boss' }),
      { params: Promise.resolve({ sessionId }) }
    );

    expect(joined.status).toBe(200);
    expect(await joined.json()).toEqual({
      sessionId,
      lobbyState: 'setup',
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'setup',
        sides: {
          home: { managerId: 'manager-home', displayName: 'Home Boss' },
          away: { managerId: 'manager-away', displayName: 'Away Boss' }
        }
      }
    });
  });

  it('preserve away-side commands and expose lobby summary shape', async () => {
    const created = await createReplaySessionRoute(jsonRequest('http://localhost/api/replay-sessions', { seed: 171, currentMinute: 50 }));
    expect(created.status).toBe(200);
    const createdBody = await created.json();
    const sessionId = createdBody.sessionId as string;

    const appended = await appendReplaySessionCommandRoute(
      jsonRequest(`http://localhost/api/replay-sessions/${sessionId}/commands`, {
        side: 'away',
        command: {
          id: 'cmd-050-02-adjust-defensive-line',
          minute: 50,
          action: 'Adjust defensive line',
          eventType: 'goal',
          eventDescription: 'Away pause event.',
          effectSummary: 'Recorded intent: adjust defensive line at 50’.'
        }
      }),
      { params: Promise.resolve({ sessionId }) }
    );

    expect(appended.status).toBe(200);
    expect(await appended.json()).toEqual({ sessionId, commandCount: 1, commandCounts: { home: 0, away: 1 } });

    const summary = await getReplaySessionRoute(
      new Request(`http://localhost/api/replay-sessions/${sessionId}`, { method: 'GET' }),
      { params: Promise.resolve({ sessionId }) }
    );

    expect(summary.status).toBe(200);
    const summaryBody = await summary.json();
    expect(summaryBody).toEqual({
      sessionId,
      seed: 171,
      ownership: {
        mode: 'single_manager',
        lobbyState: 'in_match',
        sides: { home: { managerId: 'local-home', displayName: 'Local manager' } }
      },
      lobbyState: 'in_match',
      commandCounts: { home: 0, away: 1 },
      visibleEventCount: expect.any(Number),
      resultPreview: expect.objectContaining({
        score: expect.objectContaining({ home: expect.any(Number), away: expect.any(Number) }),
        teams: { home: 'Internazionale 2002', away: 'Milan 2002' },
        eventCount: expect.any(Number),
        replay: expect.objectContaining({ seed: 171 })
      }),
      privateSetup: {
        revealState: 'revealed_after_lock',
        sides: {
          home: { side: 'home', status: 'missing', detailVisibility: 'revealed', missingLabel: 'No private setup draft stored' },
          away: { side: 'away', status: 'missing', detailVisibility: 'revealed', missingLabel: 'No private setup draft stored' }
        }
      }
    });
    expect(summaryBody).not.toHaveProperty('baseInput');
    expect(summaryBody).not.toHaveProperty('managerCommands');
    expect(summaryBody).not.toHaveProperty('sideManagerCommands');
    expect(summaryBody).not.toHaveProperty('privateSetupDrafts');
    expect(summaryBody).not.toHaveProperty('auditLog');
  });

  it('creates setup lobby sessions and advances them through Next route wrappers', async () => {
    const created = await createReplaySessionRoute(jsonRequest('http://localhost/api/replay-sessions', {
      seed: 173,
      currentMinute: 0,
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'setup',
        sides: {
          home: { managerId: 'manager-home', displayName: 'Home Boss' },
          away: { managerId: 'manager-away', displayName: 'Away Boss' }
        }
      }
    }));
    expect(created.status).toBe(200);
    const createdBody = await created.json();
    const sessionId = createdBody.sessionId as string;

    const setupSummary = await getReplaySessionRoute(
      new Request(`http://localhost/api/replay-sessions/${sessionId}`, { method: 'GET' }),
      { params: Promise.resolve({ sessionId }) }
    );
    expect(await setupSummary.json()).toEqual(expect.objectContaining({
      sessionId,
      lobbyState: 'setup',
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'setup',
        sides: {
          home: { managerId: 'manager-home', displayName: 'Home Boss' },
          away: { managerId: 'manager-away', displayName: 'Away Boss' }
        }
      }
    }));

    const locked = await transitionReplaySessionLobbyStateRoute(
      jsonRequest(`http://localhost/api/replay-sessions/${sessionId}/lobby-state`, { lobbyState: 'locked' }),
      { params: Promise.resolve({ sessionId }) }
    );
    expect(locked.status).toBe(200);
    expect(await locked.json()).toEqual(expect.objectContaining({ sessionId, lobbyState: 'locked' }));

    const inMatch = await transitionReplaySessionLobbyStateRoute(
      jsonRequest(`http://localhost/api/replay-sessions/${sessionId}/lobby-state`, { lobbyState: 'in_match' }),
      { params: Promise.resolve({ sessionId }) }
    );
    expect(inMatch.status).toBe(200);
    expect(await inMatch.json()).toEqual(expect.objectContaining({ sessionId, lobbyState: 'in_match' }));
  });

  it('stores private setup drafts through the Next route wrapper while summary stays redacted before lock', async () => {
    const created = await createReplaySessionRoute(jsonRequest('http://localhost/api/replay-sessions', {
      seed: 174,
      currentMinute: 0,
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'setup',
        sides: {
          home: { managerId: 'manager-home', displayName: 'Home Boss' },
          away: { managerId: 'manager-away', displayName: 'Away Boss' }
        }
      }
    }));
    expect(created.status).toBe(200);
    const sessionId = (await created.json()).sessionId as string;

    const submitted = await submitPrivateSetupRoute(
      jsonRequest(`http://localhost/api/replay-sessions/${sessionId}/private-setup`, {
        side: 'home',
        draft: { clubId: 'internazionale-2002', tacticShellId: 'balanced-442', readinessIntent: 'ready_to_lock' }
      }),
      { params: Promise.resolve({ sessionId }) }
    );

    expect(submitted.status).toBe(200);
    expect(await submitted.json()).toEqual({ sessionId, side: 'home', stored: true, revealState: 'hidden_until_lock' });

    const summary = await getReplaySessionRoute(
      new Request(`http://localhost/api/replay-sessions/${sessionId}`, { method: 'GET' }),
      { params: Promise.resolve({ sessionId }) }
    );
    const summaryBody = await summary.json();
    expect(summaryBody.privateSetup.sides.home).toEqual({
      side: 'home',
      status: 'stored',
      detailVisibility: 'hidden',
      redactionLabel: 'Hidden until setup lock'
    });
    expect(summaryBody.privateSetup.sides.home).not.toHaveProperty('draft');
  });

  it('maps private setup route validation and guard failures to readable responses', async () => {
    const setup = await createReplaySessionRoute(jsonRequest('http://localhost/api/replay-sessions', {
      seed: 175,
      currentMinute: 0,
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'setup',
        sides: { home: { managerId: 'manager-home', displayName: 'Home Boss' } }
      }
    }));
    expect(setup.status).toBe(200);
    const setupSessionId = (await setup.json()).sessionId as string;

    const invalid = await submitPrivateSetupRoute(
      jsonRequest(`http://localhost/api/replay-sessions/${setupSessionId}/private-setup`, {
        side: 'home',
        draft: { clubId: '', tacticShellId: 'balanced-442', readinessIntent: 'ready_to_lock' }
      }),
      { params: Promise.resolve({ sessionId: setupSessionId }) }
    );
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toEqual({ error: 'draft.clubId must be a non-empty string' });

    const missing = await submitPrivateSetupRoute(
      jsonRequest('http://localhost/api/replay-sessions/rs-missing/private-setup', {
        side: 'home',
        draft: { clubId: 'internazionale-2002', tacticShellId: 'balanced-442', readinessIntent: 'editing' }
      }),
      { params: Promise.resolve({ sessionId: 'rs-missing' }) }
    );
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: 'Replay session not found: rs-missing' });

    const unassigned = await submitPrivateSetupRoute(
      jsonRequest(`http://localhost/api/replay-sessions/${setupSessionId}/private-setup`, {
        side: 'away',
        draft: { clubId: 'milan-2002', tacticShellId: 'compact-451', readinessIntent: 'editing' }
      }),
      { params: Promise.resolve({ sessionId: setupSessionId }) }
    );
    expect(unassigned.status).toBe(400);
    expect(await unassigned.json()).toEqual({ error: 'Private setup drafts can only be stored for assigned sides' });

    const locked = await createReplaySessionRoute(jsonRequest('http://localhost/api/replay-sessions', {
      seed: 176,
      currentMinute: 0,
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'locked',
        sides: {
          home: { managerId: 'manager-home', displayName: 'Home Boss' },
          away: { managerId: 'manager-away', displayName: 'Away Boss' }
        }
      }
    }));
    expect(locked.status).toBe(200);
    const lockedSessionId = (await locked.json()).sessionId as string;
    const nonSetup = await submitPrivateSetupRoute(
      jsonRequest(`http://localhost/api/replay-sessions/${lockedSessionId}/private-setup`, {
        side: 'home',
        draft: { clubId: 'internazionale-2002', tacticShellId: 'balanced-442', readinessIntent: 'editing' }
      }),
      { params: Promise.resolve({ sessionId: lockedSessionId }) }
    );
    expect(nonSetup.status).toBe(400);
    expect(await nonSetup.json()).toEqual({ error: 'Private setup drafts can only be stored while setup is open' });
  });

  it('transitions replay session lobby state through the Next route wrapper', async () => {
    const created = await createReplaySessionRoute(jsonRequest('http://localhost/api/replay-sessions', { seed: 172, currentMinute: 50 }));
    expect(created.status).toBe(200);
    const createdBody = await created.json();
    const sessionId = createdBody.sessionId as string;

    const transitioned = await transitionReplaySessionLobbyStateRoute(
      jsonRequest(`http://localhost/api/replay-sessions/${sessionId}/lobby-state`, { lobbyState: 'complete' }),
      { params: Promise.resolve({ sessionId }) }
    );

    expect(transitioned.status).toBe(200);
    expect(await transitioned.json()).toEqual({
      sessionId,
      lobbyState: 'complete',
      ownership: {
        mode: 'single_manager',
        lobbyState: 'complete',
        sides: { home: { managerId: 'local-home', displayName: 'Local manager' } }
      }
    });

    const summary = await getReplaySessionRoute(
      new Request(`http://localhost/api/replay-sessions/${sessionId}`, { method: 'GET' }),
      { params: Promise.resolve({ sessionId }) }
    );
    expect(await summary.json()).toEqual(expect.objectContaining({ sessionId, lobbyState: 'complete' }));
  });
});
