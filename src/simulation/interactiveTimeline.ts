import type { MatchEvent, MatchEventType, MatchResult } from './domain';

export type InteractiveMatchSource = Pick<MatchResult, 'events'>;

export type InteractiveMatchOptions = {
  currentMinute: number;
  forceFullTime?: boolean;
};

export type InteractiveMatchState = {
  currentMinute: number;
  visibleEvents: MatchEvent[];
  pauseEvent?: MatchEvent;
  scoreSoFar: { home: number; away: number };
  availableActions: string[];
  isComplete: boolean;
};

const pauseEventTypes = new Set<MatchEventType>([
  'goal',
  'foul',
  'free_kick',
  'corner',
  'offside',
  'yellow_card',
  'red_card',
  'fatigue_warning',
  'injury',
  'substitution',
  'tactical_shift',
  'full_time'
]);

export function isPauseEventType(type: MatchEventType): boolean {
  return pauseEventTypes.has(type);
}

export function createInteractiveMatchState(result: InteractiveMatchSource, options: InteractiveMatchOptions): InteractiveMatchState {
  const orderedEvents = [...result.events].sort((a, b) => a.minute - b.minute);
  const nextPause = options.forceFullTime
    ? orderedEvents[orderedEvents.length - 1]
    : orderedEvents.find((event) => event.minute > options.currentMinute && isPauseEventType(event.type));
  const currentMinute = nextPause?.minute ?? 90;
  const visibleEvents = orderedEvents.filter((event) => event.minute <= currentMinute);
  const pauseEvent = [...visibleEvents].reverse().find((event: MatchEvent) => event.minute === currentMinute && isPauseEventType(event.type));
  const state = {
    currentMinute,
    visibleEvents,
    scoreSoFar: scoreFromEvents(visibleEvents),
    availableActions: pauseEvent ? availableActionsForPause(pauseEvent) : [],
    isComplete: currentMinute >= 90 || pauseEvent?.type === 'full_time'
  };
  return pauseEvent ? { ...state, pauseEvent } : state;
}

function scoreFromEvents(events: MatchEvent[]): { home: number; away: number } {
  return events.reduce((score, event) => {
    if (event.type !== 'goal') return score;
    if (event.teamId === 'home') return { ...score, home: score.home + 1 };
    if (event.teamId === 'away') return { ...score, away: score.away + 1 };
    return score;
  }, { home: 0, away: 0 });
}

function availableActionsForPause(event: MatchEvent): string[] {
  switch (event.type) {
    case 'goal':
      return ['Change mentality', 'Change pressing', 'Continue'];
    case 'yellow_card':
    case 'red_card':
      return ['Reduce pressing or change mentality', 'Prepare substitution', 'Continue'];
    case 'fatigue_warning':
    case 'injury':
      return ['Prepare substitution', 'Lower tempo/pressing', 'Continue'];
    case 'substitution':
      return ['Confirm substitution and continue', 'Review formation'];
    case 'foul':
    case 'free_kick':
    case 'corner':
    case 'offside':
      return ['Adjust defensive line', 'Change pressing', 'Continue'];
    case 'full_time':
      return ['Review match report'];
    default:
      return ['Continue'];
  }
}
