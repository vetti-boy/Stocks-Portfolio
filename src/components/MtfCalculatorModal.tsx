'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Zap,
  X,
  Coins,
  TrendingUp,
  Building2,
  Sparkles,
  Info,
  ArrowRight,
  ShieldAlert,
  Percent,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import {
  getMtfMultiplier,
  MTF_MULTIPLIER_PRESETS,
  calculateMtfFromCash,
  calculateMtfFromTotalQty,
  cleanSymbol,
  POPULAR_MTF_STOCKS,
} from '@/lib/mtfUtils';
import { StockHolding } from '@/types/stock';

interface MtfCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSymbol?: string;
  initialPrice?: number;
  initialBroker?: 'ZERODHA' | 'GROWW' | 'ANGELONE';
  onApplyTrade?: (trade: {
    symbol: string;
    companyName: string;
    buyPrice: number;
    quantity: number;
    ownQuantity: number;
    mtfQuantity: number;
    broker: 'ZERODHA' | 'GROWW' | 'ANGELONE';
    mtfMultiplier: number;
  }) => void;
}

export const MtfCalculatorModal: React.FC<MtfCalculatorModalProps> = ({
  isOpen,
  onClose,
  initialSymbol = 'RATNAVEER',
  initialPrice = 135.5,
  initialBroker = 'ZERODHA',
  onApplyTrade,
}) => {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [companyName, setCompanyName] = useState('Ratnaveer Precision Engineering Ltd');
  const [sharePrice, setSharePrice] = useState(initialPrice.toString());
  const [broker, setBroker] = useState<'ZERODHA' | 'GROWW' | 'ANGELONE'>(initialBroker);
  const [calcMode, setCalcMode] = useState<'cash' | 'quantity'>('cash');
  const [cashAmount, setCashAmount] = useState('10000');
  const [totalShares, setTotalShares] = useState('100');
  const [holdingDays, setHoldingDays] = useState('30');
  const [selectedMultiplier, setSelectedMultiplier] = useState<number>(2.4);
  const [isCustomMultiplier, setIsCustomMultiplier] = useState(false);
  const [customMultiplierInput, setCustomMultiplierInput] = useState('2.4');

  // Sync with initial props when opened
  useEffect(() => {
    if (isOpen) {
      if (initialSymbol) {
        setSymbol(initialSymbol);
        const config = POPULAR_MTF_STOCKS[cleanSymbol(initialSymbol)];
        if (config) {
          setCompanyName(config.name);
          const autoMultiplier =
            broker === 'ANGELONE'
              ? config.angelOneMultiplier
              : broker === 'GROWW'
              ? config.growwMultiplier
              : config.zerodhaMultiplier;
          setSelectedMultiplier(autoMultiplier);
          setCustomMultiplierInput(autoMultiplier.toString());
        }
      }
      if (initialPrice && initialPrice > 0) {
        setSharePrice(initialPrice.toString());
      }
      if (initialBroker) {
        setBroker(initialBroker);
      }
    }
  }, [isOpen, initialSymbol, initialPrice, initialBroker]);

  // When stock symbol or broker changes, detect verified multiplier
  const stockInfo = useMemo(() => {
    return getMtfMultiplier(symbol, broker);
  }, [symbol, broker]);

  const activeMultiplier = isCustomMultiplier
    ? Math.max(0.1, parseFloat(customMultiplierInput) || 2.4)
    : selectedMultiplier;

  const priceNum = Math.max(0.01, parseFloat(sharePrice) || 1);
  const cashNum = Math.max(0, parseFloat(cashAmount) || 0);
  const qtyNum = Math.max(1, parseFloat(totalShares) || 1);
  const daysNum = Math.max(0, parseFloat(holdingDays) || 0);

  // MTF Calculations based on mode
  const cashCalc = useMemo(() => {
    return calculateMtfFromCash({
      cashAmount: cashNum,
      sharePrice: priceNum,
      multiplier: activeMultiplier,
      broker,
    });
  }, [cashNum, priceNum, activeMultiplier, broker]);

  const qtyCalc = useMemo(() => {
    return calculateMtfFromTotalQty({
      totalQuantity: qtyNum,
      sharePrice: priceNum,
      multiplier: activeMultiplier,
      broker,
    });
  }, [qtyNum, priceNum, activeMultiplier, broker]);

  // Unified active calculations
  const effectiveResult = useMemo(() => {
    if (calcMode === 'cash') {
      const borrowed = cashCalc.actualMtfAmount;
      const dailyRate = cashCalc.dailyRatePercent;
      const totalInterest = +(borrowed * (dailyRate / 100) * daysNum).toFixed(2);
      const totalCostWithInterest = cashCalc.actualTotalCost + totalInterest + cashCalc.pledgeFee;
      const breakevenPrice =
        cashCalc.totalQuantity > 0 ? +(totalCostWithInterest / cashCalc.totalQuantity).toFixed(2) : priceNum;
      const breakevenGrowthPercent =
        priceNum > 0 ? +(((breakevenPrice - priceNum) / priceNum) * 100).toFixed(2) : 0;

      return {
        ownCapital: cashCalc.ownCash,
        actualOwnUsed: cashCalc.actualOwnAmount,
        brokerLended: cashCalc.brokerLendedAmount,
        actualBrokerLended: cashCalc.actualMtfAmount,
        totalPurchasingPower: cashCalc.totalBuyingPower,
        actualOrderValue: cashCalc.actualTotalCost,
        totalQuantity: cashCalc.totalQuantity,
        ownShares: cashCalc.ownQuantity,
        mtfShares: cashCalc.mtfQuantity,
        dailyInterest: cashCalc.dailyInterest,
        dailyRatePercent: cashCalc.dailyRatePercent,
        holdingInterest: totalInterest,
        pledgeFee: cashCalc.pledgeFee,
        breakevenPrice,
        breakevenGrowthPercent,
        marginPercent: cashCalc.marginPercent,
        totalLeverage: cashCalc.totalLeverage,
      };
    } else {
      const borrowed = qtyCalc.brokerLendedAmount;
      const dailyRate = qtyCalc.dailyRatePercent;
      const totalInterest = +(borrowed * (dailyRate / 100) * daysNum).toFixed(2);
      const totalCostWithInterest = qtyCalc.totalCost + totalInterest + qtyCalc.pledgeFee;
      const breakevenPrice =
        qtyCalc.totalQuantity > 0 ? +(totalCostWithInterest / qtyCalc.totalQuantity).toFixed(2) : priceNum;
      const breakevenGrowthPercent =
        priceNum > 0 ? +(((breakevenPrice - priceNum) / priceNum) * 100).toFixed(2) : 0;

      return {
        ownCapital: qtyCalc.ownAmount,
        actualOwnUsed: qtyCalc.ownAmount,
        brokerLended: qtyCalc.brokerLendedAmount,
        actualBrokerLended: qtyCalc.brokerLendedAmount,
        totalPurchasingPower: qtyCalc.totalCost,
        actualOrderValue: qtyCalc.totalCost,
        totalQuantity: qtyCalc.totalQuantity,
        ownShares: qtyCalc.ownQuantity,
        mtfShares: qtyCalc.mtfQuantity,
        dailyInterest: qtyCalc.dailyInterest,
        dailyRatePercent: qtyCalc.dailyRatePercent,
        holdingInterest: totalInterest,
        pledgeFee: qtyCalc.pledgeFee,
        breakevenPrice,
        breakevenGrowthPercent,
        marginPercent: qtyCalc.marginPercent,
        totalLeverage: qtyCalc.totalLeverage,
      };
    }
  }, [calcMode, cashCalc, qtyCalc, priceNum, daysNum]);

  // Leverage Returns Comparison (Delivery vs MTF) for +10% Stock Rally
  const rallyReturnComparison = useMemo(() => {
    const rallyPercent = 10;
    const grossGain = effectiveResult.actualOrderValue * (rallyPercent / 100);
    const netGainMtf = grossGain - effectiveResult.holdingInterest - effectiveResult.pledgeFee;
    const mtfRoePercent =
      effectiveResult.actualOwnUsed > 0
        ? +((netGainMtf / effectiveResult.actualOwnUsed) * 100).toFixed(1)
        : 0;

    const deliveryCapitalRequired = effectiveResult.actualOrderValue;
    const deliveryRoePercent = rallyPercent;

    return {
      grossGain,
      netGainMtf,
      mtfRoePercent,
      deliveryCapitalRequired,
      deliveryRoePercent,
    };
  }, [effectiveResult]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-5 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel w-full max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-5 border border-amber-500/40 shadow-2xl relative rounded-2xl bg-[#090D14] text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                MTF Leverage & Share Split Analyzer
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {broker}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Calculates exact Own Cash vs Broker Lended funding for Indian stocks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stock & Broker Quick Configuration */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#0D131C] p-3.5 rounded-xl border border-white/5">
          {/* Stock Symbol */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Stock Symbol</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => {
                const s = e.target.value.toUpperCase();
                setSymbol(s);
                const conf = POPULAR_MTF_STOCKS[cleanSymbol(s)];
                if (conf) {
                  setCompanyName(conf.name);
                  const m =
                    broker === 'ANGELONE'
                      ? conf.angelOneMultiplier
                      : broker === 'GROWW'
                      ? conf.growwMultiplier
                      : conf.zerodhaMultiplier;
                  setSelectedMultiplier(m);
                  setCustomMultiplierInput(m.toString());
                  setIsCustomMultiplier(false);
                }
              }}
              placeholder="e.g. RATNAVEER"
              className="w-full glass-input text-amber-400 font-mono font-bold text-xs uppercase"
            />
          </div>

          {/* Share Buy Price */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Share Price (₹)</label>
            <input
              type="number"
              step="any"
              value={sharePrice}
              onChange={(e) => setSharePrice(e.target.value)}
              className="w-full glass-input text-white font-mono text-xs"
            />
          </div>

          {/* Broker Platform */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Broker Platform</label>
            <select
              value={broker}
              onChange={(e) => {
                const b = e.target.value as 'ZERODHA' | 'GROWW' | 'ANGELONE';
                setBroker(b);
                const conf = POPULAR_MTF_STOCKS[cleanSymbol(symbol)];
                if (conf) {
                  const m =
                    b === 'ANGELONE'
                      ? conf.angelOneMultiplier
                      : b === 'GROWW'
                      ? conf.growwMultiplier
                      : conf.zerodhaMultiplier;
                  setSelectedMultiplier(m);
                  setCustomMultiplierInput(m.toString());
                }
              }}
              className="w-full glass-input text-xs font-semibold bg-[#111822] text-white"
            >
              <option value="ZERODHA">Zerodha (0.04%/day • ₹35.40)</option>
              <option value="GROWW">Groww (0.041%/day • ₹47.20)</option>
              <option value="ANGELONE">Angel One (0.041%/day • ₹47.20)</option>
            </select>
          </div>
        </div>

        {/* Multiplier Presets & Lending Factor Selection */}
        <div className="space-y-2 bg-[#0D131C] p-3.5 rounded-xl border border-amber-500/20">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-amber-400 font-mono flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5" /> Broker Lending Multiplier (Multiplier of Your Cash)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Total Leverage: <strong className="text-white">{(1 + activeMultiplier).toFixed(1)}x</strong> (Margin: {effectiveResult.marginPercent}%)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            {MTF_MULTIPLIER_PRESETS.map((p) => {
              const isSelected = !isCustomMultiplier && selectedMultiplier === p.multiplier;
              return (
                <button
                  key={p.multiplier}
                  type="button"
                  onClick={() => {
                    setSelectedMultiplier(p.multiplier);
                    setIsCustomMultiplier(false);
                    setCustomMultiplierInput(p.multiplier.toString());
                  }}
                  className={`p-2 rounded-lg text-left transition border ${
                    isSelected
                      ? 'bg-amber-500 text-black border-amber-400 shadow-md font-bold'
                      : 'bg-[#121924] text-slate-300 border-white/5 hover:border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-extrabold">{p.label}</span>
                    {p.badge && (
                      <span
                        className={`text-[8px] px-1 py-0.2 rounded font-sans uppercase ${
                          isSelected ? 'bg-black text-amber-300' : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <div className={`text-[9px] mt-0.5 leading-tight ${isSelected ? 'text-black/80' : 'text-slate-400'}`}>
                    {p.sublabel}
                  </div>
                </button>
              );
            })}

            {/* Custom Multiplier Option */}
            <button
              type="button"
              onClick={() => setIsCustomMultiplier(true)}
              className={`p-2 rounded-lg text-left transition border ${
                isCustomMultiplier
                  ? 'bg-amber-500 text-black border-amber-400 font-bold'
                  : 'bg-[#121924] text-slate-300 border-white/5 hover:border-amber-500/40'
              }`}
            >
              <div className="text-xs font-mono font-extrabold">Custom</div>
              <div className={`text-[9px] mt-0.5 ${isCustomMultiplier ? 'text-black/80' : 'text-slate-400'}`}>
                User defined
              </div>
            </button>
          </div>

          {isCustomMultiplier && (
            <div className="pt-2 flex items-center gap-3">
              <label className="text-[11px] text-slate-300 font-semibold shrink-0">Enter Multiplier:</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={customMultiplierInput}
                onChange={(e) => setCustomMultiplierInput(e.target.value)}
                placeholder="e.g. 2.4"
                className="w-28 glass-input text-amber-400 font-mono text-xs font-bold"
              />
              <span className="text-[11px] text-slate-400">
                (e.g. 2.4x means broker lends 2.4 times your cash)
              </span>
            </div>
          )}

          {/* Verified stock note */}
          {cleanSymbol(symbol) === 'RATNAVEER' && (
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />
              <span>
                <strong>Verified Ratnaveer MTF:</strong> Zerodha lends <strong>2.4x</strong> of your cash. ₹10k cash unlocks ₹24k lending = ₹34k total purchasing power (~29.4% margin).
              </span>
            </div>
          )}
        </div>

        {/* Dual Input Calculation Mode Tabs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              Calculation Mode
            </span>
            <div className="flex rounded-lg bg-[#080B10] border border-white/10 p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setCalcMode('cash')}
                className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 ${
                  calcMode === 'cash' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Coins className="h-3 w-3" /> By My Cash (₹)
              </button>
              <button
                type="button"
                onClick={() => setCalcMode('quantity')}
                className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 ${
                  calcMode === 'quantity' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="h-3 w-3" /> By Total Shares
              </button>
            </div>
          </div>

          {/* Input field based on mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0D131C] p-4 rounded-xl border border-white/5">
            {calcMode === 'cash' ? (
              <div>
                <label className="block text-[11px] font-semibold text-amber-300 mb-1">
                  Your Available Cash Capital (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="e.g. 10000"
                  className="w-full glass-input text-amber-400 font-mono font-bold text-base"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Original cash you have in trading account
                </span>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-semibold text-amber-300 mb-1">
                  Total Shares You Want to Buy
                </label>
                <input
                  type="number"
                  step="1"
                  value={totalShares}
                  onChange={(e) => setTotalShares(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full glass-input text-amber-400 font-mono font-bold text-base"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Desired order quantity in shares
                </span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Planned MTF Holding Duration (Days)
              </label>
              <input
                type="number"
                min="0"
                value={holdingDays}
                onChange={(e) => setHoldingDays(e.target.value)}
                placeholder="e.g. 30"
                className="w-full glass-input text-white font-mono text-sm"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Daily interest rate: {effectiveResult.dailyRatePercent}% / day
              </span>
            </div>
          </div>
        </div>

        {/* Visual Capital Split Bar */}
        <div className="space-y-2 bg-[#0D131C] p-4 rounded-xl border border-amber-500/20">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block"></span>
              Your Own Cash: ₹{effectiveResult.actualOwnUsed.toLocaleString('en-IN', { maximumFractionDigits: 0 })} ({effectiveResult.marginPercent}%)
            </span>
            <span className="font-bold text-amber-400 flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block"></span>
              Broker Lended: ₹{effectiveResult.actualBrokerLended.toLocaleString('en-IN', { maximumFractionDigits: 0 })} ({(100 - effectiveResult.marginPercent).toFixed(1)}%)
            </span>
          </div>

          {/* Progress Split Meter */}
          <div className="h-3.5 w-full bg-slate-800 rounded-full overflow-hidden flex border border-white/10">
            <div
              style={{ width: `${effectiveResult.marginPercent}%` }}
              className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full transition-all duration-300"
              title={`Own Cash: ${effectiveResult.marginPercent}%`}
            />
            <div
              style={{ width: `${100 - effectiveResult.marginPercent}%` }}
              className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-300"
              title={`Broker Funded: ${(100 - effectiveResult.marginPercent).toFixed(1)}%`}
            />
          </div>

          {/* Key Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center font-mono">
            <div className="p-2.5 rounded-lg bg-[#080B10] border border-white/5">
              <span className="text-[10px] text-slate-400 block uppercase">Total Purchasing Power</span>
              <span className="text-sm font-bold text-white">
                ₹{effectiveResult.totalPurchasingPower.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[9px] text-amber-400 block mt-0.5">
                {effectiveResult.totalLeverage.toFixed(1)}x Total Power
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#080B10] border border-white/5">
              <span className="text-[10px] text-slate-400 block uppercase">Total Shares Bought</span>
              <span className="text-sm font-bold text-cyan-300">{effectiveResult.totalQuantity}</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">
                Own: {effectiveResult.ownShares} • MTF: {effectiveResult.mtfShares}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#080B10] border border-white/5">
              <span className="text-[10px] text-slate-400 block uppercase">Daily MTF Interest</span>
              <span className="text-sm font-bold text-amber-400">
                ₹{effectiveResult.dailyInterest.toFixed(2)}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">
                {effectiveResult.dailyRatePercent}% / day
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#080B10] border border-white/5">
              <span className="text-[10px] text-slate-400 block uppercase">{daysNum}-Day Total Interest</span>
              <span className="text-sm font-bold text-rose-400">
                ₹{effectiveResult.holdingInterest.toFixed(2)}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">
                + ₹{effectiveResult.pledgeFee.toFixed(2)} pledge
              </span>
            </div>
          </div>
        </div>

        {/* Breakeven & Leverage Amplifier Projections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-[#080B10] border border-white/5 space-y-1.5">
            <div className="font-bold text-slate-300 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-cyan-400" /> Breakeven Target (After MTF Fees)
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-slate-400">Required Sell Price:</span>
              <span className="font-bold text-white text-sm">₹{effectiveResult.breakevenPrice}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-slate-400">Stock Rise Needed:</span>
              <span className="font-bold text-emerald-400">+{effectiveResult.breakevenGrowthPercent}%</span>
            </div>
            <p className="text-[10px] text-slate-500 pt-1 border-t border-white/5">
              Recovers full MTF interest and broker pledge/unpledge charges.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/30 to-[#080B10] border border-emerald-500/30 space-y-1.5">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> Return on Equity (ROE) Amplifier
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-slate-400">If Stock Rallies +10%:</span>
              <span className="font-bold text-emerald-300">+₹{rallyReturnComparison.netGainMtf.toFixed(0)}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-slate-400">MTF Return on Own Cash:</span>
              <span className="font-extrabold text-emerald-400 text-sm">+{rallyReturnComparison.mtfRoePercent}% ROE</span>
            </div>
            <p className="text-[10px] text-emerald-300/80 pt-1 border-t border-white/5">
              Normal delivery return: +10.0% vs MTF return: +{rallyReturnComparison.mtfRoePercent}%
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/10">
          <div className="text-[11px] text-slate-400 font-mono">
            <span>Summary: </span>
            <strong className="text-white">{effectiveResult.totalQuantity} shares</strong> of {symbol} (Own: {effectiveResult.ownShares}, MTF: {effectiveResult.mtfShares})
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl"
            >
              Close
            </button>
            {onApplyTrade && (
              <button
                type="button"
                onClick={() => {
                  onApplyTrade({
                    symbol: symbol.toUpperCase(),
                    companyName,
                    buyPrice: priceNum,
                    quantity: effectiveResult.totalQuantity,
                    ownQuantity: effectiveResult.ownShares,
                    mtfQuantity: effectiveResult.mtfShares,
                    broker,
                    mtfMultiplier: activeMultiplier,
                  });
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl shadow-lg transition"
              >
                <CheckCircle2 className="h-4 w-4" /> Apply to Trade Form
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
