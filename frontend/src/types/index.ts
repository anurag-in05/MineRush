

export interface DailyQuest {
  gamesPlayed: number;
  lastQuestDate: string | null;
  claimed: boolean;
}

export interface User {
  userId: string;
  username: string;
  balance: number;
  totalWins?: number;
  dailyQuest?: DailyQuest;
}


export interface GameState {
  gameId: string;
  grid: string[]; // 'hidden', 'mine', 'safe'
  revealedCount: number;
  gameOver: boolean;
  winAmount: number;
  mines: number[];
  betAmount: number;
  mineCount: number;
}