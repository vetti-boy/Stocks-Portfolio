'use client';

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { StockProvider } from '@/context/StockContext';
import { Navbar } from '@/components/Navbar';
import { PortfolioTab } from '@/components/PortfolioTab';
import { CalculatorTab } from '@/components/CalculatorTab';
import { AdminPanel } from '@/components/AdminPanel';
import { AuthModal } from '@/components/AuthModal';
import { PinLockModal } from '@/components/PinLockModal';
import { CommandPaletteModal } from '@/components/CommandPaletteModal';
import { Briefcase, Calculator, ShieldCheck, ChevronLeft } from 'lucide-react';

function DashboardContent() {
  const { user } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'calculator' | 'admin'>('portfolio');
  const [storedPin, setStoredPin] = useState('1234');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const savedTab = localStorage.getItem('stocks_active_tab') as 'portfolio' | 'calculator' | 'admin';
      if (savedTab && ['portfolio', 'calculator', 'admin'].includes(savedTab)) {
        setActiveTab(savedTab);
      }
      const pin = localStorage.getItem('app_screen_lock_pin');
      if (pin) {
        setStoredPin(pin);
      }
    } catch {
      // Ignored
    }
  }, []);

  const changeTab = (tab: 'portfolio' | 'calculator' | 'admin') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('stocks_active_tab', tab);
      } catch {
        // Ignored
      }
    }
  };

  const [isLocked, setIsLocked] = useState(false);

  const handleUpdateStoredPin = (newPin: string) => {
    setStoredPin(newPin);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('app_screen_lock_pin', newPin);
      } catch {
        // Ignored
      }
    }
  };
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.email === 'mailfortempusage@gmail.com';

  // Listen for global Ctrl + K / Cmd + K keyboard shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Automatically redirect non-admin users away from the admin tab to portfolio (only when user session has resolved)
  useEffect(() => {
    if (isMounted && user && activeTab === 'admin' && !isAdmin) {
      changeTab('portfolio');
    }
  }, [isMounted, user, isAdmin, activeTab]);

  return (
    <div className="relative min-h-screen flex bg-[var(--app-bg)] text-[var(--text-primary)] transition-colors duration-200 font-sans">
      {/* Left Sidebar (3 Fixed Navigation Tabs) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] text-[var(--sidebar-text)] transition-all duration-200 flex flex-col justify-between overflow-y-auto overflow-x-hidden hidden md:flex ${
          isSidebarCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="space-y-6 p-3">
          {/* Brand Header */}
          <div className="flex items-center justify-between min-h-[40px] px-1">
            {!isSidebarCollapsed ? (
              <>
                <div className="flex items-center">
                  <img
                    src="/logo.png"
                    alt="StockPulse — Portfolio Intelligence"
                    width={180}
                    height={36}
                    style={{ height: '36px', width: 'auto', maxWidth: '180px' }}
                    className="h-9 w-auto max-w-[180px] object-contain shrink-0"
                  />
                </div>
                <button
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)] p-1 rounded-md hover:bg-[var(--sidebar-hover-bg)] transition shrink-0 cursor-pointer"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="w-full flex items-center justify-center">
                <button
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center shadow-sm shrink-0 transition-all cursor-pointer group relative hover:bg-[var(--sidebar-hover-bg)]"
                  title="Click to expand sidebar"
                  aria-label="Click to expand sidebar"
                >
                  <img
                    src="/logo-icon.png"
                    alt="StockPulse"
                    width={32}
                    height={32}
                    style={{ height: '32px', width: '32px' }}
                    className="h-8 w-8 object-contain shrink-0 group-hover:opacity-25 transition-opacity"
                  />
                  <ChevronLeft className="h-4 w-4 rotate-180 text-[var(--sidebar-text)] absolute hidden group-hover:block transition-transform" />
                </button>
              </div>
            )}
          </div>

          {/* Navigation Menu (Strictly 3 Pages) */}
          <nav className="space-y-4">
            <div>
              {!isSidebarCollapsed && (
                <div className="px-2 text-[9px] font-bold uppercase tracking-widest text-[var(--sidebar-text-muted)] mb-2 font-mono">
                  NAVIGATION
                </div>
              )}
              <div className="space-y-1">
                {/* Tab 1: Portfolio & Holdings */}
                <button
                  onClick={() => changeTab('portfolio')}
                  title="Portfolio & Holdings"
                  className={`w-full flex items-center ${
                    isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2'
                  } rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'portfolio'
                      ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-text)] border border-[var(--sidebar-border)] shadow-sm font-bold'
                      : 'text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)]'
                  }`}
                >
                  <Briefcase className={`h-4 w-4 shrink-0 ${activeTab === 'portfolio' ? 'text-[var(--sidebar-text)]' : 'text-[var(--sidebar-text-muted)]'}`} />
                  {!isSidebarCollapsed && <span>Portfolio & Holdings</span>}
                </button>

                {/* Tab 2: Tax P&L Engine */}
                <button
                  onClick={() => changeTab('calculator')}
                  title="Tax P&L Engine"
                  className={`w-full flex items-center ${
                    isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2'
                  } rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'calculator'
                      ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-text)] border border-[var(--sidebar-border)] shadow-sm font-bold'
                      : 'text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)]'
                  }`}
                >
                  <Calculator className={`h-4 w-4 shrink-0 ${activeTab === 'calculator' ? 'text-[var(--sidebar-text)]' : 'text-[var(--sidebar-text-muted)]'}`} />
                  {!isSidebarCollapsed && <span>Tax P&L Engine</span>}
                </button>

                {/* Tab 3: Enterprise Console */}
                {isAdmin && (
                  <button
                    onClick={() => changeTab('admin')}
                    title="Enterprise Console"
                    className={`w-full flex items-center ${
                      isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2'
                    } rounded-lg text-xs font-semibold transition cursor-pointer ${
                      activeTab === 'admin'
                        ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-text)] border border-[var(--sidebar-border)] shadow-sm font-bold'
                        : 'text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)]'
                    }`}
                  >
                    <ShieldCheck className={`h-4 w-4 shrink-0 ${activeTab === 'admin' ? 'text-[var(--sidebar-text)]' : 'text-[var(--sidebar-text-muted)]'}`} />
                    {!isSidebarCollapsed && <span>Enterprise Console</span>}
                  </button>
                )}
              </div>
            </div>
          </nav>
        </div>
      </aside>

      {/* Right Core Container */}
      <div
        className={`flex-1 flex flex-col min-w-0 bg-[var(--app-bg)] transition-all duration-200 ${
          isSidebarCollapsed ? 'md:pl-16' : 'md:pl-60'
        }`}
      >
        {/* Sticky Top Market Command Bar */}
        <div className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--surface)]">
          <Navbar
            onLockScreen={() => setIsLocked(true)}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          />

          {/* Mobile Tab Switcher */}
          <div className="md:hidden border-t border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 flex gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => changeTab('portfolio')}
              className={`px-3 py-1 rounded-md text-xs font-semibold shrink-0 transition ${
                activeTab === 'portfolio' ? 'bg-[var(--surface-muted)] text-[var(--brand-primary)] border border-[var(--border)] font-bold' : 'text-[var(--text-secondary)]'
              }`}
            >
              Portfolio
            </button>
            <button
              onClick={() => changeTab('calculator')}
              className={`px-3 py-1 rounded-md text-xs font-semibold shrink-0 transition ${
                activeTab === 'calculator' ? 'bg-[var(--surface-muted)] text-[var(--brand-primary)] border border-[var(--border)] font-bold' : 'text-[var(--text-secondary)]'
              }`}
            >
              Tax Engine
            </button>
            {isAdmin && (
              <button
                onClick={() => changeTab('admin')}
                className={`px-3 py-1 rounded-md text-xs font-semibold shrink-0 transition ${
                  activeTab === 'admin' ? 'bg-[var(--surface-muted)] text-[var(--brand-primary)] border border-[var(--border)] font-bold' : 'text-[var(--text-secondary)]'
                }`}
              >
                Admin
              </button>
            )}
          </div>
        </div>

        {/* Main Workspace Area (The 3 Tab Components) */}
        <main className="flex-1 mx-auto w-full max-w-[1920px] px-3 py-5 sm:px-6 lg:px-8 space-y-6 pb-24 md:pb-8">
          {activeTab === 'portfolio' && (
            <PortfolioTab onOpenInCalculator={() => changeTab('calculator')} />
          )}
          {activeTab === 'calculator' && <CalculatorTab />}
          {activeTab === 'admin' && <AdminPanel />}
        </main>

        {/* Fixed Mobile Bottom Navigation Bar (iOS & Android Smartphone Native Experience) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface)]/95 backdrop-blur-lg border-t border-[var(--border)] px-4 py-2 flex items-center justify-around shadow-2xl">
          <button
            onClick={() => changeTab('portfolio')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition ${
              activeTab === 'portfolio' ? 'text-[var(--brand-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition ${activeTab === 'portfolio' ? 'bg-[var(--brand-primary)]/15 border border-[var(--brand-primary)]/30' : ''}`}>
              <Briefcase className="h-4 w-4" />
            </div>
            <span>Portfolio</span>
          </button>

          <button
            onClick={() => changeTab('calculator')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition ${
              activeTab === 'calculator' ? 'text-[var(--positive)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition ${activeTab === 'calculator' ? 'bg-[var(--positive)]/15 border border-[var(--positive)]/30' : ''}`}>
              <Calculator className="h-4 w-4" />
            </div>
            <span>Tax Engine</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => changeTab('admin')}
              className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition ${
                activeTab === 'admin' ? 'text-[var(--brand-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className={`p-1.5 rounded-lg transition ${activeTab === 'admin' ? 'bg-[var(--brand-primary)]/15 border border-[var(--brand-primary)]/30' : ''}`}>
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span>Admin</span>
            </button>
          )}
        </nav>
      </div>

      {/* Auth Modal Overlay */}
      <AuthModal />

      {/* Command Palette (Ctrl + K) Modal */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateTab={(tab) => changeTab(tab)}
        onOpenAddModal={() => changeTab('portfolio')}
        onLockScreen={() => setIsLocked(true)}
      />

      {/* PIN Security Lock Screen Overlay */}
      <PinLockModal
        isOpen={isLocked}
        onUnlock={() => setIsLocked(false)}
        storedPin={storedPin}
        onChangePin={handleUpdateStoredPin}
      />
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <StockProvider>
          <DashboardContent />
        </StockProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
