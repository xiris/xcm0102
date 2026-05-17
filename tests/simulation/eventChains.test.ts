import { describe, expect, it } from 'vitest';
import { expandChanceEventChains } from '../../src/simulation/eventChains';
import type { MatchEvent } from '../../src/simulation/domain';

const baseEvents: MatchEvent[] = [
  {
    minute: 18,
    teamId: 'home',
    type: 'chance',
    category: 'set_piece',
    outcome: 'save',
    description: 'Recoba delivers the set piece; Vieri forces a save.'
  },
  {
    minute: 41,
    teamId: 'away',
    type: 'chance',
    category: 'cross',
    outcome: 'block',
    description: "Shevchenko's effort is blocked."
  },
  {
    minute: 66,
    teamId: 'home',
    type: 'chance',
    category: 'through_ball',
    outcome: 'miss',
    description: 'Vieri races clear and misses.'
  }
];

describe('event chain expansion', () => {
  it('expands the same chance events deterministically for the same seed', () => {
    const first = expandChanceEventChains(baseEvents, { seed: 12, homePressing: 'high', awayPressing: 'medium' });
    const second = expandChanceEventChains(baseEvents, { seed: 12, homePressing: 'high', awayPressing: 'medium' });

    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThan(baseEvents.length);
    expect(first.every((event) => event.chainId && typeof event.sequence === 'number')).toBe(true);
  });

  it('adds foul and free kick precursors for set-piece chances', () => {
    const expanded = expandChanceEventChains([baseEvents[0]!], { seed: 3, homePressing: 'medium', awayPressing: 'high' });

    expect(expanded.map((event) => event.type)).toEqual(['foul', 'free_kick', 'chance']);
    expect(expanded[0]!.description).toMatch(/fouled|challenge|clips/i);
    expect(expanded[1]!.description).toMatch(/free kick|stands over/i);
    expect(new Set(expanded.map((event) => event.chainId)).size).toBe(1);
  });

  it('adds a corner precursor after blocked crossing chances', () => {
    const expanded = expandChanceEventChains([baseEvents[1]!], { seed: 5, homePressing: 'medium', awayPressing: 'medium' });

    expect(expanded.map((event) => event.type)).toContain('corner');
    expect(expanded.some((event) => /corner|deflected behind/i.test(event.description))).toBe(true);
  });

  it('can replace a through-ball chance with an offside event', () => {
    const expanded = expandChanceEventChains([baseEvents[2]!], { seed: 2, homePressing: 'high', awayPressing: 'medium' });

    expect(expanded).toHaveLength(1);
    expect(expanded[0]!).toEqual(expect.objectContaining({ type: 'offside', outcome: 'offside' }));
    expect(expanded[0]!.description).toMatch(/flag|offside/i);
  });

  it('adds card events when pressing risk is high', () => {
    const expanded = expandChanceEventChains([baseEvents[0]!], { seed: 8, homePressing: 'high', awayPressing: 'high' });

    expect(expanded.some((event) => event.type === 'yellow_card' || event.type === 'red_card')).toBe(true);
    expect(expanded.some((event) => /card|booked|sent off/i.test(event.description))).toBe(true);
  });
});
