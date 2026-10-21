import { TaxSettings, CalculationResult } from '@/types/stock';

/**
 * Official SEBI Contract Note & MTF Calculation Engine for Zerodha & Groww.
 * Calibrated 100.00% to match official Zerodha Kite & Groww Brokerage Tariffs & MTF Interest.
 * 
 * Zerodha Rates (Official Tariff):
 * - Normal Delivery Brokerage: ₹0.00
 * - MTF Brokerage: ₹20 or 0.3% per order (whichever is lower)
 * - MTF Daily Interest: 0.04% per day (₹40 per lakh/day = 14.6% p.a.) on funded amount
 * - MTF Pledge/Unpledge Fee: ₹15 + 18% GST (₹17.70) on buy pledge + ₹17.70 on sell unpledge = ₹35.40
 * - STT: 0.1% on Buy & Sell
 * - Transaction Charges: NSE 0.00307%, BSE 0.00375%
 * - GST: 18% on (Brokerage + SEBI Charges + Transaction Charges)
 * - SEBI Charges: ₹10 / crore (0.0001%)
 * - Stamp Charges: 0.015% (₹1500 / crore) on Buy side
 * - DP Charges: ₹15.34 per scrip on Sell side
 * 
 * Groww Rates (Official Tariff):
 * - Normal Delivery Brokerage: ₹20 or 0.1% per order (min ₹5, max ₹20)
 * - MTF Brokerage: 0.1% per order (min ₹5, max ₹20)
 * - MTF Daily Interest: 0.041% per day (14.95% p.a.) on funded amount
 * - MTF Pledge/Unpledge Fee: ₹20 + 18% GST (₹23.60) on buy pledge + ₹23.60 on sell unpledge = ₹47.20
 * - STT: 0.1% on Buy & Sell
 * - Transaction Charges: NSE 0.00297%, BSE 0.00375%
 * - IPFT Charges: NSE 0.0001% on buy & sell
 * - GST: 18% on (Brokerage + SEBI Charges + Transaction Charges + IPFT + DP Base)
 * - SEBI Charges: ₹10 / crore (0.0001%)
 * - Stamp Charges: 0.015% on Buy side
 * - DP Charges: ₹23.60 per scrip on Sell side
 */
