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
  History,
  X,
  ArrowRight,
  Loader2,
  SearchX,
} from 'lucide-react';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: 'portfolio' | 'calculator' | 'history' | 'admin') => void;
  onOpenAddModal: () => void;
  onLockScreen: () => void;
}

interface RowProps {
  selected: boolean;
  index: number;
  onClick: () => void;
  onHover: () => void;
  icon: React.ReactNode;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  right?: React.ReactNode;
}

/** One palette row. The active marker is absolutely positioned so rows never shift or misalign. */
const Row: React.FC<RowProps> = ({ selected, index, onClick, onHover, icon, title, subtitle, right }) => (
  <button
    type="button"
    role="option"
    aria-selected={selected}
    data-palette-index={index}
    onClick={onClick}
    onMouseEnter={onHover}
    className={`relative flex min-h-[52px] w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
      selected ? 'bg-[var(--surface-hover)]' : 'hover:bg-[var(--surface-muted)]'
    }`}
  >
    {selected && (
      <span className="absolute bottom-2.5 left-0 top-2.5 w-[3px] rounded-full bg-[var(--brand-primary)]" />
    )}
    {icon}
    <div className="min-w-0 flex-1">
      <div className="truncate text-sm font-semibold text-[var(--text-primary)]">{title}</div>
      <div className="truncate text-xs text-[var(--text-muted)]">{subtitle}</div>
    </div>
    {right}
  </button>
);

const SectionLabel: React.FC<{ children: React.ReactNode; tone?: 'brand' | 'positive' | 'muted' }> = ({
  children,
  tone = 'muted',
}) => (
  <div
    className={`px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.12em] ${
      tone === 'positive'
        ? 'text-[var(--positive)]'
        : tone === 'brand'
        ? 'text-[var(--brand-primary)]'
        : 'text-[var(--text-muted)]'
    }`}
  >
    {children}
  </div>
);

