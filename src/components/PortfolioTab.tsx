'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useStock } from '@/context/StockContext';
import {
  Plus,
  Trash2,
  Pencil,
  Download,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Search,
  Loader2,
  Building2,
  Zap,
  Sparkles,
  Briefcase,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  PieChart,
  HelpCircle,
  Calculator,
  History,
  FileText,
} from 'lucide-react';
import { StockHolding, TradeRecord } from '@/types/stock';
import { calculateEquityDeliveryBrokerage } from '@/lib/brokerageCalculator';

interface PortfolioTabProps {
  onOpenInCalculator?: (holdingId: string) => void;
}

export const PortfolioTab: React.FC<PortfolioTabProps> = ({ onOpenInCalculator }) => {
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
    setSelectedCalculatorHoldingId,
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
    broker: 'ZERODHA' as 'ZERODHA' | 'GROWW' | 'ANGELONE',
    notes: '',
    isMTF: false,
    ownQuantity: '',
    mtfQuantity: '',
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
    broker: 'ZERODHA' as 'ZERODHA' | 'GROWW' | 'ANGELONE',
    isMTF: false,
    ownQuantity: '',
    mtfQuantity: '',
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
      isMTF: !!holding.isMTF,
      ownQuantity: holding.ownQuantity !== undefined ? holding.ownQuantity.toString() : '',
      mtfQuantity: holding.mtfQuantity !== undefined ? holding.mtfQuantity.toString() : '',
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHolding || !editFormData.symbol || !editFormData.buyPrice || !editFormData.quantity) return;

    const totalQty = parseFloat(editFormData.quantity);
    const buyP = parseFloat(editFormData.buyPrice);
    const ownQ = editFormData.isMTF
      ? (editFormData.ownQuantity !== '' ? parseFloat(editFormData.ownQuantity) || 0 : totalQty * 0.25)
      : totalQty;
    const mtfQ = editFormData.isMTF
      ? (editFormData.mtfQuantity !== '' ? parseFloat(editFormData.mtfQuantity) || 0 : Math.max(0, totalQty - ownQ))
      : 0;

    updateHolding(editingHolding.id, {
      symbol: editFormData.symbol.toUpperCase(),
      companyName: editFormData.companyName || editFormData.symbol.toUpperCase(),
      buyPrice: buyP,
      quantity: totalQty,
      buyDate: editFormData.buyDate,
      exchange: editFormData.exchange,
      broker: editFormData.broker,
      isMTF: editFormData.isMTF,
      ownQuantity: ownQ,
      mtfQuantity: mtfQ,
      ownAmount: ownQ * buyP,
      mtfBorrowedAmount: mtfQ * buyP,
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

    const soldSymbol = sellingHolding.symbol;
    const soldQty = sellFormData.sellQuantity;
    sellHolding(
      sellingHolding.id,
      parseFloat(sellFormData.sellPrice),
      parseFloat(sellFormData.sellQuantity),
      sellFormData.sellDate
    );

    setSellingHolding(null);
    setSellSuccessNotice(`Marked ${soldQty} shares of ${soldSymbol} as sold! Transferred to Trade History.`);
    setTimeout(() => {
      setSellSuccessNotice(null);
    }, 6000);
  };

  // Itemized Tax & Fee Receipt Modal State
  const [selectedTradeForTaxDetails, setSelectedTradeForTaxDetails] = useState<TradeRecord | null>(null);

  // Live Stock Search Autocomplete State
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const isSuggestionSelectedRef = useRef(false);

  useEffect(() => {
    // If the symbol change was caused by selecting a suggestion, ignore and do not re-open suggestions
    if (isSuggestionSelectedRef.current) {
      isSuggestionSelectedRef.current = false;
      return;
    }

    if (!formData.symbol || formData.symbol.trim().length < 1) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(formData.symbol.trim())}`);
        if (res.ok) {
          const data = await res.json();
          // Check if selection happened while request was in-flight
          if (!isSuggestionSelectedRef.current && data.results && data.results.length > 0) {
            setSearchResults(data.results);
            setShowSuggestions(true);
          } else {
            setSearchResults([]);
            setShowSuggestions(false);
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
    isSuggestionSelectedRef.current = true;
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
    setSearchResults([]);
    setShowSuggestions(false);
  };

  // Import JSON Modal State
  const [importText, setImportText] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [sellSuccessNotice, setSellSuccessNotice] = useState<string | null>(null);

  // Download Trade History as CSV (Excel compatible)
  const handleDownloadTradeHistoryCSV = () => {
    if (tradeHistory.length === 0) return;
    const headers = [
      'Date',
      'Symbol',
      'Company Name',
      'Trade Type',
      'Exchange',
      'Broker',
      'Quantity',
      'Buy Price (INR)',
      'Sell Price (INR)',
      'Total Value (INR)',
      'Realized PnL (INR)',
      'Realized PnL (%)',
    ];

    const rows = tradeHistory.map((t) => [
      `"${t.date || ''}"`,
      `"${t.symbol || ''}"`,
      `"${(t.companyName || '').replace(/"/g, '""')}"`,
      `"${t.type || 'SELL'}"`,
      `"${t.exchange || 'NSE'}"`,
      `"${t.broker || 'ZERODHA'}"`,
      t.quantity,
      t.buyPrice !== undefined ? Number(t.buyPrice).toFixed(2) : '',
      Number(t.price).toFixed(2),
      Number(t.totalValue).toFixed(2),
      t.realizedPnL !== undefined ? Number(t.realizedPnL).toFixed(2) : '',
      t.realizedPnLPercent !== undefined ? Number(t.realizedPnLPercent).toFixed(2) : '',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Trade_History_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download Trade History as JSON
  const handleDownloadTradeHistoryJSON = () => {
    if (tradeHistory.length === 0) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(tradeHistory, null, 2)
    )}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.setAttribute('download', `Trade_History_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculated Portfolio Totals & Itemized Brokerage Deductions
  const holdingsWithCalculations = holdings.map((h) => {
    const buyTime = h.buyDate ? new Date(h.buyDate).getTime() : Date.now();
    const daysHeld = Math.max(0, Math.floor((Date.now() - buyTime) / (1000 * 60 * 60 * 24)));

    const hTaxSettings = {
      ...taxSettings,
      brokerPreset: (h.broker || 'ZERODHA') as 'ZERODHA' | 'GROWW' | 'ANGELONE',
      exchange: (h.exchange || 'NSE') as 'NSE' | 'BSE',
    };

    const calc = calculateEquityDeliveryBrokerage({
      quantity: h.quantity,
      buyPrice: h.buyPrice,
      sellPrice: h.currentPrice,
      taxSettings: hTaxSettings,
      isMTF: h.isMTF,
      ownQuantity: h.ownQuantity,
      mtfQuantity: h.mtfQuantity,
      mtfDays: daysHeld,
    });

    const grossInvested = h.buyPrice * h.quantity;
    const currentMarketValue = h.currentPrice * h.quantity;
    const grossPnL = currentMarketValue - grossInvested;
    const netPnL = calc.netPnL;
    const totalDeductions = calc.totalFees;
    const netRoiPercent = calc.netRoiPercent;

    return {
      ...h,
      daysHeld,
      calc,
      grossInvested,
      currentMarketValue,
      grossPnL,
      netPnL,
      totalDeductions,
      netRoiPercent,
    };
  });

  const totalInvested = holdingsWithCalculations.reduce((sum, item) => sum + item.grossInvested, 0);
  const currentVal = holdingsWithCalculations.reduce((sum, item) => sum + item.currentMarketValue, 0);
  const totalNetPnL = holdingsWithCalculations.reduce((sum, item) => sum + item.netPnL, 0);
  const totalGrossPnL = holdingsWithCalculations.reduce((sum, item) => sum + item.grossPnL, 0);
  const totalDeductions = holdingsWithCalculations.reduce((sum, item) => sum + item.totalDeductions, 0);
  const totalPnLPercent = totalInvested > 0 ? (totalNetPnL / totalInvested) * 100 : 0;

  // Broker Allocation Breakdown
  const zerodhaVal = holdings
    .filter((h) => (h.broker || 'ZERODHA') === 'ZERODHA')
    .reduce((sum, h) => sum + h.currentPrice * h.quantity, 0);
  const growwVal = holdings
    .filter((h) => h.broker === 'GROWW')
    .reduce((sum, h) => sum + h.currentPrice * h.quantity, 0);
  const angelOneVal = holdings
    .filter((h) => h.broker === 'ANGELONE')
    .reduce((sum, h) => sum + h.currentPrice * h.quantity, 0);

  const zerodhaPct = currentVal > 0 ? (zerodhaVal / currentVal) * 100 : 0;
  const growwPct = currentVal > 0 ? (growwVal / currentVal) * 100 : 0;
  const angelOnePct = currentVal > 0 ? (angelOneVal / currentVal) * 100 : 0;

  // Best & Worst Performers
  const bestPerformer = holdingsWithCalculations.length
    ? [...holdingsWithCalculations].sort((a, b) => b.netRoiPercent - a.netRoiPercent)[0]
    : null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.symbol || !formData.buyPrice || !formData.quantity) return;

    const totalQty = parseFloat(formData.quantity);
    const buyP = parseFloat(formData.buyPrice);
    const ownQ = formData.isMTF
      ? (formData.ownQuantity !== '' ? parseFloat(formData.ownQuantity) || 0 : totalQty * 0.25)
      : totalQty;
    const mtfQ = formData.isMTF
      ? (formData.mtfQuantity !== '' ? parseFloat(formData.mtfQuantity) || 0 : Math.max(0, totalQty - ownQ))
      : 0;

    addHolding({
      symbol: formData.symbol.toUpperCase(),
      companyName: formData.companyName || formData.symbol.toUpperCase(),
      buyPrice: buyP,
      quantity: totalQty,
      buyDate: formData.buyDate,
      exchange: formData.exchange,
      category: formData.category,
      broker: formData.broker,
      notes: formData.notes,
      isMTF: formData.isMTF,
      ownQuantity: ownQ,
      mtfQuantity: mtfQ,
      ownAmount: ownQ * buyP,
      mtfBorrowedAmount: mtfQ * buyP,
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
      isMTF: false,
      ownQuantity: '',
      mtfQuantity: '',
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
        <div className={`glass-shell ${totalNetPnL >= 0 ? 'glass-shell-profit' : 'glass-shell-loss'}`}>
          <div className="glass-core p-6 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Unrealized Net P&L
              </span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${totalNetPnL >= 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/10 border border-rose-500/20'}`}>
                {totalNetPnL >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-rose-400" />
                )}
              </div>
            </div>
            <div
              className={`mt-4 text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
                totalNetPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {totalNetPnL >= 0 ? '+' : '-'}₹
              {Math.abs(totalNetPnL).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-2 flex items-center justify-between font-mono">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    totalNetPnL >= 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {totalPnLPercent >= 0 ? '+' : ''}
                  {totalPnLPercent.toFixed(2)}%
                </span>
                <span className="text-xs text-slate-400">net yield</span>
              </div>
              <span className="text-[10px] text-slate-400">
                After ₹{totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} charges
              </span>
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
                      bestPerformer.netPnL >= 0
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                    }`}
                  >
                    {bestPerformer.netPnL >= 0 ? '+' : ''}
                    {bestPerformer.netRoiPercent.toFixed(2)}%
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400 font-mono">
                  {bestPerformer.netPnL >= 0 ? 'Net Profit: +' : 'Net Loss: -'}₹
                  {Math.abs(bestPerformer.netPnL).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                <div
                  style={{ width: `${angelOnePct}%` }}
                  className="bg-[#F97316] h-full transition-all duration-500"
                  title={`Angel One: ${angelOnePct.toFixed(1)}%`}
                />
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono shrink-0">
                <span className="text-[#38BDF8] font-bold">Zerodha {zerodhaPct.toFixed(1)}%</span>
                <span className="text-[#22C55E] font-bold">Groww {growwPct.toFixed(1)}%</span>
                <span className="text-[#F97316] font-bold">Angel One {angelOnePct.toFixed(1)}%</span>
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
              onClick={exportPortfolioJSON}
              title="Export portfolio as JSON file"
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Export JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Trade Sale Success Notification Toast */}
      {sellSuccessNotice && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-lg shadow-emerald-500/10">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{sellSuccessNotice}</span>
          </div>
          <button
            onClick={() => setSellSuccessNotice(null)}
            className="text-emerald-400 hover:text-white transition p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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
                {holdingsWithCalculations.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-slate-400">
                      No holdings in portfolio. Click <strong className="text-white">Add Stock Purchase</strong> to record your first trade!
                    </td>
                  </tr>
                ) : (
                  holdingsWithCalculations.map((holding) => {
                    const invested = holding.grossInvested;
                    const currentVal = holding.currentMarketValue;
                    const netPnL = holding.netPnL;
                    const grossPnL = holding.grossPnL;
                    const totalDeductions = holding.totalDeductions;
                    const netRoiPercent = holding.netRoiPercent;
                    const isProfit = netPnL >= 0;
                    const calc = holding.calc;

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
                                <span>{holding.symbol}</span>
                                {holding.isMTF && (
                                  <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-400 border border-amber-500/40 tracking-wider">
                                    MTF
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 truncate max-w-[160px]">
                                {holding.companyName}
                              </div>
                              {holding.isMTF && (() => {
                                const ownQ = holding.ownQuantity ?? holding.quantity;
                                const mtfQ = holding.mtfQuantity ?? 0;
                                return (
                                  <div className="text-[10px] font-mono text-amber-300/90 mt-0.5">
                                    Own: {ownQ} • MTF: {mtfQ} • Int: ₹{(calc.mtfInterestCost || 0).toFixed(2)} ({holding.daysHeld}d)
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </td>

                        {/* Exchange & Broker */}
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300 border border-white/10">
                              {holding.exchange}
                            </span>
                            {(holding.broker || 'ZERODHA') === 'ANGELONE' ? (
                              <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[9px] font-bold text-orange-400 border border-orange-500/30 flex items-center gap-1">
                                <Sparkles className="h-2.5 w-2.5" /> Angel One
                              </span>
                            ) : (holding.broker || 'ZERODHA') === 'GROWW' ? (
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

                        {/* Unrealized Net P&L */}
                        <td className="px-4 py-4 text-right font-mono group relative">
                          <div
                            className={`font-bold flex items-center justify-end gap-1 text-sm ${
                              isProfit ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isProfit ? '+' : '-'}₹
                            {Math.abs(netPnL).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="mt-0.5 flex items-center justify-end gap-1.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                isProfit
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {isProfit ? '+' : ''}
                              {netRoiPercent.toFixed(2)}%
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-end gap-1 font-sans">
                            <span>Deductions: ₹{totalDeductions.toFixed(2)}</span>
                            <div className="relative inline-block group/tooltip">
                              <HelpCircle className="h-3 w-3 text-slate-400 hover:text-slate-200 cursor-help" />
                              <div className="pointer-events-none absolute right-0 bottom-full mb-2 hidden group-hover/tooltip:block w-60 p-3 bg-[#080c14] border border-slate-700/80 rounded-xl shadow-2xl z-50 text-[11px] text-slate-200 font-sans text-left">
                                <div className="font-bold text-white mb-2 pb-1.5 border-b border-slate-800 flex justify-between items-center">
                                  <span>Estimated Deductions</span>
                                  <span className="text-amber-400 font-mono">₹{totalDeductions.toFixed(2)}</span>
                                </div>
                                <div className="space-y-1 font-mono text-[10px]">
                                  <div className="flex justify-between py-0.5 border-b border-white/5">
                                    <span className="text-slate-400 font-sans">Gross P&L:</span>
                                    <span className={grossPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                      {grossPnL >= 0 ? '+' : '-'}₹{Math.abs(grossPnL).toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400 font-sans">Brokerage:</span>
                                    <span>₹{calc.totalBrokerage.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400 font-sans">STT (0.1% Buy+Sell):</span>
                                    <span>₹{calc.totalStt.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400 font-sans">Exch + SEBI + GST:</span>
                                    <span>₹{(calc.totalExchangeTxn + calc.totalSebi + calc.totalGst).toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400 font-sans">Stamp Duty (Buy):</span>
                                    <span>₹{calc.stampDuty.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400 font-sans">DP Charges (Sell):</span>
                                    <span>₹{calc.dpCharges.toFixed(2)}</span>
                                  </div>
                                  {holding.isMTF && (
                                    <>
                                      <div className="flex justify-between text-amber-300 pt-1 border-t border-amber-500/20">
                                        <span className="font-sans">MTF Interest ({holding.daysHeld}d):</span>
                                        <span>₹{(calc.mtfInterestCost || 0).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between text-amber-300">
                                        <span className="font-sans">Pledge/Unpledge Fee:</span>
                                        <span>₹{(calc.mtfPledgeUnpledgeFee || 0).toFixed(2)}</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenSellModal(holding)}
                              title="Mark as Sold & transfer to Trade History"
                              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 hover:border-emerald-500/70 transition-all shadow-sm"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Mark Sold</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedCalculatorHoldingId(holding.id);
                                if (onOpenInCalculator) onOpenInCalculator(holding.id);
                              }}
                              title="Open in Tax & Target Calculator"
                              className="rounded-lg p-1.5 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition-colors border border-cyan-500/30"
                            >
                              <Calculator className="h-4 w-4" />
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
            {holdingsWithCalculations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No holdings in portfolio. Click <strong className="text-white">Add Stock Purchase</strong> to record your first trade!
              </div>
            ) : (
              holdingsWithCalculations.map((holding) => {
                const invested = holding.grossInvested;
                const currentVal = holding.currentMarketValue;
                const netPnL = holding.netPnL;
                const grossPnL = holding.grossPnL;
                const totalDeductions = holding.totalDeductions;
                const netRoiPercent = holding.netRoiPercent;
                const isProfit = netPnL >= 0;

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
                            {holding.isMTF && (
                              <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-400 border border-amber-500/40 tracking-wider font-mono">
                                MTF
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 truncate max-w-[140px]">
                            {holding.companyName}
                          </div>
                        </div>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold font-mono ${isProfit ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                        {isProfit ? '+' : ''}{netRoiPercent.toFixed(2)}%
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
                        <span className="text-[10px] text-slate-400 block uppercase">Unrealized Net P&L</span>
                        <span className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isProfit ? '+' : '-'}₹{Math.abs(netPnL).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[9px] text-slate-400 block mt-0.5 font-sans">
                          (Deductions: ₹{totalDeductions.toFixed(0)})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => {
                          setSelectedCalculatorHoldingId(holding.id);
                          if (onOpenInCalculator) onOpenInCalculator(holding.id);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 transition"
                      >
                        <Calculator className="h-3.5 w-3.5" /> Calc
                      </button>
                      <button
                        onClick={() => handleOpenSellModal(holding)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 transition shadow-sm"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Mark Sold
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(holding)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 transition"
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

          {/* Realized P&L Stat Pill & Download Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-xl bg-slate-950 border border-white/10 px-3.5 py-1.5 text-xs font-mono">
              <span className="text-slate-400">Total Booked P&L:</span>
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

            <button
              onClick={handleDownloadTradeHistoryCSV}
              disabled={tradeHistory.length === 0}
              title={tradeHistory.length === 0 ? "No trades to download yet" : "Download Trade History as CSV / Excel spreadsheet"}
              className="flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 disabled:opacity-40 disabled:pointer-events-none px-3.5 py-2 text-xs font-semibold text-cyan-300 transition-all shadow-sm cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download CSV</span>
            </button>

            <button
              onClick={handleDownloadTradeHistoryJSON}
              disabled={tradeHistory.length === 0}
              title={tradeHistory.length === 0 ? "No trades to download yet" : "Download Trade History as JSON"}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none px-3 py-2 text-xs font-semibold text-slate-300 transition-all cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">JSON</span>
            </button>
          </div>
        </div>

        {/* Trade Ledger Table (Desktop & Tablet) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 font-semibold border-b border-white/10">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Asset Ticker</th>
                <th className="px-4 py-3">Broker</th>
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
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-sans">
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
                        {(trade.broker || 'ZERODHA') === 'ANGELONE' ? (
                          <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[9px] font-bold text-orange-400 border border-orange-500/30 flex items-center gap-1 w-fit">
                            <Sparkles className="h-2.5 w-2.5" /> Angel One
                          </span>
                        ) : (trade.broker || 'ZERODHA') === 'GROWW' ? (
                          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                            <Building2 className="h-2.5 w-2.5" /> Groww
                          </span>
                        ) : (
                          <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[9px] font-bold text-cyan-300 border border-blue-500/30 flex items-center gap-1 w-fit">
                            <Zap className="h-2.5 w-2.5" /> Zerodha
                          </span>
                        )}
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
                      {(trade.broker || 'ZERODHA') === 'ANGELONE' ? (
                        <span className="rounded bg-orange-500/15 px-1.5 py-0.5 text-[9px] font-bold text-orange-400 border border-orange-500/30">
                          Angel One
                        </span>
                      ) : (trade.broker || 'ZERODHA') === 'GROWW' ? (
                        <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
                          Groww
                        </span>
                      ) : (
                        <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[9px] font-bold text-cyan-300 border border-blue-500/30">
                          Zerodha
                        </span>
                      )}
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
                      isSuggestionSelectedRef.current = false;
                      setFormData({ ...formData, symbol: e.target.value });
                      setShowSuggestions(true);
                    }}
                    onFocus={() => {
                      if (searchResults.length > 0 && !isSuggestionSelectedRef.current) {
                        setShowSuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowSuggestions(false), 200);
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

              {/* Broker Platform Selection (Full Width 3-Column Grid) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Broker Platform *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, broker: 'ZERODHA' })}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      (formData.broker || 'ZERODHA') === 'ZERODHA'
                        ? 'bg-blue-600/30 border-blue-500 text-white shadow-md ring-1 ring-blue-500/40'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <Zap className="h-3.5 w-3.5 text-cyan-300 shrink-0" />
                    <span>Zerodha</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, broker: 'GROWW' })}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      formData.broker === 'GROWW'
                        ? 'bg-emerald-600/30 border-emerald-500 text-white shadow-md ring-1 ring-emerald-500/40'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <Building2 className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
                    <span>Groww</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, broker: 'ANGELONE' })}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      formData.broker === 'ANGELONE'
                        ? 'bg-orange-600/30 border-orange-500 text-white shadow-md ring-1 ring-orange-500/40'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                    <span>Angel One</span>
                  </button>
                </div>
              </div>

              {/* Exchange & Purchase Date */}
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Purchase Date</span>
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
              </div>

              {/* MTF Trade Toggle */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 font-mono flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" /> Margin Trading Facility (MTF) Trade
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isMTF}
                      onChange={(e) => setFormData({ ...formData, isMTF: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {formData.isMTF && (
                  <div className="space-y-3 pt-1 border-t border-amber-500/20">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Own Shares (Your Cash)
                        </label>
                        <input
                          type="number"
                          step="any"
                          placeholder="e.g. 25"
                          value={formData.ownQuantity}
                          onChange={(e) => setFormData({ ...formData, ownQuantity: e.target.value })}
                          className="w-full glass-input text-amber-400 font-bold font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          MTF Borrowed Shares
                        </label>
                        <input
                          type="number"
                          step="any"
                          placeholder="e.g. 75"
                          value={formData.mtfQuantity}
                          onChange={(e) => setFormData({ ...formData, mtfQuantity: e.target.value })}
                          className="w-full glass-input text-amber-300 font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div className="text-[10px] text-amber-200/80 font-mono flex justify-between">
                      <span>Daily Interest: {(formData.broker === 'GROWW' || formData.broker === 'ANGELONE') ? '0.041%' : '0.04%'} / day</span>
                      <span>Interest applied from T+1</span>
                    </div>
                  </div>
                )}
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

              {/* Broker Platform Selection (Full Width 3-Column Grid) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Broker Platform *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditFormData({ ...editFormData, broker: 'ZERODHA' })}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      (editFormData.broker || 'ZERODHA') === 'ZERODHA'
                        ? 'bg-blue-600/30 border-blue-500 text-white shadow-md ring-1 ring-blue-500/40'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <Zap className="h-3.5 w-3.5 text-cyan-300 shrink-0" />
                    <span>Zerodha</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditFormData({ ...editFormData, broker: 'GROWW' })}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      editFormData.broker === 'GROWW'
                        ? 'bg-emerald-600/30 border-emerald-500 text-white shadow-md ring-1 ring-emerald-500/40'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <Building2 className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
                    <span>Groww</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditFormData({ ...editFormData, broker: 'ANGELONE' })}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      editFormData.broker === 'ANGELONE'
                        ? 'bg-orange-600/30 border-orange-500 text-white shadow-md ring-1 ring-orange-500/40'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                    <span>Angel One</span>
                  </button>
                </div>
              </div>

              {/* Exchange & Purchase Date */}
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Purchase Date</span>
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
              </div>

              {/* MTF Trade Toggle */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 font-mono flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" /> Margin Trading Facility (MTF) Trade
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.isMTF}
                      onChange={(e) => setEditFormData({ ...editFormData, isMTF: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {editFormData.isMTF && (
                  <div className="space-y-3 pt-1 border-t border-amber-500/20">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Own Shares (Your Cash)
                        </label>
                        <input
                          type="number"
                          step="any"
                          placeholder="e.g. 25"
                          value={editFormData.ownQuantity}
                          onChange={(e) => setEditFormData({ ...editFormData, ownQuantity: e.target.value })}
                          className="w-full glass-input text-amber-400 font-bold font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          MTF Borrowed Shares
                        </label>
                        <input
                          type="number"
                          step="any"
                          placeholder="e.g. 75"
                          value={editFormData.mtfQuantity}
                          onChange={(e) => setEditFormData({ ...editFormData, mtfQuantity: e.target.value })}
                          className="w-full glass-input text-amber-300 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
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
        const estBrokerage = activeHoldingBroker === 'GROWW' ? Math.min(20, grossValue * 0.0005) : activeHoldingBroker === 'ANGELONE' ? 20 : 0;
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
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" /> Mark Holding as Sold
                  </h3>
                  <p className="text-xs text-slate-400">Sold shares will be transferred to your Trade History</p>
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Quantity Sold *
                      </label>
                      <button
                        type="button"
                        onClick={() => setSellFormData({ ...sellFormData, sellQuantity: sellingHolding.quantity.toString() })}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold underline"
                      >
                        Sell All ({sellingHolding.quantity})
                      </button>
                    </div>
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
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-lg hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirm Sale & Transfer to Trade History</span>
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
          taxSettings: { ...taxSettings, brokerPreset: activeHoldingBroker },
          mode: 'forward',
          isMTF: tr.isMTF,
          ownQuantity: tr.ownQuantity,
          mtfQuantity: tr.mtfQuantity,
          mtfDays: tr.mtfDaysHeld,
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
                  {[
                    { label: `Brokerage (${activeHoldingBroker})`, val: calcRes.totalBrokerage, title: 'Brokerage Fee', desc: 'Broker execution fee. Zerodha = ₹0 for Equity Delivery. Groww = ₹20 or 0.1% per order, whichever is lower (min ₹5, max ₹20). Angel One = ₹0 Buy / ₹20 Sell.' },
                    { label: 'STT (0.1% Buy / 0.1% Sell)', val: calcRes.sttCharges, title: 'Securities Transaction Tax (STT)', desc: 'Statutory tax levied by Central Govt under SEBI rules at 0.1% on Buy and 0.1% on Sell value for Equity Delivery.' },
                    { label: 'Exchange Txn Charge', val: calcRes.exchangeTxnCharge, title: 'Exchange Transaction Charge', desc: 'Infrastructure fee charged by stock exchanges (NSE: 0.00307% for Zerodha / 0.00297% for Groww & Angel One, BSE: 0.00375%).' },
                    { label: 'SEBI Turnover Charges', val: calcRes.sebiCharges, title: 'SEBI Regulatory Fee', desc: 'Regulator charge collected by SEBI to regulate stock markets at ₹10 per crore (0.0001%) of turnover + IPFT.' },
                    { label: 'Stamp Duty (0.015% Buy)', val: calcRes.stampDuty, title: 'State Stamp Duty', desc: 'State Govt stamp tax levied at 0.015% (₹1,500/Cr) on BUY side order value only.' },
                    { label: 'GST (18%)', val: calcRes.gstCharges, title: 'Goods & Services Tax (GST)', desc: '18% Govt tax levied on (Brokerage + Exchange Transaction Charges + SEBI Fees + IPFT + DP Base).' },
                    ...(calcRes.dpCharges > 0 ? [{ label: 'CDSL DP Charge (Sell)', val: calcRes.dpCharges, title: 'Depository Participant (DP) Charge', desc: 'CDSL & broker fee charged on SELL transactions. Zerodha = ₹15.34 (13+18% GST), Groww = ₹23.60 (₹3.5 CDSL + ₹16.5 Groww = ₹20 base + ₹3.60 GST). ₹0 if sell value < ₹100.' }] : []),
                  ].map((item, idx) => (
                    <div key={idx} className="group relative flex justify-between cursor-help hover:text-white transition">
                      <span className="text-slate-400 group-hover:text-cyan-400 flex items-center gap-1 transition">
                        <span>{item.label}</span>
                        <HelpCircle className="h-3 w-3 text-slate-500 group-hover:text-cyan-400 shrink-0" />
                      </span>
                      <span>₹{item.val.toFixed(2)}</span>
                      <div
                        className={`absolute left-0 ${
                          idx < 3 ? 'top-full mt-2' : 'bottom-full mb-2'
                        } hidden group-hover:flex flex-col z-50 w-64 p-3 rounded-xl bg-slate-900 border border-cyan-500/60 shadow-2xl text-[11px] text-slate-200 font-sans leading-relaxed pointer-events-none`}
                      >
                        <span className="font-bold text-cyan-400 font-mono mb-1">{item.title}</span>
                        <span>{item.desc}</span>
                      </div>
                    </div>
                  ))}
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
    </div>
  );
};
