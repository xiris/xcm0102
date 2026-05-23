'use client';

import { useMemo, useState } from 'react';
import { createReplaySessionFromWeb, getReplaySessionSummaryFromWeb } from './replaySessionClient';
import { LobbyMutationControls } from './LobbyMutationControls';
import { LobbyStatusCard } from './MatchLab';
import { createLobbyTransitionHarnessSetupRequest } from './lobbyTransitionHarnessModel';
import { applyReplaySessionLobbyTransitionFromWeb } from './replaySessionLobbyMutationFlow';
import { createReplaySessionLobbyStatusViewModel, type ReplaySessionLobbyAction, type ReplaySessionLobbySummary } from './replaySessionLobbyStatusViewModel';

const invalidKickoffAction: ReplaySessionLobbyAction = {
  id: 'kickoff',
  label: 'Kick off match',
  targetLobbyState: 'in_match',
  available: true
};

export function LobbyTransitionHarness() {
  const [summary, setSummary] = useState<ReplaySessionLobbySummary | null>(null);
  const [statusCopy, setStatusCopy] = useState('No setup lobby has been created yet.');
  const [errorCopy, setErrorCopy] = useState<string | null>(null);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const status = useMemo(() => (summary ? createReplaySessionLobbyStatusViewModel(summary) : null), [summary]);

  async function createSetupLobby() {
    setPendingLabel('Create setup lobby');
    setErrorCopy(null);
    setStatusCopy('Creating setup lobby...');
    try {
      const created = await createReplaySessionFromWeb(createLobbyTransitionHarnessSetupRequest());
      const refreshedSummary = await getReplaySessionSummaryFromWeb(created.sessionId);
      setSummary(refreshedSummary);
      setStatusCopy(`Created setup lobby ${created.sessionId}.`);
    } catch (error) {
      setErrorCopy(error instanceof Error ? error.message : 'Replay session request failed: unknown harness setup error');
      setStatusCopy('Setup lobby creation failed.');
    } finally {
      setPendingLabel(null);
    }
  }

  async function requestTransition(action: ReplaySessionLobbyAction) {
    if (!summary) return;
    setPendingLabel(action.label);
    setErrorCopy(null);
    try {
      const refreshedSummary = await applyReplaySessionLobbyTransitionFromWeb({ sessionId: summary.sessionId, action });
      setSummary(refreshedSummary);
      setStatusCopy(`Replay session lobby transitioned to ${refreshedSummary.lobbyState}.`);
    } catch (error) {
      setErrorCopy(error instanceof Error ? error.message : 'Replay session request failed: unknown lobby transition error');
    } finally {
      setPendingLabel(null);
    }
  }

  async function requestInvalidKickoff() {
    if (!summary) return;
    setPendingLabel('Try invalid kickoff');
    setErrorCopy(null);
    try {
      const refreshedSummary = await applyReplaySessionLobbyTransitionFromWeb({ sessionId: summary.sessionId, action: invalidKickoffAction });
      setSummary(refreshedSummary);
      setStatusCopy(`Replay session lobby transitioned to ${refreshedSummary.lobbyState}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Replay session request failed: unknown invalid kickoff error';
      setErrorCopy(message);
      setStatusCopy(`Invalid kickoff rejected: ${message}`);
    } finally {
      setPendingLabel(null);
    }
  }

  return (
    <main className="shell lobby-transition-harness">
      <section className="hero">
        <p>Server-backed lobby smoke route</p>
        <h1>Lobby transition harness</h1>
        <p>Create a setup lobby, prove invalid rejection copy, then advance through setup lock and kickoff using the same guarded mutation controls.</p>
      </section>

      <section className="panel-grid">
        <article className="info-list">
          <div className="sectionheader">
            <p>HARNESS CONTROLS</p>
            <h2>Server-backed setup lobby</h2>
            <p>{statusCopy}</p>
          </div>
          {errorCopy ? <p className="error">{errorCopy}</p> : null}
          <div className="harness-actions">
            <button type="button" onClick={createSetupLobby} disabled={pendingLabel !== null}>
              {pendingLabel === 'Create setup lobby' ? 'Creating setup lobby...' : 'Create setup lobby'}
            </button>
            <button type="button" onClick={requestInvalidKickoff} disabled={!summary || pendingLabel !== null}>
              {pendingLabel === 'Try invalid kickoff' ? 'Trying invalid kickoff...' : 'Try invalid kickoff'}
            </button>
          </div>
        </article>

        {status ? (
          <article>
            <LobbyStatusCard status={status} />
            <LobbyMutationControls
              status={status}
              isPending={pendingLabel !== null && pendingLabel !== 'Create setup lobby' && pendingLabel !== 'Try invalid kickoff'}
              error={errorCopy}
              onTransition={requestTransition}
            />
          </article>
        ) : (
          <article className="info-list">
            <h2>No setup lobby has been created yet.</h2>
            <p>Use Create setup lobby to create a head-to-head replay session with both managers assigned.</p>
          </article>
        )}
      </section>
    </main>
  );
}
