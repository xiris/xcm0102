import { describe, expect, it } from 'vitest';
import { createAssignmentState, movePlayerToSlot } from '../../src/web/assignmentState';
import { createPitchAssignmentViewModel } from '../../src/web/pitchAssignmentViewModel';

describe('pitch assignment view model', () => {
  it('maps formation slots to positioned pitch markers with assigned player names', () => {
    const state = createAssignmentState('home', '4-1-3-2');
    const viewModel = createPitchAssignmentViewModel(state);

    expect(viewModel.title).toBe('Internazionale 2002 · 4-1-3-2');
    expect(viewModel.markers).toHaveLength(11);
    expect(viewModel.markers[0]).toEqual({
      slotId: 'gk',
      label: 'GK',
      role: 'GK',
      playerId: 'home-p1',
      playerName: 'Francesco Toldo',
      playerPosition: 'GK',
      left: '50%',
      top: '92%',
      suitability: 'natural'
    });
  });

  it('labels risky mismatches for pitch styling', () => {
    const state = movePlayerToSlot(createAssignmentState('away', '4-4-2'), 'away-p11', 'gk');
    const viewModel = createPitchAssignmentViewModel(state);

    expect(viewModel.title).toBe('Milan 2002 · 4-4-2');
    expect(viewModel.markers.find((marker) => marker.slotId === 'gk')).toMatchObject({
      playerName: 'Filippo Inzaghi',
      suitability: 'severe'
    });
  });
});
