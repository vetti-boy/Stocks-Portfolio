'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types/stock';

interface AuthContextType {
  user: User | null;
  loginWithGoogle: (credentialOrProfile: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (updated: Partial<User>) => void;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  googleClientId: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const [mounted, setMounted] = useState(false);

  // Restore user session from localStorage and load Google config on mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      try {
        const savedSession = localStorage.getItem('stocks_app_user');
        if (savedSession) {
          const parsedUser = JSON.parse(savedSession);
          if (parsedUser && parsedUser.email) {
            setUser(parsedUser);
          } else {
            setIsAuthModalOpen(true);
          }
        } else {
          setIsAuthModalOpen(true);
        }
      } catch {
        setIsAuthModalOpen(true);
      }
    }

    // Fetch Google Client ID configuration
    fetch('/api/auth/google')
      .then((res) => res.json())
      .then((data) => {
        if (data?.clientId) {
          setGoogleClientId(data.clientId);
        }
      })
      .catch((e) => console.warn('Could not fetch Google client ID config:', e));
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

  const loginWithGoogle = async (credentialOrProfile: any) => {
    try {
      const payload =
        typeof credentialOrProfile === 'string'
          ? { credential: credentialOrProfile }
          : credentialOrProfile?.credential
          ? credentialOrProfile
          : { profile: credentialOrProfile };

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        return { success: false, error: data.error || 'Google authentication failed' };
      }

      const userData: User = {
        ...data.user,
        currency: 'INR',
      };

      saveUserSession(userData);
      setIsAuthModalOpen(false);

      return { success: true };
    } catch (err: any) {
      console.error('Google login error:', err);
      return { success: false, error: err?.message || 'Network error during Google sign-in' };
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

  const logout = () => {
    saveUserSession(null);
    setIsAuthModalOpen(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loginWithGoogle,
        logout,
        updateUser,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        googleClientId,
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
