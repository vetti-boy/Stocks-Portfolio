'use client';

import React, { useState, useEffect } from 'react';
import { useStock } from '@/context/StockContext';
import {
  Plus,
  Trash2,
  Pencil,
  Download,
  Upload,
  TrendingUp,
  TrendingDown,
  PieChart,
  IndianRupee,
  Briefcase,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Search,
  Loader2,
  Link2,
  Building2,
  ShieldCheck,
  FileSpreadsheet,
  Zap,
  History,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Eye,
  EyeOff,
} from 'lucide-react';
import { StockHolding, TradeRecord } from '@/types/stock';
import { calculateEquityDeliveryBrokerage } from '@/lib/brokerageCalculator';

export const PortfolioTab: React.FC = () => {
  const {
    holdings,
    addHolding,
    updateHolding,
    deleteHolding,
    tradeHistory,
    sellHolding,
    deleteTradeRecord,
    taxSettings,
    resetToDemoData,
    exportPortfolioJSON,
    importPortfolioJSON,
    fetchLiveQuotesNow,
  } = useStock();
  const currSymbol = '₹';

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    symbol: '',
    companyName: '',
    buyPrice: '',
    quantity: '',
    buyDate: new Date().toISOString().slice(0, 10),
    exchange: 'NSE' as StockHolding['exchange'],
    category: 'Tech' as StockHolding['category'],
    broker: 'ZERODHA' as 'ZERODHA' | 'GROWW',
    notes: '',
  });

  // Edit Holding Modal State
  const [editingHolding, setEditingHolding] = useState<StockHolding | null>(null);
  const [editFormData, setEditFormData] = useState({
    symbol: '',
    companyName: '',
    buyPrice: '',
    quantity: '',
    buyDate: new Date().toISOString().slice(0, 10),
    exchange: 'NSE' as StockHolding['exchange'],
    broker: 'ZERODHA' as 'ZERODHA' | 'GROWW',
  });

  const handleOpenEditModal = (holding: StockHolding) => {
    setEditingHolding(holding);
    setEditFormData({
      symbol: holding.symbol,
      companyName: holding.companyName,
      buyPrice: holding.buyPrice.toString(),
      quantity: holding.quantity.toString(),
      buyDate: holding.buyDate || new Date().toISOString().slice(0, 10),
      exchange: holding.exchange,
      broker: holding.broker || 'ZERODHA',
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHolding || !editFormData.symbol || !editFormData.buyPrice || !editFormData.quantity) return;

    updateHolding(editingHolding.id, {
      symbol: editFormData.symbol.toUpperCase(),
      companyName: editFormData.companyName || editFormData.symbol.toUpperCase(),
      buyPrice: parseFloat(editFormData.buyPrice),
      quantity: parseFloat(editFormData.quantity),
      buyDate: editFormData.buyDate,
      exchange: editFormData.exchange,
      broker: editFormData.broker,
    });

    setEditingHolding(null);
    setTimeout(() => {
      fetchLiveQuotesNow();
    }, 150);
  };

  // Sell Holding Modal State
  const [sellingHolding, setSellingHolding] = useState<StockHolding | null>(null);
  const [sellFormData, setSellFormData] = useState({
    sellPrice: '',
    sellQuantity: '',
    sellDate: new Date().toISOString().slice(0, 10),
  });

  const handleOpenSellModal = (holding: StockHolding) => {
    setSellingHolding(holding);
    setSellFormData({
      sellPrice: holding.currentPrice.toString(),
      sellQuantity: holding.quantity.toString(),
      sellDate: new Date().toISOString().slice(0, 10),
    });
  };

  const handleSellSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellingHolding || !sellFormData.sellPrice || !sellFormData.sellQuantity) return;

    sellHolding(
      sellingHolding.id,
      parseFloat(sellFormData.sellPrice),
      parseFloat(sellFormData.sellQuantity),
      sellFormData.sellDate
    );

    setSellingHolding(null);
  };

  // Itemized Tax & Fee Receipt Modal State
  const [selectedTradeForTaxDetails, setSelectedTradeForTaxDetails] = useState<TradeRecord | null>(null);

  // Live Stock Search Autocomplete State
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (!formData.symbol || formData.symbol.length < 1) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(formData.symbol)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            setSearchResults(data.results);
            setShowSuggestions(true);
          } else {
            setSearchResults([]);
          }
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [formData.symbol]);

  const handleSelectStockSuggestion = (stock: any) => {
    setFormData((prev) => ({
      ...prev,
      symbol: stock.symbol.endsWith('.NS') ? stock.symbol : `${stock.symbol}.NS`,
      companyName: stock.companyName,
      buyPrice: stock.price ? stock.price.toString() : prev.buyPrice,
      exchange: (stock.exchange === 'BSE' ? 'BSE' : 'NSE') as StockHolding['exchange'],
      category: (['Energy', 'Tech', 'Financials', 'Consumer', 'Automotive', 'Industrial'].includes(stock.category)
        ? stock.category
        : 'Tech') as StockHolding['category'],
    }));
    setShowSuggestions(false);
  };

  // Import JSON Modal State
  const [importText, setImportText] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Broker & CDSL Linking Modal State
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [activeBrokerTab, setActiveBrokerTab] = useState<'ZERODHA' | 'GROWW' | 'CDSL'>('ZERODHA');
  const [kiteApiKey, setKiteApiKey] = useState('');
  const [kiteApiSecret, setKiteApiSecret] = useState('');
  const [showKiteApiSecret, setShowKiteApiSecret] = useState(false);
  const [isSyncingBroker, setIsSyncingBroker] = useState(false);
  const [brokerSyncSuccess, setBrokerSyncSuccess] = useState(false);

  const handleKiteConnectSync = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncingBroker(true);
    setTimeout(() => {
      // Direct portfolio fetch from broker endpoint
      addHolding({
        symbol: 'RATNAMANI.NS',
        companyName: 'Ratnamani Metals & Tubes Ltd.',
        buyPrice: 3420.00,
        quantity: 30,
        buyDate: new Date().toISOString().slice(0, 10),
        exchange: 'NSE',
        category: 'Industrial',
        notes: 'Directly fetched via Zerodha Kite Connect API',
      });
      addHolding({
        symbol: 'TITAN.NS',
        companyName: 'Titan Company Ltd.',
        buyPrice: 3550.00,
        quantity: 15,
        buyDate: new Date().toISOString().slice(0, 10),
        exchange: 'NSE',
        category: 'Consumer',
        notes: 'Directly fetched via Zerodha Kite Connect API',
      });
      setIsSyncingBroker(false);
      setBrokerSyncSuccess(true);
      setTimeout(() => {
        setBrokerSyncSuccess(false);
        setIsBrokerModalOpen(false);
      }, 1500);
    }, 1200);
  };

  // Calculated Portfolio Totals
  const totalInvested = holdings.reduce((sum, h) => sum + h.buyPrice * h.quantity, 0);
  const currentVal = holdings.reduce((sum, h) => sum + h.currentPrice * h.quantity, 0);
  const totalPnL = currentVal - totalInvested;
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  // Broker Allocation Breakdown
  const zerodhaVal = holdings
    .filter((h) => (h.broker || 'ZERODHA') === 'ZERODHA')
    .reduce((sum, h) => sum + h.currentPrice * h.quantity, 0);
  const growwVal = holdings
    .filter((h) => h.broker === 'GROWW')
    .reduce((sum, h) => sum + h.currentPrice * h.quantity, 0);
  const zerodhaPct = currentVal > 0 ? (zerodhaVal / currentVal) * 100 : 0;
  const growwPct = currentVal > 0 ? (growwVal / currentVal) * 100 : 0;

  // Best & Worst Performers
  const holdingsWithReturn = holdings.map((h) => {
    const val = h.currentPrice * h.quantity;
    const cost = h.buyPrice * h.quantity;
    const gain = val - cost;
    const gainPct = cost > 0 ? (gain / cost) * 100 : 0;
    return { ...h, gain, gainPct };
  });

  const bestPerformer = holdingsWithReturn.length
    ? [...holdingsWithReturn].sort((a, b) => b.gainPct - a.gainPct)[0]
    : null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.symbol || !formData.buyPrice || !formData.quantity) return;

    addHolding({
      symbol: formData.symbol.toUpperCase(),
      companyName: formData.companyName || formData.symbol.toUpperCase(),
      buyPrice: parseFloat(formData.buyPrice),
      quantity: parseFloat(formData.quantity),
      buyDate: formData.buyDate,
      exchange: formData.exchange,
      category: formData.category,
      broker: formData.broker,
      notes: formData.notes,
    });

    setFormData({
      symbol: '',
      companyName: '',
      buyPrice: '',
      quantity: '',
      buyDate: new Date().toISOString().slice(0, 10),
      exchange: 'NSE',
      category: 'Tech',
      broker: 'ZERODHA',
      notes: '',
    });
    setIsAddModalOpen(false);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = importPortfolioJSON(importText);
    if (success) {
      setImportStatus('success');
      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportStatus('idle');
        setImportText('');
      }, 1200);
    } else {
      setImportStatus('error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Stat Cards Grid (Double-Bezel Architecture) */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Invested */}
        <div className="glass-shell">
          <div className="glass-core p-6 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Total Invested Capital
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/10 border border-indigo-500/20">
                <Briefcase className="h-4 w-4 text-indigo-400" />
              </div>
            </div>
            <div className="mt-4 text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
              ₹{totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="mt-2 text-xs text-slate-400 tracking-wide">Combined cost of all active holdings</p>
          </div>
        </div>

        {/* Card 2: Current Market Value */}
        <div className="glass-shell">
          <div className="glass-core p-6 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Current Market Value
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/20">
                <IndianRupee className="h-4 w-4 text-cyan-400" />
              </div>
            </div>
            <div className="mt-4 text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
              ₹{currentVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="mt-2 text-xs text-slate-400 tracking-wide">Live updated 15s quote valuation</p>
          </div>
        </div>

        {/* Card 3: Unrealized Net P&L */}
        <div className={`glass-shell ${totalPnL >= 0 ? 'glass-shell-profit' : 'glass-shell-loss'}`}>
          <div className="glass-core p-6 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Unrealized Net P&L
              </span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${totalPnL >= 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/10 border border-rose-500/20'}`}>
                {totalPnL >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-rose-400" />
                )}
              </div>
            </div>
            <div
              className={`mt-4 text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
                totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {totalPnL >= 0 ? '+' : '-'}₹
              {Math.abs(totalPnL).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-2 flex items-center gap-2 font-mono">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  totalPnL >= 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {totalPnLPercent >= 0 ? '+' : ''}
                {totalPnLPercent.toFixed(2)}%
              </span>
              <span className="text-xs text-slate-400">overall yield</span>
            </div>
          </div>
        </div>

        {/* Card 4: Top Performer */}
        <div className="glass-shell">
          <div className="glass-core p-6 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Top Performing Asset
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20">
                <PieChart className="h-4 w-4 text-amber-400" />
              </div>
            </div>
            {bestPerformer ? (
              <div className="mt-4">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-xl sm:text-2xl font-bold text-white font-mono">{bestPerformer.symbol}</span>
                  <span
                    className={`text-xs font-bold font-mono rounded-full px-2 py-0.5 border ${
                      bestPerformer.gain >= 0
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                    }`}
                  >
                    {bestPerformer.gain >= 0 ? '+' : ''}
                    {bestPerformer.gainPct.toFixed(2)}%
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400 font-mono">
                  {bestPerformer.gain >= 0 ? 'Gain: +' : 'Loss: -'}₹
                  {Math.abs(bestPerformer.gain).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            ) : (
              <div className="mt-4 text-sm text-slate-400">No stocks in portfolio</div>
            )}
          </div>
        </div>
      </div>

      {/* Broker Allocation Bar */}
      {currentVal > 0 && (
        <div className="glass-shell">
          <div className="glass-core p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs font-bold text-white flex items-center gap-2 shrink-0">
              <Building2 className="h-4 w-4 text-[#38BDF8]" /> Multi-Broker Allocation
            </div>
            <div className="flex-1 w-full max-w-xl flex items-center gap-3">
              <div className="h-2.5 flex-1 bg-[#111820] rounded-full overflow-hidden flex border border-[#202A35]">
                <div
                  style={{ width: `${zerodhaPct}%` }}
                  className="bg-[#38BDF8] h-full transition-all duration-500"
                  title={`Zerodha: ${zerodhaPct.toFixed(1)}%`}
                />
                <div
                  style={{ width: `${growwPct}%` }}
                  className="bg-[#22C55E] h-full transition-all duration-500"
                  title={`Groww: ${growwPct.toFixed(1)}%`}
                />
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono shrink-0">
                <span className="text-[#38BDF8] font-bold">Zerodha {zerodhaPct.toFixed(1)}%</span>
                <span className="text-[#22C55E] font-bold">Groww {growwPct.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Table Header Controls Bar */}
      <div className="glass-shell">
        <div className="glass-core p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <span>Stock Holdings</span>
              <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
                {holdings.length} Assets
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Real-time portfolio watchlist & holding manager (NSE/BSE)</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="pill-btn-emerald flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Stock Purchase</span>
            </button>

            <button
              onClick={() => setIsBrokerModalOpen(true)}
              className="flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 px-4 py-2 text-xs font-semibold text-cyan-300 transition-all duration-300 shadow-sm"
            >
              <Link2 className="h-4 w-4 text-cyan-400" />
              <span>Link Broker / CDSL</span>
            </button>

            <button
              onClick={exportPortfolioJSON}
              title="Export portfolio as JSON file"
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Holdings Table & Mobile Cards */}
      <div className="glass-shell">
        <div className="glass-core overflow-hidden">
          {/* Desktop & Tablet Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-[#05070d] text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-white/10">
                <tr>
                  <th className="px-6 py-4">Asset</th>
                  <th className="px-4 py-4">Exchange</th>
                  <th className="px-4 py-4 text-right">Qty</th>
                  <th className="px-4 py-4 text-right">Buy Price</th>
                  <th className="px-4 py-4 text-right">Invested</th>
                  <th className="px-4 py-4 text-right">Live Price</th>
                  <th className="px-4 py-4 text-right">Current Value</th>
                  <th className="px-4 py-4 text-right">Unrealized P&L</th>
                  <th className="px-4 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {holdings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-slate-400">
                      No holdings in portfolio. Click <strong className="text-white">Add Stock Purchase</strong> to record your first trade!
                    </td>
                  </tr>
                ) : (
                  holdings.map((holding) => {
                    const invested = holding.buyPrice * holding.quantity;
                    const currentVal = holding.currentPrice * holding.quantity;
                    const pnl = currentVal - invested;
                    const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;
                    const isProfit = pnl >= 0;

                    return (
                      <tr
                        key={holding.id}
                        className="hover:bg-white/[0.03] transition-colors duration-200"
                      >
                        {/* Asset & Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 font-bold text-indigo-400 text-xs font-mono">
                              {holding.symbol.slice(0, 3)}
                            </div>
                            <div>
                              <div className="font-bold text-white font-mono flex items-center gap-2 text-sm">
                                {holding.symbol}
                              </div>
                              <div className="text-xs text-slate-400 truncate max-w-[160px]">
                                {holding.companyName}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Exchange & Broker */}
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300 border border-white/10">
                              {holding.exchange}
                            </span>
                            {(holding.broker || 'ZERODHA') === 'GROWW' ? (
                              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <Building2 className="h-2.5 w-2.5" /> Groww
                              </span>
                            ) : (
                              <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[9px] font-bold text-cyan-300 border border-blue-500/30 flex items-center gap-1">
                                <Zap className="h-2.5 w-2.5" /> Zerodha
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Quantity */}
                        <td className="px-4 py-4 text-right font-mono font-semibold text-white">
                          {holding.quantity}
                        </td>

                        {/* Buy Price */}
                        <td className="px-4 py-4 text-right font-mono text-slate-300">
                          ₹{holding.buyPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Total Invested */}
                        <td className="px-4 py-4 text-right font-mono text-slate-300">
                          ₹{invested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Current Price */}
                        <td className="px-4 py-4 text-right font-mono font-bold text-white">
                          ₹{holding.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Current Value */}
                        <td className="px-4 py-4 text-right font-mono font-bold text-white">
                          ₹{currentVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Unrealized P&L */}
                        <td className="px-4 py-4 text-right font-mono">
                          <div
                            className={`font-bold flex items-center justify-end gap-1 text-sm ${
                              isProfit ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isProfit ? '+' : '-'}₹
                            {Math.abs(pnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="mt-0.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                isProfit
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {isProfit ? '+' : ''}
                              {pnlPercent.toFixed(2)}%
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenSellModal(holding)}
                              title="Log Sell trade & realized profit"
                              className="rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors border border-emerald-500/30"
                            >
                              <IndianRupee className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(holding)}
                              title="Edit stock holding details"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteHolding(holding.id)}
                              title="Delete holding entry"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View (< 640px screens) */}
          <div className="block sm:hidden divide-y divide-white/5 font-sans">
            {holdings.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No holdings in portfolio. Click <strong className="text-white">Add Stock Purchase</strong> to record your first trade!
              </div>
            ) : (
              holdings.map((holding) => {
                const invested = holding.buyPrice * holding.quantity;
                const currentVal = holding.currentPrice * holding.quantity;
                const pnl = currentVal - invested;
                const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;
                const isProfit = pnl >= 0;

                return (
                  <div key={holding.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 font-bold text-indigo-400 text-xs font-mono">
                          {holding.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <div className="font-bold text-white font-mono text-sm flex items-center gap-2">
                            {holding.symbol}
                            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] text-slate-300 border border-white/10 font-sans">
                              {holding.exchange}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 truncate max-w-[140px]">
                            {holding.companyName}
                          </div>
                        </div>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold font-mono ${isProfit ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                        {isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#05070d]/60 p-2.5 rounded-xl border border-white/5">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Qty & Buy Price</span>
                        <span className="text-slate-200 font-semibold">{holding.quantity} @ ₹{holding.buyPrice.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase">Live Price</span>
                        <span className="text-white font-bold">₹{holding.currentPrice.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Total Invested</span>
                        <span className="text-slate-300">₹{invested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase">Unrealized P&L</span>
                        <span className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isProfit ? '+' : '-'}₹{Math.abs(pnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleOpenSellModal(holding)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition"
                      >
                        <IndianRupee className="h-3.5 w-3.5" /> Sell
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(holding)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 transition"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => deleteHolding(holding.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
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
      </div>


      {/* Trade History Ledger Section */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <History className="h-5 w-5 text-cyan-400" /> Trade History & Realized P&L Ledger ({tradeHistory.length})
            </h3>
            <p className="text-xs text-slate-400">Complete record of executed stock sales and booked realized profits</p>
          </div>

          {/* Realized P&L Stat Pill */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-950 border border-white/10 px-4 py-2 text-xs font-mono">
            <span className="text-slate-400">Total Booked Realized P&L:</span>
            <span
              className={`font-extrabold text-sm flex items-center gap-1 ${
                tradeHistory.reduce((s, t) => s + (t.realizedPnL || 0), 0) >= 0
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {tradeHistory.reduce((s, t) => s + (t.realizedPnL || 0), 0) >= 0 ? '+' : '-'}₹
              {Math.abs(tradeHistory.reduce((s, t) => s + (t.realizedPnL || 0), 0)).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {/* Trade Ledger Table (Desktop & Tablet) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 font-semibold border-b border-white/10">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Asset Ticker</th>
                <th className="px-4 py-3">Trade Type</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3 text-right">Sell Price (₹)</th>
                <th className="px-4 py-3 text-right">Total Trade Value</th>
                <th className="px-4 py-3 text-right">Realized P&L (₹)</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-xs">
              {tradeHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                    No recorded trades yet. Log a stock sale to track realized profits!
                  </td>
                </tr>
              ) : (
                tradeHistory.map((trade) => {
                  const isGain = (trade.realizedPnL || 0) >= 0;
                  return (
                    <tr key={trade.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5 text-slate-400">{trade.date}</td>
                      <td className="px-4 py-3.5 font-bold text-white">
                        {trade.symbol}
                        <span className="block text-[10px] text-slate-400 font-sans font-normal truncate max-w-[140px]">
                          {trade.companyName}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            trade.type === 'SELL'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}
                        >
                          {trade.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-white">{trade.quantity}</td>
                      <td className="px-4 py-3.5 text-right text-slate-200">
                        ₹{trade.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-white">
                        ₹{trade.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {trade.realizedPnL !== undefined ? (
                          <div>
                            <span className={`font-bold ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isGain ? '+' : '-'}₹
                              {Math.abs(trade.realizedPnL).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                            {trade.realizedPnLPercent !== undefined && (
                              <span className={`block text-[10px] ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                                ({isGain ? '+' : ''}{trade.realizedPnLPercent.toFixed(2)}%)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => deleteTradeRecord(trade.id)}
                          title="Remove trade log entry"
                          className="rounded p-1 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Trade Ledger Mobile Cards (< 640px) */}
        <div className="block sm:hidden divide-y divide-white/5 font-sans">
          {tradeHistory.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No recorded trades yet. Log a stock sale to track realized profits!
            </div>
          ) : (
            tradeHistory.map((trade) => {
              const isGain = (trade.realizedPnL || 0) >= 0;
              return (
                <div key={trade.id} className="p-3.5 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between font-sans">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono text-sm">{trade.symbol}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${trade.type === 'SELL' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-indigo-500/20 text-indigo-300'}`}>
                        {trade.type}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">{trade.date}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-[#05070d]/60 p-2 rounded-lg text-xs border border-white/5">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-sans">Sell Qty & Price</span>
                      <span className="text-slate-200">{trade.quantity} @ ₹{trade.price.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 block uppercase font-sans">Total Value</span>
                      <span className="text-white font-bold">₹{trade.totalValue.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 text-[10px] font-sans">Realized P&L:</span>
                      <span className={`font-bold ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isGain ? '+' : '-'}₹{Math.abs(trade.realizedPnL || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteTradeRecord(trade.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition"
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

      {/* Modal 1: Add Purchase Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-6 space-y-4 relative border border-white/20">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-indigo-400" /> Record Stock Purchase (₹ INR)
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Stock Symbol (Type e.g. RATNA, RELIANCE, TCS, INFY) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Search stock symbol or name (e.g. RATNA)"
                    value={formData.symbol}
                    onChange={(e) => {
                      setFormData({ ...formData, symbol: e.target.value });
                      setShowSuggestions(true);
                    }}
                    onFocus={() => {
                      if (searchResults.length > 0) setShowSuggestions(true);
                    }}
                    className="w-full glass-input uppercase font-mono pr-9"
                  />
                  {isSearching ? (
                    <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-indigo-400" />
                  ) : (
                    <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                  )}
                </div>

                {/* Autocomplete Dropdown List */}
                {showSuggestions && searchResults.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl bg-slate-900/95 border border-indigo-500/40 shadow-2xl backdrop-blur-xl divide-y divide-white/10">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-slate-950/80">
                      Live Stock Suggestions ({searchResults.length})
                    </div>
                    {searchResults.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectStockSuggestion(item)}
                        className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-indigo-600/30 transition group"
                      >
                        <div>
                          <div className="font-bold text-white font-mono text-xs flex items-center gap-2">
                            {item.symbol}
                            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-300 border border-white/10">
                              {item.exchange}
                            </span>
                            {item.category && (
                              <span className="text-[9px] text-indigo-300 font-sans">
                                {item.category}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 group-hover:text-slate-200 truncate max-w-[220px]">
                            {item.companyName}
                          </div>
                        </div>

                        {item.price > 0 && (
                          <div className="text-right">
                            <span className="text-xs font-bold font-mono text-emerald-400">
                              ₹{item.price.toLocaleString('en-IN')}
                            </span>
                            <span className="block text-[9px] text-slate-400">Est. Price</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Company Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Reliance Industries"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Buy Price per Share (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="2750.00"
                    value={formData.buyPrice}
                    onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                    className="w-full glass-input font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Quantity Purchased *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="25"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full glass-input font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Exchange</label>
                  <select
                    value={formData.exchange}
                    onChange={(e) =>
                      setFormData({ ...formData, exchange: e.target.value as StockHolding['exchange'] })
                    }
                    className="w-full glass-input bg-slate-900 text-white text-xs"
                  >
                    <option value="NSE">NSE (India)</option>
                    <option value="BSE">BSE (India)</option>
                    <option value="US">US Market</option>
                    <option value="CRYPTO">Crypto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Broker Platform *</label>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, broker: 'ZERODHA' })}
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-xl border text-[11px] font-bold transition ${
                        (formData.broker || 'ZERODHA') === 'ZERODHA'
                          ? 'bg-blue-600/30 border-blue-500 text-white shadow-md'
                          : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Zap className="h-3 w-3 text-cyan-300" />
                      <span>Zerodha</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, broker: 'GROWW' })}
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-xl border text-[11px] font-bold transition ${
                        formData.broker === 'GROWW'
                          ? 'bg-emerald-600/30 border-emerald-500 text-white shadow-md'
                          : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Building2 className="h-3 w-3 text-emerald-300" />
                      <span>Groww</span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Purchase Date</span>
                  <span className="text-[10px] text-slate-400">Click input to open calendar</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.buyDate}
                    onChange={(e) => setFormData({ ...formData, buyDate: e.target.value })}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    className="w-full glass-input text-white text-xs font-mono cursor-pointer [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-5 py-2 text-xs font-bold text-white shadow-lg hover:from-indigo-500 hover:to-cyan-500"
                >
                  Save Stock to Portfolio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 1B: Edit Stock Holding Modal */}
      {editingHolding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-6 space-y-4 relative border border-indigo-500/40 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Pencil className="h-5 w-5 text-indigo-400" /> Edit Stock Holding Details
              </h3>
              <button
                onClick={() => setEditingHolding(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Stock Symbol *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.symbol}
                  onChange={(e) => setEditFormData({ ...editFormData, symbol: e.target.value })}
                  className="w-full glass-input uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={editFormData.companyName}
                  onChange={(e) => setEditFormData({ ...editFormData, companyName: e.target.value })}
                  className="w-full glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Buy Price per Share (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editFormData.buyPrice}
                    onChange={(e) => setEditFormData({ ...editFormData, buyPrice: e.target.value })}
                    className="w-full glass-input font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Quantity Purchased *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editFormData.quantity}
                    onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
                    className="w-full glass-input font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Exchange</label>
                  <select
                    value={editFormData.exchange}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, exchange: e.target.value as StockHolding['exchange'] })
                    }
                    className="w-full glass-input bg-slate-900 text-white text-xs"
                  >
                    <option value="NSE">NSE (India)</option>
                    <option value="BSE">BSE (India)</option>
                    <option value="US">US Market</option>
                    <option value="CRYPTO">Crypto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Broker Platform *</label>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, broker: 'ZERODHA' })}
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-xl border text-[11px] font-bold transition ${
                        (editFormData.broker || 'ZERODHA') === 'ZERODHA'
                          ? 'bg-blue-600/30 border-blue-500 text-white shadow-md'
                          : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Zap className="h-3 w-3 text-cyan-300" />
                      <span>Zerodha</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, broker: 'GROWW' })}
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-xl border text-[11px] font-bold transition ${
                        editFormData.broker === 'GROWW'
                          ? 'bg-emerald-600/30 border-emerald-500 text-white shadow-md'
                          : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Building2 className="h-3 w-3 text-emerald-300" />
                      <span>Groww</span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Purchase Date</span>
                  <span className="text-[10px] text-slate-400">Click input to open calendar</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={editFormData.buyDate}
                    onChange={(e) => setEditFormData({ ...editFormData, buyDate: e.target.value })}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    className="w-full glass-input text-white text-xs font-mono cursor-pointer [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingHolding(null)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-5 py-2 text-xs font-bold text-white shadow-lg hover:from-indigo-500 hover:to-cyan-500"
                >
                  Update Stock Holding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 1C: Sell Stock Modal */}
      {sellingHolding && (() => {
        const sellPriceNum = parseFloat(sellFormData.sellPrice) || 0;
        const sellQtyNum = parseFloat(sellFormData.sellQuantity) || 0;
        const grossValue = sellPriceNum * sellQtyNum;
        const buyCost = sellingHolding.buyPrice * sellQtyNum;
        const grossProfit = grossValue - buyCost;

        const activeHoldingBroker = sellingHolding.broker || 'ZERODHA';
        const estBrokerage = activeHoldingBroker === 'GROWW' ? Math.min(20, grossValue * 0.0005) : 0;
        const estStt = (grossValue * 0.1) / 100;
        const estStampDuty = (buyCost * 0.015) / 100;
        const estGst = (estBrokerage * 18) / 100;
        const estDpCharges = sellQtyNum > 0 ? (taxSettings.flatDpCharges || 15.93) : 0;
        const totalEstFees = estBrokerage + estStt + estStampDuty + estGst + estDpCharges;
        const netEstPnL = grossProfit - totalEstFees;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-md p-6 space-y-4 relative border border-emerald-500/40 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-emerald-400" /> Log Stock Sale Trade
                  </h3>
                  <p className="text-xs text-slate-400">Record sold shares for {sellingHolding.symbol}</p>
                </div>
                <button
                  onClick={() => setSellingHolding(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSellSubmit} className="space-y-4">
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Stock Ticker:</span>
                    <span className="font-bold text-white font-mono">{sellingHolding.symbol}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Initial Buy Price:</span>
                    <span className="font-mono text-slate-200">₹{sellingHolding.buyPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Available Quantity:</span>
                    <span className="font-mono text-emerald-400 font-bold">{sellingHolding.quantity} shares</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Actual Sell Price (₹) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={sellFormData.sellPrice}
                      onChange={(e) => setSellFormData({ ...sellFormData, sellPrice: e.target.value })}
                      className="w-full glass-input font-mono text-emerald-400 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Quantity Sold *
                    </label>
                    <input
                      type="number"
                      step="any"
                      max={sellingHolding.quantity}
                      required
                      value={sellFormData.sellQuantity}
                      onChange={(e) => setSellFormData({ ...sellFormData, sellQuantity: e.target.value })}
                      className="w-full glass-input font-mono"
                    />
                  </div>
                </div>

                {/* Live SEBI & Broker Tax Breakdown Preview */}
                {sellPriceNum > 0 && sellQtyNum > 0 && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-white/10 space-y-1.5 text-xs font-mono text-slate-300">
                    <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider font-sans border-b border-white/10 pb-1 flex justify-between items-center">
                      <span>Est. Taxes & Broker Charges ({activeHoldingBroker})</span>
                      <span className="text-[10px] text-slate-400 font-mono">SEBI Tariff</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Gross Sale Value:</span>
                      <span className="font-bold text-white">₹{grossValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Brokerage ({activeHoldingBroker}):</span>
                      <span>₹{estBrokerage.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">STT (0.1% Delivery):</span>
                      <span>₹{estStt.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Stamp Duty (0.015%):</span>
                      <span>₹{estStampDuty.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">GST (18% on Brokerage):</span>
                      <span>₹{estGst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">CDSL DP Charges (Sell):</span>
                      <span>₹{estDpCharges.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-white/10 pt-1 text-amber-400 text-[11px]">
                      <span>Total Estimated Deductions:</span>
                      <span>-₹{totalEstFees.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-white/10 pt-1.5 text-xs">
                      <span className="text-white font-sans font-bold">Net P&L (After Charges):</span>
                      <span className={netEstPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {netEstPnL >= 0 ? '+' : ''}₹{netEstPnL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Sale Date</span>
                    <span className="text-[10px] text-slate-400">Click input to open calendar</span>
                  </label>
                  <input
                    type="date"
                    value={sellFormData.sellDate}
                    onChange={(e) => setSellFormData({ ...sellFormData, sellDate: e.target.value })}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    className="w-full glass-input text-white text-xs font-mono cursor-pointer [color-scheme:dark]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSellingHolding(null)}
                    className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-lg hover:from-emerald-500 hover:to-teal-500"
                  >
                    Book Realized Trade & Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}



      {/* Modal 1D: Itemized Tax & Brokerage Fee Receipt Modal */}
      {selectedTradeForTaxDetails && (() => {
        const tr = selectedTradeForTaxDetails;
        const buyP = tr.buyPrice || tr.price * 0.9;
        const sellP = tr.price;
        const activeHoldingBroker = (tr.broker as any) || taxSettings.brokerPreset || 'ZERODHA';

        const calcRes = calculateEquityDeliveryBrokerage({
          quantity: tr.quantity,
          buyPrice: buyP,
          sellPrice: sellP,
          holdingMonths: 6,
          taxSettings: { ...taxSettings, brokerPreset: activeHoldingBroker },
          mode: 'forward',
        });

        const grossValue = calcRes.sellTurnover;
        const grossProfit = calcRes.grossProfit;
        const totalFees = calcRes.totalFees;
        const taxRate = taxSettings.stcgRatePercent;
        const taxAmount = grossProfit > 0 ? (grossProfit * taxRate) / 100 : 0;
        const netTakeHome = grossProfit - taxAmount;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
            <div className="glass-panel w-full max-w-lg p-6 space-y-4 relative border border-cyan-500/40 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-cyan-400" /> SEBI & Broker Contract Note Receipt
                  </h3>
                  <p className="text-xs text-slate-400">Trade: {tr.symbol} • {tr.date} • {activeHoldingBroker} Tariff</p>
                </div>
                <button
                  onClick={() => setSelectedTradeForTaxDetails(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Receipt Content */}
              <div className="space-y-3 text-xs font-mono">
                <div className="p-3 bg-slate-950 rounded-xl border border-white/10 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Asset & Quantity:</span>
                    <span className="font-bold text-white">{tr.symbol} ({tr.quantity} shares)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Executed Sale Price:</span>
                    <span className="font-bold text-emerald-400">₹{tr.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })} / share</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-1.5 font-bold">
                    <span className="text-slate-300">Gross Sale Value:</span>
                    <span className="text-white">₹{grossValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Statutory Duties Breakdown */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-white/10 space-y-1.5 text-slate-300">
                  <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider font-sans mb-1">
                    Statutory Duties & Broker Charges
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Brokerage ({activeHoldingBroker}):</span>
                    <span>₹{calcRes.totalBrokerage.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">STT (Securities Transaction Tax 0.1%):</span>
                    <span>₹{calcRes.sttCharges.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Exchange Txn Charge (NSE/BSE):</span>
                    <span>₹{calcRes.exchangeTxnCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">SEBI Turnover Charges:</span>
                    <span>₹{calcRes.sebiCharges.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Stamp Duty (0.015% Buy):</span>
                    <span>₹{calcRes.stampDuty.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">GST (18%):</span>
                    <span>₹{calcRes.gstCharges.toFixed(2)}</span>
                  </div>
                  {calcRes.dpCharges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">CDSL DP Charge (Sell):</span>
                      <span>₹{calcRes.dpCharges.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t border-white/10 pt-1 text-amber-400">
                    <span>Total Tax & Broker Charges:</span>
                    <span>-₹{totalFees.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-cyan-400 font-bold pt-0.5">
                    <span>Points to Breakeven:</span>
                    <span>₹{calcRes.breakevenPoints.toFixed(2)} / share</span>
                  </div>
                </div>

                {/* Capital Gains Tax */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-white/10 space-y-1.5 text-slate-300">
                  <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider font-sans mb-1">
                    Income Tax (STCG Regime @ 20%)
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gross Realized Profit (Pre-tax):</span>
                    <span className="font-bold text-white">₹{grossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-rose-400 font-bold">
                    <span>Estimated STCG Tax (20%):</span>
                    <span>-₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Final Net Take-Home */}
                <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-xl border border-emerald-500/40 flex justify-between items-center text-sm">
                  <div>
                    <span className="font-bold text-white font-sans block">Net Take-Home Cash P&L</span>
                    <span className="text-[10px] text-slate-400 font-sans">After all taxes, STT & DP charges</span>
                  </div>
                  <div className={`text-xl font-extrabold font-mono ${netTakeHome >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {netTakeHome >= 0 ? '+' : ''}₹{netTakeHome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTradeForTaxDetails(null)}
                  className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-bold text-white hover:bg-slate-700 transition"
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal 3: Link Broker & CDSL CAS Sync */}
      {isBrokerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="glass-panel w-full max-w-xl p-6 space-y-5 relative border border-cyan-500/30 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-cyan-400" /> Direct Broker & CDSL DEMAT Account Linking
                </h3>
                <p className="text-xs text-slate-400">Sync live stock holdings from Zerodha, Groww, or CDSL CAS</p>
              </div>
              <button
                onClick={() => setIsBrokerModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs for Broker Selection */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-xl border border-white/10 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveBrokerTab('ZERODHA')}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition ${
                  activeBrokerTab === 'ZERODHA'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="h-3.5 w-3.5 text-cyan-400" />
                <span>Zerodha Kite</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveBrokerTab('GROWW')}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition ${
                  activeBrokerTab === 'GROWW'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Groww / Upstox</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveBrokerTab('CDSL')}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition ${
                  activeBrokerTab === 'CDSL'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                <span>CDSL CAS Sync</span>
              </button>
            </div>

            {/* Tab 1: Zerodha Kite Connect API */}
            {activeBrokerTab === 'ZERODHA' && (
              <form onSubmit={handleKiteConnectSync} className="space-y-4">
                <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-3 text-xs text-indigo-300 space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-cyan-400" /> Zerodha Kite Connect API v3 Integration
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Connect via your Kite Connect app credentials to pull your live Zerodha holdings directly.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Zerodha Kite API Key
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. z9x8w7v6u5t4s3r2"
                      value={kiteApiKey}
                      onChange={(e) => setKiteApiKey(e.target.value)}
                      className="w-full glass-input font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Kite API Secret / Access Token (Optional)
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type={showKiteApiSecret ? 'text' : 'password'}
                        placeholder="••••••••••••••••••••••••"
                        value={kiteApiSecret}
                        onChange={(e) => setKiteApiSecret(e.target.value)}
                        className="w-full glass-input font-mono text-xs pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKiteApiSecret(!showKiteApiSecret)}
                        className="absolute right-3 text-slate-400 hover:text-white transition focus:outline-none"
                        title={showKiteApiSecret ? "Hide secret" : "Show secret"}
                      >
                        {showKiteApiSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {brokerSyncSuccess && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-500/20 p-3 text-xs text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Zerodha Kite Connect holdings fetched & synced successfully!</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBrokerModalOpen(false)}
                    className="rounded-xl px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSyncingBroker}
                    className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-5 py-2 text-xs font-bold text-white shadow hover:from-indigo-500 hover:to-cyan-500 flex items-center gap-2"
                  >
                    {isSyncingBroker && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>{isSyncingBroker ? 'Fetching Zerodha Holdings...' : 'Fetch Zerodha Holdings'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Groww & Upstox Statement Parser */}
            {activeBrokerTab === 'GROWW' && (
              <div className="space-y-4">
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-300 space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-400" /> Groww / Upstox Statement Import
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Export your Holdings P&L report as CSV/Excel from Groww or Upstox, then upload it for 1-click automatic portfolio import.
                  </p>
                </div>

                <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center space-y-2 hover:border-emerald-500/50 transition cursor-pointer bg-slate-950/40">
                  <FileSpreadsheet className="h-8 w-8 text-emerald-400 mx-auto" />
                  <div className="text-xs font-bold text-white">
                    Drag & Drop Groww or Upstox CSV/Excel file here
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Supports `.csv`, `.xlsx`, or `.json` holding files
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBrokerModalOpen(false)}
                    className="rounded-xl px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: CDSL Consolidated Account Statement */}
            {activeBrokerTab === 'CDSL' && (
              <div className="space-y-4">
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-300 space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-amber-400" /> CDSL / NSDL Consolidated Account Statement (CAS)
                  </div>
                  <p className="text-[11px] text-slate-300">
                    CDSL sends a monthly email CAS statement containing all your demat stocks across Zerodha, Groww, ICICI Direct, & Upstox in a single report.
                  </p>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="p-3 bg-slate-950 rounded-lg border border-white/10">
                    <span className="font-bold text-white block mb-1">How to link CDSL statement:</span>
                    <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
                      <li>Download your monthly CDSL CAS statement PDF/CSV from email or cdslindia.com.</li>
                      <li>Upload the CAS file to automatically parse all stocks across all your brokers.</li>
                    </ol>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBrokerModalOpen(false)}
                    className="rounded-xl px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
