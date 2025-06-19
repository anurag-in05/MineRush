// import React, { useState } from 'react';
// import { User, Lock, UserPlus, LogIn } from 'lucide-react';
// import { useAuth } from '../context/AuthContext';
// import { useToast } from '../context/ToastContext';

// const AuthForm: React.FC = () => {
//   const [isLogin, setIsLogin] = useState(true);
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const { login, register } = useAuth();
//   const { showToast } = useToast();

//   // 
//   // const handleSubmit = async (e: React.FormEvent) => {
//   //   e.preventDefault();
//   //   if (!username.trim() || !password.trim()) {
//   //     showToast('Please fill in all fields', 'error');
//   //     return;
//   //   }
//   //   setIsLoading(true);
//   //   try {
//   //     const success = isLogin 
//   //       ? await login(username, password)
//   //       : await register(username, password);
//   //     if (!success) {
//   //       showToast(isLogin ? 'Invalid username or password' : 'Username already exists', 'error');
//   //     } else if (!isLogin) {
//   //       showToast('Account created successfully!', 'success');
//   //     }
//   //   } catch (error) {
//   //     showToast('An error occurred. Please try again.', 'error');
//   //   } finally {
//   //     setIsLoading(false);
//   //   }
//   // };

//   return (
//     <div className="min-h-screen flex items-center justify-center px-4">
//       <div className="w-full max-w-md">
//         <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
//           <div className="text-center mb-8">
//             <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-neon-green/20 to-neon-blue/20 rounded-full border border-neon-green/30 mb-4">
//               <User className="w-8 h-8 text-neon-green" />
//             </div>
//             <h2 className="text-3xl font-bold text-white mb-2">
//               {isLogin ? 'Welcome Back' : 'Join MineStorm'}
//             </h2>
//             <p className="text-gray-400">
//               {isLogin ? 'Sign in to continue playing' : 'Create your account to start'}
//             </p>
//           </div>

//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
//               <div className="relative">
//                 <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
//                 <input
//                   type="text"
//                   value={username}
//                   onChange={(e) => setUsername(e.target.value)}
//                   className="w-full pl-10 pr-4 py-3 bg-gray-900/60 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-green/50 focus:ring-1 focus:ring-neon-green/50 transition-all duration-200"
//                   placeholder="Enter your username"
//                   disabled={isLoading}
//                 />
//               </div>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
//               <div className="relative">
//                 <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
//                 <input
//                   type="password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   className="w-full pl-10 pr-4 py-3 bg-gray-900/60 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-green/50 focus:ring-1 focus:ring-neon-green/50 transition-all duration-200"
//                   placeholder="Enter your password"
//                   disabled={isLoading}
//                 />
//               </div>
//             </div>

//             <button
//               type="submit"
//               disabled={isLoading}
//               className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-neon-green to-neon-blue hover:from-neon-green/80 hover:to-neon-blue/80 text-gray-900 font-bold rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
//             >
//               {isLoading ? (
//                 <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
//               ) : (
//                 <>
//                   {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
//                   <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
//                 </>
//               )}
//             </button>
//           </form>

//           <div className="mt-8 text-center">
//             <p className="text-gray-400">
//               {isLogin ? "Don't have an account? " : "Already have an account? "}
//               <button
//                 onClick={() => setIsLogin(!isLogin)}
//                 className="text-neon-green hover:text-neon-green/80 font-medium transition-colors duration-200"
//               >
//                 {isLogin ? 'Sign Up' : 'Sign In'}
//               </button>
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AuthForm;

import React, { useState } from 'react';
import { User, Lock, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const success = isLogin
        ? await login(username, password)
        : await register(username, password);
      if (!success) {
        showToast(isLogin ? 'Invalid username or password' : 'Username already exists', 'error');
      } else if (!isLogin) {
        showToast('Account created successfully!', 'success');
      }
    } catch (error) {
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-neon-green/20 to-neon-blue/20 rounded-full border border-neon-green/30 mb-4">
              <User className="w-8 h-8 text-neon-green" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {isLogin ? 'Welcome Back' : 'Join MineStorm'}
            </h2>
            <p className="text-gray-400">
              {isLogin ? 'Sign in to continue playing' : 'Create your account to start'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900/60 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-green/50 focus:ring-1 focus:ring-neon-green/50 transition-all duration-200"
                  placeholder="Enter your username"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900/60 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-green/50 focus:ring-1 focus:ring-neon-green/50 transition-all duration-200"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-neon-green to-neon-blue hover:from-neon-green/80 hover:to-neon-blue/80 text-gray-900 font-bold rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-neon-green hover:text-neon-green/80 font-medium transition-colors duration-200"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;

