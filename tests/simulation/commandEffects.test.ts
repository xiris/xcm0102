import { describe, expect, it } from 'vitest';
import { projectCommandEffects } from '../../src/simulation/commandEffects';
import type { ManagerCommand } from '../../src/simulation/managerCommands';

function command(action: string, minute = 54): ManagerCommand {
  return {
    id: `cmd-${minute}-${action.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    minute,
    action,
    eventType: 'fatigue_warning',
    eventDescription: 'Pressure event.',
    effectSummary: `Recorded intent: ${action.toLowerCase()} at ${minute}’.`
  };
}

describe('command effects projection', () => {
  it('returns neutral projected state without manager commands', () => {
    expect(projectCommandEffects([])).toEqual({
      pressingAdjustment: 0,
      mentalityAdjustment: 0,
      defensiveRiskAdjustment: 0,
      fatigueRelief: 0,
      substitutionIntent: 0,
      formationReview: false,
      commandSignature: 'no-commands',
      diagnostics: ['No outcome-affecting manager commands recorded yet.']
    });
  });

  it('projects lower tempo and pressing into fatigue relief', () => {
    const effects = projectCommandEffects([command('Lower tempo/pressing', 54)]);

    expect(effects.pressingAdjustment).toBe(-1);
    expect(effects.fatigueRelief).toBe(2);
    expect(effects.diagnostics).toContain('54’ Lower tempo/pressing reduced pressing load and fatigue pressure.');
  });

  it('projects mentality and pressing changes into tactical pressure', () => {
    const effects = projectCommandEffects([command('Change mentality', 14), command('Change pressing', 21)]);

    expect(effects.mentalityAdjustment).toBe(1);
    expect(effects.pressingAdjustment).toBe(1);
    expect(effects.commandSignature).toBe('cmd-14-change-mentality|cmd-21-change-pressing');
  });

  it('projects defensive-line adjustment into lower defensive risk', () => {
    const effects = projectCommandEffects([command('Adjust defensive line', 7)]);

    expect(effects.defensiveRiskAdjustment).toBe(-1);
    expect(effects.diagnostics).toContain('7’ Adjust defensive line lowered defensive exposure after the pause event.');
  });

  it('tracks substitution intent and formation review separately', () => {
    const effects = projectCommandEffects([command('Prepare substitution', 60), command('Review formation', 61)]);

    expect(effects.substitutionIntent).toBe(1);
    expect(effects.formationReview).toBe(true);
    expect(effects.diagnostics).toContain('60’ Prepare substitution queued substitution intent for the next personnel phase.');
    expect(effects.diagnostics).toContain('61’ Review formation marked the shape for manager review.');
  });
});
