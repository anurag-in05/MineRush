import React from 'react';
import { LogOut, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700/50 px-6 py-4 w-full">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between w-full">
        <div className="flex items-center space-x-3 mb-4 md:mb-0">
          <div className="relative">
            <Zap className="w-8 h-8 text-neon-green" />
            <div className="absolute inset-0 w-8 h-8 text-neon-green animate-pulse opacity-50" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-neon-green to-neon-blue bg-clip-text text-transparent">
            MineStorm
          </h1>
        </div>

        {user && (
          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto justify-center md:justify-end">
            <div className="flex items-center space-x-3 bg-gray-800/60 px-6 py-3 rounded-lg border border-gray-700/50 w-full md:w-auto justify-center">
              <span className="text-gray-400 text-sm">Balance:</span>
              <span className="text-neon-green font-bold text-xl">
                {user.balance.toLocaleString()} tokens
              </span>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-red-400 hover:text-red-300 w-full md:w-auto mt-2 md:mt-0"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        )}

        {!user && <div className="w-24"></div>}
      </div>
    </header>
  );
};

export default Header;