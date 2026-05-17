import { describe, expect, it } from 'vitest';
import { getFormationGeometry } from '../../src/simulation/formationGeometry';

describe('formation geometry', () => {
  it('returns eleven normalized slots for a 4-4-2', () => {
    const geometry = getFormationGeometry('4-4-2');

    expect(geometry.slots).toHaveLength(11);
    expect(geometry.slots.every((slot) => slot.point.x >= 0 && slot.point.x <= 100 && slot.point.y >= 0 && slot.point.y <= 100)).toBe(true);
  });

  it('models 4-1-3-2 with a defensive midfielder and two forwards', () => {
    const geometry = getFormationGeometry('4-1-3-2');

    expect(geometry.slots.filter((slot) => slot.role === 'DM')).toHaveLength(1);
    expect(geometry.slots.filter((slot) => slot.role === 'F')).toHaveLength(2);
  });

  it('rates 5-3-2 as deeper and narrower than 4-3-3', () => {
    const cautious = getFormationGeometry('5-3-2');
    const attacking = getFormationGeometry('4-3-3');

    expect(cautious.depth).toBeLessThan(attacking.depth);
    expect(cautious.width).toBeLessThan(attacking.width);
  });
});
