'use client';

import { FormEvent, useMemo, useState } from 'react';
import { getFormationGeometry } from '../simulation/formationGeometry';
import { createInteractiveMatchState } from '../simulation/interactiveTimeline';
import { appendManagerCommand, type ManagerCommand } from '../simulation/managerCommands';
import {
  createAssignmentState,
  movePlayerToSlot,
  resetAssignmentsForFormation,
  roleMismatchWarnings,
  type AssignmentState
} from './assignmentState';
import { createFormationPreview, type FormationPreview } from './formationPreview';
import { createInteractiveReplayViewModel, formatAuthoritativeReplay } from './interactiveReplayViewModel';
import {
  createMatchLabLayoutViewModel,
  groupMatchStatRows,
  type MatchLabSection
} from './matchLabLayoutViewModel';
import { createMatchResultViewModel } from './matchResultViewModel';
import { createPitchAssignmentViewModel, type PitchAssignmentViewModel } from './pitchAssignmentViewModel';
import {
  appendReplaySessionCommandFromWeb,
  createReplaySessionFromWeb,
  resumeReplaySessionFromWeb,
  syncReplaySessionVisibleEventsFromWeb
} from './replaySessionClient';
import { createPlayerAttributeCards, type PlayerAttributeCard } from './playerAttributeCards';
import { buildSimulationPayload, defaultTacticalState } from './tacticalPayload';
import {
  simulateMatchFromWeb,
  type Formation,
  type Mentality,
  type MovementStyle,
  type Pressing,
  type TeamQuality,
  type TransitionStyle,
  type WebSimulationResult
} from './simulationClient';

const qualities: TeamQuality[] = ['weak', 'average', 'strong'];
const movements: MovementStyle[] = ['compact', 'balanced', 'extreme'];
const formations: Formation[] = ['4-4-2', '4-1-3-2', '4-3-3', '3-5-2', '5-3-2'];
const mentalities: Mentality[] = ['defensive', 'balanced', 'attacking'];
const pressings: Pressing[] = ['low', 'medium', 'high'];
const transitionStyles: TransitionStyle[] = ['hold_shape', 'balanced', 'fast_break'];

