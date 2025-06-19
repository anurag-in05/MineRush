import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Header from './components/Header';
import AuthForm from './components/AuthForm';
import MinesGame from './components/MinesGame';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-dark text-white">
      <Header />
      {user ? <MinesGame /> : <AuthForm />}
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