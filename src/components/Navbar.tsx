'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MarketSign } from '@/components/MarketSign';
import { useStock } from '@/context/StockContext';
import { ThemeSwitcher } from './ThemeSwitcher';
import {
  Lock,
  User as UserIcon,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  onLockScreen?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onLockScreen }) => {
  const { user, openAuthModal, logout } = useAuth();
  const { marketStatus } = useStock();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Close dropdown on Esc
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isGuestUser = user?.isGuest;

  return (
    <header className="w-full bg-[var(--surface)] border-b border-[var(--border)] transition-colors duration-200">
      <div className="mx-auto flex max-w-[1920px] items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
        {/* Market Status & Brand (Deduplicated on Desktop) */}
        <div className="flex items-center gap-3">
          {/* Mobile-only Brand (shown only when left sidebar is hidden) */}
          <div className="flex md:hidden items-center gap-2">
            <img
              src="/logo-icon.svg"
              alt="StockPulse Logo"
              width={26}
              height={26}
              style={{ height: '26px', width: '26px' }}
              className="h-6.5 w-6.5 object-contain shrink-0"
            />
            <span className="text-xs font-black tracking-wider text-[var(--text-primary)] uppercase font-mono">
              STOCK<span className="text-[var(--accent-gold)]">PULSE</span>
            </span>
          </div>

          {/* Hanging OPEN / CLOSED board */}
          <MarketSign status={marketStatus} />
        </div>

        {/* Action Controls & Auth Profile Dropdown */}
        <div className="flex items-center gap-2.5">
          {/* Lock Screen Security Button */}
          {onLockScreen && (
            <button
              onClick={onLockScreen}
              title="Lock screen with 4-digit PIN"
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-180 cursor-pointer shadow-sm"
            >
              <Lock className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
              <span className="hidden lg:inline text-[11px]">Lock</span>
            </button>
          )}

          {/* User Profile Dropdown Anchor */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(prev => !prev)}
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
              title="User Profile & Settings"
              className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition-all duration-180 cursor-pointer shadow-sm"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-5 w-5 rounded-full object-cover border border-[var(--brand-primary)]"
                />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--brand-primary)] font-bold text-[9px]">
                  {user ? user.name.charAt(0).toUpperCase() : <UserIcon className="h-3 w-3" />}
                </div>
              )}
              <span className="max-w-[110px] truncate text-xs hidden sm:inline text-[var(--text-primary)]">
                {user ? user.name : 'Guest User'}
              </span>
              {user?.role === 'ADMIN' && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] border border-[var(--brand-primary)]/30">
                  ADMIN
                </span>
              )}
              <ChevronDown className={`h-3 w-3 text-[var(--text-secondary)] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile & Settings Dropdown Menu */}
            {isDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-72 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xl p-3.5 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150"
                role="menu"
                aria-orientation="vertical"
              >
                {/* User Info Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-[var(--border)]">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-10 w-10 rounded-full object-cover border border-[var(--border)] shrink-0"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--brand-primary)] font-bold text-sm shrink-0">
                      {user ? user.name.charAt(0).toUpperCase() : 'G'}
                    </div>
                  )}
                  <div className="overflow-hidden flex-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--text-primary)] truncate">
                      <span>{user ? user.name : 'Guest Session'}</span>
                      {user?.role === 'ADMIN' && (
                        <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] border border-[var(--brand-primary)]/30">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                      {user?.email || 'Temporary local cache'}
                    </div>
                  </div>
                </div>

                {/* Appearance Section: The Light / Dark Switcher */}
                <div className="pt-1">
                  <ThemeSwitcher />
                </div>

                {/* Account Actions */}
                <div className="pt-2 border-t border-[var(--border)] space-y-1.5">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      openAuthModal();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition cursor-pointer"
                  >
                    <UserIcon className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                    <span>{user && !isGuestUser ? 'Google Account' : 'Connect Google Account'}</span>
                  </button>

                  {user && (
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--negative)] hover:bg-[var(--negative-bg)] transition cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>{isGuestUser ? 'Exit Guest Session' : 'Sign Out'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
