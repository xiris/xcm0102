import { describe, expect, it } from 'vitest';
import {
  createAssignmentState,
  createDefaultAssignments,
  createSamplePlayers,
  replaceAssignment,
  resetAssignmentsForFormation,
  roleMismatchWarnings
} from '../../src/web/assignmentState';

describe('assignment state helpers', () => {
  it('creates sample players with stable ids and names', () => {
    const players = createSamplePlayers('home');

    expect(players).toHaveLength(11);
    expect(players[0]).toEqual({ id: 'home-p1', name: 'Home Player 1', position: 'GK', attributes: expect.any(Object) });
    expect(players[10]).toEqual({ id: 'home-p11', name: 'Home Player 11', position: 'F', attributes: expect.any(Object) });
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

    expect(roleMismatchWarnings(state)).toContain('Home Player 11 is out of position at GK');
  });
});
