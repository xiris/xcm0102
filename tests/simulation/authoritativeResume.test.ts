import { describe, expect, it } from 'vitest';
import { resumeMatchAuthoritatively } from '../../src/simulation/authoritativeResume';
import { simulateMatch } from '../../src/simulation/simulateMatch';
import type { MatchCommand } from '../../src/simulation/domain';
import { createSampleMatchInput, createSampleTacticBook, createSampleTeam } from '../../src/simulation/sampleData';

describe('authoritative resumable match engine', () => {
  it('preserves visible history exactly while regenerating future events', () => {
    const baseInput = createSampleMatchInput({ seed: 57 });
    const original = simulateMatch(baseInput);
    const currentMinute = 54;
    const visibleEvents = original.events.filter((event) => event.minute <= currentMinute);

    const resumed = resumeMatchAuthoritatively({
      baseInput,
      currentMinute,
      visibleEvents,
      commands: []
    });

    expect(resumed.events.slice(0, visibleEvents.length)).toEqual(visibleEvents);
    expect(resumed.events.every((event, index) => index >= visibleEvents.length || event.minute <= currentMinute)).toBe(true);
    expect(resumed.events.some((event) => event.minute > currentMinute)).toBe(true);
  });

  it('returns identical resumed futures and signatures for identical inputs', () => {
    const baseInput = createSampleMatchInput({ seed: 64 });
    const original = simulateMatch(baseInput);
    const currentMinute = 46;
    const visibleEvents = original.events.filter((event) => event.minute <= currentMinute);
    const resumeInput = {
      baseInput,
      currentMinute,
      visibleEvents,
      commands: [{ minute: 46, teamId: 'home', type: 'change_mentality' as const, value: 'attacking' as const }]
    };

    expect(resumeMatchAuthoritatively(resumeInput)).toEqual(resumeMatchAuthoritatively(resumeInput));
  });

  it('applies typed manager commands to regenerated tactical state', () => {
    const baseInput = createSampleMatchInput({ seed: 71, homeFamiliarity: 0.75 });
    const original = simulateMatch(baseInput);
    const currentMinute = 50;
    const visibleEvents = original.events.filter((event) => event.minute <= currentMinute);

    const resumed = resumeMatchAuthoritatively({
      baseInput,
      currentMinute,
      visibleEvents,
      commands: [{ minute: 50, teamId: 'home', type: 'change_pressing', value: 'high' }]
    });

    expect(resumed.report.diagnostics).toContain('50’ home change_pressing command set pressing to high for regenerated future simulation.');
    expect(resumed.stats.home.fatigue).toBeGreaterThan(original.stats.home.fatigue);
  });

  it('scores regenerated goals for arbitrary team ids', () => {
    const home = createSampleTeam({ id: 'inter' });
    const away = createSampleTeam({ id: 'milan' });
    const baseInput = createSampleMatchInput({
      seed: 2,
      home,
      away,
      homeTactic: createSampleTacticBook({ mentality: 'attacking', playerIds: home.players.map((player) => player.id) }),
      awayTactic: createSampleTacticBook({ playerIds: away.players.map((player) => player.id) })
    });
    const original = simulateMatch(baseInput);

    const resumed = resumeMatchAuthoritatively({
      baseInput,
      currentMinute: 0,
      visibleEvents: [],
      commands: []
    });

    expect(original.score.home).toBeGreaterThan(0);
    expect(resumed.score).toEqual(original.score);
  });

  it('ignores invalid command value/type pairs instead of corrupting tactics', () => {
    const invalidCommand = {
      minute: 50,
      teamId: 'home',
      type: 'change_pressing',
      value: 'attacking'
    } as unknown as MatchCommand;
    const baseInput = createSampleMatchInput({ seed: 71, homeFamiliarity: 0.75 });
    const original = simulateMatch(baseInput);

    const resumed = resumeMatchAuthoritatively({
      baseInput,
      currentMinute: 50,
      visibleEvents: original.events.filter((event) => event.minute <= 50),
      commands: [invalidCommand]
    });

    expect(resumed.report.diagnostics).toContain('50’ home change_pressing command ignored invalid value attacking.');
    expect(resumed.stats.home.fatigue).toBe(original.stats.home.fatigue);
  });

  it('rejects forged visible events before preserving authoritative history', () => {
    const baseInput = createSampleMatchInput({ seed: 57 });
    const original = simulateMatch(baseInput);
    const visibleEvents = original.events.filter((event) => event.minute <= 54);

    expect(() => resumeMatchAuthoritatively({
      baseInput,
      currentMinute: 54,
      visibleEvents: [
        ...visibleEvents,
        { minute: 20, teamId: 'home', type: 'goal', description: 'Forged visible goal.' }
      ],
      commands: []
    })).toThrow(/visible event history does not match/i);
  });

  it('includes preserved visible history in the deterministic resume signature', () => {
    const baseInput = createSampleMatchInput({ seed: 57 });
    const original = simulateMatch(baseInput);
    const visibleEvents = original.events.filter((event) => event.minute <= 54);
    const earlyResume = resumeMatchAuthoritatively({ baseInput, currentMinute: 30, visibleEvents: visibleEvents.filter((event) => event.minute <= 30), commands: [] });
    const laterResume = resumeMatchAuthoritatively({ baseInput, currentMinute: 54, visibleEvents, commands: [] });

    expect(earlyResume.signature).not.toBe(laterResume.signature);
    expect(laterResume.signature).toContain('vh-');
  });
});
