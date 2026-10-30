import { StockHolding, TaxSettings, TradeRecord } from '@/types/stock';
import { CalculationResult } from '@/types/stock';
import { calculateEquityDeliveryBrokerage } from '@/lib/brokerageCalculator';

/** A sold trade enriched with the calibrated charges / P&L from the brokerage engine. */
export interface LedgerTrade extends TradeRecord {
  calc: CalculationResult;
  daysHeld: number;
  buyP: number;
  sellP: number;
  buyDate: string;
  /** False when the record never stored a buy date (the ledger then has to guess one). */
  buyDateRecorded: boolean;
  /** Date the trade was sold (YYYY-MM-DD). This is the date realized P&L is attributed to. */
  soldOn: string;
  grossInvested: number;
  totalSaleValue: number;
  grossPnL: number;
  totalDeductions: number;
  netPnL: number;
  netRoiPercent: number;
}

const isSymbolMatch = (a?: string, b?: string) => {
  if (!a || !b) return false;
  const strip = (s: string) => s.replace(/\.NS$/i, '').replace(/\.BO$/i, '').toUpperCase();
  return strip(a) === strip(b);
};

// ---------------------------------------------------------------------------
// Date helpers — all dates are plain 'YYYY-MM-DD' strings, handled in UTC so a
// trade never slips into the neighbouring day / week / month by timezone.
// ---------------------------------------------------------------------------

const pad = (n: number) => String(n).padStart(2, '0');

