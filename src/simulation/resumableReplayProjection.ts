import type { MatchEvent } from './domain';
import { projectCommandEffects } from './commandEffects';
import type { ManagerCommand } from './managerCommands';

export type RemainingReplayProjectionInput = {
  sourceEvents: MatchEvent[];
  currentMinute: number;
  commands: ManagerCommand[];
};

export type RemainingReplayProjection = {
  events: MatchEvent[];
  score: { home: number; away: number };
  diagnostics: string[];
  signature: string;
};

const pressureTypes = new Set<MatchEvent['type']>(['chance', 'free_kick', 'corner', 'foul', 'offside']);

export function projectRemainingReplay(input: RemainingReplayProjectionInput): RemainingReplayProjection {
  const effects = projectCommandEffects(input.commands);
  if (input.commands.length === 0) {
    const events = [...input.sourceEvents];
    return {
      events,
      score: scoreFromEvents(events),
      diagnostics: ['Projected replay preserves original timeline because no manager commands are recorded.'],
      signature: `${effects.commandSignature}|${input.currentMinute}|${events.length}`
    };
  }

  const diagnostics: string[] = [];
  const visibleEvents = input.sourceEvents.filter((event) => event.minute <= input.currentMinute);
  let futureEvents = input.sourceEvents.filter((event) => event.minute > input.currentMinute);

  for (const command of input.commands) {
    if (command.action === 'Lower tempo/pressing' || command.action === 'Reduce pressing or change mentality') {
      const candidate = futureEvents.find((event) => event.minute > command.minute && event.type === 'fatigue_warning');
      if (candidate) {
        futureEvents = futureEvents.filter((event) => event !== candidate);
        diagnostics.push(`${command.minute}’ ${command.action} suppressed future fatigue warning at ${candidate.minute}’.`);
      }
    }

    if (command.action === 'Adjust defensive line') {
      const candidate = futureEvents.find((event) => event.minute > command.minute && event.teamId === 'away' && pressureTypes.has(event.type));
      if (candidate) {
        futureEvents = futureEvents.filter((event) => event !== candidate);
        diagnostics.push(`${command.minute}’ ${command.action} reduced away pressure event at ${candidate.minute}’.`);
      }
    }
  }

  const injectedEvents = proactiveTacticalShiftEvents(input.commands, input.currentMinute);
  const projectedFutureEvents = [...futureEvents, ...injectedEvents].sort((a, b) => a.minute - b.minute || eventOrder(a) - eventOrder(b));
  const events = [...visibleEvents, ...projectedFutureEvents];

  if (input.commands.length > 0) {
    diagnostics.push(`Projection uses command effects signature: ${effects.commandSignature}.`);
  }

  return {
    events,
    score: scoreFromEvents(events),
    diagnostics,
    signature: `${effects.commandSignature}|${input.currentMinute}|${events.length}`
  };
}

function proactiveTacticalShiftEvents(commands: ManagerCommand[], currentMinute: number): MatchEvent[] {
  const events: MatchEvent[] = [];
  const usedMinutes = new Set<number>();

  for (const command of commands) {
    const description = tacticalShiftDescription(command.action);
    if (!description) continue;

    const minute = firstAvailableTacticalShiftMinute(Math.max(currentMinute, command.minute) + 1, usedMinutes);
    if (minute === null) continue;
    usedMinutes.add(minute);
    events.push({ minute, teamId: 'home', type: 'tactical_shift', description });
  }

  return events;
}

function firstAvailableTacticalShiftMinute(startMinute: number, usedMinutes: Set<number>): number | null {
  for (let minute = startMinute; minute <= 89; minute += 1) {
    if (!usedMinutes.has(minute)) return minute;
  }
  return null;
}

function tacticalShiftDescription(action: string): string | null {
  if (action === 'Change mentality') return 'Home mentality changed after manager command.';
  if (action === 'Change pressing') return 'Home pressing changed after manager command.';
  return null;
}

function scoreFromEvents(events: MatchEvent[]): { home: number; away: number } {
  return events.reduce((score, event) => {
    if (event.type !== 'goal') return score;
    if (event.teamId === 'home') return { ...score, home: score.home + 1 };
    if (event.teamId === 'away') return { ...score, away: score.away + 1 };
    return score;
  }, { home: 0, away: 0 });
}

function eventOrder(event: MatchEvent): number {
  switch (event.type) {
    case 'kickoff':
      return 0;
    case 'tactical_shift':
      return 1;
    case 'full_time':
      return 99;
    default:
      return 50;
  }
}
