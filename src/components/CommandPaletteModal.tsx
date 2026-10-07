'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useStock } from '@/context/StockContext';
import {
  Search,
  Briefcase,
  Calculator,
  Plus,
  Lock,
  Download,
  Zap,
  Building2,
  X,
  ArrowRight,
  TrendingUp,
  Loader2,
} from 'lucide-react';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: 'portfolio' | 'calculator' | 'admin') => void;
  onOpenAddModal: () => void;
  onLockScreen: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenAddModal,
  onLockScreen,
}) => {
  const {
    taxSettings,
    updateTaxSettings,
    exportPortfolioJSON,
    addHolding,
    fetchLiveQuotesNow,
  } = useStock();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Live stock API search when user types
  useEffect(() => {
    if (!query.trim() || query.length < 1) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.results && Array.isArray(data.results)) {
            setSearchResults(data.results);
          }
        }
      } catch (err) {
        console.error('Command Palette Search Error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Command palette actions
  const defaultActions = [
    {
      id: 'nav-portfolio',
      title: 'Go to Portfolio & Stock Holdings',
      category: 'Navigation',
      icon: Briefcase,
      action: () => {
        onNavigateTab('portfolio');
        onClose();
      },
    },
    {
      id: 'nav-calculator',
      title: 'Open Tax P&L Engine & Target Sell Price Calculator',
      category: 'Navigation',
      icon: Calculator,
      action: () => {
        onNavigateTab('calculator');
        onClose();
      },
    },
    {
      id: 'action-add-stock',
      title: 'Record New Stock Purchase',
      category: 'Action',
      icon: Plus,
      action: () => {
        onOpenAddModal();
        onClose();
      },
    },
    {
      id: 'broker-zerodha',
      title: 'Set Active Broker: Zerodha (₹0 Delivery Brokerage + STT)',
      category: 'Tax Engine',
      icon: Zap,
      active: (taxSettings.brokerPreset || 'ZERODHA') === 'ZERODHA',
      action: () => {
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
        onClose();
      },
    },
    {
      id: 'broker-groww',
      title: 'Set Active Broker: Groww (0.05% max ₹20 / order)',
      category: 'Tax Engine',
      icon: Building2,
      active: taxSettings.brokerPreset === 'GROWW',
      action: () => {
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
        onClose();
      },
    },
    {
      id: 'action-lock',
      title: 'Lock Screen (4-Digit PIN)',
      category: 'Security',
      icon: Lock,
      action: () => {
        onLockScreen();
        onClose();
      },
    },
    {
      id: 'action-export',
      title: 'Export Portfolio JSON Backup',
      category: 'Data',
      icon: Download,
      action: () => {
        exportPortfolioJSON();
        onClose();
      },
    },
  ];

  // Combine live stock results + navigation actions
  const filteredActions = defaultActions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  );

  const totalItemsCount = searchResults.length + filteredActions.length;

  // Keyboard Navigation Handlers
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < totalItemsCount ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : totalItemsCount - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0 && selectedIndex < searchResults.length) {
        const item = searchResults[selectedIndex];
        handleSelectStock(item);
      } else {
        const actionIdx = selectedIndex - searchResults.length;
        if (filteredActions[actionIdx]) {
          filteredActions[actionIdx].action();
        }
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelectStock = (stock: any) => {
    addHolding({
      symbol: stock.symbol.endsWith('.NS') ? stock.symbol : `${stock.symbol}.NS`,
      companyName: stock.companyName,
      buyPrice: stock.price || 1000,
      quantity: 1,
      buyDate: new Date().toISOString().slice(0, 10),
      exchange: stock.exchange === 'BSE' ? 'BSE' : 'NSE',
      category: stock.category || 'Tech',
      notes: 'Added via Quick Command Palette (Ctrl+K)',
    });
    onClose();
    setTimeout(() => fetchLiveQuotesNow(), 150);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-black/80 p-4 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#0D1218] rounded-2xl w-full max-w-2xl border border-[#202A35] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-0 space-y-0 overflow-hidden">
          {/* Search Input Bar */}
          <div className="flex items-center gap-3 border-b border-[#202A35] px-5 py-4 bg-[#080B10]">
            <Search className="h-5 w-5 text-[#38BDF8] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search stocks or commands (e.g. RELIANCE, TCS, Calculator, Lock)..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-base text-[#F4F7FA] outline-none placeholder:text-[#596574] font-mono"
            />
            {isSearching ? (
              <Loader2 className="h-5 w-5 animate-spin text-[#38BDF8] shrink-0" />
            ) : (
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-[#8D99A8] hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Results Area */}
          <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-[#202A35]">
            {/* Live Stock Results */}
            {searchResults.length > 0 && (
              <div className="py-2 space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#38BDF8] font-mono">
                  Live Stock Matches ({searchResults.length})
                </div>
                {searchResults.map((stock, idx) => {
                  const isSelected = selectedIndex === idx;
                  return (
                    <button
                      key={stock.symbol}
                      onClick={() => handleSelectStock(stock)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition text-left ${
                        isSelected
                          ? 'bg-[#111820] border-l-2 border-[#38BDF8] text-[#F4F7FA]'
                          : 'hover:bg-[#111820]/60 text-[#8D99A8]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#080B10] border border-[#202A35] text-[#38BDF8] font-mono font-bold text-xs">
                          {stock.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <div className="font-bold text-[#F4F7FA] font-mono text-sm flex items-center gap-2">
                            <span>{stock.symbol}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#111820] text-[#8D99A8] border border-[#202A35]">
                              {stock.exchange}
                            </span>
                          </div>
                          <div className="text-xs text-[#8D99A8] truncate max-w-[280px]">
                            {stock.companyName}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 font-mono">
                        {stock.price > 0 && (
                          <div className="text-right">
                            <div className="text-xs font-bold text-[#22C55E]">
                              ₹{stock.price.toLocaleString('en-IN')}
                            </div>
                            <div className="text-[9px] text-[#596574]">LTP</div>
                          </div>
                        )}
                        <span className="text-xs font-semibold text-[#38BDF8] flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          Add <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Default Quick Actions */}
            <div className="py-2 space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#596574] font-mono">
                Quick Shortcuts & Actions
              </div>
              {filteredActions.map((action, idx) => {
                const globalIdx = searchResults.length + idx;
                const isSelected = selectedIndex === globalIdx;
                const Icon = action.icon;

                return (
                  <button
                    key={action.id}
                    onClick={action.action}
                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition text-left ${
                      isSelected
                        ? 'bg-[#111820] border-l-2 border-[#38BDF8] text-[#F4F7FA]'
                        : 'hover:bg-[#111820]/60 text-[#8D99A8]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#080B10] border border-[#202A35] text-[#38BDF8]">
                        <Icon className="h-4 w-4 text-[#38BDF8]" />
                      </div>
                      <div>
                        <div className="font-semibold text-[#F4F7FA] text-sm flex items-center gap-2">
                          <span>{action.title}</span>
                          {action.active && (
                            <span className="text-[10px] font-bold font-mono text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded border border-[#22C55E]/20">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#8D99A8]">{action.category}</div>
                      </div>
                    </div>

                    <ArrowRight
                      className={`h-4 w-4 transition ${
                        isSelected ? 'translate-x-1 text-[#38BDF8]' : 'text-[#596574]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Navigation Hints */}
          <div className="flex items-center justify-between border-t border-[#202A35] px-5 py-3 bg-[#080B10] text-[11px] text-[#8D99A8]">
            <div className="flex items-center gap-3 font-mono">
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-[#111820] px-1.5 py-0.5 border border-[#202A35] text-[#F4F7FA] text-[10px]">
                  ↑↓
                </kbd>{' '}
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-[#111820] px-1.5 py-0.5 border border-[#202A35] text-[#F4F7FA] text-[10px]">
                  ↵
                </kbd>{' '}
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-[#111820] px-1.5 py-0.5 border border-[#202A35] text-[#F4F7FA] text-[10px]">
                  Esc
                </kbd>{' '}
                Close
              </span>
            </div>
            <div className="text-[#38BDF8] font-bold font-mono">StockPulse PRO Command Engine</div>
          </div>
        </div>
      </div>
    </div>
  );
};
