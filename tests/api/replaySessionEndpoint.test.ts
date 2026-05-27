import { describe, expect, it } from 'vitest';
import {
  appendReplaySessionCommandForApi,
  createReplaySessionForApi,
  getReplaySessionSummaryForApi,
  joinAwayManagerForApi,
  resumeReplaySessionForApi,
  storeReplaySessionPrivateSetupDraftForApi,
  transitionReplaySessionLobbyStateForApi,
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

const awayCommand = {
  id: 'cmd-050-02-adjust-defensive-line',
  minute: 50,
  action: 'Adjust defensive line',
  eventType: 'goal',
  eventDescription: 'Away pause event.',
  effectSummary: 'Recorded intent: adjust defensive line at 50’.'
};

describe('replay session API helpers', () => {
  it('joins an away manager through the API helper', () => {
    const repository = createInMemoryReplaySessionRepository();
    const created = createReplaySessionForApi({
      seed: 81,
      currentMinute: 0,
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'setup',
        sides: { home: { managerId: 'manager-home', displayName: 'Home Boss' } }
      }
    }, repository);
    expect(created.status).toBe(200);
    if (!created.ok) throw new Error('expected session creation to pass');
    const sessionId = created.body.sessionId as string;

    expect(joinAwayManagerForApi({ sessionId, managerId: 'manager-away', displayName: 'Away Boss' }, repository)).toEqual({
      ok: true,
      status: 200,
      body: {
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
      }
    });
  });

  it('rejects invalid away manager API joins', () => {
    const repository = createInMemoryReplaySessionRepository();
    const created = createReplaySessionForApi({
      seed: 82,
      currentMinute: 0,
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'setup',
        sides: {
          home: { managerId: 'manager-home', displayName: 'Home Boss' },
          away: { managerId: 'manager-away', displayName: 'Away Boss' }
        }
      }
    }, repository);
    expect(created.status).toBe(200);
    if (!created.ok) throw new Error('expected session creation to pass');
    const sessionId = created.body.sessionId as string;

    expect(joinAwayManagerForApi({ sessionId, managerId: 'manager-next', displayName: 'Next Away' }, repository)).toEqual({
      ok: false,
      status: 400,
      body: { error: 'Away manager is already assigned for replay session' }
    });
    expect(joinAwayManagerForApi({ sessionId, managerId: '', displayName: 'Away Boss' }, repository)).toEqual({
      ok: false,
      status: 400,
      body: { error: 'managerId must be a non-empty string' }
    });
    expect(joinAwayManagerForApi({ sessionId: 'rs-missing', managerId: 'manager-away', displayName: 'Away Boss' }, repository)).toEqual({
      ok: false,
      status: 404,
      body: { error: 'Replay session not found: rs-missing' }
    });
  });

  it('stores private setup drafts through the API helper', () => {
    const repository = createInMemoryReplaySessionRepository();
    const created = createReplaySessionForApi({
      seed: 84,
      currentMinute: 0,
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'setup',
        sides: {
          home: { managerId: 'manager-home', displayName: 'Home Boss' },
          away: { managerId: 'manager-away', displayName: 'Away Boss' }
        }
      }
    }, repository);
    expect(created.status).toBe(200);
    if (!created.ok) throw new Error('expected session creation to pass');
    const sessionId = created.body.sessionId as string;

    expect(storeReplaySessionPrivateSetupDraftForApi({
      sessionId,
      side: 'home',
      draft: { clubId: 'internazionale-2002', tacticShellId: 'balanced-442', readinessIntent: 'editing' }
    }, repository)).toEqual({
      ok: true,
      status: 200,
      body: { sessionId, side: 'home', stored: true, revealState: 'hidden_until_lock' }
    });
    expect(repository.getSession(sessionId).privateSetupDrafts.home).toEqual(expect.objectContaining({
      side: 'home',
      clubId: 'internazionale-2002',
      tacticShellId: 'balanced-442',
      readinessIntent: 'editing'
    }));
  });

  it('rejects invalid private setup draft API requests', () => {
    const repository = createInMemoryReplaySessionRepository();
    const created = createReplaySessionForApi({
      seed: 85,
      currentMinute: 0,
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'setup',
        sides: { home: { managerId: 'manager-home', displayName: 'Home Boss' } }
      }
    }, repository);
    expect(created.status).toBe(200);
    if (!created.ok) throw new Error('expected session creation to pass');
    const sessionId = created.body.sessionId as string;

    expect(storeReplaySessionPrivateSetupDraftForApi({
      sessionId: '',
      side: 'home',
      draft: { clubId: 'internazionale-2002', tacticShellId: 'balanced-442', readinessIntent: 'editing' }
    }, repository)).toEqual({ ok: false, status: 400, body: { error: 'sessionId must be a non-empty string' } });
    expect(storeReplaySessionPrivateSetupDraftForApi({
      sessionId,
      side: 'neutral',
      draft: { clubId: 'internazionale-2002', tacticShellId: 'balanced-442', readinessIntent: 'editing' }
    }, repository)).toEqual({ ok: false, status: 400, body: { error: 'side must be home or away' } });
    expect(storeReplaySessionPrivateSetupDraftForApi({
      sessionId,
      side: 'home',
      draft: { clubId: '', tacticShellId: '', readinessIntent: 'done' }
    }, repository)).toEqual({
      ok: false,
      status: 400,
      body: { error: 'draft.clubId must be a non-empty string; draft.tacticShellId must be a non-empty string; draft.readinessIntent must be editing or ready_to_lock' }
    });
    expect(storeReplaySessionPrivateSetupDraftForApi({
      sessionId: 'rs-missing',
      side: 'home',
      draft: { clubId: 'internazionale-2002', tacticShellId: 'balanced-442', readinessIntent: 'editing' }
    }, repository)).toEqual({ ok: false, status: 404, body: { error: 'Replay session not found: rs-missing' } });
    expect(storeReplaySessionPrivateSetupDraftForApi({
      sessionId,
      side: 'away',
      draft: { clubId: 'milan-2002', tacticShellId: 'compact-451', readinessIntent: 'editing' }
    }, repository)).toEqual({ ok: false, status: 400, body: { error: 'Private setup drafts can only be stored for assigned sides' } });
  });

  it('redacts private setup drafts before setup lock and reveals both sides after lock', () => {
    const repository = createInMemoryReplaySessionRepository();
    const created = createReplaySessionForApi({
      seed: 86,
      currentMinute: 0,
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'setup',
        sides: {
          home: { managerId: 'manager-home', displayName: 'Home Boss' },
          away: { managerId: 'manager-away', displayName: 'Away Boss' }
        }
      }
    }, repository);
    expect(created.status).toBe(200);
    if (!created.ok) throw new Error('expected session creation to pass');
    const sessionId = created.body.sessionId as string;

    storeReplaySessionPrivateSetupDraftForApi({
      sessionId,
      side: 'home',
      draft: { clubId: 'internazionale-2002', tacticShellId: 'balanced-442', readinessIntent: 'editing' }
    }, repository);
    storeReplaySessionPrivateSetupDraftForApi({
      sessionId,
      side: 'away',
      draft: { clubId: 'milan-2002', tacticShellId: 'compact-451', readinessIntent: 'ready_to_lock' }
    }, repository);

    const preLock = getReplaySessionSummaryForApi({ sessionId }, repository);
    expect(preLock.ok).toBe(true);
    if (!preLock.ok) throw new Error('expected summary to pass');
    expect(preLock.body.privateSetup).toEqual({
      revealState: 'hidden_until_lock',
      sides: {
        home: { side: 'home', status: 'stored', detailVisibility: 'hidden', redactionLabel: 'Hidden until setup lock' },
        away: { side: 'away', status: 'stored', detailVisibility: 'hidden', redactionLabel: 'Hidden until setup lock' }
      }
    });
    expect(JSON.stringify(preLock.body.privateSetup)).not.toContain('internazionale-2002');
    expect(JSON.stringify(preLock.body.privateSetup)).not.toContain('ready_to_lock');
    expect(JSON.stringify(preLock.body.privateSetup)).not.toContain('updatedAt');

    transitionReplaySessionLobbyStateForApi({ sessionId, lobbyState: 'locked' }, repository);
    const locked = getReplaySessionSummaryForApi({ sessionId }, repository);
    expect(locked.ok).toBe(true);
    if (!locked.ok) throw new Error('expected locked summary to pass');
    expect(locked.body.privateSetup).toEqual({
      revealState: 'revealed_after_lock',
      sides: {
        home: {
          side: 'home',
          status: 'stored',
          detailVisibility: 'revealed',
          draft: expect.objectContaining({ side: 'home', clubId: 'internazionale-2002', tacticShellId: 'balanced-442', readinessIntent: 'editing', updatedAt: expect.any(String) })
        },
        away: {
          side: 'away',
          status: 'stored',
          detailVisibility: 'revealed',
          draft: expect.objectContaining({ side: 'away', clubId: 'milan-2002', tacticShellId: 'compact-451', readinessIntent: 'ready_to_lock', updatedAt: expect.any(String) })
        }
      }
    });
  });

  it('reveals missing private setup placeholders after lock', () => {
    const repository = createInMemoryReplaySessionRepository();
    const created = createReplaySessionForApi({
      seed: 87,
      currentMinute: 0,
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'setup',
        sides: {
          home: { managerId: 'manager-home', displayName: 'Home Boss' },
          away: { managerId: 'manager-away', displayName: 'Away Boss' }
        }
      }
    }, repository);
    expect(created.status).toBe(200);
    if (!created.ok) throw new Error('expected session creation to pass');
    const sessionId = created.body.sessionId as string;

    storeReplaySessionPrivateSetupDraftForApi({
      sessionId,
      side: 'home',
      draft: { clubId: 'internazionale-2002', tacticShellId: 'balanced-442', readinessIntent: 'editing' }
    }, repository);
    transitionReplaySessionLobbyStateForApi({ sessionId, lobbyState: 'locked' }, repository);

    const summary = getReplaySessionSummaryForApi({ sessionId }, repository);
    expect(summary.ok).toBe(true);
    if (!summary.ok) throw new Error('expected summary to pass');
    expect(summary.body.privateSetup).toEqual({
      revealState: 'revealed_after_lock',
      sides: {
        home: expect.objectContaining({ status: 'stored', detailVisibility: 'revealed' }),
        away: { side: 'away', status: 'missing', detailVisibility: 'revealed', missingLabel: 'No private setup draft stored' }
      }
    });
  });

  it('creates setup lobby sessions and advances them to kickoff readiness through the API helper', () => {
    const repository = createInMemoryReplaySessionRepository();

    const created = createReplaySessionForApi({
      seed: 71,
      currentMinute: 0,
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'setup',
        sides: {
          home: { managerId: 'manager-home', displayName: 'Home Boss' },
          away: { managerId: 'manager-away', displayName: 'Away Boss' }
        }
      }
    }, repository);

    expect(created.status).toBe(200);
    if (!created.ok) throw new Error('expected setup session creation to pass');
    const sessionId = created.body.sessionId as string;
    expect(getReplaySessionSummaryForApi({ sessionId }, repository).body).toEqual(expect.objectContaining({
      sessionId,
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'setup',
        sides: {
          home: { managerId: 'manager-home', displayName: 'Home Boss' },
          away: { managerId: 'manager-away', displayName: 'Away Boss' }
        }
      },
      lobbyState: 'setup',
      commandCounts: { home: 0, away: 0 }
    }));

    expect(transitionReplaySessionLobbyStateForApi({ sessionId, lobbyState: 'locked' }, repository)).toEqual(expect.objectContaining({
      ok: true,
      body: expect.objectContaining({ lobbyState: 'locked' })
    }));
    expect(transitionReplaySessionLobbyStateForApi({ sessionId, lobbyState: 'in_match' }, repository)).toEqual(expect.objectContaining({
      ok: true,
      body: expect.objectContaining({ lobbyState: 'in_match' })
    }));
    expect(getReplaySessionSummaryForApi({ sessionId }, repository).body).toEqual(expect.objectContaining({
      lobbyState: 'in_match',
      ownership: expect.objectContaining({ lobbyState: 'in_match' })
    }));
  });

  it('includes a compact result preview in replay session summaries', () => {
    const repository = createInMemoryReplaySessionRepository();
    const created = createReplaySessionForApi({ seed: 71, currentMinute: 0 }, repository);
    expect(created.status).toBe(200);
    if (!created.ok) throw new Error('expected session creation to pass');
    const sessionId = created.body.sessionId as string;
    const stored = repository.getSession(sessionId);

    const summary = getReplaySessionSummaryForApi({ sessionId }, repository);

    expect(summary).toEqual(expect.objectContaining({ ok: true, status: 200 }));
    if (!summary.ok) throw new Error('expected summary to pass');
    expect(summary.body.resultPreview).toEqual({
      score: stored.initialResult.score,
      teams: {
        home: stored.baseInput.home.name,
        away: stored.baseInput.away.name
      },
      stats: stored.initialResult.stats,
      eventCount: stored.initialResult.events.length,
      replay: stored.initialResult.report.replay
    });
  });

  it('rejects setup lock through the API helper until both head-to-head managers are assigned', () => {
    const repository = createInMemoryReplaySessionRepository();
    const created = createReplaySessionForApi({
      seed: 83,
      currentMinute: 0,
      ownership: {
        mode: 'head_to_head',
        lobbyState: 'setup',
        sides: { home: { managerId: 'manager-home', displayName: 'Home Boss' } }
      }
    }, repository);
    expect(created.status).toBe(200);
    if (!created.ok) throw new Error('expected session creation to pass');
    const sessionId = created.body.sessionId as string;

    expect(transitionReplaySessionLobbyStateForApi({ sessionId, lobbyState: 'locked' }, repository)).toEqual({
      ok: false,
      status: 400,
      body: { error: 'Cannot lock setup until both managers are assigned' }
    });
    expect(getReplaySessionSummaryForApi({ sessionId }, repository).body).toEqual(expect.objectContaining({ lobbyState: 'setup' }));
  });

  it('transitions replay session lobby state through the API helper', () => {
    const repository = createInMemoryReplaySessionRepository();
    const created = createReplaySessionForApi({ seed: 71, currentMinute: 50 }, repository);
    if (!created.ok) throw new Error('expected session creation to pass');
    const sessionId = created.body.sessionId as string;

    const transitioned = transitionReplaySessionLobbyStateForApi({ sessionId, lobbyState: 'complete' }, repository);

    expect(transitioned).toEqual({
      ok: true,
      status: 200,
      body: {
        sessionId,
        lobbyState: 'complete',
        ownership: {
          mode: 'single_manager',
          lobbyState: 'complete',
          sides: { home: { managerId: 'local-home', displayName: 'Local manager' } }
        }
      }
    });
    expect(getReplaySessionSummaryForApi({ sessionId }, repository).body).toEqual(expect.objectContaining({ lobbyState: 'complete' }));
  });

  it('rejects invalid replay session lobby state requests', () => {
    const repository = createInMemoryReplaySessionRepository();
    const created = createReplaySessionForApi({ seed: 71, currentMinute: 50 }, repository);
    if (!created.ok) throw new Error('expected session creation to pass');
    const sessionId = created.body.sessionId as string;

    expect(transitionReplaySessionLobbyStateForApi({ sessionId, lobbyState: 'paused' }, repository)).toEqual({
      ok: false,
      status: 400,
      body: { error: 'lobbyState must be setup locked in_match or complete' }
    });
    expect(transitionReplaySessionLobbyStateForApi({ sessionId, lobbyState: 'locked' }, repository)).toEqual({
      ok: false,
      status: 400,
      body: { error: 'Invalid replay session lobby transition: in_match -> locked' }
    });
    expect(transitionReplaySessionLobbyStateForApi({ sessionId: 'rs-missing', lobbyState: 'complete' }, repository)).toEqual({
      ok: false,
      status: 404,
      body: { error: 'Replay session not found: rs-missing' }
    });
  });

  it('applies away-side replay session commands independently from home commands', () => {
    const repository = createInMemoryReplaySessionRepository();
    const created = createReplaySessionForApi({ seed: 71, currentMinute: 50 }, repository);
    if (!created.ok) throw new Error('expected session creation to pass');
    const sessionId = created.body.sessionId as string;

    const homeAppend = appendReplaySessionCommandForApi({ sessionId, command }, repository);
    const awayAppend = appendReplaySessionCommandForApi({ sessionId, side: 'away', command: awayCommand }, repository);

    expect(homeAppend).toEqual({
      ok: true,
      status: 200,
      body: { sessionId, commandCount: 1, commandCounts: { home: 1, away: 0 } }
    });
    expect(awayAppend).toEqual({
      ok: true,
      status: 200,
      body: { sessionId, commandCount: 2, commandCounts: { home: 1, away: 1 } }
    });
    expect(repository.getSession(sessionId).sideManagerCommands).toEqual({ home: [command], away: [awayCommand] });

    const stored = repository.getSession(sessionId);
    syncReplaySessionVisibleEventsForApi({ sessionId, visibleEvents: stored.visibleEvents }, repository);
    const resumed = resumeReplaySessionForApi({ sessionId, currentMinute: 50 }, repository);

    expect(resumed.status).toBe(200);
    expect(resumed.body).toEqual(expect.objectContaining({
      authoritative: true,
      diagnostics: expect.arrayContaining([
        '50’ home change_pressing command set pressing to high for regenerated future simulation.',
        '50’ away change_transition_style command set transition style to hold_shape for regenerated future simulation.'
      ]),
      replay: expect.objectContaining({ commandCount: 2 })
    }));
  });

  it('rejects invalid replay session command sides', () => {
    const repository = createInMemoryReplaySessionRepository();
    const created = createReplaySessionForApi({ seed: 71, currentMinute: 50 }, repository);
    if (!created.ok) throw new Error('expected session creation to pass');
    const sessionId = created.body.sessionId as string;

    expect(appendReplaySessionCommandForApi({ sessionId, side: 'bench', command }, repository)).toEqual({
      ok: false,
      status: 400,
      body: { error: 'side must be home or away' }
    });
  });

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

  it('resumes custom tactical sessions after storage hydration', () => {
    const repository = createInMemoryReplaySessionRepository();
    const request = {
      seed: 119,
      homeFormation: '5-3-2',
      awayFormation: '3-5-2',
      homeMentality: 'defensive',
      awayMentality: 'attacking',
      homePressing: 'low',
      awayPressing: 'high',
      homeFamiliarity: 0.92,
      awayFamiliarity: 0.35,
      homeMovement: 'compact',
      awayMovement: 'extreme',
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
    const created = createReplaySessionForApi(request, repository);
    if (!created.ok) throw new Error(created.body.error);
    const sessionId = created.body.sessionId as string;
    const stored = repository.getSession(sessionId);
    repository.appendManagerCommand(sessionId, {
      id: 'cmd-045-01-change-pressing',
      minute: 45,
      action: 'Change pressing',
      eventType: 'goal',
      eventDescription: 'Half-time tactical reset.',
      effectSummary: 'Recorded intent: change pressing at 45’.'
    });
    repository.replaceVisibleEvents(sessionId, stored.visibleEvents);

    const originalResume = resumeReplaySessionForApi({ sessionId, currentMinute: 45 }, repository);
    const hydrated = createInMemoryReplaySessionRepository();
    hydrated.hydrateStorageRecords(repository.listStorageRecords());
    const hydratedResume = resumeReplaySessionForApi({ sessionId, currentMinute: 45 }, hydrated);

    expect(hydratedResume).toEqual(originalResume);
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
      body: { sessionId, commandCount: 1, commandCounts: { home: 1, away: 0 } }
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

  it('returns replay session ownership summary without private session internals', () => {
    const repository = createInMemoryReplaySessionRepository();
    const created = createReplaySessionForApi({ seed: 71, currentMinute: 50 }, repository);
    if (!created.ok) throw new Error('expected session creation to pass');
    const sessionId = created.body.sessionId as string;

    appendReplaySessionCommandForApi({ sessionId, side: 'away', command: awayCommand }, repository);
    const resumed = resumeReplaySessionForApi({ sessionId, currentMinute: 50 }, repository);
    expect(resumed.status).toBe(200);
    if (!resumed.ok) throw new Error('expected session resume to pass');
    const signature = resumed.body.signature as string;

    const summary = getReplaySessionSummaryForApi({ sessionId }, repository);

    expect(summary).toEqual({
      ok: true,
      status: 200,
      body: {
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
        latestAuthoritativeSignature: signature,
        resultPreview: expect.objectContaining({
          score: expect.objectContaining({ home: expect.any(Number), away: expect.any(Number) }),
          teams: { home: 'Internazionale 2002', away: 'Milan 2002' },
          eventCount: expect.any(Number),
          replay: expect.objectContaining({ seed: 71 })
        }),
        privateSetup: {
          revealState: 'revealed_after_lock',
          sides: {
            home: { side: 'home', status: 'missing', detailVisibility: 'revealed', missingLabel: 'No private setup draft stored' },
            away: { side: 'away', status: 'missing', detailVisibility: 'revealed', missingLabel: 'No private setup draft stored' }
          }
        }
      }
    });
    expect(summary.body).not.toHaveProperty('baseInput');
    expect(summary.body).not.toHaveProperty('initialResult');
    expect(summary.body).not.toHaveProperty('visibleEvents');
    expect(summary.body).not.toHaveProperty('managerCommands');
    expect(summary.body).not.toHaveProperty('sideManagerCommands');
    expect(summary.body).not.toHaveProperty('privateSetupDrafts');
    expect(summary.body).not.toHaveProperty('auditLog');
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
