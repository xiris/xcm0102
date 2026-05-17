import { describe, expect, it } from 'vitest';
import { createSampleMatchInput, createSampleTacticBook } from '../../src/simulation/sampleData';

function averageRecoveryDistance(tactic: ReturnType<typeof createSampleTacticBook>): number {
  const wib = tactic.wib.MID_CENTER ?? {};
  const wob = tactic.wob.MID_CENTER ?? {};
  const distances = Object.keys(wib).map((id) => Math.hypot((wib[id]?.x ?? 0) - (wob[id]?.x ?? 0), (wib[id]?.y ?? 0) - (wob[id]?.y ?? 0)));
  return distances.reduce((sum, value) => sum + value, 0) / distances.length;
}

describe('sample data builders', () => {
  it('keys sample tactic WIB/WOB maps with the actual team player ids', () => {
    const input = createSampleMatchInput({ seed: 1 });
    const homeIds = input.home.players.map((player) => player.id).sort();
    const awayIds = input.away.players.map((player) => player.id).sort();

    expect(Object.keys(input.homeTactic.wib.MID_CENTER ?? {}).sort()).toEqual(homeIds);
    expect(Object.keys(input.homeTactic.wob.MID_CENTER ?? {}).sort()).toEqual(homeIds);
    expect(Object.keys(input.awayTactic.wib.MID_CENTER ?? {}).sort()).toEqual(awayIds);
    expect(Object.keys(input.awayTactic.wob.MID_CENTER ?? {}).sort()).toEqual(awayIds);
  });

  it('uses formation geometry to produce different MID_CENTER maps', () => {
    const playerIds = Array.from({ length: 11 }, (_unused, index) => `p${index + 1}`);
    const classic = createSampleTacticBook({ formation: '4-1-3-2', movement: 'balanced', playerIds });
    const cautious = createSampleTacticBook({ formation: '5-3-2', movement: 'balanced', playerIds });

    expect(classic.wib.MID_CENTER).not.toEqual(cautious.wib.MID_CENTER);
    expect(classic.wob.MID_CENTER).not.toEqual(cautious.wob.MID_CENTER);
  });

  it('makes compact formation movement cheaper than extreme movement', () => {
    const playerIds = Array.from({ length: 11 }, (_unused, index) => `p${index + 1}`);
    const compact = createSampleTacticBook({ formation: '4-4-2', movement: 'compact', playerIds });
    const extreme = createSampleTacticBook({ formation: '4-4-2', movement: 'extreme', playerIds });

    expect(averageRecoveryDistance(compact)).toBeLessThan(averageRecoveryDistance(extreme));
  });
});
