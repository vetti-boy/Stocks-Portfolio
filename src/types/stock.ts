export type CurrencySymbol = 'INR';
export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  currency: 'INR';
  isGuest: boolean;
  mustChangePassword?: boolean;
  isDisabled?: boolean;
}

export interface StockHolding {
  id: string;
  symbol: string;
  companyName: string;
  buyPrice: number;
  quantity: number;
  buyDate: string;
  exchange: 'NSE' | 'BSE' | 'US' | 'CRYPTO';
  category: 'Tech' | 'Financials' | 'Consumer' | 'Energy' | 'Automotive' | 'Industrial' | 'Pharma' | 'Crypto' | 'Other';
  broker?: 'ZERODHA' | 'GROWW';
  notes?: string;
  currentPrice: number;
  previousClose: number;
  dayChangePercent: number;
  // MTF (Margin Trading Facility) Properties
  isMTF?: boolean;
  ownQuantity?: number;
  mtfQuantity?: number;
  ownAmount?: number;
  mtfBorrowedAmount?: number;
  mtfInterestAccrued?: number;
  mtfDaysHeld?: number;
}

export interface TradeRecord {
  id: string;
  symbol: string;
  companyName: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  buyPrice?: number;
  price: number;
  totalValue: number;
  date: string;
  broker?: 'ZERODHA' | 'GROWW';
  realizedPnL?: number;
  realizedPnLPercent?: number;
  exchange: string;
  // MTF Realized Trade Details
  isMTF?: boolean;
  ownQuantity?: number;
  mtfQuantity?: number;
  mtfBorrowedAmount?: number;
  mtfInterestDeducted?: number;
  mtfPledgeCharges?: number;
  mtfDaysHeld?: number;
}

export interface PricePoint {
  time: string;
  price: number;
  volume: number;
}

export interface WatchlistItem {
  symbol: string;
  companyName: string;
  currentPrice: number;
  previousClose: number;
  dayChange: number;
  dayChangePercent: number;
  high52: number;
  low52: number;
  volume: string;
  marketCap: string;
  peRatio: number;
  alertHigh?: number;
  alertLow?: number;
  category: string;
  history: PricePoint[];
}

export interface TaxSettings {
  brokerPreset?: 'ZERODHA' | 'GROWW';
  exchange?: 'NSE' | 'BSE';
  holdingPeriodMonths: number;
  stcgRatePercent: number;
  ltcgRatePercent: number;
  ltcgExemptionLimit: number;
  flatBrokerageBuy: number;
  flatBrokerageSell: number;
  brokeragePercent: number;
  stampDutyPercent: number;
  sttPercent: number;
  gstPercent: number;
  exchangeTxnRatePercent?: number;
  sebiRatePercent?: number;
  flatDpCharges?: number;
}

export interface CalculatorInput {
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  targetNetPnL: number;
  holdingPeriodMonths: number;
  mode: 'forward' | 'reverse';
  isMTF?: boolean;
  ownQuantity?: number;
  mtfQuantity?: number;
  mtfDays?: number;
}

export interface CalculationResult {
  totalInvestment: number;
  buyTurnover: number;
  sellTurnover: number;
  turnover: number;
  grossSaleValue: number;
  grossProfit: number;
  isLongTerm: boolean;
  applicableTaxRate: number;
  taxAmount: number;
  // Buy Side Charges
  buyBrokerage: number;
  buyStt: number;
  buyExchangeTxn: number;
  buySebi: number;
  buyGst: number;
  buyStampDuty: number;
  totalBuyCharges: number;
  // Sell Side Charges
  sellBrokerage: number;
  sellStt: number;
  sellExchangeTxn: number;
  sellSebi: number;
  sellGst: number;
  sellDpCharges: number;
  totalSellCharges: number;
  // Combined Totals
  totalBrokerage: number;
  totalStt: number;
  totalExchangeTxn: number;
  totalSebi: number;
  totalGst: number;
  stampDuty: number;
  dpCharges: number;
  sttBuy: number;
  sttSell: number;
  sttCharges: number;
  exchangeTxnCharge: number;
  sebiCharges: number;
  gstCharges: number;
  totalFees: number;
  breakevenPoints: number;
  netPnL: number;
  netRoiPercent: number;
  requiredSellPricePerShare?: number;
  requiredGrossSaleValue?: number;
  // MTF Breakdown Details
  isMTF?: boolean;
  ownQuantity?: number;
  mtfQuantity?: number;
  ownInvestment?: number;
  mtfBorrowedAmount?: number;
  mtfDailyInterestRatePercent?: number;
  mtfHoldingDays?: number;
  mtfInterestCost?: number;
  mtfPledgeUnpledgeFee?: number;
  mtfNetReturnOnOwnCapitalPercent?: number;
}
