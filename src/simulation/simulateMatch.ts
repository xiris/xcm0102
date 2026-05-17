import type {
  MatchEvent,
  MatchInput,
  MatchResult,
  Team,
  TeamMatchStats,
  TacticBook,
  WibWobMap
} from './domain';
import { createSeededRng } from './rng';

const ENGINE_VERSION = 'production-sim-foundation-0.1.0';

type TeamEvaluation = {
  execution: number;
  movementLoad: number;
  transitionDelay: number;
  lateArrivals: number;
  fatigue: number;
  attackIntent: number;
  defensiveControl: number;
};

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, decimals = 3): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function avgAttr(team: Team, names: Array<keyof Team['players'][number]['attributes']>): number {
  return average(team.players.map((player) => average(names.map((name) => player.attributes[name]))));
}

function allPoints(map: WibWobMap): Array<{ x: number; y: number }> {
  return Object.values(map).flatMap((zone) => (zone ? Object.values(zone) : []));
}

function mapCentroid(map: WibWobMap): { x: number; y: number } {
  const points = allPoints(map);
  if (points.length === 0) {
    return { x: 50, y: 50 };
  }
  return {
    x: average(points.map((point) => point.x)),
    y: average(points.map((point) => point.y))
  };
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function movementLoad(tactic: TacticBook): number {
  const wib = mapCentroid(tactic.wib);
  const wob = mapCentroid(tactic.wob);
  const spread = average([...allPoints(tactic.wib), ...allPoints(tactic.wob)].map((point) => distance(point, { x: 50, y: 50 })));
  return round(distance(wib, wob) + spread / 3, 3);
}

function evaluateTeam(team: Team, tactic: TacticBook): TeamEvaluation {
  const athletic = avgAttr(team, ['pace', 'acceleration']);
  const stamina = avgAttr(team, ['stamina']);
  const defensiveBrain = avgAttr(team, ['positioning', 'anticipation']);
  const attackingBrain = avgAttr(team, ['teamwork', 'decisions', 'passing']);
  const finishing = avgAttr(team, ['finishing']);
  const tackling = avgAttr(team, ['tackling']);
  const familiarity = clamp(tactic.familiarity, 0, 1);
  const load = movementLoad(tactic);

  const execution = clamp(
    (athletic * 0.2 + stamina * 0.15 + defensiveBrain * 0.2 + attackingBrain * 0.25 + finishing * 0.1 + tackling * 0.1) / 20 *
      (0.65 + familiarity * 0.35),
    0.1,
    1
  );

  const transitionStyleFactor = tactic.transitionStyle === 'fast_break' ? 0.9 : tactic.transitionStyle === 'hold_shape' ? 1.1 : 1;
  const pressingFatigue = tactic.pressing === 'high' ? 10 : tactic.pressing === 'medium' ? 5 : 1;
  const transitionDelay = Math.max(0, load * transitionStyleFactor * (1.25 - execution) * (1.1 - familiarity));
  const lateArrivals = Math.max(0, Math.floor((load / 6) * (1.18 - athletic / 20) * (1.08 - familiarity)));
  const fatigue = Math.max(0, load * (1.2 - stamina / 20) + pressingFatigue + lateArrivals * 0.6);
  const mentalityAttack = tactic.mentality === 'attacking' ? 1.22 : tactic.mentality === 'balanced' ? 1 : 0.78;
  const mentalityDefense = tactic.mentality === 'defensive' ? 1.18 : tactic.mentality === 'balanced' ? 1 : 0.84;

  return {
    execution: round(execution),
    movementLoad: load,
    transitionDelay: round(transitionDelay),
    lateArrivals,
    fatigue: round(fatigue),
    attackIntent: round(mentalityAttack * (0.6 + execution * 0.8) * (0.8 + attackingBrain / 50)),
    defensiveControl: round(mentalityDefense * (0.65 + execution * 0.7) * (0.75 + defensiveBrain / 55))
  };
}

function buildStats(evaluation: TeamEvaluation, opponent: TeamEvaluation, chanceNoise: number): TeamMatchStats {
  const pressure = evaluation.attackIntent + opponent.transitionDelay / 14 + opponent.lateArrivals / 12 - opponent.defensiveControl * 0.45;
  const shots = Math.max(1, Math.round(5 + pressure * 4 + chanceNoise));
  const shotsOnTarget = clamp(Math.round(shots * (0.28 + evaluation.execution * 0.28)), 0, shots);
  const goals = Math.max(0, Math.floor(shotsOnTarget * (0.12 + evaluation.execution * 0.12)));

  return {
    shots,
    shotsOnTarget,
    goals,
    possession: 50,
    fatigue: evaluation.fatigue,
    transitionDelay: evaluation.transitionDelay,
    lateArrivals: evaluation.lateArrivals,
    execution: evaluation.execution,
    movementLoad: evaluation.movementLoad
  };
}

function diagnostics(side: 'Home' | 'Away', team: Team, tactic: TacticBook, evaluation: TeamEvaluation): string[] {
  const notes: string[] = [];
  if (tactic.familiarity < 0.45) {
    notes.push(`${side} low tactical familiarity slowed WIB/WOB transition execution`);
  }
  if (evaluation.movementLoad > 35) {
    notes.push(`${side} WIB/WOB movement geometry created long recovery runs`);
  }
  if (evaluation.execution < 0.55) {
    notes.push(`${side} player attributes limited transition execution`);
  }
  if (evaluation.lateArrivals > 8) {
    notes.push(`${side} late arrivals opened counter windows`);
  }
  if (tactic.pressing === 'high' && evaluation.fatigue > 30) {
    notes.push(`${side} high pressing increased fatigue costs`);
  }
  if (team.players.length < 11) {
    notes.push(`${side} had fewer than eleven players in the simulation input`);
  }
  return notes;
}

export function simulateMatch(input: MatchInput): MatchResult {
  const rng = createSeededRng(input.seed);
  const homeEval = evaluateTeam(input.home, input.homeTactic);
  const awayEval = evaluateTeam(input.away, input.awayTactic);

  const homeStats = buildStats(homeEval, awayEval, rng.int(-1, 2));
  const awayStats = buildStats(awayEval, homeEval, rng.int(-1, 2));
  const totalAttack = Math.max(1, homeEval.attackIntent + awayEval.attackIntent);
  homeStats.possession = Math.round((homeEval.attackIntent / totalAttack) * 100);
  awayStats.possession = 100 - homeStats.possession;

  const events: MatchEvent[] = [
    { minute: 1, type: 'kickoff' as const, description: 'The match begins with server-owned deterministic simulation.' },
    {
      minute: 12 + rng.int(0, 10),
      teamId: input.home.id,
      type: 'chance' as const,
      description: `${input.home.name} create pressure from ${input.homeTactic.mentality} mentality.`
    },
    {
      minute: 22 + rng.int(0, 16),
      teamId: homeEval.transitionDelay > awayEval.transitionDelay ? input.home.id : input.away.id,
      type: 'transition_delay' as const,
      description: 'A possession transition exposes recovery timing and tactical familiarity.'
    }
  ];

  if (homeStats.goals > 0) {
    events.push({ minute: 35 + rng.int(0, 20), teamId: input.home.id, type: 'goal', description: `${input.home.name} score after sustained pressure.` });
  }
  if (awayStats.goals > 0) {
    events.push({ minute: 50 + rng.int(0, 25), teamId: input.away.id, type: 'goal', description: `${input.away.name} score after exploiting space.` });
  }
  if (homeEval.lateArrivals > 0 || awayEval.lateArrivals > 0) {
    events.push({ minute: 70 + rng.int(0, 12), type: 'late_arrival', description: 'Late recovery runs affect second-half structure.' });
  }
  events.push({ minute: 90, type: 'full_time', description: 'Full time.' });
  events.sort((a, b) => a.minute - b.minute);

  const reportDiagnostics = [
    ...diagnostics('Home', input.home, input.homeTactic, homeEval),
    ...diagnostics('Away', input.away, input.awayTactic, awayEval)
  ];
  if (reportDiagnostics.length === 0) {
    reportDiagnostics.push('Balanced tactical execution: no major transition warning exceeded the reporting threshold');
  }

  return {
    score: { home: homeStats.goals, away: awayStats.goals },
    stats: { home: homeStats, away: awayStats },
    events,
    report: {
      diagnostics: reportDiagnostics,
      replay: {
        seed: input.seed,
        engineVersion: ENGINE_VERSION,
        commandCount: input.commands?.length ?? 0
      }
    }
  };
}
