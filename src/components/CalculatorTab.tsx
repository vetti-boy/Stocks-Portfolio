'use client';

import React, { useState, useMemo } from 'react';
import { useStock } from '@/context/StockContext';
import {
  Calculator,
  Target,
  IndianRupee,
  Receipt,
  ArrowDownRight,
  ArrowUpRight,
  Scale,
} from 'lucide-react';
import { calculateEquityDeliveryBrokerage } from '@/lib/brokerageCalculator';

export const CalculatorTab: React.FC = () => {
  const { taxSettings, updateTaxSettings } = useStock();

  // Mode: 'forward' (Known Sell Price -> Net P&L) or 'reverse' (Target Net P&L -> Required Sell Price)
  const [mode, setMode] = useState<'forward' | 'reverse'>('forward');

  // Input states in INR
  const [quantity, setQuantity] = useState<string>('100');
  const [buyPrice, setBuyPrice] = useState<string>('100.00');
  const [sellPrice, setSellPrice] = useState<string>('100.00');
  const [targetNetPnL, setTargetNetPnL] = useState<string>('5000.00');
  const [holdingMonths, setHoldingMonths] = useState<string>('8');
  const [exchange, setExchange] = useState<'NSE' | 'BSE'>(taxSettings.exchange || 'NSE');

  // Selected Broker: Only Zerodha or Groww
  const activeBroker = (taxSettings.brokerPreset === 'GROWW' ? 'GROWW' : 'ZERODHA') as 'ZERODHA' | 'GROWW';

  // Itemized Calculations
  const result = useMemo(() => {
    const qty = Math.max(0.0001, parseFloat(quantity) || 0);
    const buyP = Math.max(0, parseFloat(buyPrice) || 0);
    const sellP = Math.max(0, parseFloat(sellPrice) || 0);
    const targetPnL = parseFloat(targetNetPnL) || 0;
    const months = parseFloat(holdingMonths) || 0;

    return calculateEquityDeliveryBrokerage({
      quantity: qty,
      buyPrice: buyP,
      sellPrice: sellP,
      targetNetPnL: targetPnL,
      holdingMonths: months,
      taxSettings: { ...taxSettings, brokerPreset: activeBroker, exchange },
      mode,
    });
  }, [mode, quantity, buyPrice, sellPrice, targetNetPnL, holdingMonths, taxSettings, activeBroker, exchange]);

  return (
    <div className="space-y-8">
      {/* Mode Switcher Banner */}
      <div className="bg-[#0D1218] rounded-xl p-6 border border-[#202A35] shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#F4F7FA] font-mono flex items-center gap-2.5">
            <Calculator className="h-5 w-5 text-[#38BDF8]" />
            <span>Zerodha & Groww Equity Delivery Brokerage Calculator</span>
          </h2>
          <p className="text-xs text-[#8D99A8] mt-1">
            Itemized Buy & Sell side statutory charges (STT, Exchange Txn, SEBI, GST, Stamp Duty & DP charges) under Indian SEBI rules.
          </p>
        </div>

        {/* Mode Toggle Pills */}
        <div className="flex items-center rounded-lg bg-[#080B10] border border-[#202A35] p-1 text-xs font-semibold shrink-0">
          <button
            onClick={() => setMode('forward')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-mono transition ${
              mode === 'forward'
                ? 'bg-[#38BDF8] text-[#080B10] font-bold shadow'
                : 'text-[#8D99A8] hover:text-[#F4F7FA]'
            }`}
          >
            <Calculator className="h-3.5 w-3.5" /> Forward Net P&L
          </button>
          <button
            onClick={() => setMode('reverse')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-mono transition ${
              mode === 'reverse'
                ? 'bg-[#22C55E] text-[#080B10] font-bold shadow'
                : 'text-[#8D99A8] hover:text-[#F4F7FA]'
            }`}
          >
            <Target className="h-3.5 w-3.5" /> Target Sell Price
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Input Settings (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Trade Parameters Card */}
          <div className="bg-[#0D1218] rounded-xl p-6 space-y-5 border border-[#202A35] shadow-lg">
            <div className="flex items-center justify-between border-b border-[#202A35] pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#38BDF8] font-mono">
                1. TRADE & INVESTMENT PARAMETERS (₹ INR)
              </h3>
              {/* Exchange Selector Toggle (NSE vs BSE) */}
              <div className="flex items-center bg-[#080B10] border border-[#202A35] rounded-lg p-0.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => {
                    setExchange('NSE');
                    updateTaxSettings({ exchange: 'NSE' });
                  }}
                  className={`px-3 py-1 rounded font-bold transition ${
                    exchange === 'NSE' ? 'bg-[#38BDF8] text-black shadow' : 'text-[#8D99A8] hover:text-white'
                  }`}
                >
                  NSE
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExchange('BSE');
                    updateTaxSettings({ exchange: 'BSE' });
                  }}
                  className={`px-3 py-1 rounded font-bold transition ${
                    exchange === 'BSE' ? 'bg-[#8B5CF6] text-white shadow' : 'text-[#8D99A8] hover:text-white'
                  }`}
                >
                  BSE
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#8D99A8] mb-1.5">
                  Quantity (Shares)
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-[#080B10] text-[#F4F7FA] border border-[#202A35] rounded-lg p-2.5 font-mono text-sm focus:border-[#38BDF8] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8D99A8] mb-1.5">
                  Buy Price per Share (₹)
                </label>
                <input
                  type="number"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  className="w-full bg-[#080B10] text-[#F4F7FA] border border-[#202A35] rounded-lg p-2.5 font-mono text-sm focus:border-[#38BDF8] outline-none"
                />
              </div>
            </div>

            {mode === 'forward' ? (
              <div>
                <label className="block text-xs font-semibold text-[#8D99A8] mb-1.5">
                  Expected Sell Price per Share (₹)
                </label>
                <input
                  type="number"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  className="w-full bg-[#080B10] text-[#22C55E] border border-[#202A35] rounded-lg p-2.5 font-mono text-sm font-bold focus:border-[#22C55E] outline-none"
                />
              </div>
            ) : (
              <div className="rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 p-4 space-y-2">
                <label className="block text-xs font-bold text-[#22C55E] font-mono">
                  Target Desired Net Profit (₹)
                </label>
                <input
                  type="number"
                  value={targetNetPnL}
                  onChange={(e) => setTargetNetPnL(e.target.value)}
                  className="w-full bg-[#080B10] border border-[#22C55E]/50 rounded-lg p-2.5 font-mono text-[#22C55E] text-lg font-bold focus:border-[#22C55E] outline-none"
                />
                <span className="text-[11px] text-[#8D99A8] block">
                  Enter exact take-home net profit after all taxes & SEBI charges.
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#8D99A8] mb-2 font-mono">
                Holding Period: <span className="text-[#38BDF8] font-bold">{holdingMonths} months</span>
              </label>
              <input
                type="range"
                min="1"
                max="36"
                value={holdingMonths}
                onChange={(e) => setHoldingMonths(e.target.value)}
                className="w-full accent-[#38BDF8] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-semibold mt-2 font-mono">
                <span className={result.isLongTerm ? 'text-[#596574]' : 'text-[#F59E0B] font-bold'}>
                  Short-Term (&le; 12 mo) - STCG: {taxSettings.stcgRatePercent}%
                </span>
                <span className={result.isLongTerm ? 'text-[#22C55E] font-bold' : 'text-[#596574]'}>
                  Long-Term (&gt; 12 mo) - LTCG: {taxSettings.ltcgRatePercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Broker Selector: ONLY Zerodha & Groww */}
          <div className="bg-[#0D1218] rounded-xl p-6 space-y-4 border border-[#202A35] shadow-lg">
            <div className="flex items-center justify-between border-b border-[#202A35] pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8B5CF6] flex items-center gap-2 font-mono">
                <IndianRupee className="h-4 w-4 text-[#22C55E]" /> 2. SELECT BROKER PLATFORM
              </h3>
              <span className="text-[10px] text-[#8D99A8] font-mono">SEBI Equity Delivery</span>
            </div>

            {/* Zerodha & Groww Selector Cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Zerodha */}
              <button
                type="button"
                onClick={() =>
                  updateTaxSettings({
                    brokerPreset: 'ZERODHA',
                    flatBrokerageBuy: 0,
                    flatBrokerageSell: 0,
                    brokeragePercent: 0,
                    sttPercent: 0.1,
                    stampDutyPercent: 0.015,
                    gstPercent: 18,
                    flatDpCharges: 15.34,
                  })
                }
                className={`p-4 rounded-xl border text-left transition flex flex-col justify-between active:scale-95 ${
                  activeBroker === 'ZERODHA'
                    ? 'bg-[#111820] border-[#38BDF8] shadow-lg ring-2 ring-[#38BDF8]/40'
                    : 'bg-[#080B10] border-[#202A35] hover:border-[#38BDF8]/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#F4F7FA] text-sm font-mono">Zerodha</span>
                    {activeBroker === 'ZERODHA' && <span className="h-2.5 w-2.5 rounded-full bg-[#38BDF8]" />}
                  </div>
                  <span className="text-xs text-[#38BDF8] font-bold block mt-1">₹0 Brokerage (Delivery)</span>
                  <span className="text-[11px] text-[#8D99A8] block mt-0.5">DP Charge: ₹15.34 on Sell</span>
                </div>
              </button>

              {/* Groww */}
              <button
                type="button"
                onClick={() =>
                  updateTaxSettings({
                    brokerPreset: 'GROWW',
                    flatBrokerageBuy: 20,
                    flatBrokerageSell: 20,
                    brokeragePercent: 0.05,
                    sttPercent: 0.1,
                    stampDutyPercent: 0.015,
                    gstPercent: 18,
                    flatDpCharges: 15.93,
                  })
                }
                className={`p-4 rounded-xl border text-left transition flex flex-col justify-between active:scale-95 ${
                  activeBroker === 'GROWW'
                    ? 'bg-[#111820] border-[#22C55E] shadow-lg ring-2 ring-[#22C55E]/40'
                    : 'bg-[#080B10] border-[#202A35] hover:border-[#22C55E]/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#F4F7FA] text-sm font-mono">Groww</span>
                    {activeBroker === 'GROWW' && <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />}
                  </div>
                  <span className="text-xs text-[#22C55E] font-bold block mt-1">₹20 or 0.05% Max Order</span>
                  <span className="text-[11px] text-[#8D99A8] block mt-0.5">DP Charge: ₹15.93 on Sell</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Output Results Panel (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Target Selling Price Card in Reverse Mode */}
          {mode === 'reverse' && result.requiredSellPricePerShare && (
            <div className="bg-[#0D1218] rounded-xl p-6 border-2 border-[#22C55E] shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between text-[#22C55E] text-xs font-bold uppercase tracking-wider font-mono">
                <span>TARGET SELLING PRICE REQUIRED</span>
                <Target className="h-5 w-5 text-[#22C55E]" />
              </div>
              <div className="mt-3 text-3xl sm:text-4xl font-extrabold font-mono text-[#F4F7FA] tracking-tight">
                ₹{result.requiredSellPricePerShare.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                <span className="text-xs font-normal text-[#8D99A8] ml-1.5">/ share</span>
              </div>
              <p className="mt-2 text-xs text-[#22C55E] font-semibold tracking-wide">
                Sell at or above this price to take home net profit of ₹
                {parseFloat(targetNetPnL).toLocaleString('en-IN')} after all taxes & charges!
              </p>
            </div>
          )}

          {/* ITEM-BY-ITEM SEPARATE BUY & SELL CHARGES CONTRACT NOTE CARD */}
          <div className="bg-[#0D1218] rounded-xl p-6 space-y-5 border border-[#202A35] shadow-xl">
            <div className="flex items-center justify-between border-b border-[#202A35] pb-3 font-mono">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-[#38BDF8]" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#F4F7FA]">
                  {activeBroker} Delivery Contract Note
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30">
                {exchange} Exchange
              </span>
            </div>

            {/* SEPARATE BUY SIDE vs SELL SIDE CHARGES TABLE */}
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-xs font-mono text-left">
                <thead>
                  <tr className="border-b border-[#202A35] text-[#8D99A8] uppercase text-[10px]">
                    <th className="py-2 pr-2">Charge Category</th>
                    <th className="py-2 px-2 text-right text-[#38BDF8]">Buy Side (₹)</th>
                    <th className="py-2 px-2 text-right text-[#22C55E]">Sell Side (₹)</th>
                    <th className="py-2 pl-2 text-right text-white">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202A35]/60 text-[#F4F7FA]">
                  {/* Turnover */}
                  <tr>
                    <td className="py-2 text-[#8D99A8]">Order Turnover</td>
                    <td className="py-2 text-right">₹{result.buyTurnover.toFixed(2)}</td>
                    <td className="py-2 text-right">₹{result.sellTurnover.toFixed(2)}</td>
                    <td className="py-2 text-right font-bold">₹{result.turnover.toFixed(2)}</td>
                  </tr>

                  {/* Brokerage */}
                  <tr>
                    <td className="py-2 text-[#8D99A8]">Brokerage Charge</td>
                    <td className="py-2 text-right">₹{result.buyBrokerage.toFixed(2)}</td>
                    <td className="py-2 text-right">₹{result.sellBrokerage.toFixed(2)}</td>
                    <td className="py-2 text-right font-bold">₹{result.totalBrokerage.toFixed(2)}</td>
                  </tr>

                  {/* STT */}
                  <tr>
                    <td className="py-2 text-[#8D99A8]">STT (0.1% Buy / 0.1% Sell)</td>
                    <td className="py-2 text-right">₹{result.buyStt.toFixed(2)}</td>
                    <td className="py-2 text-right">₹{result.sellStt.toFixed(2)}</td>
                    <td className="py-2 text-right font-bold">₹{result.totalStt.toFixed(2)}</td>
                  </tr>

                  {/* Exchange Txn */}
                  <tr>
                    <td className="py-2 text-[#8D99A8]">Exchange Txn ({exchange})</td>
                    <td className="py-2 text-right">₹{result.buyExchangeTxn.toFixed(2)}</td>
                    <td className="py-2 text-right">₹{result.sellExchangeTxn.toFixed(2)}</td>
                    <td className="py-2 text-right font-bold">₹{result.totalExchangeTxn.toFixed(2)}</td>
                  </tr>

                  {/* SEBI Charges */}
                  <tr>
                    <td className="py-2 text-[#8D99A8]">SEBI Turnover Fee</td>
                    <td className="py-2 text-right">₹{result.buySebi.toFixed(2)}</td>
                    <td className="py-2 text-right">₹{result.sellSebi.toFixed(2)}</td>
                    <td className="py-2 text-right font-bold">₹{result.totalSebi.toFixed(2)}</td>
                  </tr>

                  {/* GST */}
                  <tr>
                    <td className="py-2 text-[#8D99A8]">GST (18%)</td>
                    <td className="py-2 text-right">₹{result.buyGst.toFixed(2)}</td>
                    <td className="py-2 text-right">₹{result.sellGst.toFixed(2)}</td>
                    <td className="py-2 text-right font-bold">₹{result.totalGst.toFixed(2)}</td>
                  </tr>

                  {/* Stamp Duty (Buy Only) */}
                  <tr>
                    <td className="py-2 text-[#8D99A8]">Stamp Duty (0.015% Buy)</td>
                    <td className="py-2 text-right">₹{result.buyStampDuty.toFixed(2)}</td>
                    <td className="py-2 text-right text-[#596574]">-</td>
                    <td className="py-2 text-right font-bold">₹{result.buyStampDuty.toFixed(2)}</td>
                  </tr>

                  {/* DP Charges (Sell Only) */}
                  <tr>
                    <td className="py-2 text-[#8D99A8]">DP Charge (CDSL Sell)</td>
                    <td className="py-2 text-right text-[#596574]">-</td>
                    <td className="py-2 text-right">₹{result.sellDpCharges.toFixed(2)}</td>
                    <td className="py-2 text-right font-bold">₹{result.sellDpCharges.toFixed(2)}</td>
                  </tr>

                  {/* Subtotal Row */}
                  <tr className="border-t-2 border-[#202A35] font-bold">
                    <td className="py-2 text-[#F4F7FA]">Total Side Charges</td>
                    <td className="py-2 text-right text-[#38BDF8]">₹{result.totalBuyCharges.toFixed(2)}</td>
                    <td className="py-2 text-right text-[#22C55E]">₹{result.totalSellCharges.toFixed(2)}</td>
                    <td className="py-2 text-right text-[#EF4444] text-sm">₹{result.totalFees.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Summary Highlights */}
            <div className="pt-3 border-t border-[#202A35] space-y-3 font-mono">
              <div className="flex justify-between items-center bg-[#080B10] p-3 rounded-lg border border-[#202A35]">
                <span className="text-xs font-semibold text-[#38BDF8] flex items-center gap-1.5">
                  <Scale className="h-4 w-4" /> Points to Breakeven
                </span>
                <span className="text-sm font-bold text-[#F4F7FA]">
                  ₹{result.breakevenPoints.toFixed(2)} <span className="text-xs font-normal text-[#8D99A8]">/ share</span>
                </span>
              </div>

              <div className="flex justify-between items-baseline pt-1">
                <span className="text-sm font-bold text-[#F4F7FA]">Net Take-Home P&L</span>
                <span
                  className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                    result.netPnL >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                  }`}
                >
                  {result.netPnL >= 0 ? '+' : ''}₹
                  {result.netPnL.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
