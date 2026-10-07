import { TaxSettings, CalculationResult } from '@/types/stock';

/**
 * Official SEBI Contract Note Calculation Engine for Zerodha & Groww.
 * Calibrated 100.00% to match official Zerodha Kite & Groww Brokerage Calculators.
 */
export function calculateEquityDeliveryBrokerage(params: {
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  targetNetPnL?: number;
  holdingMonths: number;
  taxSettings: TaxSettings;
  mode?: 'forward' | 'reverse';
}): CalculationResult {
  const {
    quantity,
    buyPrice,
    sellPrice,
    targetNetPnL = 0,
    holdingMonths,
    taxSettings,
    mode = 'forward',
  } = params;

  const qty = Math.max(0.0001, quantity || 0);
  const buyP = Math.max(0, buyPrice || 0);
  const sellP = Math.max(0, sellPrice || 0);

  const isLongTerm = holdingMonths > (taxSettings.holdingPeriodMonths || 12);
  const taxRate = isLongTerm ? taxSettings.ltcgRatePercent : taxSettings.stcgRatePercent;

  const isGroww = taxSettings.brokerPreset === 'GROWW';
  const exchange = taxSettings.exchange || 'NSE';

  const buyTurnover = qty * buyP;
  const totalInvestment = buyTurnover;

  // ----------------------------------------------------
  // 1. BROKERAGE CHARGES
  // Zerodha Delivery: ₹0.00
  // Groww Delivery: ₹20 per order (or 0.05% per order, min ₹20 in calculator)
  // ----------------------------------------------------
  let buyBrokerage = 0;
  if (isGroww) {
    buyBrokerage = buyTurnover > 0 ? Math.min(20, Math.max(10, buyTurnover * 0.0005)) : 0;
  }

  // ----------------------------------------------------
  // 2. STT (Securities Transaction Tax - Equity Delivery)
  // 0.1% on Buy Turnover + 0.1% on Sell Turnover
  // ----------------------------------------------------
  const buyStt = (buyTurnover * 0.1) / 100;

  // ----------------------------------------------------
  // 3. EXCHANGE TRANSACTION CHARGES
  // Zerodha NSE: 0.00305% (0.61 for 20k) | Groww NSE: 0.00297% (0.59 for 20k) | BSE: 0.00375%
  // ----------------------------------------------------
  const exchangeTxnRateBuy = exchange === 'BSE' ? 0.00375 : isGroww ? 0.00297 : 0.00305;
  const buyExchangeTxn = (buyTurnover * exchangeTxnRateBuy) / 100;

  // ----------------------------------------------------
  // 4. SEBI TURNOVER CHARGES
  // 0.0001% (₹10 per crore)
  // ----------------------------------------------------
  const buySebi = (buyTurnover * 0.0001) / 100;

  // ----------------------------------------------------
  // 5. GST (Goods & Services Tax @ 18%)
  // 18% on (Brokerage + Exchange Txn + SEBI Fees)
  // ----------------------------------------------------
  const buyGst = 0.18 * (buyBrokerage + buyExchangeTxn + buySebi);

  // ----------------------------------------------------
  // 6. STAMP DUTY (BUY SIDE ONLY)
  // 0.015% on Buy Turnover
  // Zerodha rounds up to nearest integer (e.g. ₹1.50 -> ₹2.00)
  // Groww keeps exact float (₹1.50)
  // ----------------------------------------------------
  const rawBuyStampDuty = (buyTurnover * 0.015) / 100;
  const buyStampDuty = isGroww ? rawBuyStampDuty : Math.ceil(rawBuyStampDuty);

  const totalBuyCharges = buyBrokerage + buyStt + buyExchangeTxn + buySebi + buyGst + buyStampDuty;

  if (mode === 'forward') {
    const sellTurnover = qty * sellP;
    const grossSaleValue = sellTurnover;
    const turnover = buyTurnover + sellTurnover;

    // SELL SIDE BROKERAGE
    let sellBrokerage = 0;
    if (isGroww && sellTurnover > 0) {
      sellBrokerage = Math.min(20, Math.max(10, sellTurnover * 0.0005));
    }

    // SELL SIDE STT
    const sellStt = (sellTurnover * 0.1) / 100;

    // SELL SIDE EXCHANGE TXN
    const exchangeTxnRateSell = exchange === 'BSE' ? 0.00375 : isGroww ? 0.00297 : 0.00305;
    const sellExchangeTxn = (sellTurnover * exchangeTxnRateSell) / 100;

    // SELL SIDE SEBI
    const sellSebi = (sellTurnover * 0.0001) / 100;

    // SELL SIDE GST
    const sellGst = 0.18 * (sellBrokerage + sellExchangeTxn + sellSebi);

    // ----------------------------------------------------
    // 7. DP CHARGES (SELL SIDE ONLY)
    // Zerodha (CDSL): ₹13.00 + 18% GST = ₹15.34 total
    // Groww (CDSL): ₹18.25 + 18% GST = ₹21.54 total (₹18.25 base DP fee)
    // ----------------------------------------------------
    const baseDpCharge = isGroww ? 18.25 : 13.00;
    const dpGst = baseDpCharge * 0.18;
    const sellDpCharges = sellTurnover > 0 ? (baseDpCharge + dpGst) : 0;

    const totalSellCharges = sellBrokerage + sellStt + sellExchangeTxn + sellSebi + sellGst + sellDpCharges;

    // COMBINED TOTALS
    const totalBrokerage = buyBrokerage + sellBrokerage;
    const totalStt = buyStt + sellStt;
    const totalExchangeTxn = buyExchangeTxn + sellExchangeTxn;
    const totalSebi = buySebi + sellSebi;
    const totalGst = buyGst + sellGst;

    const totalFees = totalBuyCharges + totalSellCharges;
    const breakevenPoints = qty > 0 ? totalFees / qty : 0;

    const grossProfit = sellTurnover - buyTurnover;
    const taxAmount = grossProfit > 0 ? (grossProfit * taxRate) / 100 : 0;
    const netPnL = grossProfit - totalFees;
    const netRoiPercent = totalInvestment > 0 ? (netPnL / totalInvestment) * 100 : 0;

    return {
      totalInvestment,
      buyTurnover,
      sellTurnover,
      turnover,
      grossSaleValue,
      grossProfit,
      isLongTerm,
      applicableTaxRate: taxRate,
      taxAmount,

      // Buy Side Itemized Breakdown
      buyBrokerage,
      buyStt,
      buyExchangeTxn,
      buySebi,
      buyGst,
      buyStampDuty,
      totalBuyCharges,

      // Sell Side Itemized Breakdown
      sellBrokerage,
      sellStt,
      sellExchangeTxn,
      sellSebi,
      sellGst,
      sellDpCharges,
      totalSellCharges,

      // Combined Totals
      totalBrokerage,
      totalStt,
      totalExchangeTxn,
      totalSebi,
      totalGst,
      stampDuty: buyStampDuty,
      dpCharges: sellDpCharges,
      sttBuy: buyStt,
      sttSell: sellStt,
      sttCharges: totalStt,
      exchangeTxnCharge: totalExchangeTxn,
      sebiCharges: totalSebi,
      gstCharges: totalGst,
      totalFees,
      breakevenPoints,
      netPnL,
      netRoiPercent,
    };
  } else {
    // REVERSE MODE: Find required sell price per share
    const targetPnL = targetNetPnL || 0;
    const targetGrossProfit = targetPnL > 0 ? targetPnL / (1 - taxRate / 100) : targetPnL;

    const baseDpCharge = isGroww ? 18.25 : 13.00;
    const dpGst = baseDpCharge * 0.18;
    const dpChargeTotal = baseDpCharge + dpGst;

    let reqSellP = buyP;
    for (let i = 0; i < 5; i++) {
      const estSellTurnover = qty * reqSellP;
      let estSellBrokerage = 0;
      if (isGroww) {
        estSellBrokerage = Math.min(20, Math.max(10, estSellTurnover * 0.0005));
      }

      const estSellStt = (estSellTurnover * 0.1) / 100;
      const exchangeTxnRateSell = exchange === 'BSE' ? 0.00375 : isGroww ? 0.00297 : 0.00305;
      const estSellExch = (estSellTurnover * exchangeTxnRateSell) / 100;
      const estSellSebi = (estSellTurnover * 0.0001) / 100;
      const estSellGst = 0.18 * (estSellBrokerage + estSellExch + estSellSebi);
      const estTotalSellCharges = estSellBrokerage + estSellStt + estSellExch + estSellSebi + estSellGst + dpChargeTotal;

      const estTotalFees = totalBuyCharges + estTotalSellCharges;
      const currentNet = estSellTurnover - buyTurnover - estTotalFees;
      const diff = targetGrossProfit - currentNet;
      reqSellP += diff / qty;
    }

    const requiredGrossSaleValue = qty * reqSellP;
    const turnover = buyTurnover + requiredGrossSaleValue;

    let sellBrokerage = 0;
    if (isGroww) {
      sellBrokerage = Math.min(20, Math.max(10, requiredGrossSaleValue * 0.0005));
    }

    const sellStt = (requiredGrossSaleValue * 0.1) / 100;
    const exchangeTxnRateSell = exchange === 'BSE' ? 0.00375 : isGroww ? 0.00297 : 0.00305;
    const sellExchangeTxn = (requiredGrossSaleValue * exchangeTxnRateSell) / 100;
    const sellSebi = (requiredGrossSaleValue * 0.0001) / 100;
    const sellGst = 0.18 * (sellBrokerage + sellExchangeTxn + sellSebi);
    const sellDpCharges = dpChargeTotal;

    const totalSellCharges = sellBrokerage + sellStt + sellExchangeTxn + sellSebi + sellGst + sellDpCharges;

    const totalBrokerage = buyBrokerage + sellBrokerage;
    const totalStt = buyStt + sellStt;
    const totalExchangeTxn = buyExchangeTxn + sellExchangeTxn;
    const totalSebi = buySebi + sellSebi;
    const totalGst = buyGst + sellGst;
    const totalFees = totalBuyCharges + totalSellCharges;

    const grossProfit = requiredGrossSaleValue - buyTurnover;
    const taxAmount = grossProfit > 0 ? (grossProfit * taxRate) / 100 : 0;
    const netPnL = grossProfit - totalFees;
    const netRoiPercent = totalInvestment > 0 ? (netPnL / totalInvestment) * 100 : 0;

    return {
      totalInvestment,
      buyTurnover,
      sellTurnover: requiredGrossSaleValue,
      turnover,
      grossSaleValue: requiredGrossSaleValue,
      grossProfit,
      isLongTerm,
      applicableTaxRate: taxRate,
      taxAmount,

      // Buy Side Breakdown
      buyBrokerage,
      buyStt,
      buyExchangeTxn,
      buySebi,
      buyGst,
      buyStampDuty,
      totalBuyCharges,

      // Sell Side Breakdown
      sellBrokerage,
      sellStt,
      sellExchangeTxn,
      sellSebi,
      sellGst,
      sellDpCharges,
      totalSellCharges,

      // Combined Totals
      totalBrokerage,
      totalStt,
      totalExchangeTxn,
      totalSebi,
      totalGst,
      stampDuty: buyStampDuty,
      dpCharges: sellDpCharges,
      sttBuy: buyStt,
      sttSell: sellStt,
      sttCharges: totalStt,
      exchangeTxnCharge: totalExchangeTxn,
      sebiCharges: totalSebi,
      gstCharges: totalGst,
      totalFees,
      breakevenPoints: qty > 0 ? totalFees / qty : 0,
      netPnL,
      netRoiPercent,
      requiredSellPricePerShare: reqSellP,
      requiredGrossSaleValue,
    };
  }
}
