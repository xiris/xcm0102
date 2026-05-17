'use client';

import { FormEvent, useMemo, useState } from 'react';
import { getFormationGeometry } from '../simulation/formationGeometry';
import {
  createAssignmentState,
  replaceAssignment,
  resetAssignmentsForFormation,
  roleMismatchWarnings,
  type AssignmentState
} from './assignmentState';
import { createFormationPreview, type FormationPreview } from './formationPreview';
import { createMatchResultViewModel } from './matchResultViewModel';
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
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const viewModel = useMemo(() => (result ? createMatchResultViewModel(result) : null), [result]);
  const homeFormationPreview = useMemo(() => createFormationPreview(homeFormation, homeAssignments), [homeFormation, homeAssignments]);
  const awayFormationPreview = useMemo(() => createFormationPreview(awayFormation, awayAssignments), [awayFormation, awayAssignments]);
  const homeWarnings = useMemo(() => roleMismatchWarnings(homeAssignments), [homeAssignments]);
  const awayWarnings = useMemo(() => roleMismatchWarnings(awayAssignments), [awayAssignments]);

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
      const nextResult = await simulateMatchFromWeb(
        buildSimulationPayload({
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
        })
      );
      setResult(nextResult);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Simulation request failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">CM0102 Online</p>
        <h1>Match Lab</h1>
        <p>
          Pick a formation and tune mentality, pressing, transition style, familiarity, and WIB/WOB
          movement intensity, then run a deterministic server-authoritative match simulation.
        </p>
      </section>

      <form className="panel controls" onSubmit={runSimulation}>
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
        <FormationPreviewCard title="Home shape" preview={homeFormationPreview} />
        <FormationPreviewCard title="Away shape" preview={awayFormationPreview} />
      </section>

      <section className="panel assignment-grid">
        <AssignmentEditor title="Home assignments" state={homeAssignments} warnings={homeWarnings} onChange={(slotId, playerId) => setHomeAssignments((current) => replaceAssignment(current, slotId, playerId))} />
        <AssignmentEditor title="Away assignments" state={awayAssignments} warnings={awayWarnings} onChange={(slotId, playerId) => setAwayAssignments((current) => replaceAssignment(current, slotId, playerId))} />
      </section>

      {error ? <section className="panel error">{error}</section> : null}

      {viewModel ? (
        <section className="panel result">
          <h2>{viewModel.scoreTitle}</h2>
          <table>
            <thead>
              <tr><th>Stat</th><th>Home</th><th>Away</th></tr>
            </thead>
            <tbody>
              {viewModel.statRows.map((row) => (
                <tr key={row.label}><td>{row.label}</td><td>{row.home}</td><td>{row.away}</td></tr>
              ))}
            </tbody>
          </table>

          <div className="grid">
            <InfoList title="Events" items={viewModel.events} />
            <InfoList title="Diagnostics" items={viewModel.diagnostics} />
            <InfoList title="Replay" items={viewModel.replay} />
          </div>
        </section>
      ) : (
        <section className="panel empty">Run a match to generate score, stats, events, diagnostics, and replay metadata.</section>
      )}
    </main>
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

function AssignmentEditor({ title, state, warnings, onChange }: { title: string; state: AssignmentState; warnings: string[]; onChange: (slotId: string, playerId: string) => void }) {
  const slots = getFormationGeometry(state.formation).slots;
  return (
    <article className="assignment-card">
      <div>
        <p className="eyebrow">{title}</p>
        <h2>{state.formation}</h2>
      </div>
      <div className="assignment-list">
        {slots.map((slot) => (
          <label className="assignment-row" key={slot.id}>
            <span>{slot.label}</span>
            <select value={state.assignments[slot.id]} onChange={(event) => onChange(slot.id, event.target.value)}>
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

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h3>{title}</h3>
      <ul>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}
