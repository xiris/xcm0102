import type { MatchEventCategory } from './domain';
import type { SeededRng } from './rng';
import type { ResolvedChance } from './chanceEngine';

export type CommentaryPackId = 'classic_cm';

type ChanceOutcome = ResolvedChance['outcome'];
type TemplateContext = Omit<ResolvedChance, 'description'>;
type CommentaryTemplate = (chance: TemplateContext) => string;

type CommentaryTemplateMatrix = Record<MatchEventCategory, Record<ChanceOutcome, CommentaryTemplate[]>>;

export type CommentaryPack = {
  id: CommentaryPackId;
  name: string;
  templates: CommentaryTemplateMatrix;
};

export const commentaryPacks: Record<CommentaryPackId, CommentaryPack> = {
  classic_cm: {
    id: 'classic_cm',
    name: 'Classic terse CM-style commentary',
    templates: {
      through_ball: {
        goal: [
          (c) => `${c.creator} threads it through to ${c.shooter}, who scores!`,
          (c) => `${c.shooter} beats the line from ${c.creator}'s pass and finishes.`,
          (c) => `${c.creator} opens the defence; ${c.shooter} makes no mistake.`
        ],
        save: [
          (c) => `${c.creator} slips in ${c.shooter}, but ${c.goalkeeper} saves.`,
          (c) => `${c.shooter} races onto the through ball; ${c.goalkeeper} blocks it.`,
          (c) => `${c.creator}'s pass releases ${c.shooter}. ${c.goalkeeper} is equal to it.`
        ],
        block: [
          (c) => `${c.creator} looks for ${c.shooter}, but ${c.defender} cuts it out.`,
          (c) => `${c.shooter} is played in and ${c.defender} gets across to block.`,
          (c) => `${c.defender} reads the through ball before ${c.shooter} can strike.`
        ],
        miss: [
          (c) => `${c.creator} sends ${c.shooter} clear, but the shot goes wide.`,
          (c) => `${c.shooter} latches onto ${c.creator}'s pass and misses the target.`,
          (c) => `${c.creator}'s clever ball finds ${c.shooter}; the finish is wayward.`
        ]
      },
      counter_attack: {
        goal: [
          (c) => `${c.shooter} breaks into space and scores from ${c.creator}'s pass.`,
          (c) => `A rapid counter ends with ${c.shooter} putting it away.`,
          (c) => `${c.creator} leads the break; ${c.shooter} finishes clinically.`
        ],
        save: [
          (c) => `${c.shooter} bursts clear on the counter, but ${c.goalkeeper} saves.`,
          (c) => `${c.creator} turns defence into attack; ${c.goalkeeper} denies ${c.shooter}.`,
          (c) => `${c.shooter} finds space on the break and forces a save.`
        ],
        block: [
          (c) => `${c.defender} recovers superbly to block ${c.shooter}'s counter attack.`,
          (c) => `${c.creator} launches the break, but ${c.defender} gets back.`,
          (c) => `${c.shooter} shoots after a quick break; ${c.defender} throws himself in.`
        ],
        miss: [
          (c) => `${c.shooter} has space on the counter but fires wide.`,
          (c) => `${c.creator} starts the break; ${c.shooter}'s finish is poor.`,
          (c) => `${c.shooter} races away and drags the chance past the post.`
        ]
      },
      cross: {
        goal: [
          (c) => `${c.creator} crosses and ${c.shooter} heads home.`,
          (c) => `${c.shooter} meets ${c.creator}'s cross and scores.`,
          (c) => `${c.creator} delivers from the flank; ${c.shooter} finishes first time.`
        ],
        save: [
          (c) => `${c.creator} swings in a cross; ${c.goalkeeper} saves from ${c.shooter}.`,
          (c) => `${c.shooter} meets the cross, but ${c.goalkeeper} reacts well.`,
          (c) => `${c.creator}'s ball from the flank finds ${c.shooter}; saved.`
        ],
        block: [
          (c) => `${c.defender} blocks ${c.shooter}'s effort after ${c.creator}'s cross.`,
          (c) => `${c.creator} crosses dangerously, but ${c.defender} clears the shot.`,
          (c) => `${c.shooter} attacks the delivery and ${c.defender} gets in the way.`
        ],
        miss: [
          (c) => `${c.shooter} heads ${c.creator}'s cross over the bar.`,
          (c) => `${c.creator} finds space on the flank; ${c.shooter} misses.`,
          (c) => `${c.shooter} cannot steer the cross on target.`
        ]
      },
      long_shot: {
        goal: [
          (c) => `${c.shooter} hits it from distance and scores!`,
          (c) => `${c.creator} lays it off and ${c.shooter} buries a long shot.`,
          (c) => `${c.shooter} unleashes a drive from range. Goal.`
        ],
        save: [
          (c) => `${c.shooter} tries one from distance; ${c.goalkeeper} saves.`,
          (c) => `${c.creator} tees up ${c.shooter}, whose long shot is held.`,
          (c) => `${c.shooter}'s drive from range is pushed away by ${c.goalkeeper}.`
        ],
        block: [
          (c) => `${c.shooter} shoots from range and ${c.defender} blocks.`,
          (c) => `${c.defender} closes down ${c.shooter}'s long shot.`,
          (c) => `${c.creator} sets it back; ${c.defender} charges down the strike.`
        ],
        miss: [
          (c) => `${c.shooter} tries his luck from distance, but it flies wide.`,
          (c) => `${c.creator} lays it off and ${c.shooter} shoots over.`,
          (c) => `${c.shooter}'s long shot never troubles ${c.goalkeeper}.`
        ]
      },
      set_piece: {
        goal: [
          (c) => `${c.creator}'s free kick picks out ${c.shooter}, who scores.`,
          (c) => `From the corner, ${c.shooter} rises and finds the net.`,
          (c) => `${c.creator} delivers the set piece; ${c.shooter} turns it in.`
        ],
        save: [
          (c) => `${c.creator}'s free kick is met by ${c.shooter}; ${c.goalkeeper} saves.`,
          (c) => `${c.shooter} gets to the corner and ${c.goalkeeper} keeps it out.`,
          (c) => `The set piece drops to ${c.shooter}, but ${c.goalkeeper} reacts.`
        ],
        block: [
          (c) => `${c.defender} blocks ${c.shooter}'s effort from the set piece.`,
          (c) => `${c.creator}'s corner causes trouble until ${c.defender} intervenes.`,
          (c) => `${c.shooter} shoots after the free kick and ${c.defender} blocks.`
        ],
        miss: [
          (c) => `${c.shooter} meets ${c.creator}'s free kick but heads wide.`,
          (c) => `The corner reaches ${c.shooter}, who cannot keep it down.`,
          (c) => `${c.creator}'s set piece finds ${c.shooter}; the effort misses.`
        ]
      }
    }
  }
};

export function describeChanceWithPack(chance: TemplateContext, rng: SeededRng, packId: CommentaryPackId = 'classic_cm'): string {
  const pack = commentaryPacks[packId];
  const templates = pack.templates[chance.category][chance.outcome];
  return rng.pick(templates)(chance);
}
