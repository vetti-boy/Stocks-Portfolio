'use client';

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { StockProvider, useStock } from '@/context/StockContext';
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
  const { syncStatus } = useStock();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'calculator' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedTab = localStorage.getItem('stocks_active_tab') as 'portfolio' | 'calculator' | 'admin';
        if (savedTab && ['portfolio', 'calculator', 'admin'].includes(savedTab)) {
          return savedTab;
        }
      } catch {
        // Ignored
      }
    }
    return 'portfolio';
  });

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
  const [storedPin, setStoredPin] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('app_screen_lock_pin') || '1234';
      } catch {
        return '1234';
      }
    }
    return '1234';
  });

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

  const isAdmin = user?.role === 'ADMIN' || user?.id === 'admin_master';

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

  // Automatically redirect non-admin users away from the admin tab to portfolio
  useEffect(() => {
    if (activeTab === 'admin' && !isAdmin) {
      changeTab('portfolio');
    }
  }, [user, isAdmin, activeTab]);

  return (
    <div className="relative min-h-screen flex bg-[#080B10] text-[#F4F7FA] selection:bg-[#38BDF8] selection:text-black overflow-hidden font-sans">
      {/* Subtle OBSIDIAN Ambient Orbs */}
      <div className="pointer-events-none absolute top-[-150px] left-1/4 h-[600px] w-[600px] rounded-full bg-[#38BDF8]/5 blur-[160px] animate-ambient" />
      <div className="pointer-events-none absolute bottom-[-150px] right-[-100px] h-[600px] w-[600px] rounded-full bg-[#8B5CF6]/5 blur-[160px] animate-ambient" />

      {/* OBSIDIAN PULSE Left Sidebar */}
      <aside
        className={`sticky top-0 z-50 h-screen bg-[#0A0F15] border-r border-[#202A35] transition-all duration-300 flex flex-col justify-between hidden md:flex ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="space-y-6 p-4">
          {/* Brand Header */}
          <div className="flex items-center justify-between">
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[#38BDF8] to-[#8B5CF6] flex items-center justify-center font-extrabold text-black text-xs shadow-md">
                  SP
                </div>
                <div>
                  <h1 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
                    STOCKPULSE <span className="text-[10px] font-bold text-[#38BDF8] bg-[#38BDF8]/10 px-1.5 py-0.5 rounded border border-[#38BDF8]/20">PRO</span>
                  </h1>
                </div>
              </div>
            )}
            {isSidebarCollapsed && (
              <div className="mx-auto h-8 w-8 rounded-lg bg-gradient-to-tr from-[#38BDF8] to-[#8B5CF6] flex items-center justify-center font-extrabold text-black text-xs">
                SP
              </div>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="text-[#8D99A8] hover:text-white p-1 rounded hover:bg-[#151D26] transition"
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-4">
            <div>
              {!isSidebarCollapsed && (
                <div className="px-3 text-[10px] font-bold uppercase tracking-widest text-[#596574] mb-2">
                  FINANCIAL WORKSPACE
                </div>
              )}
              <div className="space-y-1">
                <button
                  onClick={() => changeTab('portfolio')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'portfolio'
                      ? 'bg-[#111820] text-[#38BDF8] border border-[#38BDF8]/40 shadow-sm'
                      : 'text-[#8D99A8] hover:text-white hover:bg-[#151D26]'
                  }`}
                >
                  <Briefcase className="h-4 w-4 shrink-0" />
                  {!isSidebarCollapsed && <span>Portfolio & Holdings</span>}
                </button>

                <button
                  onClick={() => changeTab('calculator')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'calculator'
                      ? 'bg-[#111820] text-[#38BDF8] border border-[#38BDF8]/40 shadow-sm'
                      : 'text-[#8D99A8] hover:text-white hover:bg-[#151D26]'
                  }`}
                >
                  <Calculator className="h-4 w-4 shrink-0 text-[#22C55E]" />
                  {!isSidebarCollapsed && <span>Tax P&L Engine</span>}
                </button>

                {isAdmin && (
                  <button
                    onClick={() => changeTab('admin')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      activeTab === 'admin'
                        ? 'bg-[#111820] text-[#8B5CF6] border border-[#8B5CF6]/40 shadow-sm'
                        : 'text-[#8D99A8] hover:text-white hover:bg-[#151D26]'
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4 shrink-0 text-[#8B5CF6]" />
                    {!isSidebarCollapsed && <span>Enterprise Console</span>}
                  </button>
                )}
              </div>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer Security Status */}
        {!isSidebarCollapsed && (
          <div className="p-4 border-t border-[#202A35] space-y-2 text-[11px] text-[#8D99A8]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-white font-mono">
                <span className="h-2 w-2 rounded-full bg-[#22C55E]" /> AES-256
              </span>
              <span className="text-[10px] text-[#38BDF8] font-mono uppercase">{syncStatus}</span>
            </div>
          </div>
        )}
      </aside>

      {/* Right Core Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Top Market Command Bar */}
        <div className="sticky top-0 z-40 w-full bg-[#0A0F15]/95 backdrop-blur-md border-b border-[#202A35]">
          <Navbar
            onLockScreen={() => setIsLocked(true)}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          />

          {/* Mobile Tab Switcher */}
          <div className="md:hidden border-t border-[#202A35] bg-[#0A0F15] px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => changeTab('portfolio')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${
                activeTab === 'portfolio' ? 'bg-[#111820] text-[#38BDF8] border border-[#38BDF8]/40' : 'text-[#8D99A8]'
              }`}
            >
              Portfolio
            </button>
            <button
              onClick={() => changeTab('calculator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${
                activeTab === 'calculator' ? 'bg-[#111820] text-[#22C55E] border border-[#22C55E]/40' : 'text-[#8D99A8]'
              }`}
            >
              Tax Engine
            </button>
            {isAdmin && (
              <button
                onClick={() => changeTab('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${
                  activeTab === 'admin' ? 'bg-[#111820] text-[#8B5CF6] border border-[#8B5CF6]/40' : 'text-[#8D99A8]'
                }`}
              >
                Admin
              </button>
            )}
          </div>
        </div>

        {/* Main Workspace Area */}
        <main className="flex-1 mx-auto w-full max-w-[1920px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
          {activeTab === 'portfolio' && <PortfolioTab />}
          {activeTab === 'calculator' && <CalculatorTab />}
          {activeTab === 'admin' && <AdminPanel />}
        </main>

        {/* Footer Bar */}
        <footer className="border-t border-[#202A35] bg-[#0A0F15] py-4 text-xs text-[#596574]">
          <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="tracking-wide">
              StockPulse PRO &copy; 2026. Financial Command Center • AES-256 Encrypted Cloud DB.
            </p>
            <div className="flex items-center gap-2 text-[#8D99A8]">
              <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
              <span className="text-white font-medium">SEBI Compliant Tax Engine Active</span>
            </div>
          </div>
        </footer>
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
      <StockProvider>
        <DashboardContent />
      </StockProvider>
    </AuthProvider>
  );
}


