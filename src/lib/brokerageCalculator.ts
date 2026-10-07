import { TaxSettings, CalculationResult } from '@/types/stock';

/**
 * Itemized Indian Equity Delivery Brokerage & Statutory Tax Engine for Zerodha & Groww.
 * Computes exact Buy Side vs Sell Side statutory charges separately.
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

  const exchange = taxSettings.exchange || 'NSE';
  // Exchange transaction charge rate: NSE 0.00297%, BSE 0.00375%
  const exchangeTxnRate = exchange === 'BSE' ? 0.00375 : 0.00297;
  // SEBI Turnover Fee: 0.0001% (₹10 per crore)
  const sebiRate = 0.0001;
  // Stamp Duty (Buy side only for delivery): 0.015%
  const stampDutyRate = 0.015;
  // STT (Securities Transaction Tax for delivery): 0.1% buy + 0.1% sell
  const sttRate = 0.1;
  // GST Rate: 18%
  const gstRate = 0.18;

  // DP Charges (applied on sell transactions only): Zerodha ₹15.34 (13+18% GST), Groww ₹15.93 (13.50+18% GST)
  const dpChargeRate =
    taxSettings.brokerPreset === 'GROWW' ? 15.93 : 15.34;

  const buyTurnover = qty * buyP;
  const totalInvestment = buyTurnover;

  // 1. BUY SIDE CHARGES
  let buyBrokerage = 0;
  if (taxSettings.brokerPreset === 'GROWW') {
    buyBrokerage = Math.min(buyTurnover * 0.0005, 20);
  } else {
    // Zerodha Equity Delivery Buy Brokerage = ₹0
    buyBrokerage = 0;
  }

  const buyStt = (buyTurnover * sttRate) / 100;
  const buyExchangeTxn = (buyTurnover * exchangeTxnRate) / 100;
  const buySebi = (buyTurnover * sebiRate) / 100;
  const buyGst = (buyBrokerage + buyExchangeTxn + buySebi) * gstRate;
  const buyStampDuty = (buyTurnover * stampDutyRate) / 100; // Stamp duty is BUY SIDE ONLY
  const totalBuyCharges = buyBrokerage + buyStt + buyExchangeTxn + buySebi + buyGst + buyStampDuty;

  if (mode === 'forward') {
    const sellTurnover = qty * sellP;
    const grossSaleValue = sellTurnover;
    const turnover = buyTurnover + sellTurnover;

    // 2. SELL SIDE CHARGES
    let sellBrokerage = 0;
    if (taxSettings.brokerPreset === 'GROWW') {
      sellBrokerage = Math.min(sellTurnover * 0.0005, 20);
    } else {
      // Zerodha Equity Delivery Sell Brokerage = ₹0
      sellBrokerage = 0;
    }

    const sellStt = (sellTurnover * sttRate) / 100;
    const sellExchangeTxn = (sellTurnover * exchangeTxnRate) / 100;
    const sellSebi = (sellTurnover * sebiRate) / 100;
    const sellGst = (sellBrokerage + sellExchangeTxn + sellSebi) * gstRate;
    const sellDpCharges = sellTurnover > 0 ? dpChargeRate : 0; // DP charge is SELL SIDE ONLY

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
      breakevenPoints,
      netPnL,
      netRoiPercent,
    };
  } else {
    // REVERSE MODE: Find required sell price per share
    const targetPnL = targetNetPnL || 0;
    const targetGrossProfit = targetPnL > 0 ? targetPnL / (1 - taxRate / 100) : targetPnL;

    let reqSellP = buyP;
    for (let i = 0; i < 5; i++) {
      const estSellTurnover = qty * reqSellP;
      let estSellBrokerage = 0;
      if (taxSettings.brokerPreset === 'GROWW') {
        estSellBrokerage = Math.min(estSellTurnover * 0.0005, 20);
      }

      const estSellStt = (estSellTurnover * sttRate) / 100;
      const estSellExch = (estSellTurnover * exchangeTxnRate) / 100;
      const estSellSebi = (estSellTurnover * sebiRate) / 100;
      const estSellGst = (estSellBrokerage + estSellExch + estSellSebi) * gstRate;
      const estTotalSellCharges = estSellBrokerage + estSellStt + estSellExch + estSellSebi + estSellGst + dpChargeRate;

      const estTotalFees = totalBuyCharges + estTotalSellCharges;
      const currentNet = estSellTurnover - buyTurnover - estTotalFees;
      const diff = targetGrossProfit - currentNet;
      reqSellP += diff / qty;
    }

    const requiredGrossSaleValue = qty * reqSellP;
    const turnover = buyTurnover + requiredGrossSaleValue;

    let sellBrokerage = 0;
    if (taxSettings.brokerPreset === 'GROWW') {
      sellBrokerage = Math.min(requiredGrossSaleValue * 0.0005, 20);
    }

    const sellStt = (requiredGrossSaleValue * sttRate) / 100;
    const sellExchangeTxn = (requiredGrossSaleValue * exchangeTxnRate) / 100;
    const sellSebi = (requiredGrossSaleValue * sebiRate) / 100;
    const sellGst = (sellBrokerage + sellExchangeTxn + sellSebi) * gstRate;
    const sellDpCharges = dpChargeRate;
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
