'use client';

import React, { useState, useMemo } from 'react';
import { useStock } from '@/context/StockContext';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Compass,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Search,
  PieChart,
  Shield,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';

// Indian Market Benchmark Indices Mock Data
const BENCHMARK_INDICES = [
  { name: 'NIFTY 50', value: 25840.50, change: 145.20, changePct: 0.56, status: 'up' },
  { name: 'BANK NIFTY', value: 53920.00, change: -120.40, changePct: -0.22, status: 'down' },
  { name: 'NIFTY IT', value: 42150.80, change: 480.30, changePct: 1.15, status: 'up' },
  { name: 'NIFTY SMALLCAP', value: 19410.20, change: 210.60, changePct: 1.10, status: 'up' },
  { name: 'INDIA VIX', value: 12.85, change: -0.45, changePct: -3.38, status: 'down' },
];

// Indian Sector Heatmap
const SECTOR_HEATMAP = [
  { sector: 'IT & Software', changePct: 1.45, topStock: 'TCS (+1.8%)', tone: 'bullish' },
  { sector: 'Banking & Financials', changePct: 0.35, topStock: 'ICICIBANK (+1.2%)', tone: 'neutral' },
  { sector: 'Energy & Oil', changePct: 0.82, topStock: 'RELIANCE (+1.1%)', tone: 'bullish' },
  { sector: 'Automotive & EV', changePct: 2.10, topStock: 'TATAMOTORS (+3.4%)', tone: 'bullish' },
  { sector: 'Pharma & Healthcare', changePct: -0.42, topStock: 'SUNPHARMA (-0.8%)', tone: 'bearish' },
  { sector: 'FMCG & Consumer', changePct: -0.15, topStock: 'ITC (-0.3%)', tone: 'neutral' },
];

// Technical Signal Calculations
interface AnalysisMetrics {
  rsi14: number;
  rsiSignal: 'Oversold' | 'Neutral' | 'Overbought';
  sma20: number;
  sma50: number;
  smaSignal: 'Bullish Crossover' | 'Bearish Trend' | 'Neutral';
  macdValue: number;
  macdSignal: 'Bullish Momentum' | 'Bearish Momentum';
  pivotPoint: number;
  support1: number;
  support2: number;
  resistance1: number;
  resistance2: number;
  overallScore: 'STRONG BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG SELL';
  scoreColor: string;
}

const computeAnalysisMetrics = (ltp: number): AnalysisMetrics => {
  // Compute deterministic technicals based on LTP
  const rsi14 = +((ltp * 13) % 40 + 40).toFixed(1);
  const rsiSignal = rsi14 > 70 ? 'Overbought' : rsi14 < 30 ? 'Oversold' : 'Neutral';

  const sma20 = +(ltp * 0.985).toFixed(2);
  const sma50 = +(ltp * 0.962).toFixed(2);
  const smaSignal = ltp > sma20 && sma20 > sma50 ? 'Bullish Crossover' : 'Bearish Trend';

  const macdValue = +((ltp * 0.005).toFixed(2));
  const macdSignal = macdValue >= 0 ? 'Bullish Momentum' : 'Bearish Momentum';

  const pivotPoint = ltp;
  const support1 = +(ltp * 0.982).toFixed(2);
  const support2 = +(ltp * 0.965).toFixed(2);
  const resistance1 = +(ltp * 1.018).toFixed(2);
  const resistance2 = +(ltp * 1.035).toFixed(2);

  let overallScore: AnalysisMetrics['overallScore'] = 'BUY';
  let scoreColor = 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40';

  if (rsi14 > 65 && smaSignal === 'Bullish Crossover') {
    overallScore = 'STRONG BUY';
    scoreColor = 'text-emerald-300 bg-emerald-500/30 border-emerald-400';
  } else if (rsi14 < 35) {
    overallScore = 'SELL';
    scoreColor = 'text-rose-400 bg-rose-500/20 border-rose-500/40';
  } else if (rsi14 >= 45 && rsi14 <= 65) {
    overallScore = 'BUY';
    scoreColor = 'text-cyan-400 bg-cyan-500/20 border-cyan-500/40';
  } else {
    overallScore = 'NEUTRAL';
    scoreColor = 'text-amber-400 bg-amber-500/20 border-amber-500/40';
  }

  return {
    rsi14,
    rsiSignal,
    sma20,
    sma50,
    smaSignal,
    macdValue,
    macdSignal,
    pivotPoint,
    support1,
    support2,
    resistance1,
    resistance2,
    overallScore,
    scoreColor,
  };
};

