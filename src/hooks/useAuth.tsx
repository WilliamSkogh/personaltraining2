// src/hooks/useAuth.ts
import React, { useState, createContext, useContext } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock användare
const mockUsers = [
  { id: 1, username: 'admin', password: 'admin', email: 'admin@test.com', role: 'admin' as const },
  { id: 2, username: 'user', password: 'user', email: 'user@test.com', role: 'user' as const }
];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    
    // Simulera API-anrop
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const foundUser = mockUsers.find(u => 
      u.username === credentials.username && u.password === credentials.password
    );
    
    if (foundUser) {
      const loggedInUser = {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
        role: foundUser.role,
        createdAt: new Date().toISOString()
      };
      setUser(loggedInUser);
    } else {
      throw new Error('Fel användarnamn eller lösenord');
    }
    
    setIsLoading(false);
  };

  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    
    // Simulera API-anrop
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newUser = {
      id: Date.now(),
      username: userData.username,
      email: userData.email,
      role: 'user' as const,
      createdAt: new Date().toISOString()
    };
    setUser(newUser);
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    isAdmin: user?.role === 'admin'
  };

  return React.createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};