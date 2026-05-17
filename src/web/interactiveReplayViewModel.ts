import type { InteractiveMatchState } from '../simulation/interactiveTimeline';
import { projectCommandEffects } from '../simulation/commandEffects';
import { isContinueOnlyAction, type ManagerCommand } from '../simulation/managerCommands';

export type InteractiveReplayViewModel = {
  title: string;
  scoreLine: string;
  status: string;
  events: string[];
  actions: string[];
  commands: string[];
  effects: string[];
  continueLabel: string;
};

export function createInteractiveReplayViewModel(state: InteractiveMatchState, commands: ManagerCommand[] = []): InteractiveReplayViewModel {
  const effects = projectCommandEffects(commands);
  return {
    title: state.isComplete ? 'Interactive replay · Full time' : `Interactive replay · ${state.currentMinute}’`,
    scoreLine: `Home XI ${state.scoreSoFar.home} - ${state.scoreSoFar.away} Away XI`,
    status: state.isComplete ? (state.pauseEvent?.description ?? 'Full time.') : `Paused: ${state.pauseEvent?.description ?? 'Waiting for the next key event.'}`,
    events: state.visibleEvents.map((event) => `${event.minute}’ ${event.description}`),
    actions: state.availableActions.filter((action) => !isContinueOnlyAction(action)),
    commands: commands.map((command) => `${command.minute}’ ${command.action} — ${command.effectSummary}`),
    effects: formatEffects(effects),
    continueLabel: state.isComplete ? 'Replay complete' : 'Continue to next key event'
  };
}

function formatEffects(effects: ReturnType<typeof projectCommandEffects>): string[] {
  return [
    ...effects.diagnostics,
    `Projected state: pressing ${formatSigned(effects.pressingAdjustment)} · mentality ${effects.mentalityAdjustment} · fatigue relief +${effects.fatigueRelief} · defensive risk ${formatSigned(effects.defensiveRiskAdjustment)} · substitution intent ${effects.substitutionIntent}`
  ];
}

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}
