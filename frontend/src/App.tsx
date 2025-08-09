import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { GameProvider, useGame } from './context/GameContext';
import Header from './components/Header';
import BettingPanel from './components/BettingPanel';
import AuthForm from './components/AuthForm';
import GameBoard from './components/GameBoard';

import QuestPanel from './components/QuestPanel';


const AppContent: React.FC = () => {
  const { user } = useAuth();
  return (
    <GameProvider>
      <MainContent user={user} />
    </GameProvider>
  );
};

const MainContent: React.FC<{ user: any }> = ({ user }) => {
  const { game, loading, error, startGame, revealTile, cashout, resetGame } = useGame();
  // Force game reset on initial load so user can always start a new game
  // Always reset game on mount and when user changes to avoid stuck state
  React.useEffect(() => {
    if (user) {
      resetGame();
    }
    // eslint-disable-next-line
  }, []);
  const [betAmount, setBetAmount] = React.useState(10);
  const [mineCount, setMineCount] = React.useState(3);
  // For demo, you may want to fetch stats, streak, quest from backend in future

  if (!user) return <AuthForm />;

  // Derive revealed/mines sets for GameBoard
  const revealedCells = new Set<number>();
  const mines = new Set<number>();
  let gameResult: 'none' | 'win' | 'loss' = 'none';
  if (game) {
    game.grid?.forEach?.((cell: string, idx: number) => {
      if (cell === 'safe') revealedCells.add(idx);
      if (cell === 'mine') mines.add(idx);
    });
    if (game.gameOver) {
      if (game.winAmount && game.winAmount > 0) gameResult = 'win';
      else gameResult = 'loss';
    }
  }

  // Show New Game button if no game is active or after game over
  const showNewGameButton = !game || game.gameOver;

  // Handler to reset the game state from the New Game button
  const handleNewGame = () => {
    resetGame(); // Only reset, do not start a new game immediately
  };

  return (
    <div className="min-h-screen bg-dark text-white flex flex-col items-center px-2 overflow-x-hidden w-full max-w-full">
      <div className="w-full flex flex-col items-center z-10">
        <Header />
      </div>
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 flex-1 min-h-0">
        {/* Left: BettingPanel only */}
        <div className="flex flex-col gap-6 items-center w-full h-full justify-center">
          <div className="w-full h-full flex flex-col justify-center">
            <BettingPanel
              betAmount={betAmount}
              setBetAmount={setBetAmount}
              mineCount={mineCount}
              setMineCount={setMineCount}
              onStartGame={() => startGame(betAmount, mineCount)}
              isPlaying={!!game && !game.gameOver}
              tokens={user?.balance || 0}
            />
          </div>
          {/* Persistent New Game button - always visible after login and after game over */}
          {showNewGameButton && (
            <button
              className="mt-6 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg transition-colors"
              onClick={handleNewGame}
              disabled={loading}
            >
              {loading ? 'Starting...' : 'New Game'}
            </button>
          )}
        </div>

        {/* Center: GameBoard */}
        <div className="flex flex-col items-center justify-center w-full h-full">
          <GameBoard
            revealedCells={revealedCells}
            mines={mines}
            onCellClick={(idx) => {
              if (
                game &&
                !game.gameOver &&
                Array.isArray(game.grid) &&
                game.grid[idx] === 'hidden'
              ) {
                revealTile(idx);
              }
            }}
            isPlaying={!!game && !game.gameOver && Array.isArray(game?.grid)}
            gameResult={gameResult}
          />
          {/* Cashout button */}
          {game && !game.gameOver && (
            <button
              className="mt-6 px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg transition-colors"
              onClick={cashout}
              disabled={loading}
            >
              Cash Out
            </button>
          )}
          {error && <div className="mt-4 text-red-400">{error}</div>}
        </div>

        {/* Right: (StreakPanel removed to fix blank screen error) */}
        <div className="flex flex-col gap-6 w-full h-full justify-center">
          {/* You can add other panels or stats here if needed */}
        </div>
      </div>

      {/* Bottom stats row with Win Streak, improved layout */}
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 mb-8 flex-shrink-0">
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 flex flex-col items-center w-full min-h-[120px]">
          <div className="text-4xl font-bold text-emerald-400 mb-2">{user?.gamesPlayed ?? 0}</div>
          <div className="text-gray-400 text-base">Games Played</div>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 flex flex-col items-center w-full min-h-[120px]">
          <div className="text-4xl font-bold text-emerald-400 mb-2">{user?.totalWins ?? 0}</div>
          <div className="text-gray-400 text-base">Total Wins</div>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 flex flex-col items-center w-full min-h-[120px]">
          <div className="flex flex-col items-center w-full">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-orange-400 text-lg">🔥</span>
              <span className="font-semibold text-white">Day Streak</span>
            </div>
            <div className="text-4xl font-bold text-emerald-400 mb-2">3</div>
            <div className="text-gray-400 text-base">days played in a row</div>
          </div>
        </div>
      </div>

      {/* Multiplier Panel and Daily Quest to the right of the game grid */}
      <div className="absolute right-32 top-56 z-40 w-[350px] flex flex-col gap-6">
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 flex flex-col items-center w-full shadow-2xl">
          <div className="flex flex-col items-center w-full">
            <div className="w-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg py-2 px-4 flex items-center justify-center mb-4">
              <span className="text-yellow-300 font-bold text-xl flex items-center gap-2">
                ⚡ {user?.streakMultiplier?.toFixed(1) ?? '1.0'}x Multiplier Active
              </span>
            </div>
            <div className="flex justify-between w-full text-xs mb-2">
              <span className="text-gray-400">Next Reward:</span>
              <span className="text-green-400 font-medium">+150 tokens, 1.2x boost</span>
            </div>
            <div className="flex justify-between w-full text-xs">
              <span className="text-gray-400">Earned:</span>
              <span className="text-yellow-400 font-bold">+150 tokens</span>
            </div>
          </div>
        </div>
        {/* Daily Quest Panel under Multiplier */}
        <div className="w-full">
          <QuestPanel />
        </div>
      </div>
    </div>
  );
};


function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;