import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
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

  useEffect(() => {
    const savedUser = localStorage.getItem('minesUser');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const savedUsers = JSON.parse(localStorage.getItem('minesUsers') || '[]');
    const existingUser = savedUsers.find((u: any) => u.username === username && u.password === password);
    
    if (existingUser) {
      const userData = { id: existingUser.id, username: existingUser.username, balance: existingUser.balance };
      setUser(userData);
      localStorage.setItem('minesUser', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const register = async (username: string, password: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const savedUsers = JSON.parse(localStorage.getItem('minesUsers') || '[]');
    if (savedUsers.find((u: any) => u.username === username)) return false;
    
    const newUser = {
      id: Date.now().toString(),
      username,
      password,
      balance: 1000
    };
    
    savedUsers.push(newUser);
    localStorage.setItem('minesUsers', JSON.stringify(savedUsers));
    
    const userData = { id: newUser.id, username: newUser.username, balance: newUser.balance };
    setUser(userData);
    localStorage.setItem('minesUser', JSON.stringify(userData));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('minesUser');
  };

  const updateBalance = (newBalance: number) => {
    if (user) {
      const updatedUser = { ...user, balance: newBalance };
      setUser(updatedUser);
      localStorage.setItem('minesUser', JSON.stringify(updatedUser));
      
      const savedUsers = JSON.parse(localStorage.getItem('minesUsers') || '[]');
      const userIndex = savedUsers.findIndex((u: any) => u.id === user.id);
      if (userIndex !== -1) {
        savedUsers[userIndex].balance = newBalance;
        localStorage.setItem('minesUsers', JSON.stringify(savedUsers));
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateBalance }}>
      {children}
    </AuthContext.Provider>
  );
};