const IconTile: React.FC<{ children: React.ReactNode; tone?: 'brand' | 'positive' }> = ({
  children,
  tone = 'brand',
}) => (
  <div
    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border font-mono text-xs font-bold ${
      tone === 'positive'
        ? 'border-[var(--positive-border)] bg-[var(--positive-bg)] text-[var(--positive)]'
        : 'border-[var(--border)] bg-[var(--brand-soft)] text-[var(--brand-primary)]'
    }`}
  >
    {children}
  </div>
);

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-1.5 py-0.5 font-sans text-[10px] font-semibold text-[var(--text-secondary)]">
    {children}
  </kbd>
);

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
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keep the active row visible while arrowing through a long list
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-palette-index="${selectedIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

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
      id: 'nav-history',
      title: 'Open Trade History & P&L Ledger',
      category: 'Navigation',
      icon: History,
      action: () => {
        onNavigateTab('history');
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

  const hasQuery = query.trim().length > 0;
  const noResults = hasQuery && !isSearching && totalItemsCount === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-3 pt-[10vh] backdrop-blur-sm sm:px-4 sm:pt-[14vh]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Command palette"
        className="palette-panel w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search bar */}
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3.5">
          <Search className="h-[18px] w-[18px] shrink-0 text-[var(--text-muted)]" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            placeholder="Search stocks or type a command…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
            className="palette-input min-w-0 flex-1 text-[15px] font-medium"
          />
          {isSearching ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--brand-primary)]" />
          ) : (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-7 shrink-0 items-center justify-center rounded-md text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
            >
              <span className="hidden sm:block">
                <Kbd>Esc</Kbd>
              </span>
              <X className="h-4 w-4 sm:hidden" />
            </button>
          )}
        </div>

        {/* Results */}
        <div
          id="palette-list"
          role="listbox"
          ref={listRef}
          className="max-h-[min(60vh,420px)] overflow-y-auto overscroll-contain p-2 pt-0"
        >
          {/* Owned holdings */}
          {portfolioMatches.length > 0 && (
            <div>
              <SectionLabel tone="positive">Your holdings · {portfolioMatches.length}</SectionLabel>
              {portfolioMatches.map((holding, idx) => (
                <Row
                  key={holding.id}
                  index={idx}
                  selected={selectedIndex === idx}
                  onClick={() => handleSelectPortfolioHolding(holding.id)}
                  onHover={() => setSelectedIndex(idx)}
                  icon={<IconTile tone="positive">{holding.symbol.slice(0, 3)}</IconTile>}
                  title={
                    <span className="flex items-center gap-2">
                      <span className="font-mono">{holding.symbol}</span>
                      <span className="rounded-md border border-[var(--positive-border)] bg-[var(--positive-bg)] px-1.5 py-px text-[10px] font-semibold text-[var(--positive)]">
                        {holding.quantity} qty
                      </span>
                    </span>
                  }
                  subtitle={holding.companyName || 'Portfolio holding'}
                  right={
                    <div className="flex shrink-0 items-center gap-2.5">
                      <div className="text-right font-mono">
                        <div className="text-xs font-bold text-[var(--text-primary)]">
                          ₹{holding.currentPrice.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[9px] text-[var(--text-muted)]">CMP</div>
                      </div>
                      <ArrowRight
                        className={`h-4 w-4 ${
                          selectedIndex === idx ? 'text-[var(--brand-primary)]' : 'text-[var(--text-muted)]'
                        }`}
                      />
                    </div>
                  }
                />
              ))}
            </div>
          )}

          {/* Live stock results */}
          {searchResults.length > 0 && (
            <div>
              <SectionLabel tone="brand">Stocks · {searchResults.length}</SectionLabel>
              {searchResults.map((stock, idx) => {
                const globalIdx = portfolioMatches.length + idx;
                return (
                  <Row
                    key={stock.symbol}
                    index={globalIdx}
                    selected={selectedIndex === globalIdx}
                    onClick={() => handleSelectStock(stock)}
                    onHover={() => setSelectedIndex(globalIdx)}
                    icon={<IconTile>{stock.symbol.slice(0, 3)}</IconTile>}
                    title={
                      <span className="flex items-center gap-2">
                        <span className="font-mono">{stock.symbol}</span>
                        <span className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-1.5 py-px text-[10px] font-medium text-[var(--text-secondary)]">
                          {stock.exchange}
                        </span>
                      </span>
                    }
                    subtitle={stock.companyName}
                    right={
                      <div className="flex shrink-0 items-center gap-2.5">
                        {stock.price > 0 && (
                          <div className="text-right font-mono">
                            <div className="text-xs font-bold text-[var(--positive)]">
                              ₹{stock.price.toLocaleString('en-IN')}
                            </div>
                            <div className="text-[9px] text-[var(--text-muted)]">LTP</div>
                          </div>
                        )}
                        <span className="rounded-md bg-[var(--brand-soft)] px-2 py-1 text-[11px] font-semibold text-[var(--brand-primary)]">
                          + Add
                        </span>
                      </div>
                    }
                  />
                );
              })}
            </div>
          )}

          {/* Shortcuts / actions */}
          {filteredActions.length > 0 && (
            <div>
              <SectionLabel>{hasQuery ? 'Actions' : 'Quick shortcuts'}</SectionLabel>
              {filteredActions.map((action, idx) => {
                const globalIdx = portfolioMatches.length + searchResults.length + idx;
                const Icon = action.icon;
                const selected = selectedIndex === globalIdx;
                return (
                  <Row
                    key={action.id}
                    index={globalIdx}
                    selected={selected}
                    onClick={action.action}
                    onHover={() => setSelectedIndex(globalIdx)}
                    icon={
                      <IconTile>
                        <Icon className="h-4 w-4" />
                      </IconTile>
                    }
                    title={action.title}
                    subtitle={action.category}
                    right={
                      <ArrowRight
                        className={`h-4 w-4 shrink-0 transition-transform ${
                          selected ? 'translate-x-0.5 text-[var(--brand-primary)]' : 'text-[var(--text-muted)]'
                        }`}
                      />
                    }
                  />
                );
              })}
            </div>
          )}

          {noResults && (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <SearchX className="h-7 w-7 text-[var(--text-muted)]" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">No results for “{query.trim()}”</p>
              <p className="text-xs text-[var(--text-muted)]">
                Try a stock symbol like RELIANCE, or a command like “lock”.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2.5 text-[11px] text-[var(--text-muted)]">
          <div className="hidden items-center gap-4 sm:flex">
            <span className="flex items-center gap-1.5">
              <Kbd>↑↓</Kbd> Navigate
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>↵</Kbd> Select
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>Esc</Kbd> Close
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-wide text-[var(--text-primary)] sm:ml-auto">
            <img src="/logo-icon.svg" alt="" className="h-4 w-4 object-contain" />
            <span>
              STOCK<span className="text-[var(--brand-primary)]">PULSE</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
