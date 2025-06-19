// import React from 'react';
// import { LogOut, Zap } from 'lucide-react';
// import { useAuth } from '../context/AuthContext';

// const Header: React.FC = () => {
//   const { user, logout } = useAuth();

//   return (
//     <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700/50 px-6 py-4">
//       <div className="max-w-7xl mx-auto flex items-center justify-between">
//         <div className="flex items-center space-x-3">
//           <div className="relative">
//             <Zap className="w-8 h-8 text-neon-green" />
//             <div className="absolute inset-0 w-8 h-8 text-neon-green animate-pulse opacity-50" />
//           </div>
//           <h1 className="text-2xl font-bold bg-gradient-to-r from-neon-green to-neon-blue bg-clip-text text-transparent">
//             MineStorm
//           </h1>
//         </div>

//         {user && (
//           <>
//             <div className="flex items-center space-x-3 bg-gray-800/60 px-6 py-3 rounded-lg border border-gray-700/50">
//               <span className="text-gray-400 text-sm">Balance:</span>
//               <span className="text-neon-green font-bold text-xl">
//                 {user.balance.toLocaleString()} tokens
//               </span>
//             </div>

//             <button
//               onClick={logout}
//               className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-red-400 hover:text-red-300"
//             >
//               <LogOut className="w-4 h-4" />
//               <span>Logout</span>
//             </button>
//           </>
//         )}

//         {!user && <div className="w-24"></div>}
//       </div>
//     </header>
//   );
// };

// export default Header;

import React from 'react';
import { LogOut, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700/50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Zap className="w-8 h-8 text-neon-green" />
            <div className="absolute inset-0 w-8 h-8 text-neon-green animate-pulse opacity-50" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-neon-green to-neon-blue bg-clip-text text-transparent">
            MineStorm
          </h1>
        </div>

        {/* Balance Display & Logout */}
        {user ? (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-gray-800/60 px-5 py-2 rounded-lg border border-gray-700/50">
              <span className="text-gray-400 text-sm">Balance:</span>
              <span className="text-neon-green font-bold text-lg">
                {user.balance.toLocaleString()} tokens
              </span>
            </div>

            <button
              onClick={logout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-red-400 hover:text-red-300"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div className="text-gray-400 text-sm">Not Logged In</div>
        )}
      </div>
    </header>
  );
};

export default Header;