export function MatchLab() {
  const defaults = defaultTacticalState();
  const [seed, setSeed] = useState(defaults.seed);
  const [homeQuality, setHomeQuality] = useState<TeamQuality>(defaults.homeQuality);
  const [awayQuality, setAwayQuality] = useState<TeamQuality>(defaults.awayQuality);
  const [homeFamiliarity, setHomeFamiliarity] = useState(defaults.homeFamiliarity);
  const [awayFamiliarity, setAwayFamiliarity] = useState(defaults.awayFamiliarity);
  const [homeMovement, setHomeMovement] = useState<MovementStyle>(defaults.homeMovement);
  const [awayMovement, setAwayMovement] = useState<MovementStyle>(defaults.awayMovement);
  const [homeFormation, setHomeFormationState] = useState<Formation>(defaults.homeFormation);
  const [awayFormation, setAwayFormationState] = useState<Formation>(defaults.awayFormation);
  const [homeAssignments, setHomeAssignments] = useState(() => createAssignmentState('home', defaults.homeFormation));
  const [awayAssignments, setAwayAssignments] = useState(() => createAssignmentState('away', defaults.awayFormation));
  const [homeMentality, setHomeMentality] = useState<Mentality>(defaults.homeMentality);
  const [awayMentality, setAwayMentality] = useState<Mentality>(defaults.awayMentality);
  const [homePressing, setHomePressing] = useState<Pressing>(defaults.homePressing);
  const [awayPressing, setAwayPressing] = useState<Pressing>(defaults.awayPressing);
  const [homeTransitionStyle, setHomeTransitionStyle] = useState<TransitionStyle>(defaults.homeTransitionStyle);
  const [awayTransitionStyle, setAwayTransitionStyle] = useState<TransitionStyle>(defaults.awayTransitionStyle);
  const [result, setResult] = useState<WebSimulationResult | null>(null);
  const [isInteractiveReplay, setIsInteractiveReplay] = useState(false);
  const [interactiveMinute, setInteractiveMinute] = useState(0);
  const [managerCommands, setManagerCommands] = useState<ManagerCommand[]>([]);
  const [authoritativeReplay, setAuthoritativeReplay] = useState<string[]>([]);
  const [authoritativeError, setAuthoritativeError] = useState<string | null>(null);
  const [isAuthoritativeLoading, setIsAuthoritativeLoading] = useState(false);
  const [replaySessionId, setReplaySessionId] = useState<string | null>(null);
  const [replaySessionStatus, setReplaySessionStatus] = useState<string>('Replay session: not created yet.');
  const [replaySessionError, setReplaySessionError] = useState<string | null>(null);
  const [replaySessionVisibleEventCount, setReplaySessionVisibleEventCount] = useState(0);
  const [replaySessionCommandCount, setReplaySessionCommandCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const layout = useMemo(() => createMatchLabLayoutViewModel(), []);
  const section = (id: (typeof layout.sections)[number]['id']) => layout.sections.find((item) => item.id === id)!;
  const viewModel = useMemo(() => (result ? createMatchResultViewModel(result) : null), [result]);
  const statGroups = useMemo(() => (viewModel ? groupMatchStatRows(viewModel.statRows) : []), [viewModel]);
  const interactiveState = useMemo(() => (result && isInteractiveReplay ? createInteractiveMatchState(result, { currentMinute: interactiveMinute }) : null), [interactiveMinute, isInteractiveReplay, result]);
  const interactiveViewModel = useMemo(() => (interactiveState && result ? createInteractiveReplayViewModel(interactiveState, managerCommands, result.events) : null), [interactiveState, managerCommands, result]);
  const homeFormationPreview = useMemo(() => createFormationPreview(homeFormation, homeAssignments), [homeFormation, homeAssignments]);
  const awayFormationPreview = useMemo(() => createFormationPreview(awayFormation, awayAssignments), [awayFormation, awayAssignments]);
  const homePitch = useMemo(() => createPitchAssignmentViewModel(homeAssignments), [homeAssignments]);
  const awayPitch = useMemo(() => createPitchAssignmentViewModel(awayAssignments), [awayAssignments]);
  const homePlayerCards = useMemo(() => createPlayerAttributeCards(homeAssignments), [homeAssignments]);
  const awayPlayerCards = useMemo(() => createPlayerAttributeCards(awayAssignments), [awayAssignments]);
  const homeWarnings = useMemo(() => roleMismatchWarnings(homeAssignments), [homeAssignments]);
  const awayWarnings = useMemo(() => roleMismatchWarnings(awayAssignments), [awayAssignments]);
  const replayMetadata = useMemo(() => [
    ...(viewModel?.replay ?? []),
    replaySessionId ? `Replay session: ${replaySessionId}` : replaySessionStatus,
    `Session visible events: ${replaySessionVisibleEventCount}`,
    `Session command count: ${replaySessionCommandCount}`,
    ...(replaySessionError ? [`Replay session error: ${replaySessionError}`] : [])
  ], [replaySessionCommandCount, replaySessionError, replaySessionId, replaySessionStatus, replaySessionVisibleEventCount, viewModel]);

  function setHomeFormation(formation: Formation) {
    setHomeFormationState(formation);
    setHomeAssignments((current) => resetAssignmentsForFormation(current, formation));
  }

  function setAwayFormation(formation: Formation) {
    setAwayFormationState(formation);
    setAwayAssignments((current) => resetAssignmentsForFormation(current, formation));
  }

  async function runSimulation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const simulationPayload = buildSimulationPayload({
        seed,
        homeQuality,
        awayQuality,
        homeFamiliarity,
        awayFamiliarity,
        homeFormation,
        awayFormation,
        homeMentality,
        awayMentality,
        homePressing,
        awayPressing,
        homeTransitionStyle,
        awayTransitionStyle,
        homeMovement,
        awayMovement,
        homeAssignments: homeAssignments.assignments,
        awayAssignments: awayAssignments.assignments
      });
      const nextResult = await simulateMatchFromWeb(simulationPayload);
      setResult(nextResult);
      setIsInteractiveReplay(false);
      setInteractiveMinute(0);
      setManagerCommands([]);
      setAuthoritativeReplay([]);
      setAuthoritativeError(null);
      setReplaySessionId(null);
      setReplaySessionStatus('Creating replay session...');
      setReplaySessionError(null);
      setReplaySessionVisibleEventCount(0);
      setReplaySessionCommandCount(0);
      try {
        const session = await createReplaySessionFromWeb(simulationPayload);
        setReplaySessionId(session.sessionId);
        setReplaySessionVisibleEventCount(session.visibleEventCount);
        setReplaySessionCommandCount(0);
        setReplaySessionStatus(`Replay session ready for seed ${seed}.`);
      } catch (sessionError) {
        setReplaySessionStatus('Replay session creation failed.');
        setReplaySessionError(sessionError instanceof Error ? sessionError.message : 'Replay session creation failed');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Simulation request failed');
    } finally {
      setIsLoading(false);
    }
  }

  async function recordManagerAction(action: string) {
    if (!interactiveState?.pauseEvent) return;
    const nextCommands = appendManagerCommand(managerCommands, { action, pauseEvent: interactiveState.pauseEvent });
    setManagerCommands(nextCommands);
    setAuthoritativeReplay([]);
    setAuthoritativeError(null);

    const newCommand = nextCommands.at(-1);
    if (!replaySessionId || nextCommands.length === managerCommands.length || !newCommand) return;

    try {
      const appended = await appendReplaySessionCommandFromWeb({
        sessionId: replaySessionId,
        command: newCommand
      });
      setReplaySessionCommandCount(appended.commandCount);
      setReplaySessionStatus('Replay session command log synchronized.');
      setReplaySessionError(null);
    } catch (caught) {
      setReplaySessionError(caught instanceof Error ? caught.message : 'Replay session command append failed');
    }
  }

  async function requestAuthoritativeResume() {
    if (!interactiveState) return;
    if (!replaySessionId) {
      setAuthoritativeError('Replay session is not ready yet. Run a match again to create one.');
      return;
    }
    setIsAuthoritativeLoading(true);
    setAuthoritativeError(null);

    try {
      const synced = await syncReplaySessionVisibleEventsFromWeb({
        sessionId: replaySessionId,
        visibleEvents: interactiveState.visibleEvents
      });
      setReplaySessionVisibleEventCount(synced.visibleEventCount);
      const response = await resumeReplaySessionFromWeb({
        sessionId: replaySessionId,
        currentMinute: interactiveState.currentMinute
      });
      setAuthoritativeReplay(formatAuthoritativeReplay({
        score: response.score,
        events: response.events,
        diagnostics: response.diagnostics,
        signature: response.signature,
        currentMinute: interactiveState.currentMinute
      }));
      setReplaySessionStatus(`Replay session resumed with signature ${response.signature}.`);
    } catch (caught) {
      setAuthoritativeReplay([]);
      setAuthoritativeError(caught instanceof Error ? caught.message : 'Authoritative resume request failed');
    } finally {
      setIsAuthoritativeLoading(false);
    }
  }

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">{layout.hero.eyebrow}</p>
        <h1>{layout.hero.title}</h1>
        <p>{layout.hero.summary}</p>
      </section>

      <form className="panel controls" onSubmit={runSimulation}>
        <PanelHeader section={section('setup')} />
        <label>
          Seed
          <input type="number" value={seed} onChange={(event) => setSeed(Number(event.target.value))} />
        </label>

        <Select label="Home quality" value={homeQuality} values={qualities} onChange={setHomeQuality} />
        <Select label="Away quality" value={awayQuality} values={qualities} onChange={setAwayQuality} />
        <Select label="Home formation" value={homeFormation} values={formations} onChange={setHomeFormation} />
        <Select label="Away formation" value={awayFormation} values={formations} onChange={setAwayFormation} />
        <Select label="Home mentality" value={homeMentality} values={mentalities} onChange={setHomeMentality} />
        <Select label="Away mentality" value={awayMentality} values={mentalities} onChange={setAwayMentality} />
        <Select label="Home pressing" value={homePressing} values={pressings} onChange={setHomePressing} />
        <Select label="Away pressing" value={awayPressing} values={pressings} onChange={setAwayPressing} />
        <Select label="Home transition" value={homeTransitionStyle} values={transitionStyles} onChange={setHomeTransitionStyle} />
        <Select label="Away transition" value={awayTransitionStyle} values={transitionStyles} onChange={setAwayTransitionStyle} />

        <label>
          Home familiarity: {homeFamiliarity.toFixed(2)}
          <input type="range" min="0" max="1" step="0.05" value={homeFamiliarity} onChange={(event) => setHomeFamiliarity(Number(event.target.value))} />
        </label>

        <label>
          Away familiarity: {awayFamiliarity.toFixed(2)}
          <input type="range" min="0" max="1" step="0.05" value={awayFamiliarity} onChange={(event) => setAwayFamiliarity(Number(event.target.value))} />
        </label>

        <Select label="Home movement" value={homeMovement} values={movements} onChange={setHomeMovement} />
        <Select label="Away movement" value={awayMovement} values={movements} onChange={setAwayMovement} />

        <button type="submit" disabled={isLoading}>{isLoading ? 'Simulating...' : 'Run match'}</button>
      </form>

      <section className="panel formation-grid">
        <PanelHeader section={section('team-shape')} />
        <FormationPreviewCard title="Home shape" preview={homeFormationPreview} />
        <FormationPreviewCard title="Away shape" preview={awayFormationPreview} />
      </section>

      <section className="panel assignment-grid">
        <PanelHeader section={section('assignments')} />
        <AssignmentEditor title="Home assignments" state={homeAssignments} pitch={homePitch} playerCards={homePlayerCards} warnings={homeWarnings} onMovePlayer={(playerId, slotId) => setHomeAssignments((current) => movePlayerToSlot(current, playerId, slotId))} />
        <AssignmentEditor title="Away assignments" state={awayAssignments} pitch={awayPitch} playerCards={awayPlayerCards} warnings={awayWarnings} onMovePlayer={(playerId, slotId) => setAwayAssignments((current) => movePlayerToSlot(current, playerId, slotId))} />
      </section>

      {error ? <section className="panel error">{error}</section> : null}

      {viewModel ? (
        <section className="panel result match-console">
          <PanelHeader section={section('match-console')} />
          <div className="score-strip">
            <span className="score-kicker">Final / replay scoreline</span>
            <h2>{interactiveViewModel?.scoreLine ?? viewModel.scoreTitle}</h2>
          </div>
          <div className="replay-controls">
            <PanelHeader section={section('replay-controls')} compact />
            <button type="button" onClick={() => { setIsInteractiveReplay(true); setInteractiveMinute(0); setManagerCommands([]); setAuthoritativeReplay([]); setAuthoritativeError(null); }}>Start interactive replay</button>
            <button type="button" disabled={!interactiveState || interactiveState.isComplete} onClick={() => { if (interactiveState) { setInteractiveMinute(interactiveState.currentMinute); setAuthoritativeReplay([]); setAuthoritativeError(null); } }}>
              {interactiveViewModel?.continueLabel ?? 'Continue to next key event'}
            </button>
            <button type="button" onClick={() => { setIsInteractiveReplay(false); setAuthoritativeReplay([]); setAuthoritativeError(null); }}>Show full match</button>
            <button type="button" disabled={!interactiveState || isAuthoritativeLoading || !replaySessionId} onClick={requestAuthoritativeResume}>
              {isAuthoritativeLoading ? 'Requesting authoritative resume...' : 'Request authoritative resume'}
            </button>
          </div>
          {interactiveViewModel ? (
            <div className="interactive-status" aria-label="Interactive replay status">
              <h3>{interactiveViewModel.title}</h3>
              <p>{interactiveViewModel.status}</p>
              <p><strong>Manager options:</strong></p>
              <div className="replay-controls" aria-label="Manager action buttons">
                {interactiveViewModel.actions.map((action) => (
                  <button key={action} type="button" onClick={() => recordManagerAction(action)}>{action}</button>
                ))}
              </div>
            </div>
          ) : null}
          <div className="stat-groups" aria-label="Grouped match statistics">
            {statGroups.map((group) => (
              <section className="stat-card" key={group.id}>
                <h3>{group.title}</h3>
                <table>
                  <thead>
                    <tr><th>Stat</th><th>Home</th><th>Away</th></tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row) => (
                      <tr key={row.label}><td>{row.label}</td><td>{row.home}</td><td>{row.away}</td></tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ))}
          </div>

          <div className="grid console-grid">
            <InfoList title={interactiveViewModel ? 'Interactive events' : 'Events'} items={interactiveViewModel?.events ?? viewModel.events} />
            {interactiveViewModel ? <InfoList title={section('manager-commands').title} eyebrow={section('manager-commands').eyebrow} items={interactiveViewModel.commands.length > 0 ? interactiveViewModel.commands : ['No manager commands recorded yet.']} /> : null}
            {interactiveViewModel ? <InfoList title="Command effects" items={interactiveViewModel.effects} /> : null}
            {interactiveViewModel ? <InfoList title={section('projection').title} eyebrow={section('projection').eyebrow} items={interactiveViewModel.projectedReplay} /> : null}
            {interactiveViewModel ? <InfoList title="Server-authoritative replay" eyebrow="Server resume" items={authoritativeReplay.length > 0 ? authoritativeReplay : [authoritativeError ?? (isAuthoritativeLoading ? 'Requesting server-authoritative resume...' : 'Request an authoritative resume to compare against the client projection.')]} /> : null}
            <InfoList title={section('diagnostics').title} eyebrow={section('diagnostics').eyebrow} items={viewModel.diagnostics} />
            <InfoList title={section('replay-metadata').title} eyebrow={section('replay-metadata').eyebrow} items={replayMetadata} />
          </div>
        </section>
      ) : (
        <section className="panel empty">Run a match to generate score, stats, events, diagnostics, and replay metadata.</section>
      )}
    </main>
  );
}

