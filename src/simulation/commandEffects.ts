import type { ManagerCommand } from './managerCommands';

export type CommandEffectsProjection = {
  pressingAdjustment: number;
  mentalityAdjustment: number;
  defensiveRiskAdjustment: number;
  fatigueRelief: number;
  substitutionIntent: number;
  formationReview: boolean;
  commandSignature: string;
  diagnostics: string[];
};

export function projectCommandEffects(commands: ManagerCommand[]): CommandEffectsProjection {
  if (commands.length === 0) {
    return {
      pressingAdjustment: 0,
      mentalityAdjustment: 0,
      defensiveRiskAdjustment: 0,
      fatigueRelief: 0,
      substitutionIntent: 0,
      formationReview: false,
      commandSignature: 'no-commands',
      diagnostics: ['No outcome-affecting manager commands recorded yet.']
    };
  }

  return commands.reduce<CommandEffectsProjection>((projection, command) => applyCommand(projection, command), {
    pressingAdjustment: 0,
    mentalityAdjustment: 0,
    defensiveRiskAdjustment: 0,
    fatigueRelief: 0,
    substitutionIntent: 0,
    formationReview: false,
    commandSignature: commands.map((command) => command.id).join('|'),
    diagnostics: []
  });
}

function applyCommand(projection: CommandEffectsProjection, command: ManagerCommand): CommandEffectsProjection {
  switch (command.action) {
    case 'Lower tempo/pressing':
      return {
        ...projection,
        pressingAdjustment: projection.pressingAdjustment - 1,
        fatigueRelief: projection.fatigueRelief + 2,
        diagnostics: [...projection.diagnostics, `${command.minute}’ ${command.action} reduced pressing load and fatigue pressure.`]
      };
    case 'Change mentality':
      return {
        ...projection,
        mentalityAdjustment: projection.mentalityAdjustment + 1,
        diagnostics: [...projection.diagnostics, `${command.minute}’ ${command.action} increased tactical pressure projection.`]
      };
    case 'Change pressing':
      return {
        ...projection,
        pressingAdjustment: projection.pressingAdjustment + 1,
        diagnostics: [...projection.diagnostics, `${command.minute}’ ${command.action} increased pressing intensity projection.`]
      };
    case 'Adjust defensive line':
      return {
        ...projection,
        defensiveRiskAdjustment: projection.defensiveRiskAdjustment - 1,
        diagnostics: [...projection.diagnostics, `${command.minute}’ ${command.action} lowered defensive exposure after the pause event.`]
      };
    case 'Prepare substitution':
    case 'Confirm substitution and continue':
      return {
        ...projection,
        substitutionIntent: projection.substitutionIntent + 1,
        diagnostics: [...projection.diagnostics, `${command.minute}’ ${command.action} queued substitution intent for the next personnel phase.`]
      };
    case 'Review formation':
      return {
        ...projection,
        formationReview: true,
        diagnostics: [...projection.diagnostics, `${command.minute}’ ${command.action} marked the shape for manager review.`]
      };
    case 'Reduce pressing or change mentality':
      return {
        ...projection,
        pressingAdjustment: projection.pressingAdjustment - 1,
        mentalityAdjustment: projection.mentalityAdjustment - 1,
        fatigueRelief: projection.fatigueRelief + 1,
        diagnostics: [...projection.diagnostics, `${command.minute}’ ${command.action} reduced pressure and protected booked/tired players.`]
      };
    default:
      return {
        ...projection,
        diagnostics: [...projection.diagnostics, `${command.minute}’ ${command.action} recorded without a projected tactical modifier yet.`]
      };
  }
}
