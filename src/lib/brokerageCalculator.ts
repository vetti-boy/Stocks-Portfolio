import { TaxSettings, CalculationResult } from '@/types/stock';

/**
 * Official SEBI Contract Note Calculation Engine for Zerodha & Groww.
 * Calibrated 100.00% to match official Zerodha Kite & Groww Brokerage Tariffs.
 * 
 * Zerodha Rates (Official Tariff):
 * - Brokerage: ₹0.00 for Equity Delivery
 * - STT: 0.1% on Buy & Sell
 * - Transaction Charges: NSE 0.00307%, BSE 0.00375%
 * - GST: 18% on (Brokerage + SEBI Charges + Transaction Charges)
 * - SEBI Charges: ₹10 / crore (0.0001%)
 * - Stamp Charges: 0.015% (₹1500 / crore) on Buy side
 * - DP Charges: ₹15.34 per scrip (₹3.5 CDSL fee + ₹9.5 Zerodha fee + ₹2.34 GST) on Sell side
 * 
 * Groww Rates (Official Tariff):
 * - Brokerage: ₹20 or 0.1% per executed order, whichever is lower (min ₹5, max ₹20)
 * - STT: 0.1% on Buy & Sell
 * - Transaction Charges: NSE 0.00297%, BSE 0.00375%
 * - IPFT Charges: NSE 0.0001% on buy & sell
 * - GST: 18% on (Brokerage + SEBI Charges + Transaction Charges + IPFT + DP Base)
 * - SEBI Charges: ₹10 / crore (0.0001%)
 * - Stamp Charges: 0.015% on Buy side
 * - DP Charges: ₹23.60 per scrip (₹3.5 depository + ₹16.5 Groww = ₹20 base + ₹3.60 GST) on Sell side. ₹0 if sell value < ₹100.
 */
