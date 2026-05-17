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
});
