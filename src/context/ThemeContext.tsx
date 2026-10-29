'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const GLOBAL_STORAGE_KEY = 'stockpulse-theme-preference';

function getStorageKeyForUser(email?: string | null): string {
  if (email && email.trim()) {
    return `${GLOBAL_STORAGE_KEY}_${email.trim().toLowerCase()}`;
  }
  return GLOBAL_STORAGE_KEY;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>('light');
  const [isInitialized, setIsInitialized] = useState(false);

  // Apply theme to document element
  const applyThemeToDOM = (activeTheme: Theme) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', activeTheme);
      // Also update style or class for maximum compatibility
      if (activeTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    }
  };

  // Initialize theme on mount and when authenticated user changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const userKey = getStorageKeyForUser(user?.email);
      // Priority: user-specific key -> global fallback key -> default 'light'
      const savedTheme = (localStorage.getItem(userKey) as Theme) ||
                          (localStorage.getItem(GLOBAL_STORAGE_KEY) as Theme) ||
                          'light';

      const validTheme: Theme = savedTheme === 'dark' ? 'dark' : 'light';
      setThemeState(validTheme);
      applyThemeToDOM(validTheme);
      setIsInitialized(true);
    } catch {
      setThemeState('light');
      applyThemeToDOM('light');
      setIsInitialized(true);
    }
  }, [user?.email]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    applyThemeToDOM(newTheme);

    try {
      // 1. Always save to global fallback
      localStorage.setItem(GLOBAL_STORAGE_KEY, newTheme);

      // 2. If user is authenticated, isolate to user-specific key
      if (user?.email) {
        const userKey = getStorageKeyForUser(user.email);
        localStorage.setItem(userKey, newTheme);
      }
    } catch (e) {
      console.warn('Failed to persist theme preference:', e);
    }
  }, [user?.email]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

