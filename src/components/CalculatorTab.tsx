'use client';

import React, { useState, useMemo } from 'react';
import { useStock } from '@/context/StockContext';
import {
  Calculator,
  Target,
  IndianRupee,
  Receipt,
  HelpCircle,
  Scale,
} from 'lucide-react';
import { calculateEquityDeliveryBrokerage } from '@/lib/brokerageCalculator';

const CHARGE_DESCRIPTIONS = [
  {
    key: 'turnover',
    label: 'Order Turnover',
    title: 'Order Turnover',
    desc: 'Total gross monetary value of traded orders (Quantity × Buy/Sell Price).',
  },
  {
    key: 'brokerage',
    label: 'Brokerage Charge',
    title: 'Brokerage Fee',
    desc: 'Broker execution fee. Zerodha = ₹0 for Equity Delivery. Groww = ₹20 or 0.1% per order, whichever is lower (min ₹5, max ₹20).',
  },
  {
    key: 'stt',
    label: 'STT (0.1% Buy / 0.1% Sell)',
    title: 'Securities Transaction Tax (STT)',
    desc: 'Statutory tax levied by Central Govt under SEBI rules at 0.1% on Buy and 0.1% on Sell value for Equity Delivery.',
  },
  {
    key: 'exchange',
    label: 'Exchange Txn Charge',
    title: 'Exchange Transaction Charge',
    desc: 'Infrastructure fee charged by stock exchanges (NSE: 0.00307% for Zerodha / 0.00297% for Groww, BSE: 0.00375%).',
  },
  {
    key: 'sebi',
    label: 'SEBI Turnover Fee',
    title: 'SEBI Regulatory Fee',
    desc: 'Regulator charge collected by SEBI to regulate stock markets at ₹10 per crore (0.0001%) of turnover + IPFT.',
  },
  {
    key: 'gst',
    label: 'GST (18%)',
    title: 'Goods & Services Tax (GST)',
    desc: '18% Govt tax levied on (Brokerage + Exchange Transaction Charges + SEBI Fees + IPFT + DP Base).',
  },
  {
    key: 'stamp',
    label: 'Stamp Duty (0.015% Buy)',
    title: 'State Stamp Duty',
    desc: 'State Govt stamp tax levied at 0.015% (₹1,500/Cr) on BUY side order value only.',
  },
  {
    key: 'dp',
    label: 'DP Charge (CDSL Sell)',
    title: 'Depository Participant (DP) Charge',
    desc: 'CDSL & broker fee charged on SELL transactions. Zerodha = ₹15.34 (13+18% GST), Groww = ₹23.60 (₹3.5 CDSL + ₹16.5 Groww = ₹20 base + ₹3.60 GST). ₹0 if sell value < ₹100.',
  },
];

