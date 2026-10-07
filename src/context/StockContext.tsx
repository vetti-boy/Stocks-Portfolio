'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { StockHolding, WatchlistItem, TaxSettings, PricePoint, TradeRecord } from '@/types/stock';
import { useAuth } from './AuthContext';
import { getIndianMarketStatus, MarketStatusInfo } from '@/utils/marketStatus';

interface StockContextType {
  holdings: StockHolding[];
  watchlist: WatchlistItem[];
  tradeHistory: TradeRecord[];
  taxSettings: TaxSettings;
  isLiveTickerActive: boolean;
  toggleLiveTicker: () => void;
  addHolding: (holding: Omit<StockHolding, 'id' | 'currentPrice' | 'previousClose' | 'dayChangePercent'>) => void;
  deleteHolding: (id: string) => void;
  updateHolding: (id: string, updated: Partial<StockHolding>) => void;
  sellHolding: (id: string, sellPrice: number, sellQty: number, sellDate: string) => void;
  deleteTradeRecord: (id: string) => void;
  addToWatchlist: (item: Omit<WatchlistItem, 'history'>) => void;
  removeFromWatchlist: (symbol: string) => void;
  updateTaxSettings: (settings: Partial<TaxSettings>) => void;
  resetToDemoData: () => void;
  exportPortfolioJSON: () => void;
  importPortfolioJSON: (jsonString: string) => boolean;
  selectedStockSymbol: string;
  setSelectedStockSymbol: (symbol: string) => void;
  selectedCalculatorHoldingId: string | null;
  setSelectedCalculatorHoldingId: (id: string | null) => void;
  syncStatus: 'synced' | 'encrypting' | 'offline';
  fetchLiveQuotesNow: () => Promise<void>;
  isFetchingLiveQuotes: boolean;
  marketStatus: MarketStatusInfo;
}

const generateHistory = (basePrice: number): PricePoint[] => {
  const points: PricePoint[] = [];
  const hours = ['09:30', '10:30', '11:30', '12:30', '13:30', '14:30', '15:30', '16:00'];
  let current = basePrice * 0.97;

  hours.forEach((time) => {
    const delta = (Math.random() - 0.48) * (basePrice * 0.02);
    current = +(current + delta).toFixed(2);
    points.push({
      time,
      price: current,
      volume: Math.floor(Math.random() * 500000 + 100000),
    });
  });
  return points;
};

const INITIAL_HOLDINGS: StockHolding[] = [];

const DEMO_HOLDINGS: StockHolding[] = [];

const INITIAL_WATCHLIST: WatchlistItem[] = [];

const DEFAULT_TAX_SETTINGS: TaxSettings = {
  holdingPeriodMonths: 12,
  stcgRatePercent: 20.0,
  ltcgRatePercent: 12.5,
  ltcgExemptionLimit: 125000,
  flatBrokerageBuy: 20.0,
  flatBrokerageSell: 20.0,
  brokeragePercent: 0.03,
  stampDutyPercent: 0.015,
  sttPercent: 0.1,
  gstPercent: 18.0,
};

const INITIAL_TRADE_HISTORY: TradeRecord[] = [];

const StockContext = createContext<StockContextType | undefined>(undefined);

