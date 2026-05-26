'use client';

import { useMemo, useState } from 'react';
import { createHeadToHeadLobbyReadModel, createHeadToHeadLobbyRequest } from './headToHeadLobbyModel';
import { completeHeadToHeadMatchAndRefreshSummaryFromWeb } from './headToHeadLobbyCompletionFlow';
import { joinAwayManagerAndRefreshSummaryFromWeb } from './headToHeadLobbyJoinFlow';
import { kickOffHeadToHeadMatchAndRefreshSummaryFromWeb } from './headToHeadLobbyKickoffFlow';
import { lockHeadToHeadSetupAndRefreshSummaryFromWeb } from './headToHeadLobbyLockFlow';
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
  const lobbyStatus = useMemo(() => {
    if (!summary) return null;
    const status = createReplaySessionLobbyStatusViewModel(summary);
    if (summary.lobbyState !== 'in_match') return status;
    return {
      ...status,
      actionAvailability: {
        headline: 'Product follow-up actions',
        helperText: 'The match is active. Use the product Complete match control to close the authoritative result.',
        actions: []
      }
    };
  }, [summary]);
  const lobbyReadModel = useMemo(() => (summary ? createHeadToHeadLobbyReadModel(summary) : null), [summary]);
  const setupLockReady = summary?.lobbyState === 'setup' && summary.ownership.sides.home !== undefined && summary.ownership.sides.away !== undefined;
  const kickoffReady = summary?.lobbyState === 'locked';
  const completionReady = summary?.lobbyState === 'in_match';

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

  async function lockSetup() {
    const sessionId = lookupSessionId.trim();
    if (sessionId.length === 0) {
      setErrorCopy('Enter an existing lobby session ID before locking setup.');
      return;
    }
    setPendingLabel('Lock setup');
    setErrorCopy(null);
    setStatusCopy(`Locking setup for lobby ${sessionId}...`);
    try {
      const refreshedSummary = await lockHeadToHeadSetupAndRefreshSummaryFromWeb({ sessionId });
      setSummary(refreshedSummary);
      setStatusCopy(`Locked setup for lobby ${sessionId}.`);
    } catch (error) {
      setErrorCopy(error instanceof Error ? error.message : 'Replay session request failed: unknown setup lock error');
      setStatusCopy('Setup lock failed.');
    } finally {
      setPendingLabel(null);
    }
  }

  async function kickOffMatch() {
    const sessionId = lookupSessionId.trim();
    if (sessionId.length === 0) {
      setErrorCopy('Enter an existing lobby session ID before kickoff.');
      return;
    }
    setPendingLabel('Kick off match');
    setErrorCopy(null);
    setStatusCopy(`Kicking off match for lobby ${sessionId}...`);
    try {
      const refreshedSummary = await kickOffHeadToHeadMatchAndRefreshSummaryFromWeb({ sessionId });
      setSummary(refreshedSummary);
      setStatusCopy(`Kicked off match for lobby ${sessionId}.`);
    } catch (error) {
      setErrorCopy(error instanceof Error ? error.message : 'Replay session request failed: unknown kickoff error');
      setStatusCopy('Kickoff failed.');
    } finally {
      setPendingLabel(null);
    }
  }

  async function completeMatch() {
    const sessionId = lookupSessionId.trim();
    if (sessionId.length === 0) {
      setErrorCopy('Enter an existing lobby session ID before completing the match.');
      return;
    }
    setPendingLabel('Complete match');
    setErrorCopy(null);
    setStatusCopy(`Completing match for lobby ${sessionId}...`);
    try {
      const refreshedSummary = await completeHeadToHeadMatchAndRefreshSummaryFromWeb({ sessionId });
      setSummary(refreshedSummary);
      setStatusCopy(`Completed match for lobby ${sessionId}.`);
    } catch (error) {
      setErrorCopy(error instanceof Error ? error.message : 'Replay session request failed: unknown completion error');
      setStatusCopy('Match completion failed.');
    } finally {
      setPendingLabel(null);
    }
  }

  return (
    <main className="shell head-to-head-lobby-entry">
      <section className="hero">
        <p>Product lobby entry</p>
        <h1>Head-to-head lobby</h1>
        <p>Create a setup lobby for a home manager, join an away manager, lock setup, kick off, then complete the match.</p>
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
            <p>Assign the away manager on a setup lobby before the setup can be locked.</p>
          </div>
          <label>
            Away manager name
            <input value={awayManagerName} onChange={(event) => setAwayManagerName(event.target.value)} />
          </label>
          <button type="button" onClick={joinAwayManager} disabled={pendingLabel !== null}>
            {pendingLabel === 'Join as away manager' ? 'Joining away manager...' : 'Join as away manager'}
          </button>
        </article>

        <article className="info-list">
          <div className="sectionheader">
            <p>LOCK</p>
            <h2>Lock setup</h2>
            <p>{setupLockReady ? 'Both managers are assigned. Lock setup when tactics and lineups are ready.' : 'Assign both managers before locking setup.'}</p>
          </div>
          <button type="button" onClick={lockSetup} disabled={pendingLabel !== null || !setupLockReady}>
            {pendingLabel === 'Lock setup' ? 'Locking setup...' : 'Lock setup'}
          </button>
        </article>

        <article className="info-list">
          <div className="sectionheader">
            <p>KICKOFF</p>
            <h2>Kick off match</h2>
            <p>{kickoffReady ? 'Setup is locked. Kick off when both managers are ready to start.' : 'Lock setup before kicking off the match.'}</p>
          </div>
          <button type="button" onClick={kickOffMatch} disabled={pendingLabel !== null || !kickoffReady}>
            {pendingLabel === 'Kick off match' ? 'Kicking off match...' : 'Kick off match'}
          </button>
        </article>

        {completionReady ? (
          <article className="info-list">
            <div className="sectionheader">
              <p>RESULT</p>
              <h2>Complete match</h2>
              <p>The match is in progress. Complete it to close the authoritative result.</p>
            </div>
            <button type="button" onClick={completeMatch} disabled={pendingLabel !== null}>
              {pendingLabel === 'Complete match' ? 'Completing match...' : 'Complete match'}
            </button>
          </article>
        ) : null}
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
