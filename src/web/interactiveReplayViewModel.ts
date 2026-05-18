import type { InteractiveMatchState } from '../simulation/interactiveTimeline';
import { projectCommandEffects } from '../simulation/commandEffects';
import type { MatchEvent } from '../simulation/domain';
import { isContinueOnlyAction, type ManagerCommand } from '../simulation/managerCommands';
import { projectRemainingReplay } from '../simulation/resumableReplayProjection';

export type InteractiveReplayViewModel = {
  title: string;
  scoreLine: string;
  status: string;
  events: string[];
  actions: string[];
  commands: string[];
  effects: string[];
  projectedReplay: string[];
  continueLabel: string;
};

export function createInteractiveReplayViewModel(state: InteractiveMatchState, commands: ManagerCommand[] = [], sourceEvents: MatchEvent[] = []): InteractiveReplayViewModel {
  const effects = projectCommandEffects(commands);
  const projectedReplay = sourceEvents.length > 0 ? formatProjectedReplay(projectRemainingReplay({ sourceEvents, currentMinute: state.currentMinute, commands }), state.currentMinute) : [];
  return {
    title: state.isComplete ? 'Interactive replay · Full time' : `Interactive replay · ${state.currentMinute}’`,
    scoreLine: `Home XI ${state.scoreSoFar.home} - ${state.scoreSoFar.away} Away XI`,
    status: state.isComplete ? (state.pauseEvent?.description ?? 'Full time.') : `Paused: ${state.pauseEvent?.description ?? 'Waiting for the next key event.'}`,
    events: state.visibleEvents.map((event) => `${event.minute}’ ${event.description}`),
    actions: state.availableActions.filter((action) => !isContinueOnlyAction(action)),
    commands: commands.map((command) => `${command.minute}’ ${command.action} — ${command.effectSummary}`),
    effects: formatEffects(effects),
    projectedReplay,
    continueLabel: state.isComplete ? 'Replay complete' : 'Continue to next key event'
  };
}

function formatEffects(effects: ReturnType<typeof projectCommandEffects>): string[] {
  return [
    ...effects.diagnostics,
    `Projected state: pressing ${formatSigned(effects.pressingAdjustment)} · mentality ${effects.mentalityAdjustment} · fatigue relief +${effects.fatigueRelief} · defensive risk ${formatSigned(effects.defensiveRiskAdjustment)} · substitution intent ${effects.substitutionIntent}`
  ];
}

function formatProjectedReplay(projection: ReturnType<typeof projectRemainingReplay>, currentMinute: number): string[] {
  const remaining = projection.events
    .filter((event) => event.minute > currentMinute)
    .map((event) => `${event.minute}’ ${event.description}`);
  return [
    `Projected final: Home XI ${projection.score.home} - ${projection.score.away} Away XI`,
    `Remaining projected events: ${remaining.length > 0 ? remaining.join(' · ') : 'none'}`,
    ...projection.diagnostics
  ];
}

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}
