import { describe, expect, it } from 'vitest';
import { createAssignmentState } from '../../src/web/assignmentState';
import { createPlayerAttributeCards } from '../../src/web/playerAttributeCards';

describe('player attribute cards', () => {
  it('formats roster players with key visible attributes', () => {
    const cards = createPlayerAttributeCards(createAssignmentState('home', '4-4-2'));

    expect(cards[10]).toEqual({
      id: 'home-p11',
      name: 'Christian Vieri',
      position: 'F',
      primary: 'FIN 20',
      attributes: ['PAC 13', 'STA 15', 'POS 18', 'DEC 17', 'FIN 20', 'PAS 12', 'TCK 7']
    });
  });

  it('keeps playmaker strengths visible for Milan 2002', () => {
    const cards = createPlayerAttributeCards(createAssignmentState('away', '4-4-2'));

    expect(cards[6]).toMatchObject({
      name: 'Andrea Pirlo',
      primary: 'PAS 20',
      attributes: expect.arrayContaining(['PAS 20', 'DEC 19'])
    });
  });
});
