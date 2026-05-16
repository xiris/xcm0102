export type SeededRng = {
  next: () => number;
  int: (minInclusive: number, maxInclusive: number) => number;
  pick: <T>(items: readonly T[]) => T;
};

export function createSeededRng(seed: number): SeededRng {
  let state = seed >>> 0;

  const nextUint32 = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return (value ^ (value >>> 14)) >>> 0;
  };

  const next = (): number => nextUint32() / 4294967296;

  return {
    next,
    int: (minInclusive: number, maxInclusive: number): number => {
      if (!Number.isInteger(minInclusive) || !Number.isInteger(maxInclusive)) {
        throw new Error('RNG integer bounds must be integers');
      }
      if (maxInclusive < minInclusive) {
        throw new Error('RNG max must be >= min');
      }
      const span = maxInclusive - minInclusive + 1;
      return minInclusive + Math.floor(next() * span);
    },
    pick: <T>(items: readonly T[]): T => {
      if (items.length === 0) {
        throw new Error('Cannot pick from an empty array');
      }
      return items[Math.floor(next() * items.length)] as T;
    }
  };
}
