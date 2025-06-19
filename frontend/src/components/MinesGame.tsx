import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface GameState {
  isActive: boolean;
  isGameOver: boolean;
  gameId?: string;
  betAmount: number;
  mineCount: number;
  revealedTiles: boolean[];
  multiplier: number;
  potentialWin: number;
  hasRevealedTile: boolean;
  mines: number[];
}

const MinesGame: React.FC = () => {
  const { user, updateBalance } = useAuth();
  const { showToast } = useToast();

  const [state, setState] = useState<GameState>({
    isActive: false,
    isGameOver: false,
    betAmount: 10,
    mineCount: 3,
    revealedTiles: Array(25).fill(false),
    multiplier: 1,
    potentialWin: 0,
    hasRevealedTile: false,
    mines: [],
  });

  const startGame = useCallback(async () => {
    console.log('FETCHING:', import.meta.env.VITE_API_URL + '/game/start');
    console.log('TOKEN:', localStorage.getItem('token'));


    if (!user || state.betAmount > user.balance) {
      return showToast('Insufficient balance', 'error');
    }
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/game/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: localStorage.getItem('token') || '',
        },
        body: JSON.stringify({
          betAmount: state.betAmount,
          mineCount: state.mineCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      updateBalance(data.balance);
      setState((s) => ({
        ...s,
        isActive: true,
        isGameOver: false,
        gameId: data.gameId,
        revealedTiles: Array(25).fill(false),
        multiplier: 1,
        potentialWin: state.betAmount,
        hasRevealedTile: false,
        mines: [],
      }));
      showToast('Game started!', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to start', 'error');
    }
  }, [user, state.betAmount, state.mineCount, updateBalance, showToast]);

  const revealTile = useCallback(
    async (idx: number) => {
      if (!state.isActive || state.isGameOver || state.revealedTiles[idx]) return;

      try {
        const res = await fetch(import.meta.env.VITE_API_URL + '/game/reveal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: localStorage.getItem('token') || '',
          },
          body: JSON.stringify({ gameId: state.gameId, position: idx }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const newRevealed = [...state.revealedTiles];
        newRevealed[idx] = true;

        if (data.result === 'mine') {
          setState((s) => ({
            ...s,
            isGameOver: true,
            isActive: false,
            revealedTiles: newRevealed,
            mines: [...s.mines, idx],
          }));
          showToast('💥 You hit a mine!', 'error');
        } else {
          setState((s) => ({
            ...s,
            revealedTiles: newRevealed,
            multiplier: parseFloat(data.multiplier),
            potentialWin: Math.round(s.betAmount * parseFloat(data.multiplier)),
            hasRevealedTile: true,
          }));
        }
      } catch (err: any) {
        showToast(err.message || 'Reveal failed', 'error');
      }
    },
    [state, showToast]
  );

  const cashOut = useCallback(async () => {
    if (!state.hasRevealedTile || state.isGameOver) return;
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/game/cashout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: localStorage.getItem('token') || '',
        },
        body: JSON.stringify({ gameId: state.gameId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      updateBalance(data.balance);
      setState((s) => ({ ...s, isActive: false, isGameOver: true }));
      showToast(`🎉 Cashed out ${data.winAmount}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Cashout failed', 'error');
    }
  }, [state, updateBalance, showToast]);

  const reset = () => {
    setState((s) => ({
      ...s,
      isActive: false,
      isGameOver: false,
      revealedTiles: Array(25).fill(false),
      multiplier: 1,
      potentialWin: 0,
      hasRevealedTile: false,
      gameId: undefined,
      mines: [],
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-white">
      <h1 className="text-3xl font-bold mb-6">🎮 Mines Game</h1>
      <p className="mb-4">Bet: {state.betAmount}</p>
      <button
        onClick={startGame}
        className="bg-green-500 px-4 py-2 rounded hover:bg-green-600"
      >
        Start Game
      </button>

      {state.isActive && (
        <div className="mt-6 grid grid-cols-5 gap-2">
          {state.revealedTiles.map((revealed, i) => {
            const isMine = state.isGameOver && state.mines.includes(i);
            const showSafe = revealed && !isMine;

            return (
              <button
                key={i}
                onClick={() => revealTile(i)}
                className={`w-12 h-12 text-lg font-bold rounded ${
                  revealed
                    ? isMine
                      ? 'bg-red-600'
                      : 'bg-green-500'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                disabled={state.isGameOver || revealed}
              >
                {isMine ? '💣' : showSafe ? '💎' : ''}
              </button>
            );
          })}
        </div>
      )}

      {state.isActive && state.hasRevealedTile && !state.isGameOver && (
        <button
          onClick={cashOut}
          className="mt-6 bg-yellow-500 px-4 py-2 rounded hover:bg-yellow-600"
        >
          Cash Out ({state.potentialWin} tokens)
        </button>
      )}

      {state.isGameOver && (
        <button
          onClick={reset}
          className="mt-6 bg-red-500 px-4 py-2 rounded hover:bg-red-600"
        >
          New Game
        </button>
      )}
    </div>
  );
};

export default MinesGame;