export function todayYMD(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Normalises any date-ish string to YYYY-MM-DD, or returns null if unparseable. */
export function toYMD(value?: string | null): string | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (m) {
    const [, y, mo, d] = m;
    const dt = new Date(Date.UTC(+y, +mo - 1, +d));
    if (dt.getUTCFullYear() === +y && dt.getUTCMonth() === +mo - 1 && dt.getUTCDate() === +d) return `${y}-${mo}-${d}`;
    return null;
  }
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return null;
  const dt = new Date(t);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

const ymdToUTC = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
const utcToYMD = (ms: number) => {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

export const addDays = (ymd: string, n: number) => utcToYMD(ymdToUTC(ymd) + n * 86400000);

/** Monday of the week containing `ymd` (Indian market week runs Mon–Fri). */
export function startOfWeek(ymd: string): string {
  const dow = new Date(ymdToUTC(ymd)).getUTCDay(); // 0 = Sun
  return addDays(ymd, -((dow + 6) % 7));
}

export const startOfMonth = (ymd: string) => `${ymd.slice(0, 7)}-01`;
export function endOfMonth(ymd: string): string {
  const [y, m] = ymd.split('-').map(Number);
  return utcToYMD(Date.UTC(y, m, 0));
}

/** Indian financial year start (1 April) for the FY containing `ymd`. */
export function startOfFinancialYear(ymd: string): string {
  const [y, m] = ymd.split('-').map(Number);
  return `${m >= 4 ? y : y - 1}-04-01`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dayLabel = (ymd: string) => `${+ymd.slice(8, 10)} ${MONTHS[+ymd.slice(5, 7) - 1]}`;

// ---------------------------------------------------------------------------
// Ledger construction (moved out of the Portfolio tab so it can be reused)
// ---------------------------------------------------------------------------

export function buildTradeLedger(
  tradeHistory: TradeRecord[],
  holdings: StockHolding[],
  taxSettings: TaxSettings
): LedgerTrade[] {
  return tradeHistory.map((t) => {
    // Resolve buy price & date (handling both new and legacy trade records)
    let buyP = t.buyPrice !== undefined && t.buyPrice !== null && Number(t.buyPrice) > 0 ? Number(t.buyPrice) : 0;
    const sellP = Number(t.price) || 0;
    const qty = Math.max(0.0001, Number(t.quantity) || 1);
    const totalSaleValue = t.totalValue || sellP * qty;

    // Legacy records saved realizedPnL as gross profit: buyP = sellP - (realizedPnL / qty)
    if (buyP <= 0 && t.realizedPnL !== undefined && t.totalDeductions === undefined) {
      const inferred = sellP - Number(t.realizedPnL) / qty;
      if (inferred > 0) buyP = inferred;
    } else if (buyP <= 0 && t.grossPnL !== undefined) {
      const inferred = sellP - Number(t.grossPnL) / qty;
      if (inferred > 0) buyP = inferred;
    }

    let resolvedBuyDate = (t.buyDate && t.buyDate.trim()) || '';
    const matchingHolding = holdings.find((h) => isSymbolMatch(h.symbol, t.symbol));
    if (matchingHolding) {
      if (buyP <= 0) buyP = matchingHolding.buyPrice;
      if (!resolvedBuyDate && matchingHolding.buyDate && matchingHolding.buyDate.trim()) {
        resolvedBuyDate = matchingHolding.buyDate.trim();
      }
    }
    if (buyP <= 0) buyP = sellP;

    if (!resolvedBuyDate) {
      if (t.date && t.date.trim()) resolvedBuyDate = t.date.trim();
      else if (t.sellDate && t.sellDate.trim()) resolvedBuyDate = t.sellDate.trim();
      else if (t.id && t.id.includes('_')) {
        const ts = parseInt(t.id.split('_').pop() || '');
        if (!isNaN(ts) && ts > 1600000000000) resolvedBuyDate = new Date(ts).toISOString().slice(0, 10);
      }
      if (!resolvedBuyDate) resolvedBuyDate = todayYMD();
    }

    const soldOn = toYMD(t.sellDate) || toYMD(t.date) || toYMD(resolvedBuyDate) || todayYMD();
    const buyYMD = toYMD(resolvedBuyDate) || soldOn;
    const daysHeld = Math.max(0, Math.round((ymdToUTC(soldOn) - ymdToUTC(buyYMD)) / 86400000));
    const holdingMonths = daysHeld / 30.4375; // 365.25 / 12, so >365 days counts as >12 months

    const calc = calculateEquityDeliveryBrokerage({
      quantity: qty,
      buyPrice: buyP,
      sellPrice: sellP,
      holdingMonths,
      taxSettings: {
        ...taxSettings,
        brokerPreset: (t.broker || 'ZERODHA') as 'ZERODHA' | 'GROWW' | 'ANGELONE',
        exchange: (t.exchange || 'NSE') as 'NSE' | 'BSE',
      },
      isMTF: t.isMTF,
      mtfMultiplier: t.mtfMultiplier,
      ownQuantity: t.ownQuantity,
      mtfQuantity: t.mtfQuantity,
      mtfDays: t.mtfDaysHeld ?? daysHeld,
    });

    return {
      ...t,
      calc,
      daysHeld,
      buyP,
      sellP,
      buyDate: resolvedBuyDate,
      buyDateRecorded: !!toYMD(t.buyDate),
      soldOn,
      grossInvested: buyP * qty,
      totalSaleValue,
      grossPnL: calc.grossProfit,
      totalDeductions: calc.totalFees,
      netPnL: calc.netPnL,
      netRoiPercent: calc.netRoiPercent,
    };
  });
}

// ---------------------------------------------------------------------------
// Ranges
// ---------------------------------------------------------------------------

export type RangePreset = 'week' | 'lastWeek' | 'month' | 'lastMonth' | 'fy' | 'all' | 'custom';

export interface DateRange {
  from: string;
  to: string;
}

/** Resolves a preset to inclusive dates. `null` means "no limit" (all time). */
export function resolveRange(
  preset: RangePreset,
  custom: { from: string; to: string },
  today: string = todayYMD()
): DateRange | null {
  switch (preset) {
    case 'week': {
      const from = startOfWeek(today);
      return { from, to: addDays(from, 6) };
    }
    case 'lastWeek': {
      const from = addDays(startOfWeek(today), -7);
      return { from, to: addDays(from, 6) };
    }
    case 'month':
      return { from: startOfMonth(today), to: endOfMonth(today) };
    case 'lastMonth': {
      const prev = addDays(startOfMonth(today), -1);
      return { from: startOfMonth(prev), to: endOfMonth(prev) };
    }
    case 'fy': {
      const from = startOfFinancialYear(today);
      return { from, to: `${+from.slice(0, 4) + 1}-03-31` };
    }
    case 'custom': {
      const a = toYMD(custom.from);
      const b = toYMD(custom.to);
      if (!a && !b) return null;
      const from = a || '0000-01-01';
      const to = b || '9999-12-31';
      return from <= to ? { from, to } : { from: to, to: from }; // tolerate reversed dates
    }
    default:
      return null;
  }
}

export function filterByRange<T extends { soldOn: string }>(trades: T[], range: DateRange | null): T[] {
  if (!range) return trades;
  return trades.filter((t) => t.soldOn >= range.from && t.soldOn <= range.to);
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export type GroupBy = 'day' | 'week' | 'month';

export interface PeriodGroup {
  key: string;
  label: string;
  /** First day of the period (for sorting / filtering the ledger by clicking a bar). */
  from: string;
  to: string;
  count: number;
  wins: number;
  losses: number;
  gross: number;
  charges: number;
  net: number;
  cumulative: number;
}

function periodOf(ymd: string, by: GroupBy): { key: string; label: string; from: string; to: string } {
  if (by === 'day') return { key: ymd, label: dayLabel(ymd), from: ymd, to: ymd };
  if (by === 'week') {
    const from = startOfWeek(ymd);
    const to = addDays(from, 6);
    const sameMonth = from.slice(0, 7) === to.slice(0, 7);
    return {
      key: from,
      label: sameMonth ? `${+from.slice(8)}–${+to.slice(8)} ${MONTHS[+to.slice(5, 7) - 1]}` : `${dayLabel(from)} – ${dayLabel(to)}`,
      from,
      to,
    };
  }
  const from = startOfMonth(ymd);
  return { key: ymd.slice(0, 7), label: `${MONTHS[+ymd.slice(5, 7) - 1]} ${ymd.slice(0, 4)}`, from, to: endOfMonth(ymd) };
}

export function groupTrades(trades: LedgerTrade[], by: GroupBy): PeriodGroup[] {
  const map = new Map<string, PeriodGroup>();
  const ensure = (ymd: string) => {
    const p = periodOf(ymd, by);
    let g = map.get(p.key);
    if (!g) {
      g = { ...p, count: 0, wins: 0, losses: 0, gross: 0, charges: 0, net: 0, cumulative: 0 };
      map.set(p.key, g);
    }
    return g;
  };

  for (const t of trades) {
    const g = ensure(t.soldOn);
    g.count += 1;
    g.gross += t.grossPnL;
    g.charges += t.totalDeductions;
    g.net += t.netPnL;
    if (t.netPnL > 0) g.wins += 1;
    else if (t.netPnL < 0) g.losses += 1;
  }

  // Fill quiet weeks / months so the chart's time axis has no gaps (days: trading days only)
  if (by !== 'day' && map.size > 1) {
    const keys = [...map.values()].map((g) => g.from).sort();
    let cursor = keys[0];
    const last = keys[keys.length - 1];
    while (cursor <= last) {
      ensure(cursor);
      cursor = by === 'week' ? addDays(cursor, 7) : addDays(endOfMonth(cursor), 1);
    }
  }

  const groups = [...map.values()].sort((a, b) => (a.from < b.from ? -1 : 1));
  let running = 0;
  for (const g of groups) {
    running += g.net;
    g.cumulative = running;
  }
  return groups;
}

export interface LedgerSummary {
  count: number;
  wins: number;
  losses: number;
  winRate: number;
  net: number;
  gross: number;
  charges: number;
  invested: number;
  roi: number;
  avg: number;
  profitFactor: number | null;
  best: LedgerTrade | null;
  worst: LedgerTrade | null;
}

export function summarize(trades: LedgerTrade[]): LedgerSummary {
  let wins = 0, losses = 0, net = 0, gross = 0, charges = 0, invested = 0, grossWin = 0, grossLoss = 0;
  let best: LedgerTrade | null = null;
  let worst: LedgerTrade | null = null;
  for (const t of trades) {
    net += t.netPnL;
    gross += t.grossPnL;
    charges += t.totalDeductions;
    invested += t.grossInvested;
    if (t.netPnL > 0) { wins++; grossWin += t.netPnL; }
    else if (t.netPnL < 0) { losses++; grossLoss += -t.netPnL; }
    if (!best || t.netPnL > best.netPnL) best = t;
    if (!worst || t.netPnL < worst.netPnL) worst = t;
  }
  const decided = wins + losses;
  return {
    count: trades.length,
    wins,
    losses,
    winRate: decided > 0 ? (wins / decided) * 100 : 0,
    net,
    gross,
    charges,
    invested,
    roi: invested > 0 ? (net / invested) * 100 : 0,
    avg: trades.length > 0 ? net / trades.length : 0,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : null,
    best: best && best.netPnL > 0 ? best : null,
    worst: worst && worst.netPnL < 0 ? worst : null,
  };
}

export interface SymbolPnL {
  symbol: string;
  net: number;
  count: number;
}

export function bySymbol(trades: LedgerTrade[]): SymbolPnL[] {
  const map = new Map<string, SymbolPnL>();
  for (const t of trades) {
    const symbol = t.symbol.replace(/\.NS$/i, '').replace(/\.BO$/i, '').toUpperCase();
    const row = map.get(symbol) || { symbol, net: 0, count: 0 };
    row.net += t.netPnL;
    row.count += 1;
    map.set(symbol, row);
  }
  return [...map.values()].sort((a, b) => b.net - a.net);
}

/** Suggests a sensible grouping for a range so charts are neither empty nor cluttered. */
export function suggestGroupBy(range: DateRange | null, trades: { soldOn: string }[]): GroupBy {
  let from = range?.from;
  let to = range?.to;
  if (!range || from === '0000-01-01' || to === '9999-12-31') {
    if (trades.length === 0) return 'month';
    const dates = trades.map((t) => t.soldOn).sort();
    from = dates[0];
    to = dates[dates.length - 1];
  }
  const span = (ymdToUTC(to!) - ymdToUTC(from!)) / 86400000;
  if (span <= 35) return 'day';
  if (span <= 190) return 'week';
  return 'month';
}

// ---------------------------------------------------------------------------
// Capital breakdown: how much was your money, how much was MTF funding, and
// what you made on it. Works for sold trades and for open holdings alike.
// ---------------------------------------------------------------------------

export interface CapitalBreakdown {
  /** Your own cash that was deployed. */
  own: number;
  /** Money the broker funded through MTF. */
  mtf: number;
  /** Total money deployed (own + MTF). */
  invested: number;
  /** Net profit (positive) or loss (negative) after all charges and MTF interest. */
  profit: number;
  /** Your money plus the profit, i.e. what your own capital grew to. */
  ownPlusProfit: number;
  returnOnOwn: number;
  returnOnTotal: number;
  count: number;
}

export function capitalBreakdown(
  items: { grossInvested: number; netPnL: number; calc: { ownInvestment?: number; mtfBorrowedAmount?: number } }[]
): CapitalBreakdown {
  let own = 0;
  let mtf = 0;
  let profit = 0;
  for (const it of items) {
    const funded = Math.max(0, it.calc.mtfBorrowedAmount ?? 0);
    own += it.calc.ownInvestment ?? it.grossInvested - funded;
    mtf += funded;
    profit += it.netPnL;
  }
  const invested = own + mtf;
  return {
    own,
    mtf,
    invested,
    profit,
    ownPlusProfit: own + profit,
    returnOnOwn: own > 0 ? (profit / own) * 100 : 0,
    returnOnTotal: invested > 0 ? (profit / invested) * 100 : 0,
    count: items.length,
  };
}
