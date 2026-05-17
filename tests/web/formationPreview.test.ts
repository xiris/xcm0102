import { describe, expect, it } from 'vitest';
import { createFormationPreview } from '../../src/web/formationPreview';

describe('formation preview', () => {
  it('formats 4-1-3-2 with slot count width and depth labels', () => {
    const preview = createFormationPreview('4-1-3-2');

    expect(preview.title).toBe('4-1-3-2');
    expect(preview.summary).toBe('11 slots · width 62 · depth 70');
    expect(preview.slots).toHaveLength(11);
  });

  it('groups preview labels by tactical line', () => {
    const preview = createFormationPreview('4-1-3-2');

    expect(preview.lines).toEqual([
      { label: 'GK', slots: ['GK'] },
      { label: 'D', slots: ['DL', 'DC', 'DC', 'DR'] },
      { label: 'DM', slots: ['DMC'] },
      { label: 'M', slots: ['ML', 'MC', 'MR'] },
      { label: 'F', slots: ['FC', 'FC'] }
    ]);
  });

  it('includes assigned player names in slot labels when supplied', () => {
    const preview = createFormationPreview('4-4-2', {
      assignments: { gk: 'home-p1', fc1: 'home-p10' },
      players: [
        { id: 'home-p1', name: 'Safe Keeper' },
        { id: 'home-p10', name: 'Sharp Striker' }
      ]
    });

    expect(preview.lines[0]!.slots).toEqual(['GK — Safe Keeper']);
    expect(preview.lines.at(-1)!.slots[0]).toBe('FC — Sharp Striker');
  });
});
