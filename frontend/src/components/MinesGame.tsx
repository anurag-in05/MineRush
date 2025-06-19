import React, { useState, useCallback } from 'react';
import { Bomb, DollarSign, Play, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GameState } from '../types';

const MinesGame: React.FC = () => {
  const { user, updateBalance } = useAuth();
  const { showToast } = useToast();
  const [gameState, setGameState] = useState<GameState>({
    isActive: false,
    isGameOver: false,
    betAmount: 10,
    mineCount: 3,
    revealedTiles: new Array(25).fill(false),
    mines: [],
    multiplier: 1,
    potentialWin: 0,
    hasRevealedTile: false,
  });

  const calculateMultiplier = useCallback((revealedCount: number, mineCount: number) => {
    if (revealedCount === 0) return 1;
    const safeTiles = 25 - mineCount;
    let multiplier = 1;
    for (let i = 0; i < revealedCount; i++) {
      multiplier *= (safeTiles + mineCount - i) / (safeTiles - i);
    }
    return Math.round(multiplier * 100) / 100;
  }, []);

  const generateMines = useCallback((mineCount: number, excludeFirst?: number) => {
    const mines: number[] = [];
    while (mines.length < mineCount) {
      const randomIndex = Math.floor(Math.random() * 25);
      if (!mines.includes(randomIndex) && randomIndex !== excludeFirst) {
        mines.push(randomIndex);
      }
    }
    return mines;
  }, []);

  const startGame = useCallback(() => {
    if (!user || gameState.betAmount > user.balance) {
      showToast('Insufficient balance', 'error');
      return;
    }
    if (gameState.betAmount < 1) {
      showToast('Minimum bet is 1 token', 'error');
      return;
    }

    setGameState({
      isActive: true,
      isGameOver: false,
      betAmount: gameState.betAmount,
      mineCount: gameState.mineCount,
      revealedTiles: new Array(25).fill(false),
      mines: [],
      multiplier: 1,
      potentialWin: gameState.betAmount,
      hasRevealedTile: false,
    });

    updateBalance(user.balance - gameState.betAmount);
    showToast(`Game started! Bet: ${gameState.betAmount} tokens`, 'info');
  }, [user, gameState.betAmount, gameState.mineCount, updateBalance, showToast]);

  const revealTile = useCallback((index: number) => {
    if (!gameState.isActive || gameState.isGameOver || gameState.revealedTiles[index]) return;

    let mines = gameState.mines;
    if (mines.length === 0) {
      mines = generateMines(gameState.mineCount, index);
    }

    const newRevealedTiles = [...gameState.revealedTiles];
    newRevealedTiles[index] = true;

    if (mines.includes(index)) {
      setGameState(prev => ({
        ...prev,
        isGameOver: true,
        isActive: false,
        revealedTiles: newRevealedTiles,
        mines,
      }));
    } else {
      const revealedCount = newRevealedTiles.filter(Boolean).length;
      const multiplier = calculateMultiplier(revealedCount, gameState.mineCount);
      const potentialWin = Math.round(gameState.betAmount * multiplier);

      setGameState(prev => ({
        ...prev,
        revealedTiles: newRevealedTiles,
        mines,
        multiplier,
        potentialWin,
        hasRevealedTile: true,
      }));
    }
  }, [gameState, generateMines, calculateMultiplier]);

  const cashOut = useCallback(() => {
    if (!user || !gameState.hasRevealedTile || gameState.isGameOver) return;

    const winAmount = gameState.potentialWin;
    updateBalance(user.balance + winAmount);
    
    setGameState(prev => ({
      ...prev,
      isActive: false,
      isGameOver: true,
    }));

    showToast(`🎉 Cashed out! Won ${winAmount} tokens!`, 'success');

  }, [user, gameState, updateBalance, showToast]);

  const resetGame = useCallback(() => {
    setGameState({
      isActive: false,
      isGameOver: false,
      betAmount: gameState.betAmount,
      mineCount: gameState.mineCount,
      revealedTiles: new Array(25).fill(false),
      mines: [],
      multiplier: 1,
      potentialWin: 0,
      hasRevealedTile: false,
    });
  }, [gameState.betAmount, gameState.mineCount]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <DollarSign className="w-5 h-5 text-neon-green mr-2" />
              Game Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Bet Amount</label>
                <input
                  type="number"
                  min="1"
                  max={user?.balance || 0}
                  value={gameState.betAmount}
                  onChange={(e) => setGameState(prev => ({ ...prev, betAmount: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:border-neon-green/50 focus:ring-1 focus:ring-neon-green/50 transition-all duration-200"
                  disabled={gameState.isActive}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Mines ({gameState.mineCount})</label>
                <input
                  type="range"
                  min="3"
                  max="24"
                  value={gameState.mineCount}
                  onChange={(e) => setGameState(prev => ({ ...prev, mineCount: Number(e.target.value) }))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  disabled={gameState.isActive}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>3</span>
                  <span>24</span>
                </div>
              </div>

              {!gameState.isActive ? (
                <button
                  onClick={startGame}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-neon-green to-neon-blue hover:from-neon-green/80 hover:to-neon-blue/80 text-gray-900 font-bold rounded-lg transition-all duration-200 hover:scale-105"
                  disabled={!user || gameState.betAmount > (user?.balance || 0)}
                >
                  <Play className="w-5 h-5" />
                  <span>Start Game</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={cashOut}
                    disabled={!gameState.hasRevealedTile || gameState.isGameOver}
                    className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-900 font-bold rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <TrendingUp className="w-5 h-5" />
                    <span>Cash Out ({gameState.potentialWin} tokens)</span>
                  </button>
                  
                  {gameState.isGameOver && (
                    <button
                      onClick={resetGame}
                      className="w-full py-3 bg-gray-600/60 hover:bg-gray-600/80 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105"
                    >
                      New Game
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {gameState.isActive && (
            <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Current Game</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Multiplier:</span>
                  <span className="text-neon-green font-bold">{gameState.multiplier}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Potential Win:</span>
                  <span className="text-neon-blue font-bold">{gameState.potentialWin} tokens</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Safe Tiles:</span>
                  <span className="text-white">{gameState.revealedTiles.filter(Boolean).length}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
            <div className="grid grid-cols-5 gap-3 max-w-md mx-auto">
              {gameState.revealedTiles.map((isRevealed, index) => {
                const isMine = gameState.mines.includes(index);
                const showMine = isRevealed && isMine;
                const showSafe = isRevealed && !isMine;
                
                return (
                  <button
                    key={index}
                    onClick={() => revealTile(index)}
                    disabled={!gameState.isActive || gameState.isGameOver || isRevealed}
                    className={`
                      aspect-square rounded-lg border-2 transition-all duration-200 font-bold text-lg
                      ${!isRevealed 
                        ? 'bg-gray-700/80 border-gray-600/50 hover:bg-gray-600/80 hover:border-gray-500/50 hover:scale-105 active:scale-95' 
                        : showMine 
                          ? 'bg-red-600/80 border-red-500/50 text-white' 
                          : 'bg-neon-green/20 border-neon-green/30 text-neon-green'
                      }
                      ${(!gameState.isActive || gameState.isGameOver) && !isRevealed ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {showMine && <Bomb className="w-6 h-6 mx-auto" />}
                    {showSafe && '💎'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinesGame;