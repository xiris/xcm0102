'use client';

import { useMemo, useState } from 'react';
import { createHeadToHeadLobbyReadModel, createHeadToHeadLobbyRequest } from './headToHeadLobbyModel';
import { joinAwayManagerAndRefreshSummaryFromWeb } from './headToHeadLobbyJoinFlow';
import { createReplaySessionFromWeb, getReplaySessionSummaryFromWeb } from './replaySessionClient';
import { createReplaySessionLobbyStatusViewModel, type ReplaySessionLobbySummary } from './replaySessionLobbyStatusViewModel';
import { LobbyStatusCard } from './MatchLab';

export function HeadToHeadLobbyEntry() {
  const [homeManagerName, setHomeManagerName] = useState('Home Manager');
  const [awayManagerName, setAwayManagerName] = useState('Away Manager');
  const [lookupSessionId, setLookupSessionId] = useState('');
  const [summary, setSummary] = useState<ReplaySessionLobbySummary | null>(null);
  const [statusCopy, setStatusCopy] = useState('Create a head-to-head setup lobby or view an existing lobby by session ID.');
  const [errorCopy, setErrorCopy] = useState<string | null>(null);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const lobbyStatus = useMemo(() => (summary ? createReplaySessionLobbyStatusViewModel(summary) : null), [summary]);
  const lobbyReadModel = useMemo(() => (summary ? createHeadToHeadLobbyReadModel(summary) : null), [summary]);

  async function createLobby() {
    setPendingLabel('Create lobby');
    setErrorCopy(null);
    setStatusCopy('Creating head-to-head lobby...');
    try {
      const created = await createReplaySessionFromWeb(createHeadToHeadLobbyRequest({ homeManagerName }));
      const refreshedSummary = await getReplaySessionSummaryFromWeb(created.sessionId);
      setSummary(refreshedSummary);
      setLookupSessionId(created.sessionId);
      setStatusCopy(`Created lobby ${created.sessionId}. Share the invite code with an opponent.`);
    } catch (error) {
      setErrorCopy(error instanceof Error ? error.message : 'Replay session request failed: unknown lobby creation error');
      setStatusCopy('Head-to-head lobby creation failed.');
    } finally {
      setPendingLabel(null);
    }
  }

  async function viewLobby() {
    const sessionId = lookupSessionId.trim();
    if (sessionId.length === 0) {
      setErrorCopy('Enter an existing lobby session ID.');
      return;
    }
    setPendingLabel('View lobby');
    setErrorCopy(null);
    setStatusCopy(`Loading lobby ${sessionId}...`);
    try {
      const refreshedSummary = await getReplaySessionSummaryFromWeb(sessionId);
      setSummary(refreshedSummary);
      setStatusCopy(`Loaded lobby ${sessionId}.`);
    } catch (error) {
      setErrorCopy(error instanceof Error ? error.message : 'Replay session request failed: unknown lobby lookup error');
      setStatusCopy('Head-to-head lobby lookup failed.');
    } finally {
      setPendingLabel(null);
    }
  }

  async function joinAwayManager() {
    const sessionId = lookupSessionId.trim();
    if (sessionId.length === 0) {
      setErrorCopy('Enter an existing lobby session ID before joining.');
      return;
    }
    setPendingLabel('Join as away manager');
    setErrorCopy(null);
    setStatusCopy(`Joining lobby ${sessionId} as away manager...`);
    try {
      const refreshedSummary = await joinAwayManagerAndRefreshSummaryFromWeb({ sessionId, awayManagerName });
      setSummary(refreshedSummary);
      setStatusCopy(`Joined lobby ${sessionId} as away manager.`);
    } catch (error) {
      setErrorCopy(error instanceof Error ? error.message : 'Replay session request failed: unknown away join error');
      setStatusCopy('Away manager join failed.');
    } finally {
      setPendingLabel(null);
    }
  }

  return (
    <main className="shell head-to-head-lobby-entry">
      <section className="hero">
        <p>Product lobby entry</p>
        <h1>Head-to-head lobby</h1>
        <p>Create a setup lobby for a home manager, or read an existing lobby by session ID before join mutations are introduced.</p>
      </section>

      <section className="panel-grid">
        <article className="info-list">
          <div className="sectionheader">
            <p>CREATE</p>
            <h2>Create setup lobby</h2>
            <p>{statusCopy}</p>
          </div>
          {errorCopy ? <p className="error">{errorCopy}</p> : null}
          <label>
            Home manager name
            <input value={homeManagerName} onChange={(event) => setHomeManagerName(event.target.value)} />
          </label>
          <button type="button" onClick={createLobby} disabled={pendingLabel !== null}>
            {pendingLabel === 'Create lobby' ? 'Creating lobby...' : 'Create lobby'}
          </button>
        </article>

        <article className="info-list">
          <div className="sectionheader">
            <p>READ</p>
            <h2>View existing lobby</h2>
            <p>Paste an invite/session ID to inspect the server-owned lobby summary.</p>
          </div>
          <label>
            Existing lobby session ID
            <input value={lookupSessionId} onChange={(event) => setLookupSessionId(event.target.value)} placeholder="rs-000001" />
          </label>
          <button type="button" onClick={viewLobby} disabled={pendingLabel !== null}>
            {pendingLabel === 'View lobby' ? 'Viewing lobby...' : 'View lobby'}
          </button>
        </article>

        <article className="info-list">
          <div className="sectionheader">
            <p>JOIN</p>
            <h2>Join away side</h2>
            <p>Assign the away manager on a setup lobby before future setup-lock controls are available.</p>
          </div>
          <label>
            Away manager name
            <input value={awayManagerName} onChange={(event) => setAwayManagerName(event.target.value)} />
          </label>
          <button type="button" onClick={joinAwayManager} disabled={pendingLabel !== null}>
            {pendingLabel === 'Join as away manager' ? 'Joining away manager...' : 'Join as away manager'}
          </button>
        </article>
      </section>

      {lobbyReadModel && lobbyStatus ? (
        <section className="panel-grid">
          <article className="info-list">
            <div className="sectionheader">
              <p>LOBBY READ MODEL</p>
              <h2>{lobbyReadModel.title}</h2>
              <p>{lobbyReadModel.inviteLabel}</p>
            </div>
            <ul>
              <li>{lobbyReadModel.homeManagerLabel}</li>
              <li>{lobbyReadModel.awayManagerLabel}</li>
              <li>{lobbyReadModel.readinessLabel}</li>
            </ul>
            <p>{lobbyReadModel.readOnlyNotice}</p>
          </article>
          <article>
            <LobbyStatusCard status={lobbyStatus} />
          </article>
        </section>
      ) : null}
    </main>
  );
}
