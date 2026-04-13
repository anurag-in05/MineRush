import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import API_URL from './Api';

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<AuthResult>;
  register: (username: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  updateBalance: (newBalance: number) => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
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

  const readErrorMessage = async (res: Response): Promise<string> => {
    try {
      const data = await res.json();
      if (
        typeof data === 'object' &&
        data !== null &&
        'error' in data &&
        typeof (data as { error: unknown }).error === 'string'
      ) {
        return (data as { error: string }).error;
      }
    } catch {
      // No JSON payload.
    }

    return 'Request failed. Please try again.';
  };

  // Load user/token from localStorage on mount and refresh user from backend
  useEffect(() => {
    const savedToken = localStorage.getItem('minesToken');
    const savedUser = localStorage.getItem('minesUser');
    if (savedToken) setToken(savedToken);
    if (savedUser) setUser(JSON.parse(savedUser));
    // If token, refresh user info from backend
    if (savedToken) {
      fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data) setUser((prev) => prev ? { ...prev, ...data } : data);
        });
    }
  }, []);

  // Save user/token to localStorage when they change
  useEffect(() => {
    if (token) localStorage.setItem('minesToken', token);
    else localStorage.removeItem('minesToken');
    if (user) localStorage.setItem('minesUser', JSON.stringify(user));
    else localStorage.removeItem('minesUser');
  }, [token, user]);

  const login = async (username: string, password: string): Promise<AuthResult> => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        return { success: false, error: await readErrorMessage(res) };
      }

      const data = await res.json();
      const accessToken = data.accessToken || data.token;

      if (!accessToken) {
        return { success: false, error: 'Invalid login response from server.' };
      }

      setToken(accessToken);
      // Fetch user info to get dailyQuest
      const userRes = await fetch(`${API_URL}/me`, { headers: { Authorization: `Bearer ${accessToken}` } });

      if (!userRes.ok) {
        return { success: false, error: await readErrorMessage(userRes) };
      }

      const userData = await userRes.json();
      setUser(userData);
      return { success: true };
    } catch {
      return { success: false, error: 'Unable to reach server. Check your API URL and CORS settings.' };
    }
  };

  const register = async (username: string, password: string): Promise<AuthResult> => {
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        return { success: false, error: await readErrorMessage(res) };
      }

      const data = await res.json();
      const accessToken = data.accessToken || data.token;

      if (!accessToken) {
        return { success: false, error: 'Invalid registration response from server.' };
      }

      setToken(accessToken);
      // Fetch user info to get dailyQuest
      const userRes = await fetch(`${API_URL}/me`, { headers: { Authorization: `Bearer ${accessToken}` } });

      if (!userRes.ok) {
        return { success: false, error: await readErrorMessage(userRes) };
      }

      const userData = await userRes.json();
      setUser(userData);
      return { success: true };
    } catch {
      return { success: false, error: 'Unable to reach server. Check your API URL and CORS settings.' };
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
    <AuthContext.Provider value={{ user, token, login, register, logout, updateBalance, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
