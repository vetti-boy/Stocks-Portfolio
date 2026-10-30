'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types/stock';

interface AuthContextType {
  user: User | null;
  loginWithGoogle: (credentialOrProfile: any) => Promise<{ success: boolean; error?: string }>;
  continueAsGuest: () => void;
  logout: () => void;
  updateUser: (updated: Partial<User>) => void;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  googleClientId: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_GOOGLE_CLIENT_ID = '340953449815-qatnff0fgk0ee9jel8nk8o7tk1mlj4dp.apps.googleusercontent.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [googleClientId, setGoogleClientId] = useState(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID
  );
  const [mounted, setMounted] = useState(false);

  // Restore user session on mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      try {
        // 1. Check temporary guest session (sessionStorage only, cleared on tab close)
        const guestSession = sessionStorage.getItem('stocks_app_guest_session');
        if (guestSession) {
          const parsed = JSON.parse(guestSession);
          if (parsed && parsed.isGuest) {
            setUser(parsed);
            return;
          }
        }

        // 2. Check persistent Google authenticated session in localStorage
        const savedSession = localStorage.getItem('stocks_app_user');
        if (savedSession) {
          const parsedUser = JSON.parse(savedSession);
          if (parsedUser && parsedUser.email && !parsedUser.isGuest) {
            setUser(parsedUser);
            return;
          }
        }

        setIsAuthModalOpen(true);
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

  // Verify the persisted Google session against the server cookie (also refreshes role / disabled state)
  useEffect(() => {
    if (!mounted || !user || user.isGuest) return;
    let cancelled = false;
    fetch('/api/auth/session')
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401 || res.status === 403) {
          setUser(null);
          try { localStorage.removeItem('stocks_app_user'); } catch { /* ignored */ }
          setIsAuthModalOpen(true);
        } else if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            const serverUser: User = { ...data.user, currency: 'INR' };
            if (serverUser.role !== user.role || serverUser.id !== user.id) {
              setUser(serverUser);
              try { localStorage.setItem('stocks_app_user', JSON.stringify(serverUser)); } catch { /* ignored */ }
            }
          }
        }
      })
      .catch(() => { /* offline: keep cached user */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, user?.id]);

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
          ? { credential: credentialOrProfile.credential }
          : { accessToken: credentialOrProfile?.accessToken };

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

  const continueAsGuest = () => {
    const guestUser: User = {
      id: 'guest',
      name: 'Guest User',
      email: 'guest@portfolio.local',
      role: 'USER',
      currency: 'INR',
      isGuest: true,
    };
    setUser(guestUser);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('stocks_app_guest_session', JSON.stringify(guestUser));
        localStorage.removeItem('stocks_app_user');
      } catch {
        // Ignored
      }
    }
    setIsAuthModalOpen(false);
  };

  const updateUser = (updatedFields: Partial<User>) => {
    setUser((prev) => {
      const updated = prev ? { ...prev, ...updatedFields } : null;
      if (typeof window !== 'undefined' && updated) {
        try {
          if (updated.isGuest) {
            sessionStorage.setItem('stocks_app_guest_session', JSON.stringify(updated));
          } else {
            localStorage.setItem('stocks_app_user', JSON.stringify(updated));
          }
        } catch {
          // Ignored
        }
      }
      return updated;
    });
  };

  const logout = () => {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => { /* ignored */ });
    saveUserSession(null);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('stocks_app_guest_session');
        sessionStorage.removeItem('stocks_guest_portfolio');
        localStorage.removeItem('stocks_user_data_guest');
      } catch {
        // Ignored
      }
    }
    setIsAuthModalOpen(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loginWithGoogle,
        continueAsGuest,
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
