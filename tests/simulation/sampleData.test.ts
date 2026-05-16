import { describe, expect, it } from 'vitest';
import { createSampleMatchInput } from '../../src/simulation/sampleData';

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
});
