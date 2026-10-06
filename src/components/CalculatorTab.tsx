'use client';

import React, { useState, useMemo } from 'react';
import { useStock } from '@/context/StockContext';
import {
  Calculator,
  Target,
  IndianRupee,
} from 'lucide-react';
import { CalculationResult } from '@/types/stock';

export const CalculatorTab: React.FC = () => {
  const { taxSettings, updateTaxSettings } = useStock();
  const currSymbol = '₹';

  // Calculator Mode: 'forward' (Known Sell Price -> Net P&L) or 'reverse' (Target Net P&L -> Required Sell Price)
  const [mode, setMode] = useState<'forward' | 'reverse'>('forward');

  // Input states in INR
  const [quantity, setQuantity] = useState<string>('100');
  const [buyPrice, setBuyPrice] = useState<string>('2500.00');
  const [sellPrice, setSellPrice] = useState<string>('3100.00');
  const [targetNetPnL, setTargetNetPnL] = useState<string>('50000.00');
  const [holdingMonths, setHoldingMonths] = useState<string>('8');

  // Perform Calculations
  const result: CalculationResult = useMemo(() => {
    const qty = Math.max(0.0001, parseFloat(quantity) || 0);
    const buyP = Math.max(0, parseFloat(buyPrice) || 0);
    const sellP = Math.max(0, parseFloat(sellPrice) || 0);
    const targetPnL = parseFloat(targetNetPnL) || 0;
    const months = parseFloat(holdingMonths) || 0;

    const isLongTerm = months > taxSettings.holdingPeriodMonths;
    const taxRate = isLongTerm ? taxSettings.ltcgRatePercent : taxSettings.stcgRatePercent;

    const totalInvestment = qty * buyP;
    const dpCharges = taxSettings.flatDpCharges !== undefined ? taxSettings.flatDpCharges : 15.93;

    // Fees calculation (Zerodha / Indian Market Brokerage Rules)
    const buyBrokerage =
      taxSettings.flatBrokerageBuy + (totalInvestment * taxSettings.brokeragePercent) / 100;
    const stampDuty = (totalInvestment * taxSettings.stampDutyPercent) / 100;

    if (mode === 'forward') {
      const grossSaleValue = qty * sellP;
      const sellBrokerage =
        taxSettings.flatBrokerageSell + (grossSaleValue * taxSettings.brokeragePercent) / 100;
      const sttCharges = (grossSaleValue * taxSettings.sttPercent) / 100;
      const gstCharges = ((buyBrokerage + sellBrokerage + dpCharges) * taxSettings.gstPercent) / 100;

      const totalFees = buyBrokerage + sellBrokerage + dpCharges + stampDuty + sttCharges + gstCharges;
      const grossProfit = grossSaleValue - totalInvestment - totalFees;

      const taxAmount = grossProfit > 0 ? (grossProfit * taxRate) / 100 : 0;
      const netPnL = grossProfit - taxAmount;
      const netRoiPercent = totalInvestment > 0 ? (netPnL / totalInvestment) * 100 : 0;

      return {
        totalInvestment,
        grossSaleValue,
        grossProfit,
        isLongTerm,
        applicableTaxRate: taxRate,
        taxAmount,
        buyBrokerage,
        sellBrokerage,
        totalBrokerage: buyBrokerage + sellBrokerage,
        stampDuty,
        sttCharges,
        dpCharges,
        gstCharges,
        totalFees,
        netPnL,
        netRoiPercent,
      };
    } else {
      // REVERSE CALCULATOR MODE: Find required sell price per share in ₹
      const targetGrossProfit =
        targetPnL > 0 ? targetPnL / (1 - taxRate / 100) : targetPnL;

      const gstMult = 1 + taxSettings.gstPercent / 100;
      const totalBuySideCost = totalInvestment + buyBrokerage + stampDuty;
      const sellFixedFees = (taxSettings.flatBrokerageSell + dpCharges) * gstMult;

      const k =
        (taxSettings.brokeragePercent * gstMult) / 100 + taxSettings.sttPercent / 100;

      const requiredGrossSaleValue =
        (totalBuySideCost + sellFixedFees + targetGrossProfit) / (1 - k);
      const requiredSellPricePerShare = requiredGrossSaleValue / qty;

      const sellBrokerage =
        taxSettings.flatBrokerageSell +
        (requiredGrossSaleValue * taxSettings.brokeragePercent) / 100;
      const sttCharges = (requiredGrossSaleValue * taxSettings.sttPercent) / 100;
      const gstCharges = ((buyBrokerage + sellBrokerage + dpCharges) * taxSettings.gstPercent) / 100;

      const totalFees = buyBrokerage + sellBrokerage + dpCharges + stampDuty + sttCharges + gstCharges;
      const grossProfit = requiredGrossSaleValue - totalInvestment - totalFees;
      const taxAmount = grossProfit > 0 ? (grossProfit * taxRate) / 100 : 0;
      const netPnL = grossProfit - taxAmount;
      const netRoiPercent = totalInvestment > 0 ? (netPnL / totalInvestment) * 100 : 0;

      return {
        totalInvestment,
        grossSaleValue: requiredGrossSaleValue,
        grossProfit,
        isLongTerm,
        applicableTaxRate: taxRate,
        taxAmount,
        buyBrokerage,
        sellBrokerage,
        totalBrokerage: buyBrokerage + sellBrokerage,
        stampDuty,
        sttCharges,
        dpCharges,
        gstCharges,
        totalFees,
        netPnL,
        netRoiPercent,
        requiredSellPricePerShare,
        requiredGrossSaleValue,
      };
    }
  }, [mode, quantity, buyPrice, sellPrice, targetNetPnL, holdingMonths, taxSettings]);

  return (
    <div className="space-y-8">
      {/* Mode Switcher Banner */}
      <div className="bg-[#0D1218] rounded-xl p-6 border border-[#202A35] shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#F4F7FA] font-mono flex items-center gap-2.5">
            <Calculator className="h-5 w-5 text-[#38BDF8]" />
            <span>Target Price & P&L Trading Calculator</span>
          </h2>
          <p className="text-xs text-[#8D99A8] mt-1">
            Exact net profit calculation after STCG (20%), LTCG (12.5%), STT, GST & Stamp Duty under SEBI Indian tax rules.
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
        {/* Left Input Settings (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Trade Parameters Card */}
          <div className="bg-[#0D1218] rounded-xl p-6 space-y-5 border border-[#202A35] shadow-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#38BDF8] font-mono border-b border-[#202A35] pb-3">
              1. TRADE & INVESTMENT PARAMETERS (₹ INR)
            </h3>

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

          {/* Broker Tariff Presets Setup */}
          <div className="bg-[#0D1218] rounded-xl p-6 space-y-5 border border-[#202A35] shadow-lg">
            <div className="flex items-center justify-between border-b border-[#202A35] pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8B5CF6] flex items-center gap-2 font-mono">
                <IndianRupee className="h-4 w-4 text-[#22C55E]" /> 2. BROKER TARIFF PRESETS
              </h3>
              <span className="text-[10px] text-[#8D99A8] font-mono">SEBI Tariff Rules</span>
            </div>

            {/* Broker Buttons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'ZERODHA',
                  name: 'Zerodha',
                  subtitle: 'Kite Delivery',
                  badge: 'DP: ₹15.93',
                  apply: () =>
                    updateTaxSettings({
                      brokerPreset: 'ZERODHA',
                      flatBrokerageBuy: 0,
                      flatBrokerageSell: 0,
                      brokeragePercent: 0,
                      sttPercent: 0.1,
                      stampDutyPercent: 0.015,
                      gstPercent: 18,
                      flatDpCharges: 15.93,
                    }),
                },
                {
                  id: 'GROWW',
                  name: 'Groww',
                  subtitle: 'Equity CNC',
                  badge: 'DP: ₹23.60',
                  apply: () =>
                    updateTaxSettings({
                      brokerPreset: 'GROWW',
                      flatBrokerageBuy: 20,
                      flatBrokerageSell: 20,
                      brokeragePercent: 0.05,
                      sttPercent: 0.1,
                      stampDutyPercent: 0.015,
                      gstPercent: 18,
                      flatDpCharges: 23.60,
                    }),
                },
                {
                  id: 'ANGELONE',
                  name: 'Angel One',
                  subtitle: 'Angel Speed',
                  badge: 'DP: ₹23.60',
                  apply: () =>
                    updateTaxSettings({
                      brokerPreset: 'ANGELONE',
                      flatBrokerageBuy: 20,
                      flatBrokerageSell: 20,
                      brokeragePercent: 0,
                      sttPercent: 0.1,
                      stampDutyPercent: 0.015,
                      gstPercent: 18,
                      flatDpCharges: 23.60,
                    }),
                },
                {
                  id: 'UPSTOX',
                  name: 'Upstox',
                  subtitle: 'Pro Delivery',
                  badge: 'DP: ₹21.83',
                  apply: () =>
                    updateTaxSettings({
                      brokerPreset: 'UPSTOX',
                      flatBrokerageBuy: 20,
                      flatBrokerageSell: 20,
                      brokeragePercent: 0.1,
                      sttPercent: 0.1,
                      stampDutyPercent: 0.015,
                      gstPercent: 18,
                      flatDpCharges: 21.83,
                    }),
                },
                {
                  id: 'ICICIDIRECT',
                  name: 'ICICI Direct',
                  subtitle: 'Direct Prime',
                  badge: 'DP: ₹29.50',
                  apply: () =>
                    updateTaxSettings({
                      brokerPreset: 'ICICIDIRECT',
                      flatBrokerageBuy: 0,
                      flatBrokerageSell: 0,
                      brokeragePercent: 0.55,
                      sttPercent: 0.1,
                      stampDutyPercent: 0.015,
                      gstPercent: 18,
                      flatDpCharges: 29.50,
                    }),
                },
                {
                  id: 'CUSTOM',
                  name: 'Custom Tariff',
                  subtitle: 'Manual Entry',
                  badge: 'User Defined',
                  apply: () => updateTaxSettings({ brokerPreset: 'CUSTOM' }),
                },
              ].map((b) => {
                const isActive = (taxSettings.brokerPreset || 'ZERODHA') === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={b.apply}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between active:scale-95 ${
                      isActive
                        ? 'bg-[#111820] border-[#38BDF8] shadow-md ring-1 ring-[#38BDF8]/40'
                        : 'bg-[#080B10] border-[#202A35] hover:border-[#38BDF8]/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#F4F7FA] text-xs font-mono">{b.name}</span>
                        {isActive && <span className="h-2 w-2 rounded-full bg-[#22C55E]" />}
                      </div>
                      <span className="text-[10px] text-[#8D99A8] block mt-0.5">{b.subtitle}</span>
                    </div>
                    <span className="mt-2 text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-[#080B10] text-[#38BDF8] border border-[#38BDF8]/30 inline-block w-fit">
                      {b.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Editable DP Charge & Brokerage Inputs */}
            <div className="pt-3 border-t border-[#202A35] grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#8D99A8] mb-1 font-mono">
                  DP Charge on Sell (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={taxSettings.flatDpCharges !== undefined ? taxSettings.flatDpCharges : 15.93}
                  onChange={(e) =>
                    updateTaxSettings({
                      flatDpCharges: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-[#080B10] text-[#38BDF8] font-bold border border-[#202A35] rounded-lg p-2.5 font-mono text-sm outline-none focus:border-[#38BDF8]"
                />
                <span className="text-[10px] text-[#596574] mt-1 block">
                  Depository fee per stock on sell (Zerodha ₹15.93, Groww ₹23.60, Upstox ₹21.83, ICICI ₹29.50)
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8D99A8] mb-1 font-mono">
                  Flat Brokerage per Order (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={taxSettings.flatBrokerageSell || 0}
                  onChange={(e) =>
                    updateTaxSettings({
                      flatBrokerageBuy: parseFloat(e.target.value) || 0,
                      flatBrokerageSell: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-[#080B10] text-[#F4F7FA] border border-[#202A35] rounded-lg p-2.5 font-mono text-sm outline-none focus:border-[#38BDF8]"
                />
                <span className="text-[10px] text-[#596574] mt-1 block">
                  Max flat charge per order (e.g. ₹0 Zerodha, ₹20 Groww/Angel One/Upstox)
                </span>
              </div>
            </div>

            {/* Tariff Summary Banner */}
            <div className="rounded-xl bg-[#080B10] border border-[#202A35] p-4 text-xs space-y-1.5 text-[#8D99A8] font-mono">
              <div className="flex items-center justify-between text-[#38BDF8] font-bold">
                <span>Active Broker: {taxSettings.brokerPreset || 'ZERODHA'}</span>
                <span>DP Charge on Sell: ₹{(taxSettings.flatDpCharges || 15.93).toFixed(2)}</span>
              </div>
              <p className="text-[11px] text-[#596574] font-sans">
                {taxSettings.brokerPreset === 'GROWW'
                  ? 'Groww: ₹20/order max brokerage + ₹23.60 DP charges on Sell + STT 0.1% + GST 18%.'
                  : taxSettings.brokerPreset === 'ANGELONE'
                  ? 'Angel One: ₹20/order brokerage + ₹23.60 DP charges on Sell + STT 0.1% + GST 18%.'
                  : taxSettings.brokerPreset === 'UPSTOX'
                  ? 'Upstox: ₹20/order max brokerage + ₹21.83 DP charges on Sell + STT 0.1% + GST 18%.'
                  : taxSettings.brokerPreset === 'ICICIDIRECT'
                  ? 'ICICI Direct: 0.55% brokerage + ₹29.50 DP charges on Sell + STT 0.1% + GST 18%.'
                  : taxSettings.brokerPreset === 'CUSTOM'
                  ? 'Custom: Manual DP charges & brokerage tariff configuration selected.'
                  : 'Zerodha (Kite): ₹0 Brokerage on Equity Delivery + STT 0.1% + ₹15.93 DP charges on Sell.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Output Results Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Hero Target Selling Price Result Card */}
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

          <div className="bg-[#0D1218] rounded-xl p-6 space-y-6 border border-[#202A35] shadow-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8D99A8] border-b border-[#202A35] pb-3 flex items-center justify-between font-mono">
              <span>FINANCIAL BREAKDOWN</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  result.isLongTerm
                    ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30'
                    : 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30'
                }`}
              >
                {result.isLongTerm ? 'LTCG Tax Regime' : 'STCG Tax Regime'}
              </span>
            </h3>

            {/* Metrics List */}
            <div className="space-y-3.5 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-[#8D99A8]">Total Investment</span>
                <span className="font-bold text-[#F4F7FA]">
                  ₹{result.totalInvestment.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#8D99A8]">Gross Sale Value</span>
                <span className="font-bold text-[#F4F7FA]">
                  ₹{result.grossSaleValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#8D99A8]">Gross Profit (Pre-tax)</span>
                <span className="font-bold text-[#F4F7FA]">
                  ₹{result.grossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="h-px bg-[#202A35] my-3" />

              {/* Deductions Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[#8D99A8]">
                  <span>Brokerage Charges</span>
                  <span className="text-[#F4F7FA]">
                    -₹{result.totalBrokerage.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-[#8D99A8]">
                  <span>DP Charges (CDSL)</span>
                  <span className="text-[#F4F7FA]">
                    -₹{result.dpCharges.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-[#8D99A8]">
                  <span>STT Duty ({taxSettings.sttPercent}%)</span>
                  <span className="text-[#F4F7FA]">
                    -₹{result.sttCharges.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-[#8D99A8]">
                  <span>Stamp Duty ({taxSettings.stampDutyPercent}%)</span>
                  <span className="text-[#F4F7FA]">
                    -₹{result.stampDuty.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-[#8D99A8]">
                  <span>GST ({taxSettings.gstPercent}%)</span>
                  <span className="text-[#F4F7FA]">
                    -₹{result.gstCharges.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between font-semibold text-[#EF4444] pt-1 border-t border-[#202A35] mt-1">
                  <span>Income Tax ({result.applicableTaxRate}%)</span>
                  <span>
                    -₹{result.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="h-px bg-[#202A35] my-3" />

              {/* Net Take-Home P&L */}
              <div className="flex justify-between items-baseline pt-2">
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

              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-[#8D99A8]">Net ROI Yield</span>
                <span
                  className={`font-bold px-3 py-1 rounded text-xs ${
                    result.netRoiPercent >= 0
                      ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30'
                      : 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30'
                  }`}
                >
                  {result.netRoiPercent >= 0 ? '+' : ''}
                  {result.netRoiPercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