function PanelHeader({ section, compact = false }: { section: MatchLabSection; compact?: boolean }) {
  return (
    <header className={compact ? 'panel-header panel-header-compact' : 'panel-header'}>
      <p className="eyebrow">{section.eyebrow}</p>
      <h2>{section.title}</h2>
      {!compact ? <p>{section.summary}</p> : null}
    </header>
  );
}

function Select<T extends string>({ label, value, values, onChange }: { label: string; value: T; values: T[]; onChange: (value: T) => void }) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value as T)}>
        {values.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function FormationPreviewCard({ title, preview }: { title: string; preview: FormationPreview }) {
  return (
    <article className="formation-card">
      <div>
        <p className="eyebrow">{title}</p>
        <h2>{preview.title}</h2>
        <p>{preview.summary}</p>
      </div>
      <div className="formation-lines" aria-label={`${title} tactical lines`}>
        {preview.lines.map((line) => (
          <div className="formation-line" key={line.label}>
            <span>{line.label}</span>
            <strong>{line.slots.join(' · ')}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

function AssignmentEditor({
  title,
  state,
  pitch,
  playerCards,
  warnings,
  onMovePlayer
}: {
  title: string;
  state: AssignmentState;
  pitch: PitchAssignmentViewModel;
  playerCards: PlayerAttributeCard[];
  warnings: string[];
  onMovePlayer: (playerId: string, slotId: string) => void;
}) {
  const slots = getFormationGeometry(state.formation).slots;
  return (
    <article className="assignment-card">
      <div>
        <p className="eyebrow">{title}</p>
        <h2>{pitch.title}</h2>
      </div>

      <div className="pitch-shell" aria-label={`${title} visual pitch`}>
        <div className="pitch-board">
          <div className="pitch-line halfway" />
          <div className="pitch-box defensive-box" />
          <div className="pitch-box attacking-box" />
          {pitch.markers.map((marker) => (
            <button
              type="button"
              className={`pitch-marker suitability-${marker.suitability}`}
              draggable
              key={marker.slotId}
              style={{ left: marker.left, top: marker.top }}
              onDragStart={(event) => event.dataTransfer.setData('text/plain', marker.playerId)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const playerId = event.dataTransfer.getData('text/plain');
                if (playerId) onMovePlayer(playerId, marker.slotId);
              }}
              title={`Drop a player onto ${marker.label}`}
            >
              <span>{marker.label}</span>
              <strong>{marker.playerName}</strong>
              <small>{marker.playerPosition}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="roster-rail" aria-label={`${title} draggable roster`}>
        {playerCards.map((card) => (
          <button
            className="roster-chip"
            draggable
            key={card.id}
            type="button"
            onDragStart={(event) => event.dataTransfer.setData('text/plain', card.id)}
            title={card.attributes.join(' · ')}
          >
            {card.name} <span>{card.position}</span> <strong>{card.primary}</strong>
          </button>
        ))}
      </div>

      <div className="player-card-grid">
        {playerCards.map((card) => (
          <div className="player-card" key={card.id}>
            <div>
              <strong>{card.name}</strong>
              <span>{card.position} · {card.primary}</span>
            </div>
            <p>{card.attributes.join(' · ')}</p>
          </div>
        ))}
      </div>

      <div className="assignment-list">
        {slots.map((slot) => (
          <label className="assignment-row" key={slot.id}>
            <span>{slot.label}</span>
            <select value={state.assignments[slot.id]} onChange={(event) => onMovePlayer(event.target.value, slot.id)}>
              {state.players.map((player) => (
                <option key={player.id} value={player.id}>{player.name} ({player.position})</option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {warnings.length > 0 ? (
        <ul className="warnings">
          {warnings.map((warning) => <li key={warning}>{warning}</li>)}
        </ul>
      ) : <p className="ok-note">No major role mismatches.</p>}
    </article>
  );
}

function InfoList({ title, items, eyebrow }: { title: string; items: string[]; eyebrow?: string }) {
  return (
    <section className="info-list">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h3>{title}</h3>
      <ul>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}
