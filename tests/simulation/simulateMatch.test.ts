import { describe, expect, it } from 'vitest';
import { simulateMatch } from '../../src/simulation/simulateMatch';
import { createSampleMatchInput, createSampleTacticBook, createSampleTeam } from '../../src/simulation/sampleData';

describe('simulateMatch production contract', () => {
  it('replays identically for the same seed and input', () => {
    const input = createSampleMatchInput({ seed: 42 });

    expect(simulateMatch(input)).toEqual(simulateMatch(input));
  });

  it('attacking mentality creates at least as many shots as defensive mentality', () => {
    const attacking = simulateMatch(
      createSampleMatchInput({
        seed: 12,
        homeTactic: createSampleTacticBook({ id: 'home-att', mentality: 'attacking', familiarity: 0.75 }),
        awayTactic: createSampleTacticBook({ id: 'away-def', mentality: 'defensive', familiarity: 0.75 })
      })
    );
    const defensive = simulateMatch(
      createSampleMatchInput({
        seed: 12,
        homeTactic: createSampleTacticBook({ id: 'home-def', mentality: 'defensive', familiarity: 0.75 }),
        awayTactic: createSampleTacticBook({ id: 'away-att', mentality: 'attacking', familiarity: 0.75 })
      })
    );

    expect(attacking.stats.home.shots).toBeGreaterThanOrEqual(defensive.stats.home.shots);
  });

  it('low familiarity creates more transition delay than high familiarity', () => {
    const low = simulateMatch(createSampleMatchInput({ seed: 21, homeFamiliarity: 0.2 }));
    const high = simulateMatch(createSampleMatchInput({ seed: 21, homeFamiliarity: 0.9 }));

    expect(low.stats.home.transitionDelay).toBeGreaterThan(high.stats.home.transitionDelay);
  });

  it('weak pace and acceleration create more late arrivals than strong pace and acceleration', () => {
    const weak = simulateMatch(
      createSampleMatchInput({ seed: 33, home: createSampleTeam({ id: 'weak', quality: 'weak' }) })
    );
    const strong = simulateMatch(
      createSampleMatchInput({ seed: 33, home: createSampleTeam({ id: 'strong', quality: 'strong' }) })
    );

    expect(weak.stats.home.lateArrivals).toBeGreaterThan(strong.stats.home.lateArrivals);
  });

  it('diagnostics explain tactical and execution causes', () => {
    const result = simulateMatch(
      createSampleMatchInput({
        seed: 44,
        home: createSampleTeam({ id: 'weak-home', quality: 'weak' }),
        homeFamiliarity: 0.2,
        homeMovement: 'extreme'
      })
    );

    expect(result.report.diagnostics.length).toBeGreaterThan(0);
    expect(result.report.diagnostics.join(' | ')).toMatch(/familiarity|attributes|movement|WIB|WOB|transition/i);
  });

  it('formation geometry changes movement load and transition profile', () => {
    const playerIds = Array.from({ length: 11 }, (_unused, index) => `home-p${index + 1}`);
    const classic = simulateMatch(
      createSampleMatchInput({
        seed: 72,
        homeTactic: createSampleTacticBook({ formation: '4-1-3-2', movement: 'balanced', playerIds })
      })
    );
    const cautious = simulateMatch(
      createSampleMatchInput({
        seed: 72,
        homeTactic: createSampleTacticBook({ formation: '5-3-2', movement: 'balanced', playerIds })
      })
    );

    expect(classic.stats.home.movementLoad).not.toBe(cautious.stats.home.movementLoad);
    expect(classic.stats.home.transitionDelay).not.toBe(cautious.stats.home.transitionDelay);
  });
});
