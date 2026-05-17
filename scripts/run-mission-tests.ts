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
  },
  {
    label: 'MISSION 19: API accepts tactical editor options',
    args: ['vitest', 'run', 'tests/api/server.test.ts', '-t', 'accepts tactical editor options']
  },
  {
    label: 'MISSION 20: API rejects tactical editor options',
    args: ['vitest', 'run', 'tests/api/server.test.ts', '-t', 'rejects invalid tactical editor options']
  },
  {
    label: 'MISSION 21: web tactical payload mapping',
    args: ['vitest', 'run', 'tests/web/tacticalPayload.test.ts', '-t', 'full simulation request']
  },
  {
    label: 'MISSION 22: web tactical defaults',
    args: ['vitest', 'run', 'tests/web/tacticalPayload.test.ts', '-t', 'tactical defaults']
  },
  {
    label: 'MISSION 23: formation geometry slots',
    args: ['vitest', 'run', 'tests/simulation/formationGeometry.test.ts', '-t', 'eleven normalized slots']
  },
  {
    label: 'MISSION 24: formation geometry tactical profiles',
    args: ['vitest', 'run', 'tests/simulation/formationGeometry.test.ts', '-t', 'deeper and narrower']
  },
  {
    label: 'MISSION 25: formation maps affect WIB/WOB geometry',
    args: ['vitest', 'run', 'tests/simulation/sampleData.test.ts', '-t', 'formation geometry']
  },
  {
    label: 'MISSION 26: formation geometry impacts simulation',
    args: ['vitest', 'run', 'tests/simulation/simulateMatch.test.ts', '-t', 'formation geometry']
  },
  {
    label: 'MISSION 27: web formation preview formatting',
    args: ['vitest', 'run', 'tests/web/formationPreview.test.ts', '-t', 'width and depth labels']
  },
  {
    label: 'MISSION 28: web formation preview tactical lines',
    args: ['vitest', 'run', 'tests/web/formationPreview.test.ts', '-t', 'tactical line']
  },
  {
    label: 'MISSION 29: role suitability scoring',
    args: ['vitest', 'run', 'tests/simulation/roleSuitability.test.ts', '-t', 'natural role matches']
  },
  {
    label: 'MISSION 30: role suitability mismatch summary',
    args: ['vitest', 'run', 'tests/simulation/roleSuitability.test.ts', '-t', 'summarizes average suitability']
  },
  {
    label: 'MISSION 31: tactic assignments use real players',
    args: ['vitest', 'run', 'tests/simulation/sampleData.test.ts', '-t', 'assigns each formation slot']
  },
  {
    label: 'MISSION 32: manual tactic assignments preserved',
    args: ['vitest', 'run', 'tests/simulation/sampleData.test.ts', '-t', 'preserves manual tactic assignments']
  },
  {
    label: 'MISSION 33: role mismatch affects simulation',
    args: ['vitest', 'run', 'tests/simulation/simulateMatch.test.ts', '-t', 'role mismatches reduce execution']
  },
  {
    label: 'MISSION 34: web assignment preview labels',
    args: ['vitest', 'run', 'tests/web/formationPreview.test.ts', '-t', 'assigned player names']
  },
  {
    label: 'MISSION 35: web assignment defaults',
    args: ['vitest', 'run', 'tests/web/assignmentState.test.ts', '-t', 'assigns every slot']
  },
  {
    label: 'MISSION 36: web assignment replacement',
    args: ['vitest', 'run', 'tests/web/assignmentState.test.ts', '-t', 'replaces a single slot']
  },
  {
    label: 'MISSION 37: web assignment role warnings',
    args: ['vitest', 'run', 'tests/web/assignmentState.test.ts', '-t', 'role mismatch warnings']
  },
  {
    label: 'MISSION 38: API accepts explicit assignments',
    args: ['vitest', 'run', 'tests/api/server.test.ts', '-t', 'accepts explicit slot assignments']
  },
  {
    label: 'MISSION 39: API rejects invalid assignments',
    args: ['vitest', 'run', 'tests/api/server.test.ts', '-t', 'rejects invalid assignment maps']
  },
  {
    label: 'MISSION 40: Inter 2002 sample squad',
    args: ['vitest', 'run', 'tests/web/assignmentState.test.ts', '-t', 'stable ids and names']
  },
  {
    label: 'MISSION 41: Milan 2002 sample squad',
    args: ['vitest', 'run', 'tests/web/assignmentState.test.ts', '-t', 'Milan 2002 names']
  },
  {
    label: 'MISSION 42: assignment swap helper',
    args: ['vitest', 'run', 'tests/web/assignmentState.test.ts', '-t', 'swaps assignments']
  },
  {
    label: 'MISSION 43: assignment move helper',
    args: ['vitest', 'run', 'tests/web/assignmentState.test.ts', '-t', 'moves a player']
  },
  {
    label: 'MISSION 44: pitch assignment markers',
    args: ['vitest', 'run', 'tests/web/pitchAssignmentViewModel.test.ts', '-t', 'positioned pitch markers']
  },
  {
    label: 'MISSION 45: pitch mismatch styling',
    args: ['vitest', 'run', 'tests/web/pitchAssignmentViewModel.test.ts', '-t', 'risky mismatches']
  },
  {
    label: 'MISSION 46: historic Inter team fixture',
    args: ['vitest', 'run', 'tests/simulation/historicSquads.test.ts', '-t', 'Internazionale 2002']
  },
  {
    label: 'MISSION 47: historic Milan team fixture',
    args: ['vitest', 'run', 'tests/simulation/historicSquads.test.ts', '-t', 'Milan 2002']
  },
  {
    label: 'MISSION 48: historic squad summary',
    args: ['vitest', 'run', 'tests/simulation/historicSquads.test.ts', '-t', 'summarizes']
  },
  {
    label: 'MISSION 49: browser player attribute cards',
    args: ['vitest', 'run', 'tests/web/playerAttributeCards.test.ts', '-t', 'key visible attributes']
  },
  {
    label: 'MISSION 50: API historic team metadata',
    args: ['vitest', 'run', 'tests/api/server.test.ts', '-t', 'historic team metadata']
  },
  {
    label: 'MISSION 51: chance engine deterministic replay',
    args: ['vitest', 'run', 'tests/simulation/chanceEngine.test.ts', '-t', 'same chances']
  },
  {
    label: 'MISSION 52: chance engine finishing influence',
    args: ['vitest', 'run', 'tests/simulation/chanceEngine.test.ts', '-t', 'elite finishing']
  },
  {
    label: 'MISSION 53: chance engine commentary variation',
    args: ['vitest', 'run', 'tests/simulation/chanceEngine.test.ts', '-t', 'varied non-robotic']
  },
  {
    label: 'MISSION 54: simulation score variation',
    args: ['vitest', 'run', 'tests/simulation/simulateMatch.test.ts', '-t', 'chance resolution']
  },
  {
    label: 'MISSION 55: simulation player commentary',
    args: ['vitest', 'run', 'tests/simulation/simulateMatch.test.ts', '-t', 'player-named varied']
  },
  {
    label: 'MISSION 56: event taxonomy categories',
    args: ['vitest', 'run', 'tests/simulation/chanceEngine.test.ts', '-t', 'football event taxonomy']
  },
  {
    label: 'MISSION 57: commentary pack coverage',
    args: ['vitest', 'run', 'tests/simulation/commentaryPacks.test.ts', '-t', 'broad template coverage']
  },
  {
    label: 'MISSION 58: commentary pack deterministic text',
    args: ['vitest', 'run', 'tests/simulation/commentaryPacks.test.ts', '-t', 'same chance deterministically']
  },
  {
    label: 'MISSION 59: commentary pack category variation',
    args: ['vitest', 'run', 'tests/simulation/commentaryPacks.test.ts', '-t', 'varies repeated chance text']
  },
  {
    label: 'MISSION 60: API categorized chance metadata',
    args: ['vitest', 'run', 'tests/api/server.test.ts', '-t', 'categorized chance metadata']
  },
  {
    label: 'MISSION 61: event chain deterministic expansion',
    args: ['vitest', 'run', 'tests/simulation/eventChains.test.ts', '-t', 'deterministically']
  },
  {
    label: 'MISSION 62: event chain free kick precursor',
    args: ['vitest', 'run', 'tests/simulation/eventChains.test.ts', '-t', 'foul and free kick']
  },
  {
    label: 'MISSION 63: event chain corner precursor',
    args: ['vitest', 'run', 'tests/simulation/eventChains.test.ts', '-t', 'corner precursor']
  },
  {
    label: 'MISSION 64: event chain offside replacement',
    args: ['vitest', 'run', 'tests/simulation/eventChains.test.ts', '-t', 'offside event']
  },
  {
    label: 'MISSION 65: event chain card risk',
    args: ['vitest', 'run', 'tests/simulation/eventChains.test.ts', '-t', 'card events']
  },
  {
    label: 'MISSION 66: simulation chained event metadata',
    args: ['vitest', 'run', 'tests/simulation/simulateMatch.test.ts', '-t', 'chained match events']
  },
  {
    label: 'MISSION 67: API event chain metadata',
    args: ['vitest', 'run', 'tests/api/server.test.ts', '-t', 'event chain metadata']
  },
  {
    label: 'MISSION 68: root layout hydration warning suppression',
    args: ['vitest', 'run', 'tests/web/rootLayout.test.ts', '-t', 'browser-extension body attribute']
  },
  {
    label: 'MISSION 69: historic Inter bench fixture',
    args: ['vitest', 'run', 'tests/simulation/historicSquads.test.ts', '-t', 'Internazionale 2002']
  },
  {
    label: 'MISSION 70: historic Milan bench fixture',
    args: ['vitest', 'run', 'tests/simulation/historicSquads.test.ts', '-t', 'Milan 2002']
  },
  {
    label: 'MISSION 71: condition engine deterministic replay',
    args: ['vitest', 'run', 'tests/simulation/playerConditionEngine.test.ts', '-t', 'deterministic condition']
  },
  {
    label: 'MISSION 72: condition engine fatigue pressure',
    args: ['vitest', 'run', 'tests/simulation/playerConditionEngine.test.ts', '-t', 'high pressing']
  },
  {
    label: 'MISSION 73: condition engine substitution recommendation',
    args: ['vitest', 'run', 'tests/simulation/playerConditionEngine.test.ts', '-t', 'compatible bench']
  },
  {
    label: 'MISSION 74: simulation condition events',
    args: ['vitest', 'run', 'tests/simulation/simulateMatch.test.ts', '-t', 'condition and substitution']
  },
  {
    label: 'MISSION 75: API condition events',
    args: ['vitest', 'run', 'tests/api/server.test.ts', '-t', 'condition and substitution']
  },
  {
    label: 'MISSION 76: interactive replay first pause',
    args: ['vitest', 'run', 'tests/simulation/interactiveTimeline.test.ts', '-t', 'first pause']
  },
  {
    label: 'MISSION 77: interactive replay continues',
    args: ['vitest', 'run', 'tests/simulation/interactiveTimeline.test.ts', '-t', 'continues']
  },
  {
    label: 'MISSION 78: interactive replay score so far',
    args: ['vitest', 'run', 'tests/simulation/interactiveTimeline.test.ts', '-t', 'score so far']
  },
  {
    label: 'MISSION 79: interactive replay manager actions',
    args: ['vitest', 'run', 'tests/simulation/interactiveTimeline.test.ts', '-t', 'manager action']
  },
  {
    label: 'MISSION 80: interactive replay web formatting',
    args: ['vitest', 'run', 'tests/web/interactiveReplayViewModel.test.ts', '-t', 'formats minute']
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
