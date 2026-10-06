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
  brokerPreset?: 'ZERODHA' | 'GROWW' | 'ANGELONE' | 'UPSTOX' | 'ICICIDIRECT' | 'CUSTOM';
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
  flatDpCharges?: number;
}

export interface CalculatorInput {
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  targetNetPnL: number;
  holdingPeriodMonths: number;
  mode: 'forward' | 'reverse';
}

export interface CalculationResult {
  totalInvestment: number;
  grossSaleValue: number;
  grossProfit: number;
  isLongTerm: boolean;
  applicableTaxRate: number;
  taxAmount: number;
  buyBrokerage: number;
  sellBrokerage: number;
  totalBrokerage: number;
  stampDuty: number;
  sttCharges: number;
  dpCharges: number;
  gstCharges: number;
  totalFees: number;
  netPnL: number;
  netRoiPercent: number;
  requiredSellPricePerShare?: number;
  requiredGrossSaleValue?: number;
}
