import type { MatchCommand } from './domain';
import { isContinueOnlyAction, type ManagerCommand } from './managerCommands';

export function translateManagerCommandsToMatchCommands(commands: ManagerCommand[], teamId: string): MatchCommand[] {
  return commands.flatMap((command) => translateManagerCommand(command, teamId));
}

function translateManagerCommand(command: ManagerCommand, teamId: string): MatchCommand[] {
  const action = command.action.trim().toLowerCase();
  if (isContinueOnlyAction(command.action) || action.startsWith('review ')) return [];

  switch (action) {
    case 'change mentality':
      return [{ minute: command.minute, teamId, type: 'change_mentality', value: 'attacking' }];
    case 'change pressing':
      return [{ minute: command.minute, teamId, type: 'change_pressing', value: 'high' }];
    case 'lower tempo/pressing':
      return [{ minute: command.minute, teamId, type: 'change_pressing', value: 'low' }];
    case 'adjust defensive line':
      return [{ minute: command.minute, teamId, type: 'change_transition_style', value: 'hold_shape' }];
    case 'reduce pressing or change mentality':
      return [
        { minute: command.minute, teamId, type: 'change_pressing', value: 'low' },
        { minute: command.minute, teamId, type: 'change_mentality', value: 'defensive' }
      ];
    default:
      return [];
  }
}
