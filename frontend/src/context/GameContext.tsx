import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { GameState } from '../types';
import { apiRequest } from './Api';
import { useAuth } from './AuthContext';

interface GameContextType {
  game: GameState | null;
  loading: boolean;
  error: string | null;
  startGame: (betAmount: number, mineCount: number) => Promise<void>;
  revealTile: (position: number) => Promise<void>;
  cashout: () => Promise<void>;
  fetchGameState: () => Promise<void>;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, setUser } = useAuth();
  const [game, setGame] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only fetch game state if you want to restore an unfinished game. To always allow new game, do not auto-fetch stuck games.
  const fetchGameState = useCallback(async () => {
    setGame(null); // Always clear any stuck game state on login
  }, []);

  const startGame = async (betAmount: number, mineCount: number) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/game/start', {
        method: 'POST',
        headers: { Authorization: token },
        body: JSON.stringify({ betAmount, mineCount }),
      });
      setGame({ ...data.game, gameId: data.gameId });
      // Always refresh user info after starting game
      const userInfo = await apiRequest('/me', { headers: { Authorization: token } });
      setUser((prev) => prev ? { ...prev, ...userInfo } : prev);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const revealTile = async (position: number) => {
    if (!token || !game) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/game/reveal', {
        method: 'POST',
        headers: { Authorization: token },
        body: JSON.stringify({ gameId: game.gameId, position }),
      });
      setGame((prev) => prev ? {
        ...prev,
        grid: data.grid || prev.grid,
        revealedCount: data.revealedCount !== undefined ? data.revealedCount : prev.revealedCount,
        gameOver: data.gameOver !== undefined ? data.gameOver : prev.gameOver,
        winAmount: data.winAmount !== undefined ? data.winAmount : prev.winAmount,
        mines: data.mines || prev.mines,
      } : prev);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cashout = async () => {
    if (!token || !game) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/game/cashout', {
        method: 'POST',
        headers: { Authorization: token },
        body: JSON.stringify({ gameId: game.gameId }),
      });
      setGame({ ...data.game, gameId: data.gameId });
      // Always refresh user info after cashout
      const userInfo = await apiRequest('/me', { headers: { Authorization: token } });
      setUser((prev) => prev ? { ...prev, ...userInfo } : prev);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetGame = () => setGame(null);

  useEffect(() => {
    fetchGameState();
    // eslint-disable-next-line
  }, [token]);

  return (
    <GameContext.Provider value={{ game, loading, error, startGame, revealTile, cashout, fetchGameState, resetGame }}>
      {children}
    </GameContext.Provider>
  );
};