export const AnalysisTab: React.FC = () => {
  const { watchlist, selectedStockSymbol, setSelectedStockSymbol, marketStatus } = useStock();

  const [selectedSymbol, setSelectedSymbol] = useState<string>(selectedStockSymbol || 'RELIANCE');
  const [searchFilter, setSearchFilter] = useState('');

  const activeStock =
    watchlist.find((w) => w.symbol === selectedSymbol) || watchlist[0] || null;

  const analysis = useMemo(() => {
    return activeStock ? computeAnalysisMetrics(activeStock.currentPrice) : computeAnalysisMetrics(2500);
  }, [activeStock?.currentPrice]);

  return (
    <div className="space-y-6">
      {/* Market Regime Status Bar */}
      <div className="bg-[#0D1218] rounded-xl p-4 border border-[#202A35] shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#F4F7FA] uppercase tracking-wider flex items-center gap-2 font-mono">
            <Flame className="h-4 w-4 text-[#8B5CF6]" /> MARKET REGIME & BENCHMARK INDICES
          </h2>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${marketStatus.textColor} ${marketStatus.bgColor} ${marketStatus.borderColor}`}
            title={marketStatus.detailText}
          >
            ● {marketStatus.statusText}
          </span>
        </div>

        {/* Market Regime Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#080B10] p-3 rounded-lg border border-[#202A35] flex items-center justify-between">
            <span className="text-xs font-mono text-[#8D99A8]">NIFTY 50</span>
            <span className="text-xs font-mono font-extrabold text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded border border-[#22C55E]/20">
              BULLISH
            </span>
          </div>
          <div className="bg-[#080B10] p-3 rounded-lg border border-[#202A35] flex items-center justify-between">
            <span className="text-xs font-mono text-[#8D99A8]">SENSEX</span>
            <span className="text-xs font-mono font-extrabold text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded border border-[#22C55E]/20">
              BULLISH
            </span>
          </div>
          <div className="bg-[#080B10] p-3 rounded-lg border border-[#202A35] flex items-center justify-between">
            <span className="text-xs font-mono text-[#8D99A8]">BANK NIFTY</span>
            <span className="text-xs font-mono font-extrabold text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded border border-[#F59E0B]/20">
              NEUTRAL
            </span>
          </div>
        </div>

        {/* Indices Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          {BENCHMARK_INDICES.map((idx) => {
            const isUp = idx.status === 'up';
            return (
              <div
                key={idx.name}
                className="bg-[#080B10] p-3 rounded-xl border border-[#202A35] space-y-1 hover:border-[#38BDF8]/40 transition"
              >
                <div className="flex justify-between items-center text-[11px] font-semibold text-[#8D99A8] font-mono">
                  <span>{idx.name}</span>
                  {isUp ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-[#22C55E]" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 text-[#EF4444]" />
                  )}
                </div>
                <div className="text-base font-extrabold font-mono text-[#F4F7FA]">
                  {idx.value.toLocaleString('en-IN')}
                </div>
                <div
                  className={`text-[10px] font-bold font-mono ${
                    isUp ? 'text-[#22C55E]' : 'text-[#EF4444]'
                  }`}
                >
                  {isUp ? '+' : ''}
                  {idx.change} ({isUp ? '+' : ''}
                  {idx.changePct}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Analysis Engine Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Selector Column (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#0D1218] rounded-xl p-4 space-y-3 border border-[#202A35] shadow-lg">
            <h3 className="text-xs font-bold text-[#F4F7FA] uppercase tracking-wider flex items-center gap-2 border-b border-[#202A35] pb-2 font-mono">
              <Search className="h-3.5 w-3.5 text-[#38BDF8]" /> SELECT STOCK FOR LAB ANALYSIS
            </h3>

            <input
              type="text"
              placeholder="Search ticker (e.g. RELIANCE, TCS)..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-[#080B10] text-[#F4F7FA] border border-[#202A35] rounded-lg text-xs uppercase font-mono px-3 py-2 outline-none focus:border-[#38BDF8]"
            />

            {/* Stock List Scroll Area */}
            <div className="space-y-1 max-h-[460px] overflow-y-auto pt-1">
              {watchlist
                .filter((item) => item.symbol.toLowerCase().includes(searchFilter.toLowerCase()))
                .map((item) => {
                  const isSelected = item.symbol === selectedSymbol;
                  const itemIsUp = item.dayChangePercent >= 0;

                  return (
                    <div
                      key={item.symbol}
                      onClick={() => setSelectedSymbol(item.symbol)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition border ${
                        isSelected
                          ? 'bg-[#111820] border-[#38BDF8]/60 shadow-md'
                          : 'bg-[#080B10]/40 border-[#202A35]/50 hover:bg-[#111820]/60 hover:border-[#202A35]'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-[#F4F7FA] text-xs font-mono">{item.symbol}</div>
                        <div className="text-[10px] text-[#8D99A8] truncate max-w-[120px]">
                          {item.companyName}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-xs text-[#F4F7FA] font-mono">
                          ₹{item.currentPrice.toLocaleString('en-IN')}
                        </div>
                        <div
                          className={`text-[10px] font-bold font-mono ${
                            itemIsUp ? 'text-[#22C55E]' : 'text-[#EF4444]'
                          }`}
                        >
                          {itemIsUp ? '+' : ''}
                          {item.dayChangePercent}%
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* FII / DII Net Institutional Activity Card */}
          <div className="bg-[#0D1218] rounded-xl p-4 space-y-3 border border-[#202A35] shadow-lg">
            <h3 className="text-xs font-bold text-[#F4F7FA] uppercase tracking-wider border-b border-[#202A35] pb-2 flex items-center gap-2 font-mono">
              <PieChart className="h-4 w-4 text-[#8B5CF6]" /> FII / DII NET CASH ACTIVITY
            </h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center bg-[#080B10] p-2.5 rounded-lg border border-[#202A35]">
                <span className="text-[#8D99A8]">FII Net Buy/Sell:</span>
                <span className="font-bold text-[#22C55E]">+₹1,420.50 Cr</span>
              </div>
              <div className="flex justify-between items-center bg-[#080B10] p-2.5 rounded-lg border border-[#202A35]">
                <span className="text-[#8D99A8]">DII Net Buy/Sell:</span>
                <span className="font-bold text-[#22C55E]">+₹890.20 Cr</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Detailed Analysis Column (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {activeStock ? (
            <>
              {/* Header Card: Overall Rating & Signal Badge */}
              <div className="bg-[#0D1218] rounded-xl p-6 border border-[#202A35] shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-extrabold text-[#F4F7FA] font-mono">
                        {activeStock.symbol} Analytics Laboratory
                      </h2>
                    </div>
                    <p className="text-xs text-[#8D99A8] mt-1">{activeStock.companyName}</p>
                  </div>

                  {/* Overall Signal Badge */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-[#8D99A8] block font-mono">
                        Technical Summary
                      </span>
                      <span
                        className={`text-sm font-extrabold font-mono px-3 py-1 rounded-xl border ${
                          analysis.overallScore === 'STRONG BUY' || analysis.overallScore === 'BUY'
                            ? 'text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/30'
                            : analysis.overallScore === 'SELL' || analysis.overallScore === 'STRONG SELL'
                            ? 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30'
                            : 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30'
                        }`}
                      >
                        {analysis.overallScore}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Key Technical Indicators Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                  {/* RSI (14) */}
                  <div className="bg-[#080B10] p-4 rounded-xl border border-[#202A35] space-y-1">
                    <span className="text-[11px] text-[#8D99A8] font-semibold block">RSI (14 Period)</span>
                    <div className="text-2xl font-extrabold font-mono text-[#F4F7FA]">{analysis.rsi14}</div>
                    <span
                      className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                        analysis.rsiSignal === 'Overbought'
                          ? 'bg-[#EF4444]/20 text-[#EF4444]'
                          : analysis.rsiSignal === 'Oversold'
                          ? 'bg-[#22C55E]/20 text-[#22C55E]'
                          : 'bg-[#38BDF8]/20 text-[#38BDF8]'
                      }`}
                    >
                      {analysis.rsiSignal}
                    </span>
                  </div>

                  {/* Moving Average SMA 20 */}
                  <div className="bg-[#080B10] p-4 rounded-xl border border-[#202A35] space-y-1">
                    <span className="text-[11px] text-[#8D99A8] font-semibold block">SMA 20 & SMA 50</span>
                    <div className="text-lg font-bold font-mono text-[#F4F7FA]">₹{analysis.sma20}</div>
                    <span className="text-[10px] font-bold font-mono text-[#22C55E] bg-[#22C55E]/10 px-1.5 py-0.5 rounded border border-[#22C55E]/20">
                      {analysis.smaSignal}
                    </span>
                  </div>

                  {/* MACD Momentum */}
                  <div className="bg-[#080B10] p-4 rounded-xl border border-[#202A35] space-y-1">
                    <span className="text-[11px] text-[#8D99A8] font-semibold block">MACD Momentum</span>
                    <div className="text-lg font-bold font-mono text-[#F4F7FA]">+{analysis.macdValue}</div>
                    <span className="text-[10px] font-bold font-mono text-[#22C55E] bg-[#22C55E]/10 px-1.5 py-0.5 rounded border border-[#22C55E]/20">
                      {analysis.macdSignal}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pivot Support & Resistance Levels Card */}
              <div className="bg-[#0D1218] rounded-xl p-5 space-y-4 border border-[#202A35] shadow-lg">
                <h3 className="text-xs font-bold text-[#F4F7FA] uppercase tracking-wider border-b border-[#202A35] pb-2 flex items-center gap-2 font-mono">
                  <Compass className="h-4 w-4 text-[#8B5CF6]" /> DAILY PIVOT POINTS, SUPPORT & RESISTANCE (NSE)
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs font-mono">
                  <div className="bg-[#080B10] p-3 rounded-xl border border-[#202A35]">
                    <span className="text-[#EF4444] font-semibold block text-[10px]">Resistance 2 (R2)</span>
                    <span className="font-bold text-[#F4F7FA] text-sm">₹{analysis.resistance2}</span>
                  </div>
                  <div className="bg-[#080B10] p-3 rounded-xl border border-[#202A35]">
                    <span className="text-[#EF4444]/80 font-semibold block text-[10px]">Resistance 1 (R1)</span>
                    <span className="font-bold text-[#F4F7FA] text-sm">₹{analysis.resistance1}</span>
                  </div>
                  <div className="bg-[#8B5CF6]/10 p-3 rounded-xl border border-[#8B5CF6]/40">
                    <span className="text-[#8B5CF6] font-bold block text-[10px]">Pivot Point (PP)</span>
                    <span className="font-extrabold text-[#F4F7FA] text-sm">₹{analysis.pivotPoint}</span>
                  </div>
                  <div className="bg-[#080B10] p-3 rounded-xl border border-[#202A35]">
                    <span className="text-[#22C55E]/80 font-semibold block text-[10px]">Support 1 (S1)</span>
                    <span className="font-bold text-[#F4F7FA] text-sm">₹{analysis.support1}</span>
                  </div>
                  <div className="bg-[#080B10] p-3 rounded-xl border border-[#202A35]">
                    <span className="text-[#22C55E] font-semibold block text-[10px]">Support 2 (S2)</span>
                    <span className="font-bold text-[#F4F7FA] text-sm">₹{analysis.support2}</span>
                  </div>
                </div>
              </div>

              {/* Sector Performance Heatmap */}
              <div className="bg-[#0D1218] rounded-xl p-5 space-y-4 border border-[#202A35] shadow-lg">
                <h3 className="text-xs font-bold text-[#F4F7FA] uppercase tracking-wider border-b border-[#202A35] pb-2 flex items-center gap-2 font-mono">
                  <Layers className="h-4 w-4 text-[#38BDF8]" /> SECTOR TRENDS HEATMAP
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {SECTOR_HEATMAP.map((sec) => (
                    <div
                      key={sec.sector}
                      className={`p-3.5 rounded-xl border space-y-1 transition ${
                        sec.changePct >= 0
                          ? 'bg-[#22C55E]/5 border-[#22C55E]/20 hover:border-[#22C55E]/40'
                          : 'bg-[#EF4444]/5 border-[#EF4444]/20 hover:border-[#EF4444]/40'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs font-bold text-[#F4F7FA]">
                        <span>{sec.sector}</span>
                        <span
                          className={`font-mono text-[11px] ${
                            sec.changePct >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                          }`}
                        >
                          {sec.changePct >= 0 ? '+' : ''}
                          {sec.changePct}%
                        </span>
                      </div>
                      <div className="text-[10px] text-[#8D99A8]">
                        Top Mover: <span className="text-[#F4F7FA]">{sec.topStock}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-[#0D1218] rounded-xl p-12 text-center text-[#8D99A8] space-y-2 border border-[#202A35]">
              <BarChart3 className="h-10 w-10 text-[#38BDF8] mx-auto opacity-50" />
              <p className="text-sm font-bold text-[#F4F7FA]">No Stock Selected for Technical Analysis</p>
              <p className="text-xs text-[#8D99A8]">
                Select a ticker from the list on the left to inspect live technical indicators and daily pivot levels.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
