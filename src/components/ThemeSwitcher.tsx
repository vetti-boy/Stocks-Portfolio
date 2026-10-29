'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme, Theme } from '@/context/ThemeContext';

interface ThemeSwitcherProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  className = '',
  showLabel = true,
}) => {
  const { theme, setTheme } = useTheme();

  return (
    <div className={`space-y-1.5 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-[11px] font-mono font-medium text-[var(--text-secondary)]">
          <span>Appearance</span>
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
            {theme === 'light' ? 'Ivory × Forest' : 'Royal Black'}
          </span>
        </div>
      )}

      {/* Segmented Control */}
      <div
        role="radiogroup"
        aria-label="Appearance theme selector"
        className="grid grid-cols-2 p-1 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] transition-colors duration-200"
      >
        {/* Light Segment */}
        <button
          type="button"
          role="radio"
          aria-checked={theme === 'light'}
          aria-label="Switch to Light Theme (Ivory × Forest)"
          onClick={() => setTheme('light')}
          className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-semibold transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ${
            theme === 'light'
              ? 'bg-[var(--surface)] text-[var(--brand-primary)] shadow-sm font-bold border border-[var(--border)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <Sun className="h-3.5 w-3.5 shrink-0 text-[#D6B477]" />
          <span>Light</span>
        </button>

        {/* Dark Segment */}
        <button
          type="button"
          role="radio"
          aria-checked={theme === 'dark'}
          aria-label="Switch to Dark Theme (Royal Black)"
          onClick={() => setTheme('dark')}
          className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-semibold transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ${
            theme === 'dark'
              ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] shadow-sm font-bold border border-[var(--border)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <Moon className="h-3.5 w-3.5 shrink-0 text-[var(--brand-primary)]" />
          <span>Dark</span>
        </button>
      </div>
    </div>
  );
};