export const CalculatorTab: React.FC = () => {
  const { taxSettings, updateTaxSettings } = useStock();

  // Mode: 'forward' (Known Sell Price -> Net P&L) or 'reverse' (Target Net P&L -> Required Sell Price)
  const [mode, setMode] = useState<'forward' | 'reverse'>('forward');

  // Input states in INR
  const [quantity, setQuantity] = useState<string>('100');
  const [buyPrice, setBuyPrice] = useState<string>('100.00');
  const [sellPrice, setSellPrice] = useState<string>('100.00');
  const [targetNetPnL, setTargetNetPnL] = useState<string>('5000.00');
  const [exchange, setExchange] = useState<'NSE' | 'BSE'>(taxSettings.exchange || 'NSE');

  // Selected Broker: Only Zerodha or Groww
  const activeBroker = (taxSettings.brokerPreset === 'GROWW' ? 'GROWW' : 'ZERODHA') as 'ZERODHA' | 'GROWW';

  // Itemized Calculations
  const result = useMemo(() => {
    const qty = Math.max(0.0001, parseFloat(quantity) || 0);
    const buyP = Math.max(0, parseFloat(buyPrice) || 0);
    const sellP = Math.max(0, parseFloat(sellPrice) || 0);
    const targetPnL = parseFloat(targetNetPnL) || 0;

    return calculateEquityDeliveryBrokerage({
      quantity: qty,
      buyPrice: buyP,
      sellPrice: sellP,
      targetNetPnL: targetPnL,
      taxSettings: { ...taxSettings, brokerPreset: activeBroker, exchange },
      mode,
    });
  }, [mode, quantity, buyPrice, sellPrice, targetNetPnL, taxSettings, activeBroker, exchange]);

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
            Hover over any charge category below to inspect full statutory rules & tax definitions.
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
                    brokeragePercent: 0.1,
                    sttPercent: 0.1,
                    stampDutyPercent: 0.015,
                    gstPercent: 18,
                    flatDpCharges: 23.60,
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
                  <span className="text-xs text-[#22C55E] font-bold block mt-1">₹20 or 0.1% Lower (Min ₹5)</span>
                  <span className="text-[11px] text-[#8D99A8] block mt-0.5">DP Charge: ₹23.60 on Sell</span>
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

            {/* SEPARATE BUY SIDE vs SELL SIDE CHARGES TABLE WITH INTERACTIVE HOVER TOOLTIPS */}
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
                  {[
                    {
                      label: 'Order Turnover',
                      buy: result.buyTurnover,
                      sell: result.sellTurnover,
                      total: result.turnover,
                      info: CHARGE_DESCRIPTIONS[0],
                    },
                    {
                      label: 'Brokerage Charge',
                      buy: result.buyBrokerage,
                      sell: result.sellBrokerage,
                      total: result.totalBrokerage,
                      info: CHARGE_DESCRIPTIONS[1],
                    },
                    {
                      label: 'STT (0.1% Buy / 0.1% Sell)',
                      buy: result.buyStt,
                      sell: result.sellStt,
                      total: result.totalStt,
                      info: CHARGE_DESCRIPTIONS[2],
                    },
                    {
                      label: `Exchange Txn (${exchange})`,
                      buy: result.buyExchangeTxn,
                      sell: result.sellExchangeTxn,
                      total: result.totalExchangeTxn,
                      info: CHARGE_DESCRIPTIONS[3],
                    },
                    {
                      label: 'SEBI Turnover Fee',
                      buy: result.buySebi,
                      sell: result.sellSebi,
                      total: result.totalSebi,
                      info: CHARGE_DESCRIPTIONS[4],
                    },
                    {
                      label: 'GST (18%)',
                      buy: result.buyGst,
                      sell: result.sellGst,
                      total: result.totalGst,
                      info: CHARGE_DESCRIPTIONS[5],
                    },
                    {
                      label: 'Stamp Duty (0.015% Buy)',
                      buy: result.buyStampDuty,
                      sell: null,
                      total: result.buyStampDuty,
                      info: CHARGE_DESCRIPTIONS[6],
                    },
                    {
                      label: 'DP Charge (CDSL Sell)',
                      buy: null,
                      sell: result.sellDpCharges,
                      total: result.sellDpCharges,
                      info: CHARGE_DESCRIPTIONS[7],
                    },
                  ].map((row, idx) => (
                    <tr key={idx} className="group hover:bg-[#111820]/80 transition">
                      <td className="py-2.5 pr-2 text-[#8D99A8] group-hover:text-white relative cursor-help">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span>{row.label}</span>
                          <HelpCircle className="h-3 w-3 text-[#596574] group-hover:text-[#38BDF8] shrink-0 transition" />
                        </span>

                        {/* INTERACTIVE HOVER TOOLTIP POPUP */}
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:flex flex-col z-30 w-64 p-3 rounded-xl bg-[#0A0F15] border border-[#38BDF8]/40 shadow-2xl text-[11px] text-[#F4F7FA] font-sans leading-relaxed pointer-events-none animate-fadeIn">
                          <span className="font-bold text-[#38BDF8] font-mono mb-1">{row.info.title}</span>
                          <span className="text-slate-300">{row.info.desc}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {row.buy !== null ? `₹${row.buy.toFixed(2)}` : <span className="text-[#596574]">-</span>}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {row.sell !== null ? `₹${row.sell.toFixed(2)}` : <span className="text-[#596574]">-</span>}
                      </td>
                      <td className="py-2.5 pl-2 text-right font-bold">₹{row.total.toFixed(2)}</td>
                    </tr>
                  ))}

                  {/* Subtotal Row */}
                  <tr className="border-t-2 border-[#202A35] font-bold">
                    <td className="py-3 text-[#F4F7FA]">Total Side Charges</td>
                    <td className="py-3 text-right text-[#38BDF8]">₹{result.totalBuyCharges.toFixed(2)}</td>
                    <td className="py-3 text-right text-[#22C55E]">₹{result.totalSellCharges.toFixed(2)}</td>
                    <td className="py-3 text-right text-[#EF4444] text-sm">₹{result.totalFees.toFixed(2)}</td>
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
