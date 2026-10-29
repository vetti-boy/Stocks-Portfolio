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
  X,
  ArrowRight,
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
    exportPortfolioJSON,
    addHolding,
    fetchLiveQuotesNow,
    holdings,
    setSelectedCalculatorHoldingId,
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

  // Portfolio holdings matches when typing
  const portfolioMatches = query.trim()
    ? holdings.filter(
        (h) =>
          h.symbol.toLowerCase().includes(query.toLowerCase()) ||
          (h.companyName && h.companyName.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  // Streamlined essential shortcuts & actions
  const defaultActions = [
    {
      id: 'nav-portfolio',
      title: 'Go to Portfolio',
      category: 'Navigation',
      icon: Briefcase,
      action: () => {
        onNavigateTab('portfolio');
        onClose();
      },
    },
    {
      id: 'nav-calculator',
      title: 'Open Tax & Target Calculator',
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
      id: 'action-export',
      title: 'Export Portfolio Backup',
      category: 'Data',
      icon: Download,
      action: () => {
        exportPortfolioJSON();
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
  ];

  // Filter actions based on search input
  const filteredActions = defaultActions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  );

  const totalItemsCount = portfolioMatches.length + searchResults.length + filteredActions.length;

  const handleSelectPortfolioHolding = (holdingId: string) => {
    setSelectedCalculatorHoldingId(holdingId);
    onNavigateTab('calculator');
    onClose();
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
      if (portfolioMatches.length > 0 && selectedIndex < portfolioMatches.length) {
        handleSelectPortfolioHolding(portfolioMatches[selectedIndex].id);
      } else {
        const remainingIdx = selectedIndex - portfolioMatches.length;
        if (searchResults.length > 0 && remainingIdx < searchResults.length) {
          handleSelectStock(searchResults[remainingIdx]);
        } else {
          const actionIdx = remainingIdx - searchResults.length;
          if (filteredActions[actionIdx]) {
            filteredActions[actionIdx].action();
          }
        }
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
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
            {/* Owned Portfolio Holding Matches */}
            {portfolioMatches.length > 0 && (
              <div className="py-2 space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#22C55E] font-mono">
                  Your Portfolio Holdings ({portfolioMatches.length})
                </div>
                {portfolioMatches.map((holding, idx) => {
                  const isSelected = selectedIndex === idx;
                  return (
                    <button
                      key={holding.id}
                      onClick={() => handleSelectPortfolioHolding(holding.id)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition text-left ${
                        isSelected
                          ? 'bg-[#111820] border-l-2 border-[#22C55E] text-[#F4F7FA]'
                          : 'hover:bg-[#111820]/60 text-[#8D99A8]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#080B10] border border-[#202A35] text-[#22C55E] font-mono font-bold text-xs">
                          {holding.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <div className="font-bold text-[#F4F7FA] font-mono text-sm flex items-center gap-2">
                            <span>{holding.symbol}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30 font-sans font-semibold">
                              Owned • {holding.quantity} Qty
                            </span>
                          </div>
                          <div className="text-xs text-[#8D99A8] truncate max-w-[280px]">
                            {holding.companyName || 'Portfolio Holding'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 font-mono">
                        <div className="text-right">
                          <div className="text-xs font-bold text-white">
                            ₹{holding.currentPrice.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[9px] text-[#596574]">CMP</div>
                        </div>
                        <span className="text-xs font-semibold text-[#22C55E] flex items-center gap-1">
                          Open in Calc <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Live Stock Results */}
            {searchResults.length > 0 && (
              <div className="py-2 space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#38BDF8] font-mono">
                  Live Stock Search ({searchResults.length})
                </div>
                {searchResults.map((stock, idx) => {
                  const globalIdx = portfolioMatches.length + idx;
                  const isSelected = selectedIndex === globalIdx;
                  return (
                    <button
                      key={stock.symbol}
                      onClick={() => handleSelectStock(stock)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
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
                        <span className="text-xs font-semibold text-[#38BDF8] flex items-center gap-1">
                          Add <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Default Essential Shortcuts */}
            <div className="py-2 space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#596574] font-mono">
                Quick Shortcuts
              </div>
              {filteredActions.map((action, idx) => {
                const globalIdx = portfolioMatches.length + searchResults.length + idx;
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
            <div className="flex items-center gap-1.5 font-bold font-mono text-white text-[11px]">
              <img src="/logo-icon.png" alt="StockPulse" className="h-4 w-4 object-contain" />
              <span>STOCK<span className="text-[#E5C07B]">PULSE</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
