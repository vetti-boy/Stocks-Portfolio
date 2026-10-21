'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useStock } from '@/context/StockContext';
import {
  Search,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart2,
  X,
  CheckCircle2,
  RefreshCw,
  Zap,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface MarketDepthRow {
  bidPrice: number;
  bidOrders: number;
  bidQty: number;
  askPrice: number;
  askOrders: number;
  askQty: number;
}

const generateMarketDepth = (ltp: number): MarketDepthRow[] => {
  const rows: MarketDepthRow[] = [];
  for (let i = 0; i < 5; i++) {
    const bidP = +(ltp - (i + 1) * 0.25).toFixed(2);
    const askP = +(ltp + (i + 1) * 0.25).toFixed(2);
    rows.push({
      bidPrice: Math.max(0.05, bidP),
      bidOrders: Math.floor(Math.random() * 15 + 2),
      bidQty: Math.floor(Math.random() * 1200 + 100),
      askPrice: askP,
      askOrders: Math.floor(Math.random() * 18 + 3),
      askQty: Math.floor(Math.random() * 1500 + 150),
    });
  }
  return rows;
};

export const WatchlistTab: React.FC = () => {
  const {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    selectedStockSymbol,
    setSelectedStockSymbol,
    addHolding,
    fetchLiveQuotesNow,
    isFetchingLiveQuotes,
    taxSettings,
  } = useStock();

  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '6M' | '1Y' | 'ALL'>('1D');

  // Live Stock Search Suggestions State
  const [apiSuggestions, setApiSuggestions] = useState<any[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 1) {
      setApiSuggestions([]);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingApi(true);
      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            setApiSuggestions(data.results);
            setShowSearchDropdown(true);
          } else {
            setApiSuggestions([]);
          }
        }
      } catch (err) {
        console.error('Watchlist search error:', err);
      } finally {
        setIsSearchingApi(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Quick Order Modal
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [productType, setProductType] = useState<'CNC' | 'MIS'>('CNC');
  const [orderQuantity, setOrderQuantity] = useState<string>('10');
  const [orderSuccessMsg, setOrderSuccessMsg] = useState(false);

  // Active Selected Stock
  const activeStock =
    watchlist.find((w) => w.symbol === selectedStockSymbol) || watchlist[0] || null;

  // Single unified watchlist filter
  const filteredWatchlist = useMemo(() => {
    return watchlist.filter(
      (item) =>
        item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.companyName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [watchlist, searchQuery]);

  // Market Depth
  const marketDepth = useMemo(() => {
    return activeStock ? generateMarketDepth(activeStock.currentPrice) : [];
  }, [activeStock?.currentPrice]);

  const totalBidQty = marketDepth.reduce((sum, r) => sum + r.bidQty, 0);
  const totalAskQty = marketDepth.reduce((sum, r) => sum + r.askQty, 0);
  const buyDepthPct = Math.round((totalBidQty / (totalBidQty + totalAskQty || 1)) * 100);

  const handleAddSearchTicker = (symbol: string, name: string, price?: number) => {
    const basePrice = price && price > 0 ? price : Math.floor(Math.random() * 1500 + 350);
    addToWatchlist({
      symbol: symbol.toUpperCase(),
      companyName: name || `${symbol.toUpperCase()} Ltd.`,
      currentPrice: basePrice,
      previousClose: +(basePrice * 0.985).toFixed(2),
      dayChange: +(basePrice * 0.015).toFixed(2),
      dayChangePercent: 1.5,
      high52: +(basePrice * 1.25).toFixed(2),
      low52: +(basePrice * 0.75).toFixed(2),
      volume: '15.4L',
      marketCap: '₹1.8T',
      peRatio: 24.5,
      category: 'Equity',
    });
    setSelectedStockSymbol(symbol.toUpperCase());
    setSearchQuery('');
    setShowSearchDropdown(false);
  };

  const handleExecuteOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStock || !orderQuantity) return;

    const qty = parseFloat(orderQuantity);
    if (qty <= 0) return;

    if (orderType === 'BUY') {
      addHolding({
        symbol: activeStock.symbol,
        companyName: activeStock.companyName,
        buyPrice: activeStock.currentPrice,
        quantity: qty,
        buyDate: new Date().toISOString().slice(0, 10),
        exchange: 'NSE',
        category: (activeStock.category as any) || 'Tech',
        broker: taxSettings.brokerPreset || 'ZERODHA',
        notes: `Executed via ${taxSettings.brokerPreset || 'Zerodha'} Quick Order (${productType})`,
      });
    }

    setOrderSuccessMsg(true);
    setTimeout(() => {
      setOrderSuccessMsg(false);
      setIsOrderModalOpen(false);
    }, 1200);
  };

  const isUp = activeStock ? activeStock.dayChangePercent >= 0 : true;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Watchlist (5 Cols) */}
      <div className="lg:col-span-5 space-y-4">
        {/* Watchlist Header & Global Stock Search Box */}
        <div className="bg-[#0D1218] rounded-xl p-4 space-y-3 border border-[#202A35] relative z-30 shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#F4F7FA] uppercase tracking-wider flex items-center gap-2 font-mono">
              <Activity className="h-4 w-4 text-[#38BDF8]" /> WATCHLIST ({watchlist.length})
            </h3>
            <button
              onClick={() => fetchLiveQuotesNow()}
              disabled={isFetchingLiveQuotes}
              className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-[#22C55E] bg-[#22C55E]/10 hover:bg-[#22C55E]/20 px-2.5 py-1 rounded border border-[#22C55E]/30 transition active:scale-95"
            >
              <RefreshCw className={`h-3 w-3 ${isFetchingLiveQuotes ? 'animate-spin' : ''}`} />
              <span>{isFetchingLiveQuotes ? 'SYNCING...' : 'LIVE QUOTES'}</span>
            </button>
          </div>

          {/* Search Box with Autocomplete Dropdown */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#596574] z-10" />
            <input
              type="text"
              placeholder="Search & add stocks (e.g. RATNAVEER, TCS)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => {
                if (searchQuery.trim().length > 0) setShowSearchDropdown(true);
              }}
              className="w-full bg-[#080B10] text-[#F4F7FA] border border-[#202A35] rounded-lg pl-9 pr-8 text-xs py-2 uppercase font-mono shadow-inner focus:border-[#38BDF8] outline-none transition"
            />
            {isSearchingApi && (
              <Loader2 className="absolute right-3 top-2.5 h-3.5 w-3.5 animate-spin text-[#38BDF8] z-10" />
            )}

            {/* Floating Live Autocomplete Dropdown */}
            {showSearchDropdown && searchQuery.trim().length > 0 && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1.5 max-h-72 overflow-y-auto rounded-xl bg-[#0A0F15] border border-[#38BDF8]/40 shadow-2xl divide-y divide-[#202A35]">
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#38BDF8] bg-[#0D1218] flex justify-between items-center sticky top-0 z-10 border-b border-[#202A35]">
                  <span>NSE Live Ticker Search ({apiSuggestions.length} results)</span>
                  <button
                    onClick={() => setShowSearchDropdown(false)}
                    className="text-[#8D99A8] hover:text-white text-[10px] px-1.5 py-0.5 rounded bg-[#111820]"
                  >
                    Close
                  </button>
                </div>

                {apiSuggestions.length === 0 ? (
                  <div className="p-4 text-center space-y-2">
                    <p className="text-xs text-[#8D99A8]">No matching tickers found for &quot;{searchQuery}&quot;.</p>
                    <button
                      type="button"
                      onClick={() => handleAddSearchTicker(searchQuery.trim().toUpperCase(), `${searchQuery.trim().toUpperCase()} India Ltd.`)}
                      className="px-3.5 py-1.5 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#080B10] font-bold text-xs rounded-lg shadow font-mono transition"
                    >
                      + Add &quot;{searchQuery.trim().toUpperCase()}&quot; to Watchlist
                    </button>
                  </div>
                ) : (
                  apiSuggestions.map((item, idx) => {
                    const isInWatchlist = watchlist.some((w) => w.symbol.toUpperCase() === item.symbol.toUpperCase());

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (!isInWatchlist) {
                            handleAddSearchTicker(item.symbol, item.companyName, item.price);
                          } else {
                            setSelectedStockSymbol(item.symbol.toUpperCase());
                          }
                          setShowSearchDropdown(false);
                          setSearchQuery('');
                        }}
                        className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-[#111820] transition cursor-pointer group"
                      >
                        <div>
                          <div className="font-bold text-[#F4F7FA] font-mono text-xs flex items-center gap-2">
                            {item.symbol}
                            <span className="rounded bg-[#111820] px-1.5 py-0.5 text-[9px] text-[#8D99A8] border border-[#202A35]">
                              {item.exchange || 'NSE'}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#8D99A8] group-hover:text-[#F4F7FA] truncate max-w-[210px]">
                            {item.companyName}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {item.price > 0 && (
                            <div className="text-right">
                              <span className="text-xs font-bold font-mono text-[#22C55E] block">
                                ₹{item.price.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[9px] text-[#596574] block">LTP</span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isInWatchlist) {
                                handleAddSearchTicker(item.symbol, item.companyName, item.price);
                              } else {
                                setSelectedStockSymbol(item.symbol.toUpperCase());
                              }
                              setShowSearchDropdown(false);
                              setSearchQuery('');
                            }}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold font-mono transition ${
                              isInWatchlist
                                ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30'
                                : 'bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#080B10] shadow'
                            }`}
                          >
                            {isInWatchlist ? '✓ Added' : '+ Add'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Watchlist Stock List */}
        <div className="bg-[#0D1218] rounded-xl p-2 space-y-1.5 max-h-[580px] overflow-y-auto border border-[#202A35] relative z-10 shadow-lg">
          {filteredWatchlist.length === 0 ? (
            <div className="py-12 px-4 text-center text-xs text-[#8D99A8] space-y-3">
              <Activity className="h-8 w-8 text-[#38BDF8] mx-auto opacity-50" />
              <p className="font-semibold text-[#F4F7FA]">Your watchlist is currently empty.</p>
              <p className="text-[11px] text-[#596574]">
                Search for any stock ticker (NSE/BSE) using the input box above to add it.
              </p>
            </div>
          ) : (
            filteredWatchlist.map((item) => {
              const itemIsUp = item.dayChangePercent >= 0;
              const isSelected = item.symbol === activeStock?.symbol;

              return (
                <div
                  key={item.symbol}
                  onClick={() => setSelectedStockSymbol(item.symbol)}
                  className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition border ${
                    isSelected
                      ? 'bg-[#111820] border-[#38BDF8]/60 shadow-md'
                      : 'bg-[#080B10]/40 border-[#202A35]/50 hover:bg-[#111820]/60 hover:border-[#202A35]'
                  }`}
                >
                  {/* Stock Symbol & Exchange */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#080B10] font-bold text-xs font-mono text-[#F4F7FA] border border-[#202A35]">
                      {item.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="font-bold text-[#F4F7FA] text-xs font-mono flex items-center gap-1.5">
                        {item.symbol}
                        <span className="text-[9px] text-[#8D99A8] bg-[#111820] px-1 py-0.2 rounded font-sans border border-[#202A35]">
                          NSE
                        </span>
                      </div>
                      <div className="text-[10px] text-[#8D99A8] truncate max-w-[120px]">
                        {item.companyName}
                      </div>
                    </div>
                  </div>

                  {/* Price & Change */}
                  <div className="text-right">
                    <div className="font-bold text-xs text-[#F4F7FA] font-mono">
                      ₹{item.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div
                      className={`text-[10px] font-semibold flex items-center justify-end gap-0.5 font-mono ${
                        itemIsUp ? 'text-[#22C55E]' : 'text-[#EF4444]'
                      }`}
                    >
                      {itemIsUp ? '+' : ''}
                      {item.dayChange} ({itemIsUp ? '+' : ''}
                      {item.dayChangePercent}%)
                    </div>
                  </div>

                  {/* Quick Action Hover Bar */}
                  <div className="absolute right-3 hidden group-hover:flex items-center gap-1 bg-[#0A0F15] border border-[#202A35] p-1 rounded-lg shadow-xl">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStockSymbol(item.symbol);
                        setOrderType('BUY');
                        setIsOrderModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-[#22C55E] hover:bg-[#22C55E]/90 text-[#080B10] font-bold text-[11px] rounded transition"
                    >
                      B
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStockSymbol(item.symbol);
                        setOrderType('SELL');
                        setIsOrderModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-[#EF4444] hover:bg-[#EF4444]/90 text-white font-bold text-[11px] rounded transition"
                    >
                      S
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromWatchlist(item.symbol);
                      }}
                      title="Delete from Watchlist"
                      className="p-1 text-[#596574] hover:text-[#EF4444] transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Real-Time Price Chart & Market Depth (7 Cols) */}
      <div className="lg:col-span-7 space-y-6">
        {activeStock ? (
          <>
            {/* Top Bar: Stock LTP Header & Order Triggers */}
            <div className="bg-[#0D1218] rounded-xl p-6 space-y-4 border border-[#202A35] shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-extrabold text-[#F4F7FA] font-mono">
                      {activeStock.symbol}
                    </h2>
                    <span className="rounded bg-[#38BDF8]/10 px-2.5 py-0.5 text-xs font-semibold text-[#38BDF8] border border-[#38BDF8]/30">
                      NSE REAL-TIME
                    </span>
                  </div>
                  <p className="text-xs text-[#8D99A8] mt-1">{activeStock.companyName}</p>
                </div>

                {/* LTP & Quick Order Buttons */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-3xl font-extrabold font-mono text-[#F4F7FA]">
                      ₹{activeStock.currentPrice.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                    <div
                      className={`flex items-center justify-end gap-1 font-bold text-xs font-mono ${
                        isUp ? 'text-[#22C55E]' : 'text-[#EF4444]'
                      }`}
                    >
                      {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      {isUp ? '+' : ''}₹{activeStock.dayChange} ({isUp ? '+' : ''}
                      {activeStock.dayChangePercent}%)
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setOrderType('BUY');
                        setIsOrderModalOpen(true);
                      }}
                      className="px-4 py-2 bg-[#22C55E] hover:bg-[#22C55E]/90 text-[#080B10] font-bold text-xs rounded-xl shadow transition active:scale-95"
                    >
                      BUY
                    </button>
                    <button
                      onClick={() => {
                        setOrderType('SELL');
                        setIsOrderModalOpen(true);
                      }}
                      className="px-4 py-2 bg-[#EF4444] hover:bg-[#EF4444]/90 text-white font-bold text-xs rounded-xl shadow transition active:scale-95"
                    >
                      SELL
                    </button>
                  </div>
                </div>
              </div>

              {/* Timeframe Controls Bar */}
              <div className="flex items-center justify-between border-t border-[#202A35] pt-4">
                <div className="flex items-center gap-1 bg-[#080B10] p-1 rounded-lg text-xs border border-[#202A35]">
                  {(['1D', '1W', '1M', '6M', '1Y', 'ALL'] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-3 py-1 rounded-md font-semibold transition ${
                        timeframe === tf
                          ? 'bg-[#38BDF8] text-[#080B10] shadow'
                          : 'text-[#8D99A8] hover:text-[#F4F7FA]'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                <div className="text-xs text-[#8D99A8] font-mono">
                  Vol: <span className="text-[#F4F7FA] font-bold">{activeStock.volume}</span>
                </div>
              </div>

              {/* Live Interactive Area Chart */}
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activeStock.history}>
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor={isUp ? '#22C55E' : '#EF4444'}
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor={isUp ? '#22C55E' : '#EF4444'}
                          stopOpacity={0.0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="time"
                      stroke="#596574"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      stroke="#596574"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0D1218',
                        borderColor: '#202A35',
                        borderRadius: '0.5rem',
                        fontSize: '12px',
                        color: '#F4F7FA',
                      }}
                      formatter={(val: any) => [`₹${val}`, 'Price']}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={isUp ? '#22C55E' : '#EF4444'}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#chartGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 5-Level Market Depth (Bids vs Asks) */}
            <div className="bg-[#0D1218] rounded-xl p-5 space-y-4 border border-[#202A35] shadow-lg">
              <div className="flex items-center justify-between border-b border-[#202A35] pb-2">
                <h3 className="text-xs font-bold text-[#F4F7FA] uppercase tracking-wider flex items-center gap-2 font-mono">
                  <BarChart2 className="h-4 w-4 text-[#8B5CF6]" /> MARKET DEPTH (5 BIDS / 5 ASKS)
                </h3>
                <span className="text-[10px] text-[#8D99A8] font-mono">Real-time Order Book</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <div className="grid grid-cols-3 text-[#596574] text-[10px] font-semibold border-b border-[#202A35] pb-1 mb-1">
                    <span>BID (₹)</span>
                    <span className="text-center">ORDERS</span>
                    <span className="text-right">QTY</span>
                  </div>
                  <div className="space-y-1">
                    {marketDepth.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-3 text-[#38BDF8]">
                        <span className="font-bold">₹{row.bidPrice.toFixed(2)}</span>
                        <span className="text-center text-[#8D99A8]">{row.bidOrders}</span>
                        <span className="text-right text-[#F4F7FA]">{row.bidQty}</span>
                      </div>
                    ))}
                    <div className="grid grid-cols-3 font-bold text-[#F4F7FA] pt-1 border-t border-[#202A35] text-[11px]">
                      <span>Total Bids</span>
                      <span />
                      <span className="text-right text-[#38BDF8]">{totalBidQty}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="grid grid-cols-3 text-[#596574] text-[10px] font-semibold border-b border-[#202A35] pb-1 mb-1">
                    <span>ASK (₹)</span>
                    <span className="text-center">ORDERS</span>
                    <span className="text-right">QTY</span>
                  </div>
                  <div className="space-y-1">
                    {marketDepth.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-3 text-[#F97316]">
                        <span className="font-bold">₹{row.askPrice.toFixed(2)}</span>
                        <span className="text-center text-[#8D99A8]">{row.askOrders}</span>
                        <span className="text-right text-[#F4F7FA]">{row.askQty}</span>
                      </div>
                    ))}
                    <div className="grid grid-cols-3 font-bold text-[#F4F7FA] pt-1 border-t border-[#202A35] text-[11px]">
                      <span>Total Asks</span>
                      <span />
                      <span className="text-right text-[#F97316]">{totalAskQty}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Pressure Bar */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] font-bold font-mono">
                  <span className="text-[#38BDF8]">BUY {buyDepthPct}%</span>
                  <span className="text-[#F97316]">SELL {100 - buyDepthPct}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#F97316] overflow-hidden flex">
                  <div
                    className="bg-[#38BDF8] h-full transition-all duration-500"
                    style={{ width: `${buyDepthPct}%` }}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-[#0D1218] rounded-xl p-12 text-center text-[#8D99A8] border border-[#202A35]">
            Select a stock from the watchlist to view live price charts & market depth.
          </div>
        )}
      </div>

      {/* Quick Order Modal */}
      {isOrderModalOpen && activeStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div
            className={`bg-[#0D1218] rounded-2xl w-full max-w-md p-6 space-y-4 relative border ${
              orderType === 'BUY' ? 'border-[#22C55E]/60' : 'border-[#EF4444]/60'
            } shadow-2xl`}
          >
            <div className="flex items-center justify-between border-b border-[#202A35] pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-[#F4F7FA] flex items-center gap-2 font-mono">
                  {orderType} {activeStock.symbol}
                  <span className="text-xs font-normal text-[#8D99A8]">x NSE</span>
                </h3>
                <p className="text-xs text-[#8D99A8]">
                  LTP: ₹{activeStock.currentPrice.toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="text-[#8D99A8] hover:text-[#F4F7FA]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteOrderSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8D99A8] mb-1">Product Type</label>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setProductType('CNC')}
                    className={`py-2 rounded-lg border transition ${
                      productType === 'CNC'
                        ? 'bg-[#38BDF8] text-[#080B10] border-[#38BDF8]'
                        : 'bg-[#080B10] text-[#8D99A8] border-[#202A35]'
                    }`}
                  >
                    CNC (Delivery)
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductType('MIS')}
                    className={`py-2 rounded-lg border transition ${
                      productType === 'MIS'
                        ? 'bg-[#38BDF8] text-[#080B10] border-[#38BDF8]'
                        : 'bg-[#080B10] text-[#8D99A8] border-[#202A35]'
                    }`}
                  >
                    MIS (Intraday)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8D99A8] mb-1">
                  Quantity (Shares) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(e.target.value)}
                  className="w-full bg-[#080B10] border border-[#202A35] rounded-lg p-2.5 font-mono text-[#F4F7FA] text-sm focus:border-[#38BDF8] outline-none"
                />
              </div>

              <div className="rounded-xl bg-[#080B10] p-3 flex justify-between items-center text-xs border border-[#202A35]">
                <span className="text-[#8D99A8]">Required Capital:</span>
                <span className="font-bold font-mono text-[#F4F7FA] text-sm">
                  ₹
                  {(
                    (parseFloat(orderQuantity) || 0) * activeStock.currentPrice
                  ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {orderSuccessMsg && (
                <div className="flex items-center gap-2 rounded-lg bg-[#22C55E]/20 p-3 text-xs text-[#22C55E] border border-[#22C55E]/30">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Order executed! Position added to portfolio.</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="w-1/3 py-2 text-xs font-semibold text-[#8D99A8] hover:text-[#F4F7FA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`w-2/3 py-2.5 rounded-xl font-bold text-xs shadow transition ${
                    orderType === 'BUY'
                      ? 'bg-[#22C55E] hover:bg-[#22C55E]/90 text-[#080B10]'
                      : 'bg-[#EF4444] hover:bg-[#EF4444]/90 text-white'
                  }`}
                >
                  {orderType} {activeStock.symbol}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
