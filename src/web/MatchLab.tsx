'use client';

import { FormEvent, useMemo, useState } from 'react';
import { createMatchResultViewModel } from './matchResultViewModel';
import { simulateMatchFromWeb, type MovementStyle, type TeamQuality, type WebSimulationResult } from './simulationClient';

const qualities: TeamQuality[] = ['weak', 'average', 'strong'];
const movements: MovementStyle[] = ['compact', 'balanced', 'extreme'];

export function MatchLab() {
  const [seed, setSeed] = useState(42);
  const [homeQuality, setHomeQuality] = useState<TeamQuality>('strong');
  const [awayQuality, setAwayQuality] = useState<TeamQuality>('average');
  const [homeFamiliarity, setHomeFamiliarity] = useState(0.8);
  const [awayFamiliarity, setAwayFamiliarity] = useState(0.5);
  const [homeMovement, setHomeMovement] = useState<MovementStyle>('balanced');
  const [awayMovement, setAwayMovement] = useState<MovementStyle>('balanced');
  const [result, setResult] = useState<WebSimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const viewModel = useMemo(() => (result ? createMatchResultViewModel(result) : null), [result]);

  async function runSimulation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const nextResult = await simulateMatchFromWeb({
        seed,
        homeQuality,
        awayQuality,
        homeFamiliarity,
        awayFamiliarity,
        homeMovement,
        awayMovement
      });
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
          Tune team quality, familiarity, and WIB/WOB movement intensity, then run a deterministic
          server-authoritative match simulation.
        </p>
      </section>

      <form className="panel controls" onSubmit={runSimulation}>
        <label>
          Seed
          <input type="number" value={seed} onChange={(event) => setSeed(Number(event.target.value))} />
        </label>

        <Select label="Home quality" value={homeQuality} values={qualities} onChange={setHomeQuality} />
        <Select label="Away quality" value={awayQuality} values={qualities} onChange={setAwayQuality} />

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