export const StockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [holdings, setHoldings] = useState<StockHolding[]>(INITIAL_HOLDINGS);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(INITIAL_WATCHLIST);
  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>(INITIAL_TRADE_HISTORY);
  const [taxSettings, setTaxSettings] = useState<TaxSettings>(DEFAULT_TAX_SETTINGS);
  const [isLiveTickerActive, setIsLiveTickerActive] = useState<boolean>(true);
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string>('');
  const [selectedCalculatorHoldingId, setSelectedCalculatorHoldingId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'encrypting' | 'offline'>('synced');
  const [isFetchingLiveQuotes, setIsFetchingLiveQuotes] = useState<boolean>(false);
  const [marketStatus, setMarketStatus] = useState<MarketStatusInfo>(getIndianMarketStatus());

  useEffect(() => {
    const timer = setInterval(() => {
      setMarketStatus(getIndianMarketStatus());
    }, 30000); // refresh every 30 seconds
    return () => clearInterval(timer);
  }, []);

  const storageKey = user ? `stocks_data_${user.id}` : 'stocks_data_guest';

  // Helper to normalize and match stock symbols (e.g. SOLARA.NS vs SOLARA)
  const isSymbolMatch = (sym1?: string, sym2?: string) => {
    if (!sym1 || !sym2) return false;
    const s1 = sym1.replace(/\.NS$/i, '').replace(/\.BO$/i, '').toUpperCase();
    const s2 = sym2.replace(/\.NS$/i, '').replace(/\.BO$/i, '').toUpperCase();
    return s1 === s2;
  };

  // Real-Time Quote Fetcher from Live API Server
  const fetchLiveQuotesNow = async () => {
    const allSymbols = Array.from(
      new Set([
        ...watchlist.map((w) => w.symbol),
        ...holdings.map((h) => h.symbol),
      ])
    );
    if (allSymbols.length === 0) return;
    setIsFetchingLiveQuotes(true);

    try {
      const symbolsString = allSymbols.join(',');
      const res = await fetch(`/api/stocks/quote?symbols=${encodeURIComponent(symbolsString)}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.quotes)) {
        setWatchlist((prevWatchlist) =>
          prevWatchlist.map((item) => {
            const liveMatch = data.quotes.find((q: any) =>
              isSymbolMatch(q.symbol, item.symbol) || isSymbolMatch(q.cleanSymbol, item.symbol)
            );

            if (liveMatch && liveMatch.currentPrice > 0) {
              const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const updatedHistory = [
                ...item.history.slice(1),
                { time: nowTime, price: liveMatch.currentPrice, volume: Math.floor(Math.random() * 20000 + 5000) },
              ];

              return {
                ...item,
                currentPrice: liveMatch.currentPrice,
                previousClose: liveMatch.previousClose || item.previousClose,
                dayChange: liveMatch.dayChange || item.dayChange,
                dayChangePercent: liveMatch.dayChangePercent || item.dayChangePercent,
                high52: liveMatch.high52 || item.high52,
                low52: liveMatch.low52 || item.low52,
                volume: liveMatch.volume || item.volume,
                marketCap: liveMatch.marketCap || item.marketCap,
                peRatio: liveMatch.peRatio || item.peRatio,
                history: updatedHistory,
              };
            }
            return item;
          })
        );

        // Also update live prices in holdings table
        setHoldings((prevHoldings) =>
          prevHoldings.map((h) => {
            const liveMatch = data.quotes.find((q: any) =>
              isSymbolMatch(q.symbol, h.symbol) || isSymbolMatch(q.cleanSymbol, h.symbol)
            );
            if (liveMatch && liveMatch.currentPrice > 0) {
              return {
                ...h,
                currentPrice: liveMatch.currentPrice,
                dayChangePercent: liveMatch.dayChangePercent || h.dayChangePercent,
              };
            }
            return h;
          })
        );
      }
    } catch (err) {
      console.warn('Live quote polling error:', err);
    } finally {
      setIsFetchingLiveQuotes(false);
    }
  };

  // Poll real-time stock prices every 15 seconds automatically for live market watching
  useEffect(() => {
    fetchLiveQuotesNow(); // Immediate initial fetch
    const interval = setInterval(fetchLiveQuotesNow, 15000);

    return () => clearInterval(interval);
  }, [watchlist.length, holdings.length]);

  const isCloudDataLoadedRef = useRef(false);

  // Helper to immediately persist data locally & to server database
  const saveDataImmediately = async (
    currentHoldings = holdings,
    currentWatchlist = watchlist,
    currentHistory = tradeHistory,
    currentTax = taxSettings
  ) => {
    if (!user) return;

    // 1. Instant Local Cache Save (synchronous)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          `stocks_user_data_${user.id}`,
          JSON.stringify({
            holdings: currentHoldings,
            watchlist: currentWatchlist,
            tradeHistory: currentHistory,
            taxSettings: currentTax,
          })
        );
      } catch {
        // Ignored
      }
    }

    // 2. Instant Server Database Save
    try {
      setSyncStatus('encrypting');
      await fetch('/api/user/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          holdings: currentHoldings,
          watchlist: currentWatchlist,
          tradeHistory: currentHistory,
          taxSettings: currentTax,
        }),
      });
      setSyncStatus('synced');
    } catch (err) {
      console.warn('Server database save error:', err);
      setSyncStatus('offline');
    }
  };

  // Load holdings from Local Session Cache & Server Database
  useEffect(() => {
    isCloudDataLoadedRef.current = false;
    setHoldings([]);
    setWatchlist([]);
    setTradeHistory([]);

    if (!user) return;

    // 1. Restore from Local Session Cache instantly so UI never displays empty state
    let cachedData: any = null;
    if (typeof window !== 'undefined') {
      try {
        const localCacheKey = `stocks_user_data_${user.id}`;
        const cached = localStorage.getItem(localCacheKey);
        if (cached) {
          cachedData = JSON.parse(cached);
          if (Array.isArray(cachedData.holdings)) setHoldings(cachedData.holdings);
          if (Array.isArray(cachedData.watchlist)) setWatchlist(cachedData.watchlist);
          if (Array.isArray(cachedData.tradeHistory)) setTradeHistory(cachedData.tradeHistory);
          if (cachedData.taxSettings) setTaxSettings(cachedData.taxSettings);
        }
      } catch {
        // Ignored
      }
    }

    // 2. Sync with Server Database
    const fetchCloudData = async () => {
      setSyncStatus('encrypting');
      try {
        const res = await fetch(`/api/user/data?userId=${user.id}`);
        const result = await res.json();
        if (result.success && result.data) {
          const cloudHoldings = Array.isArray(result.data.holdings) ? result.data.holdings : [];
          const cloudWatchlist = Array.isArray(result.data.watchlist) ? result.data.watchlist : [];
          const cloudHistory = Array.isArray(result.data.tradeHistory) ? result.data.tradeHistory : [];

          setHoldings(cloudHoldings);
          setWatchlist(cloudWatchlist);
          setTradeHistory(cloudHistory);
          if (result.data.taxSettings) setTaxSettings(result.data.taxSettings);

          // Update local session cache
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(`stocks_user_data_${user.id}`, JSON.stringify(result.data));
            } catch {
              // Ignored
            }
          }
        } else if (cachedData && (cachedData.holdings?.length > 0 || cachedData.watchlist?.length > 0)) {
          // If server returns no data but local storage has data, push local data to server
          saveDataImmediately(
            cachedData.holdings || [],
            cachedData.watchlist || [],
            cachedData.tradeHistory || [],
            cachedData.taxSettings || taxSettings
          );
        }
        setSyncStatus('synced');
      } catch (err) {
        console.warn('Server data fetch error:', err);
        setSyncStatus('offline');
      } finally {
        isCloudDataLoadedRef.current = true;
      }
    };

    fetchCloudData();
  }, [user]);

  const toggleLiveTicker = () => setIsLiveTickerActive((prev) => !prev);

  const addHolding = (
    data: Omit<StockHolding, 'id' | 'currentPrice' | 'previousClose' | 'dayChangePercent'>
  ) => {
    const matched = watchlist.find((w) => isSymbolMatch(w.symbol, data.symbol));
    const currentPrice = matched ? matched.currentPrice : data.buyPrice;
    const previousClose = matched ? matched.previousClose : data.buyPrice;
    const dayChangePercent = matched ? matched.dayChangePercent : 0;

    const newHolding: StockHolding = {
      ...data,
      id: 'hold_' + Date.now(),
      symbol: data.symbol.toUpperCase(),
      currentPrice,
      previousClose,
      dayChangePercent,
    };

    setHoldings((prev) => {
      const nextHoldings = [newHolding, ...prev];
      let nextWatchlist = watchlist;
      if (!matched) {
        const newItem: WatchlistItem = {
          symbol: data.symbol.toUpperCase(),
          companyName: data.companyName,
          currentPrice: data.buyPrice,
          previousClose: data.buyPrice,
          dayChange: 0,
          dayChangePercent: 0,
          high52: +(data.buyPrice * 1.2).toFixed(2),
          low52: +(data.buyPrice * 0.8).toFixed(2),
          volume: '1.2L',
          marketCap: '₹50,000Cr',
          peRatio: 22.5,
          category: data.category,
          history: generateHistory(data.buyPrice),
        };
        nextWatchlist = [...watchlist, newItem];
        setWatchlist(nextWatchlist);
      }
      saveDataImmediately(nextHoldings, nextWatchlist, tradeHistory, taxSettings);
      return nextHoldings;
    });

    setTimeout(() => {
      fetchLiveQuotesNow();
    }, 150);
  };

  const deleteHolding = (id: string) => {
    setHoldings((prev) => {
      const next = prev.filter((h) => h.id !== id);
      saveDataImmediately(next, watchlist, tradeHistory, taxSettings);
      return next;
    });
  };

  const updateHolding = (id: string, updated: Partial<StockHolding>) => {
    setHoldings((prev) => {
      const next = prev.map((h) => (h.id === id ? { ...h, ...updated } : h));
      saveDataImmediately(next, watchlist, tradeHistory, taxSettings);
      return next;
    });
  };

  const sellHolding = (id: string, sellPrice: number, sellQty: number, sellDate: string) => {
    const targetHolding = holdings.find((h) => h.id === id);
    if (!targetHolding) return;

    const qtyToSell = Math.min(sellQty, targetHolding.quantity);
    const buyCost = targetHolding.buyPrice * qtyToSell;
    const saleValue = sellPrice * qtyToSell;
    const realizedPnL = saleValue - buyCost;
    const realizedPnLPercent = buyCost > 0 ? (realizedPnL / buyCost) * 100 : 0;

    const sellRecord: TradeRecord = {
      id: 'tr_sell_' + Date.now(),
      symbol: targetHolding.symbol,
      companyName: targetHolding.companyName,
      type: 'SELL',
      quantity: qtyToSell,
      buyPrice: targetHolding.buyPrice,
      price: sellPrice,
      totalValue: saleValue,
      date: sellDate || new Date().toISOString().slice(0, 10),
      broker: targetHolding.broker,
      realizedPnL: +realizedPnL.toFixed(2),
      realizedPnLPercent: +realizedPnLPercent.toFixed(2),
      exchange: targetHolding.exchange,
    };

    const nextHistory = [sellRecord, ...tradeHistory];
    setTradeHistory(nextHistory);

    setHoldings((prev) => {
      let nextHoldings: StockHolding[];
      if (qtyToSell >= targetHolding.quantity) {
        nextHoldings = prev.filter((h) => h.id !== id);
      } else {
        nextHoldings = prev.map((h) => (h.id === id ? { ...h, quantity: h.quantity - qtyToSell } : h));
      }
      saveDataImmediately(nextHoldings, watchlist, nextHistory, taxSettings);
      return nextHoldings;
    });
  };

  const deleteTradeRecord = (id: string) => {
    setTradeHistory((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveDataImmediately(holdings, watchlist, next, taxSettings);
      return next;
    });
  };

  const addToWatchlist = (item: Omit<WatchlistItem, 'history'>) => {
    if (watchlist.some((w) => w.symbol === item.symbol)) return;
    const newItem: WatchlistItem = {
      ...item,
      history: generateHistory(item.currentPrice),
    };
    setWatchlist((prev) => {
      const next = [...prev, newItem];
      saveDataImmediately(holdings, next, tradeHistory, taxSettings);
      return next;
    });
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist((prev) => {
      const next = prev.filter((w) => w.symbol !== symbol);
      saveDataImmediately(holdings, next, tradeHistory, taxSettings);
      return next;
    });
  };

  const updateTaxSettings = (settings: Partial<TaxSettings>) => {
    setTaxSettings((prev) => {
      const next = { ...prev, ...settings };
      saveDataImmediately(holdings, watchlist, tradeHistory, next);
      return next;
    });
  };

  const resetToDemoData = () => {
    setHoldings([]);
    setWatchlist([]);
    setTradeHistory([]);
    setTaxSettings(DEFAULT_TAX_SETTINGS);
    saveDataImmediately([], [], [], DEFAULT_TAX_SETTINGS);
  };

  const exportPortfolioJSON = () => {
    const data = JSON.stringify({ holdings, watchlist, tradeHistory, taxSettings }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stocks_portfolio_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importPortfolioJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.holdings)) setHoldings(parsed.holdings);
      if (Array.isArray(parsed.watchlist)) setWatchlist(parsed.watchlist);
      if (Array.isArray(parsed.tradeHistory)) setTradeHistory(parsed.tradeHistory);
      if (parsed.taxSettings) setTaxSettings(parsed.taxSettings);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <StockContext.Provider
      value={{
        holdings,
        watchlist,
        tradeHistory,
        taxSettings,
        isLiveTickerActive,
        toggleLiveTicker,
        addHolding,
        deleteHolding,
        updateHolding,
        sellHolding,
        deleteTradeRecord,
        addToWatchlist,
        removeFromWatchlist,
        updateTaxSettings,
        resetToDemoData,
        exportPortfolioJSON,
        importPortfolioJSON,
        selectedStockSymbol,
        setSelectedStockSymbol,
        selectedCalculatorHoldingId,
        setSelectedCalculatorHoldingId,
        syncStatus,
        fetchLiveQuotesNow,
        isFetchingLiveQuotes,
        marketStatus,
      }}
    >
      {children}
    </StockContext.Provider>
  );
};

export const useStock = () => {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
};
