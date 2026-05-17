import { describe, expect, it } from 'vitest';
import { createSeededRng } from '../../src/simulation/rng';
import { commentaryPacks, describeChanceWithPack } from '../../src/simulation/commentaryPacks';
import type { ResolvedChance } from '../../src/simulation/chanceEngine';

const baseChance: Omit<ResolvedChance, 'description'> = {
  minute: 12,
  teamId: 'home',
  creator: 'Andrea Pirlo',
  shooter: 'Andriy Shevchenko',
  defender: 'Marco Materazzi',
  goalkeeper: 'Francesco Toldo',
  quality: 0.42,
  category: 'through_ball',
  outcome: 'goal'
};

describe('commentary packs', () => {
  it('ships a classic CM-style pack with broad template coverage', () => {
    const pack = commentaryPacks.classic_cm;
    const templateCount = Object.values(pack.templates).flatMap((byOutcome) => Object.values(byOutcome).flat()).length;

    expect(pack.id).toBe('classic_cm');
    expect(templateCount).toBeGreaterThanOrEqual(40);
    expect(Object.keys(pack.templates)).toEqual(['through_ball', 'counter_attack', 'cross', 'long_shot', 'set_piece']);
  });

  it('describes the same chance deterministically with the same seeded rng', () => {
    const first = describeChanceWithPack(baseChance, createSeededRng(3), 'classic_cm');
    const second = describeChanceWithPack(baseChance, createSeededRng(3), 'classic_cm');

    expect(first).toBe(second);
    expect(first).toMatch(/Pirlo|Shevchenko|Toldo|Materazzi/);
  });

  it('varies repeated chance text across categories and outcomes', () => {
    const rng = createSeededRng(11);
    const descriptions = new Set(['through_ball', 'counter_attack', 'cross', 'long_shot', 'set_piece'].flatMap((category) =>
      ['goal', 'save', 'block', 'miss'].map((outcome) => describeChanceWithPack({
        ...baseChance,
        category: category as typeof baseChance.category,
        outcome: outcome as typeof baseChance.outcome
      }, rng, 'classic_cm'))
    ));

    expect(descriptions.size).toBeGreaterThanOrEqual(16);
    expect([...descriptions].some((text) => /cross|header|flank/i.test(text))).toBe(true);
    expect([...descriptions].some((text) => /break|counter|space/i.test(text))).toBe(true);
    expect([...descriptions].some((text) => /free kick|corner|set piece/i.test(text))).toBe(true);
  });
});
