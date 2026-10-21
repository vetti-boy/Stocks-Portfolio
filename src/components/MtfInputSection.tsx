'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Zap, Coins, TrendingUp, Sparkles, Sliders, Info } from 'lucide-react';
import {
  getMtfMultiplier,
  MTF_MULTIPLIER_PRESETS,
  calculateMtfFromCash,
  calculateMtfFromTotalQty,
  cleanSymbol,
} from '@/lib/mtfUtils';

export interface MtfInputSectionProps {
  symbol: string;
  broker: 'ZERODHA' | 'GROWW' | 'ANGELONE';
  buyPrice: string;
  totalQuantity: string;
  ownQuantity: string;
  mtfQuantity: string;
  isMTF: boolean;
  onToggleMtf: (isMTF: boolean) => void;
  onChangeTotalQuantity: (qty: string) => void;
  onChangeOwnQuantity: (ownQty: string) => void;
  onChangeMtfQuantity: (mtfQty: string) => void;
  mtfMultiplier?: number;
  onChangeMultiplier?: (multiplier: number) => void;
  onOpenAnalyzer?: () => void;
}

export const MtfInputSection: React.FC<MtfInputSectionProps> = ({
  symbol,
  broker,
  buyPrice,
  totalQuantity,
  ownQuantity,
  mtfQuantity,
  isMTF,
  onToggleMtf,
  onChangeTotalQuantity,
  onChangeOwnQuantity,
  onChangeMtfQuantity,
  mtfMultiplier,
  onChangeMultiplier,
  onOpenAnalyzer,
}) => {
  const [calcMode, setCalcMode] = useState<'qty' | 'cash'>('qty');
  const [cashAmountInput, setCashAmountInput] = useState<string>('10000');
  const [selectedMultiplier, setSelectedMultiplier] = useState<number>(mtfMultiplier || 2.4);
  const [isCustomMultiplier, setIsCustomMultiplier] = useState(false);
  const [customMultiplierInput, setCustomMultiplierInput] = useState<string>('2.4');

  // Detect verified stock config when symbol or broker changes
  const stockConfig = useMemo(() => {
    return getMtfMultiplier(symbol, broker);
  }, [symbol, broker]);

  // When stock changes to a known stock (like Ratnaveer), auto-select its lending multiplier
  useEffect(() => {
    if (stockConfig.isVerified) {
      setSelectedMultiplier(stockConfig.multiplier);
      setCustomMultiplierInput(stockConfig.multiplier.toString());
      setIsCustomMultiplier(false);
      if (onChangeMultiplier) {
        onChangeMultiplier(stockConfig.multiplier);
      }
    }
  }, [stockConfig.multiplier, stockConfig.isVerified, symbol]);

  const activeMultiplier = isCustomMultiplier
    ? Math.max(0.1, parseFloat(customMultiplierInput) || 2.4)
    : selectedMultiplier;

  const priceNum = Math.max(0.01, parseFloat(buyPrice) || 0);
  const totalQtyNum = Math.max(0, parseFloat(totalQuantity) || 0);
  const ownQtyNum = Math.max(0, parseFloat(ownQuantity) || 0);
  const mtfQtyNum = Math.max(0, parseFloat(mtfQuantity) || 0);

  // Split calculation when in 'qty' mode
  const qtyCalculated = useMemo(() => {
    return calculateMtfFromTotalQty({
      totalQuantity: totalQtyNum,
      sharePrice: priceNum,
      multiplier: activeMultiplier,
      broker,
    });
  }, [totalQtyNum, priceNum, activeMultiplier, broker]);

  // Recalculate and sync ownQuantity and mtfQuantity when totalQuantity or multiplier changes in 'qty' mode
  const handleApplySplitFromQty = (newTotalQtyStr: string, multiplierVal: number) => {
    const qNum = Math.max(0, parseFloat(newTotalQtyStr) || 0);
    if (qNum <= 0) return;
    const split = calculateMtfFromTotalQty({
      totalQuantity: qNum,
      sharePrice: priceNum,
      multiplier: multiplierVal,
      broker,
    });
    onChangeOwnQuantity(split.ownQuantity.toString());
    onChangeMtfQuantity(split.mtfQuantity.toString());
  };

  // Recalculate when user inputs Cash Amount in 'cash' mode
  const handleCashAmountChange = (cashStr: string, multiplierVal: number) => {
    setCashAmountInput(cashStr);
    const cNum = Math.max(0, parseFloat(cashStr) || 0);
    if (cNum > 0 && priceNum > 0) {
      const split = calculateMtfFromCash({
        cashAmount: cNum,
        sharePrice: priceNum,
        multiplier: multiplierVal,
        broker,
      });
      onChangeTotalQuantity(split.totalQuantity.toString());
      onChangeOwnQuantity(split.ownQuantity.toString());
      onChangeMtfQuantity(split.mtfQuantity.toString());
    }
  };

  const handleMultiplierChange = (mult: number) => {
    setSelectedMultiplier(mult);
    setIsCustomMultiplier(false);
    setCustomMultiplierInput(mult.toString());
    if (onChangeMultiplier) onChangeMultiplier(mult);

    if (calcMode === 'cash') {
      handleCashAmountChange(cashAmountInput, mult);
    } else {
      handleApplySplitFromQty(totalQuantity, mult);
    }
  };

  const handleCustomMultiplierChange = (customStr: string) => {
    setCustomMultiplierInput(customStr);
    const m = Math.max(0.1, parseFloat(customStr) || 2.4);
    if (onChangeMultiplier) onChangeMultiplier(m);

    if (calcMode === 'cash') {
      handleCashAmountChange(cashAmountInput, m);
    } else {
      handleApplySplitFromQty(totalQuantity, m);
    }
  };

  // Effective visual stats
  const effectiveTotalCost = totalQtyNum * priceNum;
  const effectiveOwnAmount = (ownQuantity !== '' ? ownQtyNum : qtyCalculated.ownQuantity) * priceNum;
  const effectiveMtfAmount = (mtfQuantity !== '' ? mtfQtyNum : qtyCalculated.mtfQuantity) * priceNum;
  const effectiveMarginPct = effectiveTotalCost > 0 ? (effectiveOwnAmount / effectiveTotalCost) * 100 : (1 / (1 + activeMultiplier)) * 100;
  const dailyRate = (broker === 'GROWW' || broker === 'ANGELONE') ? 0.041 : 0.04;
  const dailyInterest = (effectiveMtfAmount * (dailyRate / 100)).toFixed(2);
  const pledgeFee = (broker === 'GROWW' || broker === 'ANGELONE') ? 47.20 : 35.40;

  return (
    <div className="p-3.5 bg-gradient-to-b from-amber-500/10 to-amber-950/20 border border-amber-500/30 rounded-xl space-y-3.5">
      {/* Top Toggle Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Zap className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-400 font-mono block">
              Margin Trading Facility (MTF)
            </span>
            <span className="text-[10px] text-amber-200/70 block">
              Lending multiplier & auto share splitter
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenAnalyzer && (
            <button
              type="button"
              onClick={onOpenAnalyzer}
              className="text-[10px] font-mono font-bold text-amber-300 hover:text-white px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 transition flex items-center gap-1"
            >
              <Sliders className="h-3 w-3" /> Analyzer
            </button>
          )}

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isMTF}
              onChange={(e) => {
                const checked = e.target.checked;
                onToggleMtf(checked);
                if (checked) {
                  handleApplySplitFromQty(totalQuantity, activeMultiplier);
                }
              }}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>
      </div>

      {isMTF && (
        <div className="space-y-3 pt-1 border-t border-amber-500/20">
          {/* Verified stock badge if applicable */}
          {cleanSymbol(symbol) === 'RATNAVEER' && (
            <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-400" />
              <span>
                <strong>Ratnaveer Precision:</strong> Zerodha lends <strong>2.4x</strong> of your cash (Total <strong>3.4x</strong> buying power • ~29.4% margin).
              </span>
            </div>
          )}

          {/* Broker Lending Multiplier Selector Chips */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <Coins className="h-3 w-3 text-amber-400" /> Broker Lending Multiplier:
              </span>
              <span className="font-mono text-amber-400 font-bold">
                Total Leverage: {(1 + activeMultiplier).toFixed(1)}x
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {MTF_MULTIPLIER_PRESETS.map((p) => {
                const isSelected = !isCustomMultiplier && selectedMultiplier === p.multiplier;
                return (
                  <button
                    key={p.multiplier}
                    type="button"
                    onClick={() => handleMultiplierChange(p.multiplier)}
                    className={`px-2 py-1.5 rounded-lg text-center transition border font-mono ${
                      isSelected
                        ? 'bg-amber-500 text-black border-amber-400 font-extrabold shadow'
                        : 'bg-[#0E1520] text-slate-300 border-white/5 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="text-xs">{p.label}</div>
                    <div className={`text-[8px] truncate ${isSelected ? 'text-black/80 font-bold' : 'text-slate-400'}`}>
                      {p.badge || `${(1 + p.multiplier).toFixed(1)}x`}
                    </div>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setIsCustomMultiplier(true)}
                className={`px-2 py-1.5 rounded-lg text-center transition border font-mono ${
                  isCustomMultiplier
                    ? 'bg-amber-500 text-black border-amber-400 font-extrabold shadow'
                    : 'bg-[#0E1520] text-slate-300 border-white/5 hover:border-amber-500/40'
                }`}
              >
                <div className="text-xs">Custom</div>
                <div className={`text-[8px] ${isCustomMultiplier ? 'text-black/80 font-bold' : 'text-slate-400'}`}>
                  Custom
                </div>
              </button>
            </div>

            {isCustomMultiplier && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-400">Multiplier factor:</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10"
                  value={customMultiplierInput}
                  onChange={(e) => handleCustomMultiplierChange(e.target.value)}
                  placeholder="e.g. 2.4"
                  className="w-20 glass-input text-amber-400 font-mono text-xs font-bold py-1 px-2"
                />
                <span className="text-[10px] text-slate-500">
                  (Broker lends {activeMultiplier}x your cash)
                </span>
              </div>
            )}
          </div>

          {/* Dual Calculation Mode Switcher */}
          <div className="space-y-2 bg-[#090E16] p-2.5 rounded-xl border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                Input Mode
              </span>
              <div className="flex rounded-md bg-[#05070B] border border-white/10 p-0.5 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => {
                    setCalcMode('qty');
                    handleApplySplitFromQty(totalQuantity, activeMultiplier);
                  }}
                  className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                    calcMode === 'qty' ? 'bg-amber-500 text-black font-bold shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <TrendingUp className="h-2.5 w-2.5" /> Total Shares
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCalcMode('cash');
                    handleCashAmountChange(cashAmountInput, activeMultiplier);
                  }}
                  className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                    calcMode === 'cash' ? 'bg-amber-500 text-black font-bold shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Coins className="h-2.5 w-2.5" /> By My Cash (₹)
                </button>
              </div>
            </div>

            {calcMode === 'cash' ? (
              <div>
                <label className="block text-[11px] font-semibold text-amber-300 mb-1">
                  Enter Your Available Cash (₹):
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">₹</span>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 10000"
                      value={cashAmountInput}
                      onChange={(e) => handleCashAmountChange(e.target.value, activeMultiplier)}
                      className="w-full glass-input pl-6 text-amber-400 font-mono font-bold text-xs"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    Broker gives: <strong className="text-amber-300">₹{(Math.max(0, parseFloat(cashAmountInput) || 0) * activeMultiplier).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>Total Order Shares: <strong className="text-white font-mono">{totalQtyNum} shares</strong></span>
                <button
                  type="button"
                  onClick={() => handleApplySplitFromQty(totalQuantity, activeMultiplier)}
                  className="text-amber-400 hover:underline font-mono"
                >
                  Re-split by {activeMultiplier}x factor
                </button>
              </div>
            )}
          </div>

          {/* Visual Capital Split Meter */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-emerald-400 font-semibold">
                Your Cash: ₹{effectiveOwnAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} ({effectiveMarginPct.toFixed(1)}%)
              </span>
              <span className="text-amber-400 font-semibold">
                Broker Lended: ₹{effectiveMtfAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} ({(100 - effectiveMarginPct).toFixed(1)}%)
              </span>
            </div>

            <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex border border-white/10">
              <div
                style={{ width: `${Math.min(100, Math.max(0, effectiveMarginPct))}%` }}
                className="bg-emerald-500 h-full transition-all duration-200"
              />
              <div
                style={{ width: `${Math.min(100, Math.max(0, 100 - effectiveMarginPct))}%` }}
                className="bg-amber-400 h-full transition-all duration-200"
              />
            </div>
          </div>

          {/* Own Shares vs MTF Borrowed Shares Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Own Shares (Your Cash)
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 29"
                value={ownQuantity}
                onChange={(e) => {
                  const val = e.target.value;
                  onChangeOwnQuantity(val);
                  const o = parseFloat(val) || 0;
                  onChangeMtfQuantity(Math.max(0, totalQtyNum - o).toString());
                }}
                className="w-full glass-input text-emerald-400 font-bold font-mono text-xs"
              />
              <span className="text-[9px] text-slate-400 mt-0.5 block font-mono">
                ₹{effectiveOwnAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                MTF Borrowed Shares
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 71"
                value={mtfQuantity}
                onChange={(e) => {
                  const val = e.target.value;
                  onChangeMtfQuantity(val);
                  const m = parseFloat(val) || 0;
                  onChangeOwnQuantity(Math.max(0, totalQtyNum - m).toString());
                }}
                className="w-full glass-input text-amber-400 font-mono font-bold text-xs"
              />
              <span className="text-[9px] text-slate-400 mt-0.5 block font-mono">
                ₹{effectiveMtfAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          {/* Daily Interest & Statutory Fees Notice */}
          <div className="flex items-center justify-between text-[10px] text-amber-200/80 font-mono pt-1 border-t border-white/5">
            <span>Daily Interest: <strong className="text-amber-400">₹{dailyInterest} / day</strong> ({dailyRate}%/d)</span>
            <span>Pledge: ₹{pledgeFee.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
