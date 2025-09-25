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


export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

 const login = async (credentials: LoginCredentials) => {
  setIsLoading(true);
  try {
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: credentials.username,  // Backend förväntar sig 'email'
        password: credentials.password
      })
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    const data = await response.json();
    
    // Kolla om backend returnerade error
    if (data.error) {
      throw new Error(data.error);
    }
    
    setUser(data);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Login failed');
  } finally {
    setIsLoading(false);
  }
};
    
  

  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    
    // Simulera API-anrop
    await new Promise(resolve => setTimeout(resolve, 100));
    
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