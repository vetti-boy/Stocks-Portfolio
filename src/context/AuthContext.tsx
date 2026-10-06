'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types/stock';

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<{ success: boolean; mustChangePassword?: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  updateUser: (updated: Partial<User>) => void;
  loginAsAdmin: () => void;
  loginAsGuest: () => void;
  logout: () => void;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const DEFAULT_ADMIN_USER: User = {
  id: 'admin_master',
  name: 'System Administrator',
  email: 'mailfortempusage@gmail.com',
  role: 'ADMIN',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  currency: 'INR',
  isGuest: false,
  mustChangePassword: false,
};

const DEFAULT_GUEST_USER: User = {
  id: 'guest_1',
  name: 'Manoj (Trader)',
  email: 'manoj.trader@stocks.io',
  role: 'USER',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  currency: 'INR',
  isGuest: true,
  mustChangePassword: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Restore user session from localStorage on initial load
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      try {
        const savedSession = localStorage.getItem('stocks_app_user');
        if (savedSession) {
          const parsedUser = JSON.parse(savedSession);
          setUser(parsedUser);
        } else {
          // No active user session -> prompt for login by default
          setIsAuthModalOpen(true);
        }
      } catch {
        setIsAuthModalOpen(true);
      }
    }
  }, []);

  const saveUserSession = (userData: User | null) => {
    setUser(userData);
    if (typeof window !== 'undefined') {
      try {
        if (userData) {
          localStorage.setItem('stocks_app_user', JSON.stringify(userData));
        } else {
          localStorage.removeItem('stocks_app_user');
        }
      } catch {
        // Ignored
      }
    }
  };

  const login = async (email: string, password?: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password || 'defaultpass' }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return { success: false, error: data.error || 'Authentication failed' };
      }

      const userData: User = { ...data.user, currency: 'INR' };
      saveUserSession(userData);
      setIsAuthModalOpen(false);

      return {
        success: true,
        mustChangePassword: !!userData.mustChangePassword,
      };
    } catch {
      const fallbackUser: User = {
        id: 'user_' + Date.now(),
        name: email.split('@')[0],
        email,
        role: email.toLowerCase().includes('admin') ? 'ADMIN' : 'USER',
        currency: 'INR',
        isGuest: false,
        mustChangePassword: false,
      };
      saveUserSession(fallbackUser);
      setIsAuthModalOpen(false);
      return { success: true };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      const userData: User = { ...data.user, currency: 'INR' };
      saveUserSession(userData);
      setIsAuthModalOpen(false);
      return { success: true };
    } catch {
      return { success: false, error: 'Registration failed due to network error' };
    }
  };

  const updateUser = (updatedFields: Partial<User>) => {
    setUser((prev) => {
      const updated = prev ? { ...prev, ...updatedFields } : null;
      if (typeof window !== 'undefined' && updated) {
        try {
          localStorage.setItem('stocks_app_user', JSON.stringify(updated));
        } catch {
          // Ignored
        }
      }
      return updated;
    });
  };

  const loginAsAdmin = () => {
    saveUserSession(DEFAULT_ADMIN_USER);
    setIsAuthModalOpen(false);
  };

  const loginAsGuest = () => {
    saveUserSession(DEFAULT_GUEST_USER);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    saveUserSession(null);
    setIsAuthModalOpen(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        updateUser,
        loginAsAdmin,
        loginAsGuest,
        logout,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

