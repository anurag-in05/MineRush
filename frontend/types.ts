export interface GameState {
  isPlaying: boolean;
  betAmount: number;
  mineCount: number;
  revealedCells: Set<number>;
  mines: Set<number>;
  gameResult: 'none' | 'win' | 'loss';
  multiplier: number;
}

export interface Quest {
  id: string;
  description: string;
  target: number;
  progress: number;
  reward: number;
  completed: boolean;
}

export interface Streak {
  count: number;
  multiplier: number;
  rewards: number;
}

export interface PlayerStats {
  tokens: number;
  gamesPlayed: number;
  totalWins: number;
  currentStreak: number;
  lastQuestReset: string;
}