export type MatchLabSectionId =
  | 'setup'
  | 'team-shape'
  | 'assignments'
  | 'match-console'
  | 'replay-controls'
  | 'manager-commands'
  | 'projection'
  | 'diagnostics'
  | 'lobby-status'
  | 'replay-metadata';

export type MatchLabSection = {
  id: MatchLabSectionId;
  eyebrow: string;
  title: string;
  summary: string;
};

export type MatchLabLayoutViewModel = {
  hero: {
    eyebrow: string;
    title: string;
    summary: string;
  };
  sections: MatchLabSection[];
};

export type LayoutStatRow = {
  label: string;
  home: string;
  away: string;
};

export type LayoutStatGroup = {
  id: 'summary' | 'attacking' | 'tactical';
  title: string;
  rows: LayoutStatRow[];
};

const sections: MatchLabSection[] = [
  {
    id: 'setup',
    eyebrow: 'Pre-match desk',
    title: 'Match setup',
    summary: 'Seed, quality, formations, familiarity, mentality, pressing, transitions, and movement.'
  },
  {
    id: 'team-shape',
    eyebrow: 'Tactical board',
    title: 'Team shape',
    summary: 'Formation lines and positional balance for both sides before kickoff.'
  },
  {
    id: 'assignments',
    eyebrow: 'Selection room',
    title: 'Player assignments',
    summary: 'Drag/drop pitch assignments, roster chips, role suitability, and slot dropdowns.'
  },
  {
    id: 'match-console',
    eyebrow: 'Live desk',
    title: 'Match console',
    summary: 'Score, grouped stats, events, and manager-readable explanation in one dense console.'
  },
  {
    id: 'replay-controls',
    eyebrow: 'Replay booth',
    title: 'Replay controls',
    summary: 'Start, advance, or exit the interactive key-event replay.'
  },
  {
    id: 'manager-commands',
    eyebrow: 'Touchline log',
    title: 'Manager commands',
    summary: 'Recorded in-match manager interventions at replay pause points.'
  },
  {
    id: 'projection',
    eyebrow: 'Projection layer',
    title: 'Projected remaining replay',
    summary: 'Command-sensitive future replay projection kept separate from server-authoritative output.'
  },
  {
    id: 'diagnostics',
    eyebrow: 'Analyst notes',
    title: 'Diagnostics',
    summary: 'Readable explanations for tactical and simulation outcomes.'
  },
  {
    id: 'lobby-status',
    eyebrow: 'Lobby desk',
    title: 'Session lobby status',
    summary: 'Read-only ownership, lobby state, command-log counts, and server replay status.'
  },
  {
    id: 'replay-metadata',
    eyebrow: 'Audit trail',
    title: 'Replay metadata',
    summary: 'Seed, engine version, command count, and deterministic replay metadata.'
  }
];

const summaryLabels = new Set(['Possession', 'Goals']);
const attackingLabels = new Set(['Shots', 'Shots on target']);

export function createMatchLabLayoutViewModel(): MatchLabLayoutViewModel {
  return {
    hero: {
      eyebrow: 'CM0102 Online',
      title: 'Match Lab',
      summary: 'Server-authoritative tactical sandbox for deterministic match simulation and interactive replay.'
    },
    sections
  };
}

export function getMatchLabSection(id: MatchLabSectionId): MatchLabSection {
  return sections.find((section) => section.id === id)!;
}

export function groupMatchStatRows(rows: LayoutStatRow[]): LayoutStatGroup[] {
  const summary = rows.filter((row) => summaryLabels.has(row.label));
  const attacking = rows.filter((row) => attackingLabels.has(row.label));
  const tactical = rows.filter((row) => !summaryLabels.has(row.label) && !attackingLabels.has(row.label));

  return [
    { id: 'summary', title: 'Summary', rows: summary },
    { id: 'attacking', title: 'Attacking', rows: attacking },
    { id: 'tactical', title: 'Tactical load', rows: tactical }
  ];
}