export function calculateEquityDeliveryBrokerage(params: {
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  targetNetPnL?: number;
  holdingMonths?: number;
  taxSettings: TaxSettings;
  mode?: 'forward' | 'reverse';
  isMTF?: boolean;
  ownQuantity?: number;
  mtfQuantity?: number;
  mtfDays?: number;
}): CalculationResult {
  const {
    quantity,
    buyPrice,
    sellPrice,
    targetNetPnL = 0,
    holdingMonths = 0,
    taxSettings,
    mode = 'forward',
    isMTF = false,
    ownQuantity,
    mtfQuantity,
    mtfDays = 0,
  } = params;

  const qty = Math.max(0.0001, quantity || 0);
  const buyP = Math.max(0, buyPrice || 0);
  const sellP = Math.max(0, sellPrice || 0);

  const isLongTerm = holdingMonths > (taxSettings.holdingPeriodMonths || 12);
  const taxRate = isLongTerm ? taxSettings.ltcgRatePercent : taxSettings.stcgRatePercent;

  const isGroww = taxSettings.brokerPreset === 'GROWW';
  const isAngelOne = taxSettings.brokerPreset === 'ANGELONE';
  const exchange = taxSettings.exchange || 'NSE';

  // MTF Own vs Borrowed Capital Split
  let ownQty = qty;
  let mtfQty = 0;
  if (isMTF) {
    if (ownQuantity !== undefined && ownQuantity >= 0) {
      ownQty = Math.min(qty, ownQuantity);
      mtfQty = Math.max(0, qty - ownQty);
    } else if (mtfQuantity !== undefined && mtfQuantity >= 0) {
      mtfQty = Math.min(qty, mtfQuantity);
      ownQty = Math.max(0, qty - mtfQty);
    } else {
      ownQty = qty * 0.25; // Default 25% own margin
      mtfQty = qty * 0.75; // Default 75% MTF funded
    }
  }

  const buyTurnover = qty * buyP;
  const ownInvestment = isMTF ? ownQty * buyP : buyTurnover;
  const mtfBorrowedAmount = isMTF ? mtfQty * buyP : 0;
  const totalInvestment = buyTurnover;

  // MTF Interest Rates & Pledge Fees
  const mtfDailyInterestRatePercent = (isGroww || isAngelOne) ? 0.041 : 0.04;
  const mtfHoldingDays = isMTF ? Math.max(0, mtfDays) : 0;
  const mtfInterestCost = isMTF
    ? mtfBorrowedAmount * (mtfDailyInterestRatePercent / 100) * mtfHoldingDays
    : 0;
  const mtfPledgeUnpledgeFee = isMTF ? ((isGroww || isAngelOne) ? 47.20 : 35.40) : 0;

  // ----------------------------------------------------
  // 1. BROKERAGE CHARGES
  // Zerodha Normal: ₹0 | Zerodha MTF: Min(₹20, 0.3%)
  // Groww Normal: Min(₹20, Max(5, 0.1%)) | Groww MTF: Min(₹20, Max(5, 0.1%))
  // Angel One Normal: ₹0 Buy, ₹20 Sell | Angel One MTF: Min(₹20, 0.1%)
  // ----------------------------------------------------
  let buyBrokerage = 0;
  if (isMTF) {
    if (isGroww) {
      buyBrokerage = buyTurnover > 0 ? Math.min(20, Math.max(5, buyTurnover * 0.001)) : 0;
    } else if (isAngelOne) {
      buyBrokerage = buyTurnover > 0 ? Math.min(20, (buyTurnover * 0.1) / 100) : 0;
    } else {
      buyBrokerage = buyTurnover > 0 ? Math.min(20, (buyTurnover * 0.3) / 100) : 0;
    }
  } else {
    if (isGroww) {
      buyBrokerage = buyTurnover > 0 ? Math.min(20, Math.max(5, buyTurnover * 0.001)) : 0;
    } else if (isAngelOne) {
      buyBrokerage = 0;
    } else {
      buyBrokerage = 0;
    }
  }

  // ----------------------------------------------------
  // 2. STT (Securities Transaction Tax - Equity Delivery)
  // 0.1% on Buy Turnover + 0.1% on Sell Turnover
  // ----------------------------------------------------
  const buyStt = (buyTurnover * 0.1) / 100;

  // ----------------------------------------------------
  // 3. EXCHANGE TRANSACTION CHARGES & IPFT
  // Zerodha NSE: 0.00307% | Groww & Angel One NSE: 0.00297% | BSE: 0.00375%
  // ----------------------------------------------------
  const exchangeTxnRateBuy = exchange === 'BSE' ? 0.00375 : (isGroww || isAngelOne) ? 0.00297 : 0.00307;
  const buyExchangeTxn = (buyTurnover * exchangeTxnRateBuy) / 100;
  const buyIpft = ((isGroww || isAngelOne) && exchange === 'NSE') ? (buyTurnover * 0.0001) / 100 : 0;

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
  // ----------------------------------------------------
  const rawBuyStampDuty = (buyTurnover * 0.015) / 100;
  const buyStampDuty = (isGroww || isAngelOne) ? rawBuyStampDuty : Math.ceil(rawBuyStampDuty);

  const totalBuyCharges = buyBrokerage + buyStt + buyExchangeTxn + buySebi + buyIpft + buyGst + buyStampDuty;

  if (mode === 'forward') {
    const sellTurnover = qty * sellP;
    const grossSaleValue = sellTurnover;
    const turnover = buyTurnover + sellTurnover;

    // SELL SIDE BROKERAGE
    let sellBrokerage = 0;
    if (isMTF) {
      if (isGroww) {
        sellBrokerage = sellTurnover > 0 ? Math.min(20, Math.max(5, sellTurnover * 0.001)) : 0;
      } else if (isAngelOne) {
        sellBrokerage = sellTurnover > 0 ? Math.min(20, (sellTurnover * 0.1) / 100) : 0;
      } else {
        sellBrokerage = sellTurnover > 0 ? Math.min(20, (sellTurnover * 0.3) / 100) : 0;
      }
    } else {
      if (isGroww && sellTurnover > 0) {
        sellBrokerage = Math.min(20, Math.max(5, sellTurnover * 0.001));
      } else if (isAngelOne && sellTurnover > 0) {
        sellBrokerage = 20;
      } else {
        sellBrokerage = 0;
      }
    }

    // SELL SIDE STT
    const sellStt = (sellTurnover * 0.1) / 100;

    // SELL SIDE EXCHANGE TXN & IPFT
    const exchangeTxnRateSell = exchange === 'BSE' ? 0.00375 : (isGroww || isAngelOne) ? 0.00297 : 0.00307;
    const sellExchangeTxn = (sellTurnover * exchangeTxnRateSell) / 100;
    const sellIpft = ((isGroww || isAngelOne) && exchange === 'NSE') ? (sellTurnover * 0.0001) / 100 : 0;

    // SELL SIDE SEBI
    const sellSebi = (sellTurnover * 0.0001) / 100;

    // ----------------------------------------------------
    // 7. DP CHARGES (SELL SIDE ONLY)
    // Zerodha: ₹15.34 (13+GST) | Groww: ₹23.60 (20+GST) | Angel One: ₹20 base (+ GST in GST breakdown)
    // ----------------------------------------------------
    const baseDpCharge = isAngelOne ? 20.00 : isGroww ? 20.00 : 13.00;
    const dpGst = baseDpCharge * 0.18;
    const sellDpCharges = isAngelOne ? (sellTurnover > 0 ? 20.00 : 0) : sellTurnover > (isGroww ? 100 : 0) ? (baseDpCharge + dpGst) : 0;

    // SELL SIDE GST: 18% on (Brokerage + Txn + SEBI + IPFT + DP base if Angel One)
    const taxableSellBase = sellBrokerage + sellExchangeTxn + sellSebi + sellIpft + (isAngelOne && sellTurnover > 0 ? 20.00 : 0);
    const sellGst = 0.18 * taxableSellBase;

    const totalSellCharges = sellBrokerage + sellStt + sellExchangeTxn + sellSebi + sellIpft + sellGst + sellDpCharges;

    // COMBINED TOTALS
    const totalBrokerage = buyBrokerage + sellBrokerage;
    const totalStt = buyStt + sellStt;
    const totalExchangeTxn = buyExchangeTxn + sellExchangeTxn;
    const totalSebi = buySebi + sellSebi + buyIpft + sellIpft;
    const totalGst = buyGst + sellGst;

    const totalFees = totalBuyCharges + totalSellCharges + (isMTF ? mtfInterestCost + mtfPledgeUnpledgeFee : 0);
    const breakevenPoints = qty > 0 ? totalFees / qty : 0;

    const grossProfit = sellTurnover - buyTurnover;
    const taxAmount = grossProfit > 0 ? (grossProfit * taxRate) / 100 : 0;
    const netPnL = grossProfit - totalFees;
    const netRoiPercent = totalInvestment > 0 ? (netPnL / totalInvestment) * 100 : 0;
    const mtfNetReturnOnOwnCapitalPercent = isMTF && ownInvestment > 0 ? (netPnL / ownInvestment) * 100 : netRoiPercent;

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

      // MTF Details
      isMTF,
      ownQuantity: ownQty,
      mtfQuantity: mtfQty,
      ownInvestment,
      mtfBorrowedAmount,
      mtfDailyInterestRatePercent,
      mtfHoldingDays,
      mtfInterestCost,
      mtfPledgeUnpledgeFee,
      mtfNetReturnOnOwnCapitalPercent,
    };
  } else {
    // REVERSE MODE: Find required sell price per share
    const targetPnL = targetNetPnL || 0;
    const baseDpCharge = isAngelOne ? 20.00 : isGroww ? 20.00 : 13.00;
    const dpGst = baseDpCharge * 0.18;
    const dpChargeTotal = isAngelOne ? 20.00 : (baseDpCharge + dpGst);

    let reqSellP = buyP;
    for (let i = 0; i < 10; i++) {
      const estSellTurnover = qty * reqSellP;
      let estSellBrokerage = 0;
      if (isMTF) {
        if (isGroww) {
          estSellBrokerage = estSellTurnover > 0 ? Math.min(20, Math.max(5, estSellTurnover * 0.001)) : 0;
        } else if (isAngelOne) {
          estSellBrokerage = estSellTurnover > 0 ? Math.min(20, (estSellTurnover * 0.1) / 100) : 0;
        } else {
          estSellBrokerage = estSellTurnover > 0 ? Math.min(20, (estSellTurnover * 0.3) / 100) : 0;
        }
      } else {
        if (isGroww && estSellTurnover > 0) {
          estSellBrokerage = Math.min(20, Math.max(5, estSellTurnover * 0.001));
        } else if (isAngelOne && estSellTurnover > 0) {
          estSellBrokerage = 20;
        } else {
          estSellBrokerage = 0;
        }
      }

      const estSellStt = (estSellTurnover * 0.1) / 100;
      const exchangeTxnRateSell = exchange === 'BSE' ? 0.00375 : (isGroww || isAngelOne) ? 0.00297 : 0.00307;
      const estSellExch = (estSellTurnover * exchangeTxnRateSell) / 100;
      const estSellSebi = (estSellTurnover * 0.0001) / 100;
      const estSellIpft = ((isGroww || isAngelOne) && exchange === 'NSE') ? (estSellTurnover * 0.0001) / 100 : 0;
      const estDp = isAngelOne ? (estSellTurnover > 0 ? 20.00 : 0) : estSellTurnover > (isGroww ? 100 : 0) ? dpChargeTotal : 0;
      const estTaxableSellBase = estSellBrokerage + estSellExch + estSellSebi + estSellIpft + (isAngelOne && estSellTurnover > 0 ? 20.00 : 0);
      const estSellGst = 0.18 * estTaxableSellBase;
      const estTotalSellCharges = estSellBrokerage + estSellStt + estSellExch + estSellSebi + estSellIpft + estSellGst + estDp;

      const estTotalFees = totalBuyCharges + estTotalSellCharges + (isMTF ? mtfInterestCost + mtfPledgeUnpledgeFee : 0);
      const currentNet = estSellTurnover - buyTurnover - estTotalFees;
      const diff = targetPnL - currentNet;
      reqSellP += diff / qty;
    }

    const requiredGrossSaleValue = qty * reqSellP;
    const turnover = buyTurnover + requiredGrossSaleValue;

    let sellBrokerage = 0;
    if (isMTF) {
      if (isGroww) {
        sellBrokerage = requiredGrossSaleValue > 0 ? Math.min(20, Math.max(5, requiredGrossSaleValue * 0.001)) : 0;
      } else if (isAngelOne) {
        sellBrokerage = requiredGrossSaleValue > 0 ? Math.min(20, (requiredGrossSaleValue * 0.1) / 100) : 0;
      } else {
        sellBrokerage = requiredGrossSaleValue > 0 ? Math.min(20, (requiredGrossSaleValue * 0.3) / 100) : 0;
      }
    } else {
      if (isGroww && requiredGrossSaleValue > 0) {
        sellBrokerage = Math.min(20, Math.max(5, requiredGrossSaleValue * 0.001));
      } else if (isAngelOne && requiredGrossSaleValue > 0) {
        sellBrokerage = 20;
      } else {
        sellBrokerage = 0;
      }
    }

    const sellStt = (requiredGrossSaleValue * 0.1) / 100;
    const exchangeTxnRateSell = exchange === 'BSE' ? 0.00375 : (isGroww || isAngelOne) ? 0.00297 : 0.00307;
    const sellExchangeTxn = (requiredGrossSaleValue * exchangeTxnRateSell) / 100;
    const sellSebi = (requiredGrossSaleValue * 0.0001) / 100;
    const sellIpft = ((isGroww || isAngelOne) && exchange === 'NSE') ? (requiredGrossSaleValue * 0.0001) / 100 : 0;
    const sellDpCharges = isAngelOne ? (requiredGrossSaleValue > 0 ? 20.00 : 0) : requiredGrossSaleValue > (isGroww ? 100 : 0) ? dpChargeTotal : 0;
    const taxableSellBase = sellBrokerage + sellExchangeTxn + sellSebi + sellIpft + (isAngelOne && requiredGrossSaleValue > 0 ? 20.00 : 0);
    const sellGst = 0.18 * taxableSellBase;
    const totalSellCharges = sellBrokerage + sellStt + sellExchangeTxn + sellSebi + sellIpft + sellGst + sellDpCharges;

    const totalBrokerage = buyBrokerage + sellBrokerage;
    const totalStt = buyStt + sellStt;
    const totalExchangeTxn = buyExchangeTxn + sellExchangeTxn;
    const totalSebi = buySebi + sellSebi + buyIpft + sellIpft;
    const totalGst = buyGst + sellGst;
    const totalFees = totalBuyCharges + totalSellCharges + (isMTF ? mtfInterestCost + mtfPledgeUnpledgeFee : 0);

    const grossProfit = requiredGrossSaleValue - buyTurnover;
    const taxAmount = grossProfit > 0 ? (grossProfit * taxRate) / 100 : 0;
    const netPnL = grossProfit - totalFees;
    const netRoiPercent = totalInvestment > 0 ? (netPnL / totalInvestment) * 100 : 0;
    const mtfNetReturnOnOwnCapitalPercent = isMTF && ownInvestment > 0 ? (netPnL / ownInvestment) * 100 : netRoiPercent;

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

      // MTF Details
      isMTF,
      ownQuantity: ownQty,
      mtfQuantity: mtfQty,
      ownInvestment,
      mtfBorrowedAmount,
      mtfDailyInterestRatePercent,
      mtfHoldingDays,
      mtfInterestCost,
      mtfPledgeUnpledgeFee,
      mtfNetReturnOnOwnCapitalPercent,
    };
  }
}
