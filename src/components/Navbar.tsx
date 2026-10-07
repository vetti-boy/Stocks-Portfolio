'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useStock } from '@/context/StockContext';
import {
  LogIn,
  Activity,
  Lock,
  ShieldCheck,
  Search,
  Zap,
  Building2,
} from 'lucide-react';

interface NavbarProps {
  onLockScreen?: () => void;
  onOpenCommandPalette?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onLockScreen, onOpenCommandPalette }) => {
  const { user, openAuthModal } = useAuth();
  const { taxSettings, updateTaxSettings, marketStatus } = useStock();

  const activeBroker = taxSettings.brokerPreset || 'ZERODHA';

  const setBrokerPreset = (preset: 'ZERODHA' | 'GROWW') => {
    if (preset === 'ZERODHA') {
      updateTaxSettings({
        brokerPreset: 'ZERODHA',
        flatBrokerageBuy: 0,
        flatBrokerageSell: 0,
        brokeragePercent: 0,
        sttPercent: 0.1,
        stampDutyPercent: 0.015,
        gstPercent: 18,
        flatDpCharges: 15.93,
      });
    } else {
      updateTaxSettings({
        brokerPreset: 'GROWW',
        flatBrokerageBuy: 20,
        flatBrokerageSell: 20,
        brokeragePercent: 0.05,
        sttPercent: 0.1,
        stampDutyPercent: 0.015,
        gstPercent: 18,
        flatDpCharges: 23.60,
      });
    }
  };

  return (
    <header className="w-full">
      <div className="mx-auto flex max-w-[1920px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Market Status & Branding */}
        <div className="flex items-center gap-4">
          <button
            onClick={openAuthModal}
            title="Open Profile & Account Session Panel"
            className="flex items-center gap-3 text-left hover:opacity-90 transition group cursor-pointer"
          >
            <div className="relative">
              <div className="h-9 w-9 rounded-xl bg-[#0D1218] border border-[#202A35] flex items-center justify-center">
                <Activity className="h-4 w-4 text-[#38BDF8]" />
              </div>
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-white">
                STOCKPULSE
              </h1>
              <div className="flex items-center gap-2 text-[10px] text-[#8D99A8]">
                <span
                  className={`flex items-center gap-1 font-semibold ${marketStatus.textColor}`}
                  title={marketStatus.detailText}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${marketStatus.dotColor} ${marketStatus.isOpen ? 'animate-pulse' : ''}`}
                  />
                  {marketStatus.statusText}
                </span>
                <span className="hidden md:inline">• NSE/BSE Real-Time (₹ INR)</span>
              </div>
            </div>
          </button>
        </div>

        {/* Center: Command Palette Trigger */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            className="hidden md:flex items-center gap-3 rounded-full border border-[#202A35] bg-[#0D1218] hover:bg-[#151D26] hover:border-[#334155] px-4 py-1.5 text-xs text-[#8D99A8] transition-all duration-200 group"
          >
            <Search className="h-3.5 w-3.5 text-[#38BDF8] group-hover:scale-110 transition-transform" />
            <span>Search stocks or press</span>
            <kbd className="rounded bg-[#111820] px-2 py-0.5 text-[10px] font-mono font-bold text-white border border-[#202A35]">
              Ctrl + K
            </kbd>
          </button>
        )}

        {/* Action Controls & Auth */}
        <div className="flex items-center gap-3">
          {/* Lock Screen Security Button */}
          {onLockScreen && (
            <button
              onClick={onLockScreen}
              title="Lock screen with 4-digit PIN"
              className="flex items-center gap-2 rounded-full border border-[#202A35] bg-[#0D1218] hover:bg-[#151D26] hover:border-[#38BDF8]/40 px-3 py-1.5 text-xs font-semibold text-[#8D99A8] hover:text-white transition-all duration-200"
            >
              <Lock className="h-3.5 w-3.5 text-[#38BDF8]" />
              <span className="hidden lg:inline">Lock Screen</span>
            </button>
          )}

          {/* User Profile / Auth Button */}
          {user ? (
            <button
              onClick={openAuthModal}
              className="flex items-center gap-2.5 rounded-full border border-[#202A35] bg-[#0D1218] hover:bg-[#151D26] px-3.5 py-1.5 text-xs font-semibold text-white transition-all duration-200"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-[#38BDF8] to-[#8B5CF6] font-bold text-[9px] text-black">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="max-w-[110px] truncate hidden sm:inline">{user.name}</span>
              {user.role === 'ADMIN' && (
                <ShieldCheck className="h-3.5 w-3.5 text-[#8B5CF6] shrink-0" />
              )}
            </button>
          ) : (
            <button
              onClick={openAuthModal}
              className="pill-btn-primary flex items-center gap-2"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};


