export interface User {
  id: string;
  username: string;
  balance: number;
}

export interface GameState {
  isActive: boolean;
  isGameOver: boolean;
  betAmount: number;
  mineCount: number;
  revealedTiles: boolean[];
  mines: number[];
  multiplier: number;
  potentialWin: number;
  hasRevealedTile: boolean;
}