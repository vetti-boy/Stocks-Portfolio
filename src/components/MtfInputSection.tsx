'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Zap, Coins, Sparkles, TrendingUp } from 'lucide-react';
import {
  getMtfMultiplier,
  MTF_MULTIPLIER_PRESETS,
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
}) => {
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
    ? Math.max(1.0, parseFloat(customMultiplierInput) || 2.4)
    : selectedMultiplier;

  const priceNum = Math.max(0.01, parseFloat(buyPrice) || 0);
  const totalQtyNum = Math.max(0, parseFloat(totalQuantity) || 0);

  // Auto-calculate split based on multiplier (1x user cash, (M - 1)x broker funded)
  const split = useMemo(() => {
    return calculateMtfFromTotalQty({
      totalQuantity: totalQtyNum,
      sharePrice: priceNum,
      multiplier: activeMultiplier,
      broker,
    });
  }, [totalQtyNum, priceNum, activeMultiplier, broker]);

  // Keep parent form in sync with calculated own shares and broker shares
  useEffect(() => {
    if (isMTF && totalQtyNum > 0) {
      onChangeOwnQuantity(split.ownQuantity.toString());
      onChangeMtfQuantity(split.mtfQuantity.toString());
    }
  }, [isMTF, split.ownQuantity, split.mtfQuantity]);

  const handleMultiplierChange = (mult: number) => {
    setSelectedMultiplier(mult);
    setIsCustomMultiplier(false);
    setCustomMultiplierInput(mult.toString());
    if (onChangeMultiplier) onChangeMultiplier(mult);

    const newSplit = calculateMtfFromTotalQty({
      totalQuantity: totalQtyNum,
      sharePrice: priceNum,
      multiplier: mult,
      broker,
    });
    onChangeOwnQuantity(newSplit.ownQuantity.toString());
    onChangeMtfQuantity(newSplit.mtfQuantity.toString());
  };

  const handleCustomMultiplierChange = (customStr: string) => {
    setCustomMultiplierInput(customStr);
    const m = Math.max(1.0, parseFloat(customStr) || 2.4);
    if (onChangeMultiplier) onChangeMultiplier(m);

    const newSplit = calculateMtfFromTotalQty({
      totalQuantity: totalQtyNum,
      sharePrice: priceNum,
      multiplier: m,
      broker,
    });
    onChangeOwnQuantity(newSplit.ownQuantity.toString());
    onChangeMtfQuantity(newSplit.mtfQuantity.toString());
  };

  const dailyRate = (broker === 'GROWW' || broker === 'ANGELONE') ? 0.041 : 0.04;

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
              Auto capital & share split based on multiplier
            </span>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isMTF}
            onChange={(e) => {
              const checked = e.target.checked;
              onToggleMtf(checked);
              if (checked && totalQtyNum > 0) {
                onChangeOwnQuantity(split.ownQuantity.toString());
                onChangeMtfQuantity(split.mtfQuantity.toString());
              }
            }}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
        </label>
      </div>

      {isMTF && (
        <div className="space-y-3 pt-1 border-t border-amber-500/20">
          {/* Verified stock badge if applicable */}
          {cleanSymbol(symbol) === 'RATNAVEER' && (
            <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-400" />
              <span>
                <strong>Ratnaveer Precision:</strong> <strong>2.4x Multiplier</strong> (1x own cash + 1.4x broker funded • ~41.7% own capital).
              </span>
            </div>
          )}

          {/* Broker Multiplier Selector Chips */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <Coins className="h-3 w-3 text-amber-400" /> Broker Multiplier:
              </span>
              <span className="font-mono text-amber-400 font-bold">
                {activeMultiplier}x Total (1.0x Own • {(activeMultiplier - 1).toFixed(1)}x Broker)
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5">
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
                      {p.badge || `${p.multiplier}x`}
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
                  min="1.0"
                  max="10"
                  value={customMultiplierInput}
                  onChange={(e) => handleCustomMultiplierChange(e.target.value)}
                  placeholder="e.g. 2.4"
                  className="w-20 glass-input text-amber-400 font-mono text-xs font-bold py-1 px-2"
                />
                <span className="text-[10px] text-slate-500">
                  (1.0x Own Cash + {(activeMultiplier - 1).toFixed(1)}x Broker Funded)
                </span>
              </div>
            )}
          </div>

          {/* Automatic Multiplier Split Cards - No manual own shares prompt */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-[#090E16] p-2.5 rounded-xl border border-white/5">
            <div>
              <span className="text-slate-400 block text-[10px]">Total Order Value:</span>
              <span className="font-bold text-white text-xs">
                ₹{split.totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] text-slate-500 block">{totalQtyNum} shares ({activeMultiplier}x)</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px]">Daily Interest:</span>
              <span className="font-bold text-amber-400 text-xs">
                ₹{split.dailyInterest} / day
              </span>
              <span className="text-[9px] text-slate-500 block">Pledge fee: ₹{split.pledgeFee.toFixed(2)}</span>
            </div>

            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-emerald-400 block text-[10px] font-semibold">Your Own Cash (1.0x):</span>
              <span className="font-bold text-[#22C55E] text-xs">
                ₹{split.ownAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] text-emerald-300/80 block font-bold">{split.ownQuantity} shares ({split.marginPercent.toFixed(1)}%)</span>
            </div>

            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="text-amber-400 block text-[10px] font-semibold">
                Broker Funded ({(activeMultiplier - 1).toFixed(1)}x):
              </span>
              <span className="font-bold text-[#F59E0B] text-xs">
                ₹{split.brokerLendedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] text-amber-300/80 block font-bold">{split.mtfQuantity} shares ({(100 - split.marginPercent).toFixed(1)}%)</span>
            </div>
          </div>

          {/* Visual Capital Split Meter */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-emerald-400 font-semibold">
                1.0x Own Cash: ₹{split.ownAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} ({split.marginPercent.toFixed(1)}%)
              </span>
              <span className="text-amber-400 font-semibold">
                {(activeMultiplier - 1).toFixed(1)}x Broker Funded: ₹{split.brokerLendedAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} ({(100 - split.marginPercent).toFixed(1)}%)
              </span>
            </div>

            <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex border border-white/10">
              <div
                style={{ width: `${Math.min(100, Math.max(0, split.marginPercent))}%` }}
                className="bg-emerald-500 h-full transition-all duration-200"
              />
              <div
                style={{ width: `${Math.min(100, Math.max(0, 100 - split.marginPercent))}%` }}
                className="bg-amber-400 h-full transition-all duration-200"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
