'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Zap, Coins, TrendingUp } from 'lucide-react';
import {
  getMtfMultiplier,
  calculateMtfFromTotalQty,
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
  const [multiplierInput, setMultiplierInput] = useState<string>(
    mtfMultiplier ? mtfMultiplier.toString() : '2.5'
  );

  // Detect verified stock config when symbol or broker changes
  const stockConfig = useMemo(() => {
    return getMtfMultiplier(symbol, broker);
  }, [symbol, broker]);

  // When stock changes to a known stock, pre-populate its lending multiplier
  useEffect(() => {
    if (stockConfig.isVerified) {
      setMultiplierInput(stockConfig.multiplier.toString());
      if (onChangeMultiplier) {
        onChangeMultiplier(stockConfig.multiplier);
      }
    }
  }, [stockConfig.multiplier, stockConfig.isVerified, symbol]);

  const activeMultiplier = Math.max(1.0, parseFloat(multiplierInput) || 2.5);

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

  const handleMultiplierChange = (customStr: string) => {
    setMultiplierInput(customStr);
    const m = Math.max(1.0, parseFloat(customStr) || 2.5);
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
    <div className="p-3.5 bg-gradient-to-b from-amber-500/[0.08] to-amber-950/20 border border-amber-500/25 rounded-xl space-y-3.5">
      {/* Top Toggle Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-amber-500/20 border border-amber-500/35 flex items-center justify-center text-amber-400">
            <Zap className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-400 font-mono block">
              Margin Trading Facility (MTF)
            </span>
            <span className="text-[10px] text-amber-200/70 block">
              Auto capital & share split based on broker multiplier
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
          <div className="w-9 h-5 bg-[#090E16] border border-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
        </label>
      </div>

      {isMTF && (
        <div className="space-y-3 pt-1 border-t border-amber-500/20">
          {/* Broker Multiplier Custom Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <label className="font-semibold text-slate-300 flex items-center gap-1">
                <Coins className="h-3 w-3 text-amber-400" /> Broker Multiplier:
              </label>
              <span className="font-mono text-amber-400 font-bold">
                {activeMultiplier}x Total (1.0x Own • {(activeMultiplier - 1).toFixed(1)}x Broker)
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono">
              <div className="relative w-28">
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="10.0"
                  value={multiplierInput}
                  onChange={(e) => handleMultiplierChange(e.target.value)}
                  placeholder="2.5"
                  className="w-full bg-[#090E16] border border-amber-500/40 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-bold pr-6 outline-none focus:ring-1 focus:ring-amber-400"
                />
                <span className="absolute right-2 top-1.5 text-xs font-bold text-amber-400">x</span>
              </div>
              <span className="text-[10px] text-slate-400 font-sans">
                Enter your broker approved multiplier (e.g. 2.0x, 2.5x, 3.5x, 4.0x)
              </span>
            </div>
          </div>

          {/* Capital Distribution Breakdown Cards */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {/* Own Capital Card */}
            <div className="p-2.5 rounded-lg bg-[#090E16]/90 border border-emerald-500/30">
              <div className="flex items-center justify-between text-[10px] text-emerald-400 font-sans">
                <span className="font-bold">YOUR CASH ({split.marginPercent.toFixed(0)}%)</span>
                <span>1.0x</span>
              </div>
              <div className="mt-1 text-sm font-bold text-white">
                ₹{split.ownAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {split.ownQuantity} / {totalQtyNum} shares
              </div>
            </div>

            {/* Broker Margin Card */}
            <div className="p-2.5 rounded-lg bg-[#090E16]/90 border border-amber-500/30">
              <div className="flex items-center justify-between text-[10px] text-amber-400 font-sans">
                <span className="font-bold">BROKER FUNDED ({(100 - split.marginPercent).toFixed(0)}%)</span>
                <span>{(activeMultiplier - 1).toFixed(1)}x</span>
              </div>
              <div className="mt-1 text-sm font-bold text-white">
                ₹{split.brokerLendedAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {split.mtfQuantity} / {totalQtyNum} shares
              </div>
            </div>
          </div>

          {/* MTF Daily Interest & Terms Micro-Footnote */}
          <div className="flex items-center justify-between text-[10px] text-amber-300/80 font-mono pt-1 border-t border-amber-500/15">
            <span className="flex items-center gap-1 font-sans">
              <TrendingUp className="h-3 w-3 text-amber-400" />
              Daily Interest: {dailyRate}% / day (~{(dailyRate * 365).toFixed(2)}% p.a.)
            </span>
            <span>
              1d Est: ₹{split.dailyInterest.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
