import React from 'react';
import { Flame, Trophy, Zap } from 'lucide-react';
import { Streak } from '../../types';

interface StreakPanelProps {
  streak: Streak;
  showRecovery: boolean;
  onRecoverStreak: () => void;
}

const StreakPanel: React.FC<StreakPanelProps> = ({ streak, showRecovery, onRecoverStreak }) => {
  const getStreakColor = (count: number) => {
    if (count >= 6) return 'text-purple-400';
    if (count >= 4) return 'text-red-400';
    if (count >= 2) return 'text-orange-400';
    return 'text-gray-400';
  };
  
  const getStreakReward = (count: number) => {
    if (count >= 6) return '1.5x multiplier';
    if (count >= 5) return '+200 tokens, 1.3x boost';
    if (count >= 4) return '+150 tokens, 1.2x boost';
    if (count >= 3) return '+100 tokens, 1.1x boost';
    if (count >= 2) return '+50 tokens';
    return 'Keep winning!';
  };
  
  return (
    <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
      <div className="flex items-center space-x-3 mb-4">
        <Flame className={`w-6 h-6 ${getStreakColor(streak.count)}`} />
        <h3 className="text-lg font-semibold text-white">Win Streak</h3>
      </div>
      
      <div className="space-y-4">
        <div className="text-center">
          <div className={`text-3xl font-bold ${getStreakColor(streak.count)}`}>
            {streak.count}
          </div>
          <div className="text-gray-400 text-sm">consecutive wins</div>
        </div>
        
        {streak.multiplier > 1 && (
          <div className="bg-gradient-to-r from-purple-900 to-pink-900 p-3 rounded-lg border border-purple-700">
            <div className="flex items-center justify-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-medium">{streak.multiplier}x Multiplier Active</span>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Next Reward:</span>
            <span className="text-emerald-400 text-sm">{getStreakReward(streak.count + 1)}</span>
          </div>
          
          {streak.rewards > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Earned:</span>
              <span className="text-yellow-400 font-medium">+{streak.rewards} tokens</span>
            </div>
          )}
        </div>
        
        {showRecovery && (
          <div className="bg-red-900 border border-red-700 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Trophy className="w-5 h-5 text-red-400" />
              <span className="text-white font-medium">Streak Recovery</span>
            </div>
            <p className="text-gray-300 text-sm mb-3">
              Your {streak.count} win streak was broken! Recover it for 200 tokens and continue your streak.
            </p>
            <button
              onClick={onRecoverStreak}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
            >
              Recover Streak (200 tokens)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreakPanel;