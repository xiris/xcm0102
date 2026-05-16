export type PlayerAttributes = {
  pace: number;
  acceleration: number;
  stamina: number;
  positioning: number;
  anticipation: number;
  teamwork: number;
  decisions: number;
  finishing: number;
  passing: number;
  tackling: number;
};

export type PlayerPosition = 'GK' | 'D' | 'DM' | 'M' | 'AM' | 'F';

export type Player = {
  id: string;
  name: string;
  position: PlayerPosition;
  attributes: PlayerAttributes;
};

export type Team = {
  id: string;
  name: string;
  players: Player[];
};

export type PitchPoint = {
  x: number;
  y: number;
};

export type BallZone =
  | 'DEF_LEFT'
  | 'DEF_CENTER'
  | 'DEF_RIGHT'
  | 'MID_LEFT'
  | 'MID_CENTER'
  | 'MID_RIGHT'
  | 'ATT_LEFT'
  | 'ATT_CENTER'
  | 'ATT_RIGHT';

export type WibWobMap = Partial<Record<BallZone, Record<string, PitchPoint>>>;

export type Mentality = 'defensive' | 'balanced' | 'attacking';
export type Pressing = 'low' | 'medium' | 'high';
export type TransitionStyle = 'hold_shape' | 'balanced' | 'fast_break';

export type TacticBook = {
  id: string;
  name: string;
  mentality: Mentality;
  pressing: Pressing;
  transitionStyle: TransitionStyle;
  familiarity: number;
  wib: WibWobMap;
  wob: WibWobMap;
};

export type Weather = 'clear' | 'rain' | 'wind';
export type PitchCondition = 'fast' | 'normal' | 'heavy';

export type MatchContext = {
  weather: Weather;
  pitch: PitchCondition;
  neutralVenue: boolean;
};

export type MatchCommand = {
  minute: number;
  teamId: string;
  type: 'change_mentality' | 'change_pressing' | 'change_transition_style';
  value: Mentality | Pressing | TransitionStyle;
};

export type MatchInput = {
  seed: number;
  home: Team;
  away: Team;
  homeTactic: TacticBook;
  awayTactic: TacticBook;
  context: MatchContext;
  commands?: MatchCommand[];
};

export type MatchEventType =
  | 'kickoff'
  | 'chance'
  | 'goal'
  | 'transition_delay'
  | 'late_arrival'
  | 'tactical_shift'
  | 'full_time';

export type MatchEvent = {
  minute: number;
  teamId?: string;
  type: MatchEventType;
  description: string;
};

export type TeamMatchStats = {
  shots: number;
  shotsOnTarget: number;
  goals: number;
  possession: number;
  fatigue: number;
  transitionDelay: number;
  lateArrivals: number;
  execution: number;
  movementLoad: number;
};

export type MatchReport = {
  diagnostics: string[];
  replay: {
    seed: number;
    engineVersion: string;
    commandCount: number;
  };
};

export type MatchResult = {
  score: {
    home: number;
    away: number;
  };
  stats: {
    home: TeamMatchStats;
    away: TeamMatchStats;
  };
  events: MatchEvent[];
  report: MatchReport;
};
