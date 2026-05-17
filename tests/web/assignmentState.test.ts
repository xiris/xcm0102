import { describe, expect, it } from 'vitest';
import {
  createAssignmentState,
  createDefaultAssignments,
  createSamplePlayers,
  movePlayerToSlot,
  replaceAssignment,
  resetAssignmentsForFormation,
  roleMismatchWarnings,
  swapAssignments
} from '../../src/web/assignmentState';

describe('assignment state helpers', () => {
  it('creates sample players with stable ids and names', () => {
    const players = createSamplePlayers('home');

    expect(players).toHaveLength(11);
    expect(players[0]).toEqual({ id: 'home-p1', name: 'Francesco Toldo', position: 'GK', attributes: expect.any(Object) });
    expect(players[10]).toEqual({ id: 'home-p11', name: 'Christian Vieri', position: 'F', attributes: expect.any(Object) });
    expect(players[10]?.attributes.finishing).toBe(20);
  });

  it('uses Milan 2002 names for away sample players', () => {
    const players = createSamplePlayers('away');

    expect(players[0]).toEqual({ id: 'away-p1', name: 'Dida', position: 'GK', attributes: expect.any(Object) });
    expect(players[10]).toEqual({ id: 'away-p11', name: 'Filippo Inzaghi', position: 'F', attributes: expect.any(Object) });
    expect(players[6]?.attributes.passing).toBe(20);
  });

  it('assigns every slot in formation order to one player', () => {
    const players = createSamplePlayers('away');
    const assignments = createDefaultAssignments('4-1-3-2', players);

    expect(Object.keys(assignments)).toEqual(['gk', 'dl', 'dc1', 'dc2', 'dr', 'dm', 'ml', 'mc', 'mr', 'fc1', 'fc2']);
    expect(Object.values(assignments)).toEqual(players.map((player) => player.id));
  });

  it('replaces a single slot assignment without mutating previous state', () => {
    const state = createAssignmentState('home', '4-4-2');
    const next = replaceAssignment(state, 'gk', 'home-p11');

    expect(next.assignments.gk).toBe('home-p11');
    expect(state.assignments.gk).toBe('home-p1');
  });

  it('resets assignments when formation changes', () => {
    const state = replaceAssignment(createAssignmentState('home', '4-4-2'), 'gk', 'home-p11');
    const next = resetAssignmentsForFormation(state, '3-5-2');

    expect(next.formation).toBe('3-5-2');
    expect(next.assignments.gk).toBe('home-p1');
    expect(Object.keys(next.assignments)).toEqual(['gk', 'dc1', 'dc2', 'dc3', 'wbl', 'mc1', 'mc2', 'mc3', 'wbr', 'fc1', 'fc2']);
  });

  it('reports role mismatch warnings for selected players', () => {
    const state = replaceAssignment(createAssignmentState('home', '4-4-2'), 'gk', 'home-p11');

    expect(roleMismatchWarnings(state)).toContain('Christian Vieri is out of position at GK');
  });

  it('swaps assignments between two occupied slots', () => {
    const state = createAssignmentState('home', '4-4-2');
    const next = swapAssignments(state, 'gk', 'fc2');

    expect(next.assignments.gk).toBe('home-p11');
    expect(next.assignments.fc2).toBe('home-p1');
    expect(state.assignments.gk).toBe('home-p1');
  });

  it('moves a player to a target slot without creating duplicates', () => {
    const state = createAssignmentState('away', '4-4-2');
    const next = movePlayerToSlot(state, 'away-p11', 'gk');

    expect(next.assignments.gk).toBe('away-p11');
    expect(next.assignments.fc2).toBe('away-p1');
    expect(new Set(Object.values(next.assignments)).size).toBe(11);
  });
});
