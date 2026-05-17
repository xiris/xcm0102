import type { MatchEvent, MatchEventType } from './domain';

export type ManagerCommand = {
  id: string;
  minute: number;
  action: string;
  eventType: MatchEventType;
  eventDescription: string;
  effectSummary: string;
};

export type CreateManagerCommandInput = {
  action: string;
  pauseEvent: MatchEvent;
  commandIndex: number;
};

export type AppendManagerCommandInput = Omit<CreateManagerCommandInput, 'commandIndex'>;

export function createManagerCommand(input: CreateManagerCommandInput): ManagerCommand | null {
  if (isContinueOnlyAction(input.action)) return null;

  return {
    id: `cmd-${String(input.pauseEvent.minute).padStart(3, '0')}-${String(input.commandIndex + 1).padStart(2, '0')}-${slugify(input.action)}`,
    minute: input.pauseEvent.minute,
    action: input.action,
    eventType: input.pauseEvent.type,
    eventDescription: input.pauseEvent.description,
    effectSummary: `Recorded intent: ${input.action.toLowerCase()} at ${input.pauseEvent.minute}’.`
  };
}

export function appendManagerCommand(history: ManagerCommand[], input: AppendManagerCommandInput): ManagerCommand[] {
  const command = createManagerCommand({ ...input, commandIndex: history.length });
  return command ? [...history, command] : history;
}

function isContinueOnlyAction(action: string): boolean {
  return action.trim().toLowerCase() === 'continue';
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
