import { spawnSync } from 'node:child_process';

type Mission = {
  label: string;
  args: string[];
};

const missions: Mission[] = [
  {
    label: 'MISSION 01: deterministic RNG replay',
    args: ['vitest', 'run', 'tests/simulation/rng.test.ts', '-t', 'replays the same sequence']
  },
  {
    label: 'MISSION 02: RNG range helpers',
    args: ['vitest', 'run', 'tests/simulation/rng.test.ts', '-t', 'integer ranges']
  },
  {
    label: 'MISSION 03: sample tactic maps use real player ids',
    args: ['vitest', 'run', 'tests/simulation/sampleData.test.ts', '-t', 'actual team player ids']
  },
  {
    label: 'MISSION 04: deterministic match replay',
    args: ['vitest', 'run', 'tests/simulation/simulateMatch.test.ts', '-t', 'replays identically']
  },
  {
    label: 'MISSION 05: attacking mentality creates pressure',
    args: ['vitest', 'run', 'tests/simulation/simulateMatch.test.ts', '-t', 'attacking mentality']
  },
  {
    label: 'MISSION 06: familiarity affects transitions',
    args: ['vitest', 'run', 'tests/simulation/simulateMatch.test.ts', '-t', 'low familiarity']
  },
  {
    label: 'MISSION 07: attributes affect late arrivals',
    args: ['vitest', 'run', 'tests/simulation/simulateMatch.test.ts', '-t', 'weak pace']
  },
  {
    label: 'MISSION 08: diagnostics explain causes',
    args: ['vitest', 'run', 'tests/simulation/simulateMatch.test.ts', '-t', 'diagnostics']
  },
  {
    label: 'MISSION 09: API health endpoint',
    args: ['vitest', 'run', 'tests/api/server.test.ts', '-t', 'health endpoint']
  },
  {
    label: 'MISSION 10: API simulate endpoint response',
    args: ['vitest', 'run', 'tests/api/server.test.ts', '-t', 'returns score stats events']
  },
  {
    label: 'MISSION 11: API simulate endpoint deterministic replay',
    args: ['vitest', 'run', 'tests/api/server.test.ts', '-t', 'identical responses']
  },
  {
    label: 'MISSION 12: API validation failure',
    args: ['vitest', 'run', 'tests/api/server.test.ts', '-t', 'rejects invalid']
  },
  {
    label: 'MISSION 13: API rejects non-object bodies',
    args: ['vitest', 'run', 'tests/api/server.test.ts', '-t', 'non-object request bodies']
  },
  {
    label: 'MISSION 14: API rejects JSON null bodies',
    args: ['vitest', 'run', 'tests/api/server.test.ts', '-t', 'JSON null request bodies']
  },
  {
    label: 'MISSION 15: web client posts simulation request',
    args: ['vitest', 'run', 'tests/web/simulationClient.test.ts', '-t', 'JSON POST request']
  },
  {
    label: 'MISSION 16: web client reports API errors',
    args: ['vitest', 'run', 'tests/web/simulationClient.test.ts', '-t', 'readable error']
  },
  {
    label: 'MISSION 17: web result view model formatting',
    args: ['vitest', 'run', 'tests/web/matchResultViewModel.test.ts', '-t', 'scoreboard and stat rows']
  },
  {
    label: 'MISSION 18: web replay labels formatting',
    args: ['vitest', 'run', 'tests/web/matchResultViewModel.test.ts', '-t', 'event, diagnostic, and replay labels']
  }
];

for (const [index, mission] of missions.entries()) {
  console.log(`\n${mission.label}`);
  const result = spawnSync('npx', mission.args, { stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`STATUS: FAILED (${mission.label})`);
    process.exit(result.status ?? 1);
  }
  console.log(`STATUS: PASSED (${String(index + 1).padStart(2, '0')})`);
}

console.log(`\nALL ${missions.length} MISSIONS PASSED`);
