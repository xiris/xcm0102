import type { MatchEvent, Pressing } from './domain';
import { createSeededRng } from './rng';

export type EventChainOptions = {
  seed: number;
  homePressing: Pressing;
  awayPressing: Pressing;
};

export function expandChanceEventChains(events: MatchEvent[], options: EventChainOptions): MatchEvent[] {
  const rng = createSeededRng(options.seed);
  return events.flatMap((event, index) => expandChanceEvent(event, index, options, rng));
}

function expandChanceEvent(event: MatchEvent, index: number, options: EventChainOptions, rng: ReturnType<typeof createSeededRng>): MatchEvent[] {
  const chainId = `${event.teamId ?? 'neutral'}-${event.minute}-${index}`;
  const base = { ...event, chainId, sequence: 1 };

  if (event.category === 'through_ball' && shouldCallOffside(event, options, rng)) {
    return [
      {
        minute: event.minute,
        teamId: event.teamId ?? 'neutral',
        type: 'offside',
        category: event.category,
        outcome: 'offside',
        chainId,
        sequence: 1,
        description: rng.pick([
          'The flag goes up for offside before the chance can develop.',
          'The assistant spots the early run. Offside.',
          'The through ball is promising, but the flag is up.'
        ])
      }
    ];
  }

  const chain: MatchEvent[] = [];
  if (event.category === 'set_piece') {
    chain.push({
      minute: Math.max(1, event.minute - 2),
      teamId: event.teamId ?? 'neutral',
      type: 'foul',
      category: event.category,
      outcome: 'foul',
      chainId,
      sequence: 1,
      description: rng.pick([
        'A late challenge gives away a dangerous foul.',
        'The attacker is clipped just as the move opens up.',
        'A clumsy challenge stops the attack.'
      ])
    });
    const card = maybeCardEvent(event, chainId, 2, options, rng);
    if (card) {
      chain.push(card);
    }
    chain.push({
      minute: Math.max(1, event.minute - 1),
      teamId: event.teamId ?? 'neutral',
      type: 'free_kick',
      category: event.category,
      outcome: 'free_kick',
      chainId,
      sequence: chain.length + 1,
      description: rng.pick([
        'The free kick is lined up on the edge of the area.',
        'He stands over the free kick with options in the box.',
        'The set piece is delivered into a crowded area.'
      ])
    });
  } else if (event.category === 'cross' && event.outcome === 'block') {
    chain.push({
      minute: Math.max(1, event.minute - 1),
      teamId: event.teamId ?? 'neutral',
      type: 'corner',
      category: event.category,
      outcome: 'corner',
      chainId,
      sequence: 1,
      description: rng.pick([
        'The cross is deflected behind for a corner.',
        'A defender gets a touch and concedes the corner.',
        'The block spins behind. Corner kick.'
      ])
    });
  } else {
    const card = maybeCardEvent(event, chainId, 1, options, rng);
    if (card) {
      chain.push(card);
    }
  }

  chain.push({ ...base, sequence: chain.length + 1 });
  return chain;
}

function shouldCallOffside(event: MatchEvent, options: EventChainOptions, rng: ReturnType<typeof createSeededRng>): boolean {
  const pressingRisk = pressingValue(options.homePressing) + pressingValue(options.awayPressing);
  return event.category === 'through_ball' && event.outcome !== 'goal' && rng.next() + pressingRisk * 0.05 > 0.55;
}

function maybeCardEvent(event: MatchEvent, chainId: string, sequence: number, options: EventChainOptions, rng: ReturnType<typeof createSeededRng>): MatchEvent | undefined {
  const risk = pressingValue(options.homePressing) + pressingValue(options.awayPressing);
  if (risk < 2.7 || rng.next() < 0.12) {
    return undefined;
  }
  const red = risk > 2.6 && rng.next() > 0.92;
  return {
    minute: Math.max(1, event.minute - 1),
    teamId: event.teamId ?? 'neutral',
    type: red ? 'red_card' : 'yellow_card',
    category: event.category ?? 'long_shot',
    outcome: red ? 'red_card' : 'yellow_card',
    chainId,
    sequence,
    description: red
      ? rng.pick(['The referee reaches for red. He is sent off.', 'A reckless tackle brings a straight red card.'])
      : rng.pick(['The referee shows a yellow card.', 'He is booked for that challenge.', 'The challenge earns a yellow card.'])
  };
}

function pressingValue(pressing: Pressing): number {
  return pressing === 'high' ? 1.4 : pressing === 'medium' ? 0.8 : 0.3;
}
