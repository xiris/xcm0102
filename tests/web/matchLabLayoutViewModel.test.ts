import { describe, expect, it } from 'vitest';
import {
  createMatchLabLayoutViewModel,
  groupMatchStatRows,
  type LayoutStatRow
} from '../../src/web/matchLabLayoutViewModel';

describe('createMatchLabLayoutViewModel', () => {
  it('defines stable semantic sections for the modernized Match Lab shell', () => {
    const viewModel = createMatchLabLayoutViewModel();

    expect(viewModel.hero).toEqual({
      eyebrow: 'CM0102 Online',
      title: 'Match Lab',
      summary: 'Server-authoritative tactical sandbox for deterministic match simulation and interactive replay.'
    });
    expect(viewModel.sections.map((section) => section.id)).toEqual([
      'setup',
      'team-shape',
      'assignments',
      'match-console',
      'replay-controls',
      'manager-commands',
      'projection',
      'diagnostics',
      'lobby-status',
      'replay-metadata'
    ]);
    expect(viewModel.sections.find((section) => section.id === 'match-console')).toEqual({
      id: 'match-console',
      eyebrow: 'Live desk',
      title: 'Match console',
      summary: 'Score, grouped stats, events, and manager-readable explanation in one dense console.'
    });
  });

  it('groups stat rows into summary, attacking, and tactical tables', () => {
    const rows: LayoutStatRow[] = [
      { label: 'Possession', home: '57%', away: '43%' },
      { label: 'Shots', home: '11', away: '7' },
      { label: 'Shots on target', home: '6', away: '3' },
      { label: 'Goals', home: '2', away: '1' },
      { label: 'Transition delay', home: '3', away: '6' },
      { label: 'Late arrivals', home: '2', away: '5' }
    ];

    expect(groupMatchStatRows(rows)).toEqual([
      {
        id: 'summary',
        title: 'Summary',
        rows: [
          { label: 'Possession', home: '57%', away: '43%' },
          { label: 'Goals', home: '2', away: '1' }
        ]
      },
      {
        id: 'attacking',
        title: 'Attacking',
        rows: [
          { label: 'Shots', home: '11', away: '7' },
          { label: 'Shots on target', home: '6', away: '3' }
        ]
      },
      {
        id: 'tactical',
        title: 'Tactical load',
        rows: [
          { label: 'Transition delay', home: '3', away: '6' },
          { label: 'Late arrivals', home: '2', away: '5' }
        ]
      }
    ]);
  });
});
