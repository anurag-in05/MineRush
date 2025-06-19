import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

const API_URL = 'http://localhost:3000';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateBalance: (newBalance: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Load user/token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('minesToken');
    const savedUser = localStorage.getItem('minesUser');
    if (savedToken) setToken(savedToken);
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // Save user/token to localStorage when they change
  useEffect(() => {
    if (token) localStorage.setItem('minesToken', token);
    else localStorage.removeItem('minesToken');
    if (user) localStorage.setItem('minesUser', JSON.stringify(user));
    else localStorage.removeItem('minesUser');
  }, [token, user]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setToken(data.token);
      setUser({ id: data.id || '', username, balance: data.balance });
      return true;
    } catch {
      return false;
    }
  };

  const register = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) return false;
      return await login(username, password);
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('minesUser');
    localStorage.removeItem('minesToken');
  };

  const updateBalance = (newBalance: number) => {
    if (user) {
      const updatedUser = { ...user, balance: newBalance };
      setUser(updatedUser);
      localStorage.setItem('minesUser', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateBalance }}>
      {children}
    </AuthContext.Provider>
  );
};
