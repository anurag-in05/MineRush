import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../context/Api';

const QUEST_GAMES_REQUIRED = 7;
const QUEST_REWARD = 150;

const QuestPanel: React.FC = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dailyQuest = user?.dailyQuest;

  const canClaim = dailyQuest && !dailyQuest.claimed && dailyQuest.gamesPlayed >= QUEST_GAMES_REQUIRED;
  const progress = dailyQuest ? Math.min(dailyQuest.gamesPlayed, QUEST_GAMES_REQUIRED) : 0;
  const progressPercent = (progress / QUEST_GAMES_REQUIRED) * 100;

  const handleClaim = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest('/quest/claim', { method: 'POST' });
      setUser((prev) => prev ? { ...prev, balance: res.balance, dailyQuest: res.dailyQuest } : prev);
    } catch (err: any) {
      setError(err.message || 'Failed to claim reward');
    } finally {
      setLoading(false);
    }
  };

  if (!dailyQuest) return null;

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-md mx-auto mt-4 text-left">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-blue-400 text-lg">🟢</span>
        <span className="font-semibold text-white text-lg">Daily Quest</span>
      </div>
      <div className="text-gray-300 text-sm mb-1">Play {QUEST_GAMES_REQUIRED} games today</div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">Progress</span>
        <span className="text-white font-semibold">{progress}/{QUEST_GAMES_REQUIRED}</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${progressPercent}%` }}></div>
      </div>
      <div className="flex justify-between items-center mt-2">
        <span className="text-yellow-400 font-bold text-base flex items-center gap-1">
          <span role="img" aria-label="gift">🎁</span> {QUEST_REWARD} tokens
        </span>
        <span className={`text-sm ${dailyQuest.claimed ? 'text-emerald-400' : canClaim ? 'text-yellow-400' : 'text-gray-400'}`}>
          {dailyQuest.claimed ? 'Claimed' : canClaim ? 'Ready to claim!' : 'In Progress'}
        </span>
      </div>
      {canClaim && (
        <button
          className="w-full px-4 py-2 bg-yellow-400 text-black font-bold rounded-lg mt-4 hover:bg-yellow-300 transition disabled:opacity-50"
          onClick={handleClaim}
          disabled={loading}
        >
          {loading ? 'Claiming...' : 'Claim Reward'}
        </button>
      )}
      {error && <div className="text-red-400 mt-2 text-sm">{error}</div>}
    </div>
  );
};

export default QuestPanel;