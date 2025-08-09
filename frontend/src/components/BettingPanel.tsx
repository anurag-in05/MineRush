import React from 'react';
import { Play } from 'lucide-react';

interface BettingPanelProps {
  betAmount: number;
  setBetAmount: (amount: number) => void;
  mineCount: number;
  setMineCount: (count: number) => void;
  onStartGame: () => void;
  isPlaying: boolean;
  tokens: number;
}

const BettingPanel: React.FC<BettingPanelProps> = ({
  betAmount,
  setBetAmount,
  mineCount,
  setMineCount,
  onStartGame,
  isPlaying,
  tokens,
}) => {
  return (
    <div className="bg-[#232836] rounded-2xl shadow-lg border border-[#2d3243] p-6 w-full max-w-[350px] mx-auto space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-200 mb-2">
            Bet Amount
          </label>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => {
              const val = e.target.value;
              // Allow empty string for typing
              if (val === "") {
                setBetAmount("");
                return;
              }
              const num = parseInt(val);
              if (!isNaN(num)) {
                setBetAmount(Math.max(1, Math.min(num, tokens)));
              }
            }}
            className="w-full px-4 py-2 bg-[#232836] border border-[#2d3243] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            disabled={isPlaying}
            min="1"
            max={tokens}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-200 mb-2">
            Mines ({mineCount})
          </label>
          <select
            value={mineCount}
            onChange={(e) => setMineCount(parseInt(e.target.value))}
            className="w-full px-4 py-2 bg-[#232836] border border-[#2d3243] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            disabled={isPlaying}
          >
            {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
              <option key={num} value={num}>
                {num} mine{num !== 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        onClick={onStartGame}
        disabled={betAmount > tokens || betAmount < 1 || isPlaying}
        className="w-full flex items-center justify-center space-x-2 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold text-base transition-colors"
      >
        <Play className="w-5 h-5" />
        <span>Place Bet</span>
      </button>
    </div>
  );
};

export default BettingPanel;