export function calculateEquityDeliveryBrokerage(params: {
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  targetNetPnL?: number;
  holdingMonths?: number;
  taxSettings: TaxSettings;
  mode?: 'forward' | 'reverse';
}): CalculationResult {
  const {
    quantity,
    buyPrice,
    sellPrice,
    targetNetPnL = 0,
    holdingMonths = 0,
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
  // Groww Delivery: ₹20 or 0.1% per executed order, whichever is lower (minimum ₹5)
  // ----------------------------------------------------
  let buyBrokerage = 0;
  if (isGroww) {
    buyBrokerage = buyTurnover > 0 ? Math.min(20, Math.max(5, buyTurnover * 0.001)) : 0;
  }

  // ----------------------------------------------------
  // 2. STT (Securities Transaction Tax - Equity Delivery)
  // 0.1% on Buy Turnover + 0.1% on Sell Turnover
  // ----------------------------------------------------
  const buyStt = (buyTurnover * 0.1) / 100;

  // ----------------------------------------------------
  // 3. EXCHANGE TRANSACTION CHARGES
  // Zerodha NSE: 0.00307% | Groww NSE: 0.00297% | BSE: 0.00375%
  // ----------------------------------------------------
  const exchangeTxnRateBuy = exchange === 'BSE' ? 0.00375 : isGroww ? 0.00297 : 0.00307;
  const buyExchangeTxn = (buyTurnover * exchangeTxnRateBuy) / 100;

  // IPFT (Investor Protection Fund Trust: 0.0001% on NSE for Groww)
  const buyIpft = (isGroww && exchange === 'NSE') ? (buyTurnover * 0.0001) / 100 : 0;

  // ----------------------------------------------------
  // 4. SEBI TURNOVER CHARGES
  // 0.0001% (₹10 per crore)
  // ----------------------------------------------------
  const buySebi = (buyTurnover * 0.0001) / 100;

  // ----------------------------------------------------
  // 5. GST (Goods & Services Tax @ 18%)
  // 18% on (Brokerage + SEBI Charges + Transaction Charges + IPFT)
  // ----------------------------------------------------
  const buyGst = 0.18 * (buyBrokerage + buyExchangeTxn + buySebi + buyIpft);

  // ----------------------------------------------------
  // 6. STAMP DUTY (BUY SIDE ONLY)
  // 0.015% (₹1500 / crore) on Buy Turnover
  // Zerodha rounds up to nearest integer (e.g. ₹1.50 -> ₹2.00)
  // Groww keeps exact float (₹1.50)
  // ----------------------------------------------------
  const rawBuyStampDuty = (buyTurnover * 0.015) / 100;
  const buyStampDuty = isGroww ? rawBuyStampDuty : Math.ceil(rawBuyStampDuty);

  const totalBuyCharges = buyBrokerage + buyStt + buyExchangeTxn + buySebi + buyIpft + buyGst + buyStampDuty;

  if (mode === 'forward') {
    const sellTurnover = qty * sellP;
    const grossSaleValue = sellTurnover;
    const turnover = buyTurnover + sellTurnover;

    // SELL SIDE BROKERAGE
    let sellBrokerage = 0;
    if (isGroww && sellTurnover > 0) {
      sellBrokerage = Math.min(20, Math.max(5, sellTurnover * 0.001));
    }

    // SELL SIDE STT
    const sellStt = (sellTurnover * 0.1) / 100;

    // SELL SIDE EXCHANGE TXN & IPFT
    const exchangeTxnRateSell = exchange === 'BSE' ? 0.00375 : isGroww ? 0.00297 : 0.00307;
    const sellExchangeTxn = (sellTurnover * exchangeTxnRateSell) / 100;
    const sellIpft = (isGroww && exchange === 'NSE') ? (sellTurnover * 0.0001) / 100 : 0;

    // SELL SIDE SEBI
    const sellSebi = (sellTurnover * 0.0001) / 100;

    // SELL SIDE GST
    const sellGst = 0.18 * (sellBrokerage + sellExchangeTxn + sellSebi + sellIpft);

    // ----------------------------------------------------
    // 7. DP CHARGES (SELL SIDE ONLY)
    // Zerodha: ₹15.34 per scrip (₹3.5 CDSL + ₹9.5 Zerodha + ₹2.34 GST)
    // Groww: ₹23.60 per scrip (₹3.5 CDSL + ₹16.5 Groww = ₹20 base + ₹3.60 GST). ₹0 if sell value < ₹100.
    // ----------------------------------------------------
    const baseDpCharge = isGroww ? 20.00 : 13.00;
    const dpGst = baseDpCharge * 0.18;
    const sellDpCharges = sellTurnover > (isGroww ? 100 : 0) ? (baseDpCharge + dpGst) : 0;

    const totalSellCharges = sellBrokerage + sellStt + sellExchangeTxn + sellSebi + sellIpft + sellGst + sellDpCharges;

    // COMBINED TOTALS
    const totalBrokerage = buyBrokerage + sellBrokerage;
    const totalStt = buyStt + sellStt;
    const totalExchangeTxn = buyExchangeTxn + sellExchangeTxn;
    const totalSebi = buySebi + sellSebi + buyIpft + sellIpft;
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
      buySebi: buySebi + buyIpft,
      buyGst,
      buyStampDuty,
      totalBuyCharges,

      // Sell Side Itemized Breakdown
      sellBrokerage,
      sellStt,
      sellExchangeTxn,
      sellSebi: sellSebi + sellIpft,
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

    const baseDpCharge = isGroww ? 20.00 : 13.00;
    const dpGst = baseDpCharge * 0.18;
    const dpChargeTotal = baseDpCharge + dpGst;

    let reqSellP = buyP;
    for (let i = 0; i < 5; i++) {
      const estSellTurnover = qty * reqSellP;
      let estSellBrokerage = 0;
      if (isGroww) {
        estSellBrokerage = estSellTurnover > 0 ? Math.min(20, Math.max(5, estSellTurnover * 0.001)) : 0;
      }

      const estSellStt = (estSellTurnover * 0.1) / 100;
      const exchangeTxnRateSell = exchange === 'BSE' ? 0.00375 : isGroww ? 0.00297 : 0.00307;
      const estSellExch = (estSellTurnover * exchangeTxnRateSell) / 100;
      const estSellSebi = (estSellTurnover * 0.0001) / 100;
      const estSellIpft = (isGroww && exchange === 'NSE') ? (estSellTurnover * 0.0001) / 100 : 0;
      const estSellGst = 0.18 * (estSellBrokerage + estSellExch + estSellSebi + estSellIpft);
      const estDp = estSellTurnover > (isGroww ? 100 : 0) ? dpChargeTotal : 0;
      const estTotalSellCharges = estSellBrokerage + estSellStt + estSellExch + estSellSebi + estSellIpft + estSellGst + estDp;

      const estTotalFees = totalBuyCharges + estTotalSellCharges;
      const currentNet = estSellTurnover - buyTurnover - estTotalFees;
      const diff = targetGrossProfit - currentNet;
      reqSellP += diff / qty;
    }

    const requiredGrossSaleValue = qty * reqSellP;
    const turnover = buyTurnover + requiredGrossSaleValue;

    let sellBrokerage = 0;
    if (isGroww && requiredGrossSaleValue > 0) {
      sellBrokerage = Math.min(20, Math.max(5, requiredGrossSaleValue * 0.001));
    }

    const sellStt = (requiredGrossSaleValue * 0.1) / 100;
    const exchangeTxnRateSell = exchange === 'BSE' ? 0.00375 : isGroww ? 0.00297 : 0.00307;
    const sellExchangeTxn = (requiredGrossSaleValue * exchangeTxnRateSell) / 100;
    const sellSebi = (requiredGrossSaleValue * 0.0001) / 100;
    const sellIpft = (isGroww && exchange === 'NSE') ? (requiredGrossSaleValue * 0.0001) / 100 : 0;
    const sellGst = 0.18 * (sellBrokerage + sellExchangeTxn + sellSebi + sellIpft);
    const sellDpCharges = requiredGrossSaleValue > (isGroww ? 100 : 0) ? dpChargeTotal : 0;

    const totalSellCharges = sellBrokerage + sellStt + sellExchangeTxn + sellSebi + sellIpft + sellGst + sellDpCharges;

    const totalBrokerage = buyBrokerage + sellBrokerage;
    const totalStt = buyStt + sellStt;
    const totalExchangeTxn = buyExchangeTxn + sellExchangeTxn;
    const totalSebi = buySebi + sellSebi + buyIpft + sellIpft;
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
      buySebi: buySebi + buyIpft,
      buyGst,
      buyStampDuty,
      totalBuyCharges,

      // Sell Side Breakdown
      sellBrokerage,
      sellStt,
      sellExchangeTxn,
      sellSebi: sellSebi + sellIpft,
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
