import type { InteractiveMatchState } from '../simulation/interactiveTimeline';
import type { ManagerCommand } from '../simulation/managerCommands';

export type InteractiveReplayViewModel = {
  title: string;
  scoreLine: string;
  status: string;
  events: string[];
  actions: string[];
  commands: string[];
  continueLabel: string;
};

export function createInteractiveReplayViewModel(state: InteractiveMatchState, commands: ManagerCommand[] = []): InteractiveReplayViewModel {
  return {
    title: state.isComplete ? 'Interactive replay · Full time' : `Interactive replay · ${state.currentMinute}’`,
    scoreLine: `Home XI ${state.scoreSoFar.home} - ${state.scoreSoFar.away} Away XI`,
    status: state.isComplete ? (state.pauseEvent?.description ?? 'Full time.') : `Paused: ${state.pauseEvent?.description ?? 'Waiting for the next key event.'}`,
    events: state.visibleEvents.map((event) => `${event.minute}’ ${event.description}`),
    actions: state.availableActions,
    commands: commands.map((command) => `${command.minute}’ ${command.action} — ${command.effectSummary}`),
    continueLabel: state.isComplete ? 'Replay complete' : 'Continue to next key event'
  };
}
