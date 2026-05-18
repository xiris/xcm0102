import type { MatchCommand, MatchEvent, MatchInput, MatchResult, Mentality, Pressing, TacticBook, TransitionStyle } from './domain';
import { simulateMatch } from './simulateMatch';

export type AuthoritativeResumeInput = {
  baseInput: MatchInput;
  currentMinute: number;
  visibleEvents: MatchEvent[];
  commands: MatchCommand[];
};

export type AuthoritativeResumeResult = MatchResult & {
  signature: string;
};

export function resumeMatchAuthoritatively(input: AuthoritativeResumeInput): AuthoritativeResumeResult {
  const original = simulateMatch(input.baseInput);
  assertVisibleHistoryMatches(input.visibleEvents, original.events, input.currentMinute);

  const adjustedInput = applyCommandsToInput(input.baseInput, input.commands);
  const regenerated = simulateMatch(adjustedInput);
  const futureEvents = regenerated.events.filter((event) => event.minute > input.currentMinute);
  const events = [...input.visibleEvents, ...futureEvents];
  const commandDiagnostics = commandApplicationDiagnostics(input.commands);

  return {
    ...regenerated,
    events,
    score: scoreFromEvents(events, input.baseInput.home.id, input.baseInput.away.id),
    report: {
      ...regenerated.report,
      diagnostics: [
        ...regenerated.report.diagnostics,
        ...commandDiagnostics,
        `Authoritative resume preserved ${input.visibleEvents.length} visible events at or before ${input.currentMinute}’.`
      ],
      replay: {
        ...regenerated.report.replay,
        commandCount: input.commands.length
      }
    },
    signature: resumeSignature(input, events.length)
  };
}

function assertVisibleHistoryMatches(visibleEvents: MatchEvent[], originalEvents: MatchEvent[], currentMinute: number): void {
  const expectedVisibleEvents = originalEvents.filter((event) => event.minute <= currentMinute);
  if (visibleEvents.length !== expectedVisibleEvents.length) {
    throw new Error('Authoritative resume visible event history does not match the server-owned original simulation.');
  }

  for (const [index, event] of visibleEvents.entries()) {
    const expected = expectedVisibleEvents[index];
    if (!expected || canonicalEvent(event) !== canonicalEvent(expected)) {
      throw new Error('Authoritative resume visible event history does not match the server-owned original simulation.');
    }
  }
}

function applyCommandsToInput(baseInput: MatchInput, commands: MatchCommand[]): MatchInput {
  return {
    ...baseInput,
    homeTactic: applyCommandsToTactic(baseInput.homeTactic, baseInput.home.id, commands),
    awayTactic: applyCommandsToTactic(baseInput.awayTactic, baseInput.away.id, commands),
    commands: [...commands]
  };
}

function applyCommandsToTactic(tactic: TacticBook, teamId: string, commands: MatchCommand[]): TacticBook {
  return commands
    .filter((command) => command.teamId === teamId && isValidCommand(command))
    .reduce<TacticBook>((current, command) => {
      switch (command.type) {
        case 'change_mentality':
          return { ...current, mentality: command.value };
        case 'change_pressing':
          return { ...current, pressing: command.value };
        case 'change_transition_style':
          return { ...current, transitionStyle: command.value };
      }
    }, { ...tactic });
}

function scoreFromEvents(events: MatchEvent[], homeTeamId: string, awayTeamId: string): MatchResult['score'] {
  return events.reduce<MatchResult['score']>((score, event) => {
    if (event.type !== 'goal') return score;
    if (event.teamId === homeTeamId) return { ...score, home: score.home + 1 };
    if (event.teamId === awayTeamId) return { ...score, away: score.away + 1 };
    return score;
  }, { home: 0, away: 0 });
}

function commandApplicationDiagnostics(commands: MatchCommand[]): string[] {
  return commands.map((command) => {
    if (!isValidCommand(command)) {
      return `${command.minute}’ ${command.teamId} ${command.type} command ignored invalid value ${command.value}.`;
    }
    return `${command.minute}’ ${command.teamId} ${command.type} command set ${commandLabel(command.type)} to ${command.value} for regenerated future simulation.`;
  });
}

function isValidCommand(command: MatchCommand): boolean {
  switch (command.type) {
    case 'change_mentality':
      return isMentality(command.value);
    case 'change_pressing':
      return isPressing(command.value);
    case 'change_transition_style':
      return isTransitionStyle(command.value);
  }
}

function isMentality(value: string): value is Mentality {
  return value === 'defensive' || value === 'balanced' || value === 'attacking';
}

function isPressing(value: string): value is Pressing {
  return value === 'low' || value === 'medium' || value === 'high';
}

function isTransitionStyle(value: string): value is TransitionStyle {
  return value === 'hold_shape' || value === 'balanced' || value === 'fast_break';
}

function commandLabel(type: MatchCommand['type']): string {
  switch (type) {
    case 'change_mentality':
      return 'mentality';
    case 'change_pressing':
      return 'pressing';
    case 'change_transition_style':
      return 'transition style';
  }
}

function resumeSignature(input: AuthoritativeResumeInput, eventCount: number): string {
  const commandSignature = input.commands.length === 0
    ? 'no-commands'
    : input.commands.map((command) => `${command.minute}-${command.teamId}-${command.type}-${command.value}`).join('|');
  return `${input.baseInput.seed}|${input.currentMinute}|${commandSignature}|vh-${hashEvents(input.visibleEvents)}|${eventCount}`;
}

function hashEvents(events: MatchEvent[]): string {
  const text = events.map(canonicalEvent).join('||');
  let hash = 5381;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) + hash + text.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

function canonicalEvent(event: MatchEvent): string {
  return [
    event.minute,
    event.teamId ?? '',
    event.type,
    event.category ?? '',
    event.outcome ?? '',
    event.chainId ?? '',
    event.sequence ?? '',
    event.description
  ].join('~');
}
