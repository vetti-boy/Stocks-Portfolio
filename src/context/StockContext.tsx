'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { StockHolding, WatchlistItem, TaxSettings, PricePoint, TradeRecord, User } from '@/types/stock';
import { useAuth } from './AuthContext';
import { getIndianMarketStatus, MarketStatusInfo } from '@/utils/marketStatus';
import { calculateEquityDeliveryBrokerage } from '@/lib/brokerageCalculator';

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
  sellHolding: (
    id: string,
    sellPrice: number,
    sellQty: number,
    sellDate: string,
    customBuyDate?: string
  ) => void;
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

const StockContext = createContext<StockContextType | undefined>(undefined);

export const StockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [holdings, setHoldings] = useState<StockHolding[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>([]);
  const [taxSettings, setTaxSettings] = useState<TaxSettings>(DEFAULT_TAX_SETTINGS);
  const [isLiveTickerActive, setIsLiveTickerActive] = useState<boolean>(true);
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string>('');
  const [selectedCalculatorHoldingId, setSelectedCalculatorHoldingId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'encrypting' | 'offline'>('synced');
  const [isFetchingLiveQuotes, setIsFetchingLiveQuotes] = useState<boolean>(false);
  const [marketStatus, setMarketStatus] = useState<MarketStatusInfo>(getIndianMarketStatus());

  // Mutable refs to prevent race conditions during rapid state transitions
  const userRef = useRef(user);
  const holdingsRef = useRef<StockHolding[]>(holdings);
  const watchlistRef = useRef<WatchlistItem[]>(watchlist);
  const tradeHistoryRef = useRef<TradeRecord[]>(tradeHistory);
  const taxSettingsRef = useRef<TaxSettings>(taxSettings);

  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { holdingsRef.current = holdings; }, [holdings]);
  useEffect(() => { watchlistRef.current = watchlist; }, [watchlist]);
  useEffect(() => { tradeHistoryRef.current = tradeHistory; }, [tradeHistory]);
  useEffect(() => { taxSettingsRef.current = taxSettings; }, [taxSettings]);

  // Market status timer
  useEffect(() => {
    const timer = setInterval(() => {
      setMarketStatus(getIndianMarketStatus());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Helper to normalize and match stock symbols
  const isSymbolMatch = (sym1?: string, sym2?: string) => {
    if (!sym1 || !sym2) return false;
    const s1 = sym1.replace(/\.NS$/i, '').replace(/\.BO$/i, '').toUpperCase();
    const s2 = sym2.replace(/\.NS$/i, '').replace(/\.BO$/i, '').toUpperCase();
    return s1 === s2;
  };

  // Real-Time Quote Fetcher from Live API Server
  const fetchLiveQuotesNow = useCallback(async () => {
    const allSymbols = Array.from(
      new Set([
        ...watchlistRef.current.map((w) => w.symbol),
        ...holdingsRef.current.map((h) => h.symbol),
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
  }, []);

  // Periodic price polling every 15 seconds
  useEffect(() => {
    if (holdings.length === 0 && watchlist.length === 0) return;
    const interval = setInterval(fetchLiveQuotesNow, 15000);
    return () => clearInterval(interval);
  }, [fetchLiveQuotesNow, holdings.length, watchlist.length]);

  // Master persistence function: Saves to local cache immediately and syncs with MongoDB
  const persistPortfolio = async (
    nextHoldings: StockHolding[],
    nextWatchlist: WatchlistItem[],
    nextHistory: TradeRecord[],
    nextTax: TaxSettings,
    targetUser?: User | null
  ) => {
    const currentUser = targetUser || userRef.current || user;

    // 1. GUEST USER: Store ONLY in sessionStorage (in-memory tab cache, discarded once app/tab is closed)
    if (!currentUser || currentUser.isGuest) {
      if (typeof window !== 'undefined') {
        try {
          const payloadStr = JSON.stringify({
            holdings: nextHoldings,
            watchlist: nextWatchlist,
            tradeHistory: nextHistory,
            taxSettings: nextTax,
          });
          sessionStorage.setItem('stocks_guest_portfolio', payloadStr);
        } catch (e) {
          console.warn('SessionStorage save error:', e);
        }
      }
      setSyncStatus('synced');
      return; // Do NOT persist to localStorage or MongoDB Cloud Database
    }

    // 2. AUTHENTICATED USER: Instant Local Storage Persistence
    if (typeof window !== 'undefined') {
      try {
        const payloadStr = JSON.stringify({
          holdings: nextHoldings,
          watchlist: nextWatchlist,
          tradeHistory: nextHistory,
          taxSettings: nextTax,
        });

        localStorage.setItem(`stocks_user_data_${currentUser.id}`, payloadStr);
        if (currentUser.email) {
          localStorage.setItem(`stocks_user_data_${currentUser.email}`, payloadStr);
        }
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
    }

    // 3. Persist to MongoDB Cloud Database if user is an authenticated Google user
    setSyncStatus('encrypting');
    try {
      const res = await fetch('/api/user/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userEmail: currentUser.email,
          holdings: nextHoldings,
          watchlist: nextWatchlist,
          tradeHistory: nextHistory,
          taxSettings: nextTax,
        }),
      });

      if (res.ok) {
        setSyncStatus('synced');
      } else {
        setSyncStatus('offline');
      }
    } catch (err) {
      console.warn('Server database save error:', err);
      setSyncStatus('offline');
    }
  };

  // Synchronize portfolio state when user session loads or changes
  useEffect(() => {
    if (!user || user.isGuest) {
      // If Guest user, restore ONLY from temporary sessionStorage
      if (typeof window !== 'undefined') {
        try {
          const guestCached = sessionStorage.getItem('stocks_guest_portfolio');
          if (guestCached) {
            const parsed = JSON.parse(guestCached);
            if (Array.isArray(parsed.holdings)) setHoldings(parsed.holdings);
            if (Array.isArray(parsed.watchlist)) setWatchlist(parsed.watchlist);
            if (Array.isArray(parsed.tradeHistory)) setTradeHistory(parsed.tradeHistory);
            if (parsed.taxSettings) setTaxSettings(parsed.taxSettings);
          } else {
            setHoldings([]);
            setWatchlist([]);
            setTradeHistory([]);
            setTaxSettings(DEFAULT_TAX_SETTINGS);
          }
        } catch {
          // Ignored
        }
      }
      setSyncStatus('synced');
      return;
    }

    // 1. Instantly check local cache for this specific user so UI does not flicker
    let localCache: any = null;
    let guestCache: any = null;
    if (typeof window !== 'undefined') {
      try {
        const cached =
          localStorage.getItem(`stocks_user_data_${user.id}`) ||
          (user.email ? localStorage.getItem(`stocks_user_data_${user.email}`) : null);

        if (cached) {
          localCache = JSON.parse(cached);
          if (Array.isArray(localCache.holdings)) setHoldings(localCache.holdings);
          if (Array.isArray(localCache.watchlist)) setWatchlist(localCache.watchlist);
          if (Array.isArray(localCache.tradeHistory)) setTradeHistory(localCache.tradeHistory);
          if (localCache.taxSettings) setTaxSettings(localCache.taxSettings);
        }

        const guestRaw = localStorage.getItem('stocks_user_data_guest');
        if (guestRaw) guestCache = JSON.parse(guestRaw);
      } catch {
        // Ignored
      }
    }

    // 2. Fetch authentic data from MongoDB Atlas Cloud Database
    const syncWithCloud = async () => {
      setSyncStatus('encrypting');
      try {
        const queryParams = new URLSearchParams();
        if (user.id) queryParams.set('userId', user.id);
        if (user.email) queryParams.set('userEmail', user.email);

        const res = await fetch(`/api/user/data?${queryParams.toString()}`);
        const result = await res.json();

        if (result.success && result.data) {
          const cloudHoldings = Array.isArray(result.data.holdings) ? result.data.holdings : [];
          const cloudWatchlist = Array.isArray(result.data.watchlist) ? result.data.watchlist : [];
          const cloudHistory = Array.isArray(result.data.tradeHistory) ? result.data.tradeHistory : [];
          const cloudTax = result.data.taxSettings || DEFAULT_TAX_SETTINGS;

          holdingsRef.current = cloudHoldings;
          watchlistRef.current = cloudWatchlist;
          tradeHistoryRef.current = cloudHistory;
          taxSettingsRef.current = cloudTax;

          setHoldings(cloudHoldings);
          setWatchlist(cloudWatchlist);
          setTradeHistory(cloudHistory);
          setTaxSettings(cloudTax);

          if (typeof window !== 'undefined') {
            try {
              const payloadStr = JSON.stringify(result.data);
              localStorage.setItem(`stocks_user_data_${user.id}`, payloadStr);
              if (user.email) localStorage.setItem(`stocks_user_data_${user.email}`, payloadStr);
            } catch {
              // Ignored
            }
          }
          setSyncStatus('synced');
        } else {
          // Cloud has no data for this user.
          // If the user had locally cached data or guest data, upload it to the cloud now
          const fallbackData = localCache || guestCache;
          if (fallbackData && (fallbackData.holdings?.length > 0 || fallbackData.watchlist?.length > 0)) {
            const h = fallbackData.holdings || [];
            const w = fallbackData.watchlist || [];
            const t = fallbackData.tradeHistory || [];
            const tax = fallbackData.taxSettings || DEFAULT_TAX_SETTINGS;

            holdingsRef.current = h;
            watchlistRef.current = w;
            tradeHistoryRef.current = t;
            taxSettingsRef.current = tax;

            setHoldings(h);
            setWatchlist(w);
            setTradeHistory(t);
            setTaxSettings(tax);

            persistPortfolio(h, w, t, tax, user);
          } else {
            setHoldings([]);
            setWatchlist([]);
            setTradeHistory([]);
            setSyncStatus('synced');
          }
        }
      } catch (err) {
        console.warn('Cloud sync error:', err);
        setSyncStatus('offline');
      }
    };

    syncWithCloud();
  }, [user]);

  const toggleLiveTicker = () => setIsLiveTickerActive((prev) => !prev);

  const addHolding = (
    data: Omit<StockHolding, 'id' | 'currentPrice' | 'previousClose' | 'dayChangePercent'>
  ) => {
    const curHoldings = holdingsRef.current;
    const curWatchlist = watchlistRef.current;
    const curHistory = tradeHistoryRef.current;
    const curTax = taxSettingsRef.current;

    const matched = curWatchlist.find((w) => isSymbolMatch(w.symbol, data.symbol));
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
      buyDate: (data.buyDate && data.buyDate.trim()) || new Date().toISOString().slice(0, 10),
    };

    const nextHoldings = [newHolding, ...curHoldings];
    let nextWatchlist = curWatchlist;

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
      nextWatchlist = [...curWatchlist, newItem];
      watchlistRef.current = nextWatchlist;
      setWatchlist(nextWatchlist);
    }

    holdingsRef.current = nextHoldings;
    setHoldings(nextHoldings);
    persistPortfolio(nextHoldings, nextWatchlist, curHistory, curTax);

    setTimeout(() => {
      fetchLiveQuotesNow();
    }, 150);
  };

  const deleteHolding = (id: string) => {
    const nextHoldings = holdingsRef.current.filter((h) => h.id !== id);
    holdingsRef.current = nextHoldings;
    setHoldings(nextHoldings);
    persistPortfolio(nextHoldings, watchlistRef.current, tradeHistoryRef.current, taxSettingsRef.current);
  };

  const updateHolding = (id: string, updated: Partial<StockHolding>) => {
    const nextHoldings = holdingsRef.current.map((h) => (h.id === id ? { ...h, ...updated } : h));
    holdingsRef.current = nextHoldings;
    setHoldings(nextHoldings);
    persistPortfolio(nextHoldings, watchlistRef.current, tradeHistoryRef.current, taxSettingsRef.current);
  };

  const sellHolding = (
    id: string,
    sellPrice: number,
    sellQty: number,
    sellDate: string,
    customBuyDate?: string
  ) => {
    const targetHolding = holdingsRef.current.find((h) => h.id === id);
    if (!targetHolding) return;

    const qtyToSell = Math.min(sellQty, targetHolding.quantity);
    const validBuyDate =
      (customBuyDate && customBuyDate.trim()) ||
      (targetHolding.buyDate && targetHolding.buyDate.trim()) ||
      (sellDate && sellDate.trim()) ||
      new Date().toISOString().slice(0, 10);
    const validSellDate = (sellDate && sellDate.trim()) || new Date().toISOString().slice(0, 10);

    const buyTime = new Date(validBuyDate).getTime();
    const sellTime = new Date(validSellDate).getTime();
    const daysHeld = Math.max(0, Math.floor((sellTime - buyTime) / (1000 * 60 * 60 * 24)));
    const holdingMonths = daysHeld / 30;

    const hTaxSettings = {
      ...taxSettingsRef.current,
      brokerPreset: (targetHolding.broker || 'ZERODHA') as 'ZERODHA' | 'GROWW' | 'ANGELONE',
      exchange: (targetHolding.exchange || 'NSE') as 'NSE' | 'BSE',
    };

    const calc = calculateEquityDeliveryBrokerage({
      quantity: qtyToSell,
      buyPrice: targetHolding.buyPrice,
      sellPrice: sellPrice,
      holdingMonths,
      taxSettings: hTaxSettings,
      isMTF: targetHolding.isMTF,
      mtfMultiplier: targetHolding.mtfMultiplier,
      ownQuantity: targetHolding.ownQuantity ? Math.min(qtyToSell, targetHolding.ownQuantity) : undefined,
      mtfQuantity: targetHolding.mtfQuantity ? Math.min(qtyToSell, targetHolding.mtfQuantity) : undefined,
      mtfDays: daysHeld,
    });

    const buyCost = targetHolding.buyPrice * qtyToSell;
    const saleValue = sellPrice * qtyToSell;
    const grossPnL = saleValue - buyCost;
    const totalDeductions = calc.totalFees;
    const netRealizedPnL = calc.netPnL; // Net profit after all deductions & statutory charges
    const netRoiPercent = calc.netRoiPercent;

    const sellRecord: TradeRecord = {
      id: 'tr_sell_' + Date.now(),
      symbol: targetHolding.symbol,
      companyName: targetHolding.companyName,
      quantity: qtyToSell,
      buyDate: validBuyDate,
      buyPrice: targetHolding.buyPrice,
      price: sellPrice,
      sellDate: validSellDate,
      date: validSellDate,
      totalValue: saleValue,
      broker: targetHolding.broker,
      grossPnL: +grossPnL.toFixed(2),
      totalDeductions: +totalDeductions.toFixed(2),
      realizedPnL: +netRealizedPnL.toFixed(2),
      realizedPnLPercent: +netRoiPercent.toFixed(2),
      exchange: targetHolding.exchange,
      isMTF: targetHolding.isMTF,
      mtfMultiplier: targetHolding.mtfMultiplier,
      ownQuantity: targetHolding.ownQuantity,
      mtfQuantity: targetHolding.mtfQuantity,
      mtfDaysHeld: daysHeld,
      mtfInterestDeducted: +(calc.mtfInterestCost || 0).toFixed(2),
      mtfPledgeCharges: +(calc.mtfPledgeUnpledgeFee || 0).toFixed(2),
      deductionsBreakdown: {
        brokerage: +(calc.totalBrokerage || 0).toFixed(2),
        stt: +(calc.totalStt || 0).toFixed(2),
        exchangeTxn: +(calc.totalExchangeTxn || 0).toFixed(2),
        sebi: +(calc.totalSebi || 0).toFixed(2),
        gst: +(calc.totalGst || 0).toFixed(2),
        stampDuty: +(calc.stampDuty || 0).toFixed(2),
        dpCharges: +(calc.dpCharges || 0).toFixed(2),
        mtfInterest: +(calc.mtfInterestCost || 0).toFixed(2),
        mtfPledgeFee: +(calc.mtfPledgeUnpledgeFee || 0).toFixed(2),
      },
    };

    const nextHistory = [sellRecord, ...tradeHistoryRef.current];
    let nextHoldings: StockHolding[];
    if (qtyToSell >= targetHolding.quantity) {
      nextHoldings = holdingsRef.current.filter((h) => h.id !== id);
    } else {
      nextHoldings = holdingsRef.current.map((h) => (h.id === id ? { ...h, quantity: h.quantity - qtyToSell } : h));
    }

    tradeHistoryRef.current = nextHistory;
    holdingsRef.current = nextHoldings;

    setTradeHistory(nextHistory);
    setHoldings(nextHoldings);
    persistPortfolio(nextHoldings, watchlistRef.current, nextHistory, taxSettingsRef.current);
  };

  const deleteTradeRecord = (id: string) => {
    const nextHistory = tradeHistoryRef.current.filter((t) => t.id !== id);
    tradeHistoryRef.current = nextHistory;
    setTradeHistory(nextHistory);
    persistPortfolio(holdingsRef.current, watchlistRef.current, nextHistory, taxSettingsRef.current);
  };

  const addToWatchlist = (item: Omit<WatchlistItem, 'history'>) => {
    if (watchlistRef.current.some((w) => w.symbol === item.symbol)) return;
    const newItem: WatchlistItem = {
      ...item,
      history: generateHistory(item.currentPrice),
    };
    const nextWatchlist = [...watchlistRef.current, newItem];
    watchlistRef.current = nextWatchlist;
    setWatchlist(nextWatchlist);
    persistPortfolio(holdingsRef.current, nextWatchlist, tradeHistoryRef.current, taxSettingsRef.current);
  };

  const removeFromWatchlist = (symbol: string) => {
    const nextWatchlist = watchlistRef.current.filter((w) => w.symbol !== symbol);
    watchlistRef.current = nextWatchlist;
    setWatchlist(nextWatchlist);
    persistPortfolio(holdingsRef.current, nextWatchlist, tradeHistoryRef.current, taxSettingsRef.current);
  };

  const updateTaxSettings = (settings: Partial<TaxSettings>) => {
    const nextTax = { ...taxSettingsRef.current, ...settings };
    taxSettingsRef.current = nextTax;
    setTaxSettings(nextTax);
    persistPortfolio(holdingsRef.current, watchlistRef.current, tradeHistoryRef.current, nextTax);
  };

  const resetToDemoData = () => {
    holdingsRef.current = [];
    watchlistRef.current = [];
    tradeHistoryRef.current = [];
    taxSettingsRef.current = DEFAULT_TAX_SETTINGS;

    setHoldings([]);
    setWatchlist([]);
    setTradeHistory([]);
    setTaxSettings(DEFAULT_TAX_SETTINGS);
    persistPortfolio([], [], [], DEFAULT_TAX_SETTINGS);
  };

  const exportPortfolioJSON = () => {
    const data = JSON.stringify(
      {
        holdings: holdingsRef.current,
        watchlist: watchlistRef.current,
        tradeHistory: tradeHistoryRef.current,
        taxSettings: taxSettingsRef.current,
      },
      null,
      2
    );
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
      const nextHoldings = Array.isArray(parsed.holdings) ? parsed.holdings : [];
      const nextWatchlist = Array.isArray(parsed.watchlist) ? parsed.watchlist : [];
      const nextHistory = Array.isArray(parsed.tradeHistory) ? parsed.tradeHistory : [];
      const nextTax = parsed.taxSettings || DEFAULT_TAX_SETTINGS;

      holdingsRef.current = nextHoldings;
      watchlistRef.current = nextWatchlist;
      tradeHistoryRef.current = nextHistory;
      taxSettingsRef.current = nextTax;

      setHoldings(nextHoldings);
      setWatchlist(nextWatchlist);
      setTradeHistory(nextHistory);
      setTaxSettings(nextTax);

      persistPortfolio(nextHoldings, nextWatchlist, nextHistory, nextTax);
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
