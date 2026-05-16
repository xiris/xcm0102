import { describe, expect, it } from 'vitest';
import { createSeededRng } from '../../src/simulation/rng';

describe('createSeededRng', () => {
  it('replays the same sequence for the same seed', () => {
    const a = createSeededRng(42);
    const b = createSeededRng(42);

    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
  });

  it('produces numbers in the half-open range [0, 1)', () => {
    const rng = createSeededRng(7);

    for (let i = 0; i < 100; i += 1) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('supports deterministic integer ranges', () => {
    const a = createSeededRng(99);
    const b = createSeededRng(99);
    const values = Array.from({ length: 10 }, () => a.int(1, 6));

    expect(values).toEqual(Array.from({ length: 10 }, () => b.int(1, 6)));
    expect(values.every((value) => value >= 1 && value <= 6)).toBe(true);
  });

  it('supports deterministic picks from a list', () => {
    const a = createSeededRng(123);
    const b = createSeededRng(123);
    const items = ['keeper', 'defender', 'midfielder', 'forward'] as const;

    expect(Array.from({ length: 8 }, () => a.pick(items))).toEqual(
      Array.from({ length: 8 }, () => b.pick(items))
    );
  });
});
