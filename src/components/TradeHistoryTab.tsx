'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  History,
  Download,
  FileText,
  Trash2,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Percent,
  Receipt,
  Trophy,
  CalendarRange,
  X,
  Scale,
  Pencil,
  Info,
} from 'lucide-react';
import { useStock } from '@/context/StockContext';
import { EditTradeModal } from '@/components/EditTradeModal';
import { DateRangePicker } from '@/components/DateRangePicker';
import { CapitalPieCard } from '@/components/CapitalPieCard';
import {
  LedgerTrade,
  PeriodGroup,
  RangePreset,
  GroupBy,
  buildTradeLedger,
  resolveRange,
  filterByRange,
  groupTrades,
  summarize,
  capitalBreakdown,
  bySymbol,
  suggestGroupBy,
  toYMD,
} from '@/lib/tradeLedger';

const PRESETS: { id: RangePreset; label: string }[] = [
  { id: 'week', label: 'This Week' },
  { id: 'lastWeek', label: 'Last Week' },
  { id: 'month', label: 'This Month' },
  { id: 'lastMonth', label: 'Last Month' },
  { id: 'fy', label: 'This FY' },
  { id: 'all', label: 'All Time' },
  { id: 'custom', label: 'Custom' },
];

const GROUPS: { id: GroupBy; label: string }[] = [
  { id: 'day', label: 'Daily' },
  { id: 'week', label: 'Weekly' },
  { id: 'month', label: 'Monthly' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = (ymd: string) => `${+ymd.slice(8, 10)} ${MONTHS[+ymd.slice(5, 7) - 1]} ${ymd.slice(0, 4)}`;

const money = (n: number, digits = 2) =>
  Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const signed = (n: number, digits = 2) => `${n >= 0 ? '+' : '-'}₹${money(n, digits)}`;
const tone = (n: number) => (n > 0 ? 'text-[var(--positive)]' : n < 0 ? 'text-[var(--negative)]' : 'text-[var(--text-secondary)]');

const axisMoney = (n: number) => {
  const a = Math.abs(n);
  const s = n < 0 ? '-' : '';
  if (a >= 10000000) return `${s}₹${(a / 10000000).toFixed(1)}Cr`;
  if (a >= 100000) return `${s}₹${(a / 100000).toFixed(1)}L`;
  if (a >= 1000) return `${s}₹${(a / 1000).toFixed(a >= 10000 ? 0 : 1)}K`;
  return `${s}₹${Math.round(a)}`;
};

const brokerName = (b?: string) => (b === 'ANGELONE' ? 'Angel One' : b === 'GROWW' ? 'Groww' : 'Zerodha');


/** Invested amount under the sale value. For MTF trades, hover / tap shows how it was funded. */
const InvestedLine: React.FC<{ t: LedgerTrade; className?: string }> = ({ t, className = '' }) => {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [pinned, setPinned] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!pinned) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !btnRef.current?.contains(e.target as Node)) {
        setPinned(false);
        setRect(null);
      }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [pinned]);

  const invested = t.grossInvested;
  if (!t.isMTF) {
    return <div className={`font-sans text-[10px] text-[var(--text-secondary)] ${className}`}>Invested ₹{money(invested)}</div>;
  }

  const own = t.calc.ownInvestment ?? 0;
  const funded = t.calc.mtfBorrowedAmount ?? 0;
  const interest = (t.calc.mtfInterestCost ?? 0) + (t.calc.mtfPledgeUnpledgeFee ?? 0);
  const ownReturn = t.calc.mtfNetReturnOnOwnCapitalPercent ?? 0;
  const total = own + funded || 1;
  const ownPct = (own / total) * 100;
  const show = () => btnRef.current && setRect(btnRef.current.getBoundingClientRect());
  const W = 250;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768;
  const style: React.CSSProperties | undefined = rect
    ? {
        width: W,
        left: Math.min(Math.max(8, rect.right - W), vw - W - 8),
        ...(rect.bottom + 230 > vh ? { bottom: vh - rect.top + 8 } : { top: rect.bottom + 8 }),
      }
    : undefined;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onMouseEnter={show}
        onMouseLeave={() => !pinned && setRect(null)}
        onFocus={show}
        onBlur={() => !pinned && setRect(null)}
        onClick={() => {
          show();
          setPinned((p) => !p);
        }}
        aria-label="Show how this MTF trade was funded"
        className={`inline-flex cursor-help items-center gap-1 font-sans text-[10px] text-[var(--text-secondary)] underline decoration-dotted underline-offset-2 hover:text-[var(--text-primary)] ${className}`}
      >
        Invested ₹{money(invested)}
        <Info className="h-2.5 w-2.5 text-[var(--warning)]" />
      </button>
      {rect && style && typeof document !== 'undefined' &&
        createPortal(
          <div
            role="tooltip"
            style={style}
            className="fixed z-[60] rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-3 text-left font-sans text-xs shadow-2xl"
          >
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              How this was funded · MTF {t.mtfMultiplier || 2.5}x
            </div>
            <div className="mb-2.5 flex h-2 overflow-hidden rounded-full">
              <div style={{ width: `${ownPct}%`, background: 'var(--positive)' }} />
              <div style={{ width: `${100 - ownPct}%`, background: 'var(--warning)' }} />
            </div>
            <div className="space-y-1.5 font-mono">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-sans text-[var(--positive)]">● Your money ({ownPct.toFixed(0)}%)</span>
                <span className="font-bold text-[var(--text-primary)]">₹{money(own)}</span>
              </div>
              {t.calc.ownQuantity ? <div className="text-right font-sans text-[10px] text-[var(--text-muted)]">{t.calc.ownQuantity} shares</div> : null}
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-sans text-[var(--warning)]">● MTF fund ({(100 - ownPct).toFixed(0)}%)</span>
                <span className="font-bold text-[var(--text-primary)]">₹{money(funded)}</span>
              </div>
              {t.calc.mtfQuantity ? <div className="text-right font-sans text-[10px] text-[var(--text-muted)]">{t.calc.mtfQuantity} shares</div> : null}
              <div className="flex items-baseline justify-between gap-2 border-t border-[var(--border)] pt-1.5">
                <span className="font-sans text-[var(--text-secondary)]">Total invested</span>
                <span className="font-bold text-[var(--text-primary)]">₹{money(invested)}</span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-sans text-[var(--text-secondary)]">Interest ({t.calc.mtfHoldingDays ?? 0}d) + pledge</span>
                <span className="font-bold text-[var(--warning)]">-₹{money(interest)}</span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-sans text-[var(--text-secondary)]">Return on your money</span>
                <span className={`font-bold ${t.netPnL >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                  {ownReturn >= 0 ? '+' : ''}{ownReturn.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export const TradeHistoryTab: React.FC = () => {
  const { tradeHistory, holdings, taxSettings, deleteTradeRecord, updateTradeRecord } = useStock();

  const [preset, setPreset] = useState<RangePreset>('all');
  const [custom, setCustom] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [groupOverride, setGroupOverride] = useState<GroupBy | null>(null);
  const [period, setPeriod] = useState<PeriodGroup | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<LedgerTrade | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const ledger = useMemo(() => buildTradeLedger(tradeHistory, holdings, taxSettings), [tradeHistory, holdings, taxSettings]);

  const range = useMemo(() => resolveRange(preset, custom), [preset, custom]);
  const inRange = useMemo(() => filterByRange(ledger, range), [ledger, range]);
  const groupBy = groupOverride ?? suggestGroupBy(range, inRange);
  const groups = useMemo(() => groupTrades(inRange, groupBy), [inRange, groupBy]);
  const summary = useMemo(() => summarize(inRange), [inRange]);
  const capital = useMemo(() => capitalBreakdown(inRange), [inRange]);
  const tradeDays = useMemo(() => new Set(ledger.map((t) => t.soldOn)), [ledger]);
  const symbols = useMemo(() => bySymbol(inRange), [inRange]);

  // Ledger rows: the chosen range, optionally narrowed to one clicked period, newest first
  const rows = useMemo(() => {
    const list = period ? inRange.filter((t) => t.soldOn >= period.from && t.soldOn <= period.to) : inRange;
    return [...list].sort((a, b) => (a.soldOn === b.soldOn ? 0 : a.soldOn < b.soldOn ? 1 : -1));
  }, [inRange, period]);

  const rangeText = (() => {
    if (!range) {
      if (inRange.length === 0) return 'No trades yet';
      const dates = inRange.map((t) => t.soldOn).sort();
      return `${fmtDate(dates[0])} – ${fmtDate(dates[dates.length - 1])}`;
    }
    const f = range.from === '0000-01-01' ? null : range.from;
    const t = range.to === '9999-12-31' ? null : range.to;
    return `${f ? fmtDate(f) : 'Beginning'} – ${t ? fmtDate(t) : 'Today'}`;
  })();

  const choosePreset = (p: RangePreset) => {
    setPreset(p);
    setGroupOverride(null);
    setPeriod(null);
    setPickerOpen(p === 'custom'); // choosing Custom opens the calendar straight away
  };

  const selectPeriod = (g: PeriodGroup) => setPeriod((cur) => (cur?.key === g.key ? null : g));

  const handleDelete = (t: LedgerTrade) => {
    if (window.confirm(`Remove the ${t.symbol} trade sold on ${fmtDate(t.soldOn)} from your history?`)) {
      deleteTradeRecord(t.id);
    }
  };

  const downloadCSV = () => {
    if (rows.length === 0) return;
    const headers = [
      'Symbol', 'Company Name', 'Broker', 'Exchange', 'Quantity', 'Buy Date', 'Buy Price (INR)', 'Sell Date',
      'Sell Price (INR)', 'Total Sale Value (INR)', 'Gross PnL (INR)', 'Deductions / Charges (INR)',
      'Net Realized PnL (INR)', 'Net Realized PnL (%)',
    ];
    const body = rows.map((t) => [
      `"${t.symbol || ''}"`,
      `"${(t.companyName || '').replace(/"/g, '""')}"`,
      `"${t.broker || 'ZERODHA'}"`,
      `"${t.exchange || 'NSE'}"`,
      t.quantity,
      `"${t.buyDate || ''}"`,
      t.buyP.toFixed(2),
      `"${t.soldOn}"`,
      t.sellP.toFixed(2),
      t.totalSaleValue.toFixed(2),
      t.grossPnL.toFixed(2),
      t.totalDeductions.toFixed(2),
      t.netPnL.toFixed(2),
      t.netRoiPercent.toFixed(2),
    ]);
    const csv = '﻿' + [headers.join(','), ...body.map((r) => r.join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `Trade_History_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    if (rows.length === 0) return;
    const ids = new Set(rows.map((r) => r.id));
    const url = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(tradeHistory.filter((t) => ids.has(t.id)), null, 2)
    )}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `Trade_History_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const chargeLines = (t: LedgerTrade) =>
    [
      ['Brokerage', t.calc.totalBrokerage],
      ['STT', t.calc.totalStt],
      ['Exchange txn', t.calc.totalExchangeTxn],
      ['SEBI / IPFT', t.calc.totalSebi],
      ['GST', t.calc.totalGst],
      ['Stamp duty', t.calc.stampDuty],
      ['DP charges', t.calc.dpCharges],
      ['MTF interest', t.calc.mtfInterestCost],
      ['MTF pledge fee', t.calc.mtfPledgeUnpledgeFee],
    ].filter(([, v]) => Number(v) > 0.004) as [string, number][];

  const maxSymbolAbs = Math.max(1, ...symbols.map((s) => Math.abs(s.net)));
  const groupWord = groupBy === 'day' ? 'day' : groupBy === 'week' ? 'week' : 'month';
  const hasAnyTrades = ledger.length > 0;

  const ChartTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const g: PeriodGroup = payload[0].payload;
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2.5 text-xs shadow-xl">
        <div className="mb-1 font-bold text-[var(--text-primary)]">{g.label}</div>
        <div className={`font-mono text-sm font-extrabold ${tone(g.net)}`}>{signed(g.net)}</div>
        <div className="mt-1 space-y-0.5 text-[var(--text-secondary)]">
          <div>{g.count} trade{g.count === 1 ? '' : 's'} · {g.wins}W / {g.losses}L</div>
          <div>Charges: ₹{money(g.charges)}</div>
          <div>Running total: <span className={tone(g.cumulative)}>{signed(g.cumulative)}</span></div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-shell">
        <div className="glass-core flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2.5 font-mono text-lg font-bold text-[var(--text-primary)]">
              <History className="h-5 w-5 text-[var(--brand-primary)]" />
              Trade History &amp; Realized P&amp;L Ledger
            </h2>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              See what you actually booked — by week, month, financial year or any custom dates. All figures are net of brokerage, taxes and charges.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <button
              onClick={downloadCSV}
              disabled={rows.length === 0}
              title={rows.length === 0 ? 'No trades to download' : 'Download the trades shown below as CSV / Excel'}
              className="btn-export-csv"
            >
              <Download className="h-3.5 w-3.5 shrink-0" />
              <span>Download CSV</span>
            </button>
            <button
              onClick={downloadJSON}
              disabled={rows.length === 0}
              title={rows.length === 0 ? 'No trades to download' : 'Download the trades shown below as JSON'}
              className="btn-export-secondary"
            >
              <FileText className="h-3.5 w-3.5 shrink-0 text-[var(--brand-primary)]" />
              <span className="hidden sm:inline">JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Range selector */}
      <div className="glass-shell">
        <div className="glass-core space-y-3 p-4">
          <div className="no-scrollbar -mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-0.5">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => choosePreset(p.id)}
                aria-pressed={preset === p.id}
                className={`shrink-0 cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  preset === p.id
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--on-brand)]'
                    : 'border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                }`}
              >
                {p.id === 'custom' && <CalendarRange className="mr-1 inline h-3.5 w-3.5 -translate-y-px" />}
                {p.label}
              </button>
            ))}
          </div>

          {preset === 'custom' && (
            <div className="flex flex-wrap items-center gap-3">
              <DateRangePicker
                value={custom}
                onChange={(r) => {
                  setCustom(r);
                  setPeriod(null);
                  setGroupOverride(null);
                }}
                open={pickerOpen}
                onOpenChange={setPickerOpen}
                markedDates={tradeDays}
              />
              <span className="text-[11px] text-[var(--text-muted)]">Click a start date, then an end date.</span>
            </div>
          )}

          <p className="text-[11px] text-[var(--text-muted)]">
            Showing trades sold <span className="font-semibold text-[var(--text-secondary)]">{rangeText}</span>
            {' · '}
            {summary.count} trade{summary.count === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-6">
        <div className="glass-shell col-span-2 sm:col-span-1">
          <div className="glass-core h-full p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Net Realized P&amp;L</span>
              {summary.net >= 0 ? <TrendingUp className="h-4 w-4 text-[var(--positive)]" /> : <TrendingDown className="h-4 w-4 text-[var(--negative)]" />}
            </div>
            <div className={`mt-2 truncate whitespace-nowrap font-mono text-xl font-extrabold sm:text-2xl 2xl:text-xl tracking-tight ${tone(summary.net)}`}>{signed(summary.net, Math.abs(summary.net) >= 100000 ? 0 : 2)}</div>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
              {summary.invested > 0 ? <span className={tone(summary.roi)}>{summary.roi >= 0 ? '+' : ''}{summary.roi.toFixed(2)}%</span> : '—'} on ₹{money(summary.invested, 0)} sold
            </p>
          </div>
        </div>

        <div className="glass-shell">
          <div className="glass-core h-full p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Win Rate</span>
              <Percent className="h-4 w-4 text-[var(--brand-primary)]" />
            </div>
            <div className="mt-2 truncate whitespace-nowrap font-mono text-xl font-extrabold sm:text-2xl 2xl:text-xl text-[var(--text-primary)]">{summary.count ? `${summary.winRate.toFixed(0)}%` : '—'}</div>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">{summary.wins}W · {summary.losses}L{summary.profitFactor !== null ? ` · PF ${summary.profitFactor.toFixed(2)}` : ''}</p>
          </div>
        </div>

        <div className="glass-shell">
          <div className="glass-core h-full p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Avg / Trade</span>
              <Scale className="h-4 w-4 text-[var(--brand-primary)]" />
            </div>
            <div className={`mt-2 truncate whitespace-nowrap font-mono text-xl font-extrabold sm:text-2xl 2xl:text-xl ${tone(summary.avg)}`}>{summary.count ? signed(summary.avg, 0) : '—'}</div>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">{summary.count} trade{summary.count === 1 ? '' : 's'}</p>
          </div>
        </div>

        <div className="glass-shell">
          <div className="glass-core h-full p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Charges Paid</span>
              <Receipt className="h-4 w-4 text-[var(--warning)]" />
            </div>
            <div className="mt-2 truncate whitespace-nowrap font-mono text-xl font-extrabold sm:text-2xl 2xl:text-xl text-[var(--warning)]">₹{money(summary.charges, 0)}</div>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">Gross {signed(summary.gross, 0)}</p>
          </div>
        </div>

        <div className="glass-shell">
          <div className="glass-core h-full p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Best Trade</span>
              <Trophy className="h-4 w-4 text-[var(--positive)]" />
            </div>
            <div className={`mt-2 truncate whitespace-nowrap font-mono text-xl font-extrabold sm:text-2xl 2xl:text-xl ${summary.best ? 'text-[var(--positive)]' : 'text-[var(--text-muted)]'}`}>
              {summary.best ? signed(summary.best.netPnL, 0) : '—'}
            </div>
            <p className="mt-1 truncate text-[11px] text-[var(--text-secondary)]">{summary.best ? `${summary.best.symbol.replace(/\.NS$|\.BO$/i, '')} · ${fmtDate(summary.best.soldOn)}` : 'No winning trade'}</p>
          </div>
        </div>

        <div className="glass-shell">
          <div className="glass-core h-full p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Worst Trade</span>
              <TrendingDown className="h-4 w-4 text-[var(--negative)]" />
            </div>
            <div className={`mt-2 truncate whitespace-nowrap font-mono text-xl font-extrabold sm:text-2xl 2xl:text-xl ${summary.worst ? 'text-[var(--negative)]' : 'text-[var(--text-muted)]'}`}>
              {summary.worst ? signed(summary.worst.netPnL, 0) : '—'}
            </div>
            <p className="mt-1 truncate text-[11px] text-[var(--text-secondary)]">{summary.worst ? `${summary.worst.symbol.replace(/\.NS$|\.BO$/i, '')} · ${fmtDate(summary.worst.soldOn)}` : 'No losing trade'}</p>
          </div>
        </div>
      </div>

      {/* Where the money went: my money vs MTF fund vs profit */}
      <CapitalPieCard breakdown={capital} mode="realized" />

      {/* Profit chart */}
      <div className="glass-shell">
        <div className="glass-core space-y-3 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-mono text-sm font-bold text-[var(--text-primary)]">Profit by {groupWord}</h3>
              <p className="text-[11px] text-[var(--text-secondary)]">Each bar is that {groupWord}&apos;s net P&amp;L (green = profit, red = loss). Hover for the running total, tap a bar to see just those trades.</p>
            </div>
            <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-0.5" role="radiogroup" aria-label="Group results by">
              {GROUPS.map((g) => (
                <button
                  key={g.id}
                  role="radio"
                  aria-checked={groupBy === g.id}
                  onClick={() => { setGroupOverride(g.id); setPeriod(null); }}
                  className={`cursor-pointer rounded-md px-3 py-1 text-xs font-semibold transition ${
                    groupBy === g.id ? 'bg-[var(--surface)] text-[var(--brand-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {groups.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-center text-sm text-[var(--text-secondary)]">
              {hasAnyTrades ? 'No trades were sold in this period.' : 'No sold trades yet. Use “Mark Sold” on a holding to start building your ledger.'}
            </div>
          ) : (
            <div className="h-[230px] w-full sm:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groups} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} interval="preserveStartEnd" minTickGap={14} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={axisMoney} width={52} />
                  <ReferenceLine y={0} stroke="var(--border-strong)" />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-hover)', opacity: 0.5 }} />
                  <Bar dataKey="net" radius={[4, 4, 0, 0]} maxBarSize={44} cursor="pointer" onClick={(d: any) => selectPeriod((d?.payload ?? d) as PeriodGroup)}>
                    {groups.map((g) => (
                      <Cell
                        key={g.key}
                        fill={g.net >= 0 ? 'var(--positive)' : 'var(--negative)'}
                        fillOpacity={period && period.key !== g.key ? 0.3 : 1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Period breakdown + by stock */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass-shell lg:col-span-2">
          <div className="glass-core overflow-hidden">
            <div className="border-b border-[var(--border)] px-5 py-3.5">
              <h3 className="font-mono text-sm font-bold text-[var(--text-primary)]">
                {groupBy === 'day' ? 'Daily' : groupBy === 'week' ? 'Weekly' : 'Monthly'} results
              </h3>
            </div>
            {groups.length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-[var(--text-secondary)]">Nothing to show for this range.</div>
            ) : (
              <div className="max-h-[360px] overflow-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-[var(--table-header-bg)] font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    <tr>
                      <th className="px-4 py-2.5">Period</th>
                      <th className="px-3 py-2.5 text-right">Trades</th>
                      <th className="hidden px-3 py-2.5 text-right sm:table-cell">W / L</th>
                      <th className="hidden px-3 py-2.5 text-right md:table-cell">Charges</th>
                      <th className="px-3 py-2.5 text-right">Net P&amp;L</th>
                      <th className="hidden px-4 py-2.5 text-right sm:table-cell">Running</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] font-mono">
                    {[...groups].reverse().map((g) => (
                      <tr
                        key={g.key}
                        onClick={() => selectPeriod(g)}
                        className={`cursor-pointer transition-colors hover:bg-[var(--table-row-hover)] ${period?.key === g.key ? 'bg-[var(--brand-soft)]' : ''}`}
                      >
                        <td className="px-4 py-2.5 font-sans font-semibold text-[var(--text-primary)]">{g.label}</td>
                        <td className="px-3 py-2.5 text-right text-[var(--text-primary)]">{g.count}</td>
                        <td className="hidden px-3 py-2.5 text-right sm:table-cell">
                          <span className="text-[var(--positive)]">{g.wins}</span>
                          <span className="text-[var(--text-muted)]"> / </span>
                          <span className="text-[var(--negative)]">{g.losses}</span>
                        </td>
                        <td className="hidden px-3 py-2.5 text-right text-[var(--text-secondary)] md:table-cell">₹{money(g.charges, 0)}</td>
                        <td className={`px-3 py-2.5 text-right font-bold ${g.count ? tone(g.net) : 'text-[var(--text-muted)]'}`}>{g.count ? signed(g.net) : '—'}</td>
                        <td className={`hidden px-4 py-2.5 text-right sm:table-cell ${tone(g.cumulative)}`}>{signed(g.cumulative, 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="glass-shell">
          <div className="glass-core overflow-hidden">
            <div className="border-b border-[var(--border)] px-5 py-3.5">
              <h3 className="font-mono text-sm font-bold text-[var(--text-primary)]">Profit by stock</h3>
            </div>
            {symbols.length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-[var(--text-secondary)]">Nothing to show for this range.</div>
            ) : (
              <ul className="max-h-[360px] space-y-3 overflow-auto p-4">
                {symbols.map((s) => (
                  <li key={s.symbol}>
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="font-mono font-bold text-[var(--text-primary)]">
                        {s.symbol} <span className="font-sans text-[10px] font-normal text-[var(--text-muted)]">· {s.count} trade{s.count === 1 ? '' : 's'}</span>
                      </span>
                      <span className={`font-mono font-bold ${tone(s.net)}`}>{signed(s.net, 0)}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.max(3, (Math.abs(s.net) / maxSymbolAbs) * 100)}%`, background: s.net >= 0 ? 'var(--positive)' : 'var(--negative)' }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Ledger */}
      <div className="glass-shell">
        <div className="glass-core space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
            <h3 className="font-mono text-sm font-bold text-[var(--text-primary)]">
              Trade ledger <span className="font-normal text-[var(--text-secondary)]">({rows.length})</span>
            </h3>
            {period && (
              <button
                onClick={() => setPeriod(null)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--brand-primary)] bg-[var(--brand-soft)] px-3 py-1 text-[11px] font-semibold text-[var(--brand-primary)]"
              >
                {period.label}
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {rows.length === 0 ? (
            <div className="py-10 text-center text-sm text-[var(--text-secondary)]">
              {hasAnyTrades ? 'No trades in this period.' : 'No recorded trades yet. Log a stock sale to track realized profits!'}
            </div>
          ) : (
            <>
              {/* Desktop / tablet */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-left text-sm text-[var(--text-secondary)]">
                  <thead className="border-b border-[var(--border)] bg-[var(--table-header-bg)] font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    <tr>
                      <th className="px-4 py-3">Asset</th>
                      <th className="px-4 py-3">Broker</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right">Bought</th>
                      <th className="px-4 py-3 text-right">Sold</th>
                      <th className="px-4 py-3 text-right">Sale value</th>
                      <th className="px-4 py-3 text-right">Charges</th>
                      <th className="px-4 py-3 text-right">Net P&amp;L</th>
                      <th className="px-4 py-3 text-center"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-xs">
                    {rows.map((t) => {
                      const open = expandedId === t.id;
                      return (
                        <React.Fragment key={t.id}>
                          <tr className="border-b border-[var(--border)] transition-colors hover:bg-[var(--table-row-hover)]">
                            <td className="px-4 py-3.5 font-bold text-[var(--text-primary)]">
                              <div className="flex items-center gap-1.5">
                                <span>{t.symbol}</span>
                                {t.isMTF && (
                                  <span className="rounded border border-amber-500/30 bg-amber-500/15 px-1.5 text-[9px] font-bold text-amber-400">MTF {t.mtfMultiplier || 2.5}x</span>
                                )}
                              </div>
                              <span className="block max-w-[170px] truncate font-sans text-[10px] font-normal text-[var(--text-secondary)]">{t.companyName}</span>
                            </td>
                            <td className="px-4 py-3.5 font-sans text-[11px]">{brokerName(t.broker)}</td>
                            <td className="px-4 py-3.5 text-right font-bold text-[var(--text-primary)]">{t.quantity}</td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="font-bold text-[var(--text-primary)]">₹{money(t.buyP)}</div>
                              <div className="font-sans text-[10px] text-[var(--text-secondary)]">
                                {toYMD(t.buyDate) ? fmtDate(toYMD(t.buyDate)!) : t.buyDate}
                                {!t.buyDateRecorded && (
                                  <button onClick={() => setEditing(t)} title="No buy date was saved for this trade. Click to set it." className="ml-1 inline-flex cursor-pointer items-center gap-0.5 rounded bg-[var(--warning-bg)] px-1 text-[9px] font-semibold text-[var(--warning)]">
                                    <Info className="h-2.5 w-2.5" />est.
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="font-bold text-[var(--text-primary)]">₹{money(t.sellP)}</div>
                              <div className="font-sans text-[10px] text-[var(--text-secondary)]">{fmtDate(t.soldOn)}</div>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="font-bold text-[var(--text-primary)]">₹{money(t.totalSaleValue)}</div>
                              <InvestedLine t={t} />
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <button
                                onClick={() => setExpandedId(open ? null : t.id)}
                                aria-expanded={open}
                                className="inline-flex cursor-pointer items-center gap-1 font-bold text-[var(--warning)]"
                                title="Show charges breakdown"
                              >
                                -₹{money(t.totalDeductions)}
                                <ChevronDown className={`h-3 w-3 text-[var(--text-secondary)] transition-transform ${open ? 'rotate-180' : ''}`} />
                              </button>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <span className={`font-bold ${tone(t.netPnL)}`}>{signed(t.netPnL)}</span>
                              <span className={`block text-[10px] ${tone(t.netPnL)}`}>({t.netRoiPercent >= 0 ? '+' : ''}{t.netRoiPercent.toFixed(2)}%)</span>
                              <span className="block font-sans text-[9px] text-[var(--text-secondary)]">Gross {signed(t.grossPnL)}</span>
                            </td>
                            <td className="px-3 py-3.5 text-center">
                              <div className="flex items-center justify-center gap-0.5">
                                <button
                                  onClick={() => setEditing(t)}
                                  title="Edit buy / sell details"
                                  aria-label={`Edit ${t.symbol} trade`}
                                  className="cursor-pointer rounded p-1 text-[var(--text-secondary)] transition hover:bg-[var(--brand-soft)] hover:text-[var(--brand-primary)]"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(t)}
                                  title="Remove trade log entry"
                                  aria-label={`Remove ${t.symbol} trade`}
                                  className="cursor-pointer rounded p-1 text-[var(--text-secondary)] transition hover:bg-[var(--negative-bg)] hover:text-[var(--negative)]"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {open && (
                            <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)]">
                              <td colSpan={9} className="px-4 py-3">
                                <div className="flex flex-wrap gap-x-6 gap-y-1.5 font-sans text-[11px]">
                                  {chargeLines(t).map(([label, v]) => (
                                    <span key={label} className="text-[var(--text-secondary)]">
                                      {label}: <span className="font-mono font-bold text-[var(--text-primary)]">₹{money(v)}</span>
                                    </span>
                                  ))}
                                  <span className="text-[var(--text-secondary)]">Held: <span className="font-mono font-bold text-[var(--text-primary)]">{t.daysHeld} day{t.daysHeld === 1 ? '' : 's'}</span></span>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y divide-[var(--border)] sm:hidden">
                {rows.map((t) => {
                  const open = expandedId === t.id;
                  return (
                    <div key={t.id} className="space-y-2.5 py-3.5 first:pt-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-sm font-bold text-[var(--text-primary)]">{t.symbol}</span>
                            {t.isMTF && (
                              <span className="rounded border border-amber-500/30 bg-amber-500/15 px-1.5 text-[9px] font-bold text-amber-400">MTF {t.mtfMultiplier || 2.5}x</span>
                            )}
                            <span className="rounded border border-[var(--border)] bg-[var(--surface-muted)] px-1.5 text-[9px] font-semibold text-[var(--text-secondary)]">{brokerName(t.broker)}</span>
                          </div>
                          <div className="mt-0.5 truncate text-[11px] text-[var(--text-secondary)]">{t.quantity} shares · sold {fmtDate(t.soldOn)}</div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className={`font-mono text-sm font-extrabold ${tone(t.netPnL)}`}>{signed(t.netPnL)}</div>
                          <div className={`font-mono text-[10px] ${tone(t.netPnL)}`}>({t.netRoiPercent >= 0 ? '+' : ''}{t.netRoiPercent.toFixed(2)}%)</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-2.5 text-xs">
                        <div>
                          <span className="block text-[9px] uppercase text-[var(--text-secondary)]">Bought{toYMD(t.buyDate) ? ` · ${fmtDate(toYMD(t.buyDate)!)}` : ''}{!t.buyDateRecorded ? ' (est.)' : ''}</span>
                          <span className="font-mono font-bold text-[var(--text-primary)]">₹{money(t.buyP)}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[9px] uppercase text-[var(--text-secondary)]">Sold</span>
                          <span className="font-mono font-bold text-[var(--text-primary)]">₹{money(t.sellP)}</span>
                        </div>
                        <div className="border-t border-[var(--border)] pt-2">
                          <span className="block text-[9px] uppercase text-[var(--text-secondary)]">Sale value</span>
                          <span className="font-mono font-bold text-[var(--text-primary)]">₹{money(t.totalSaleValue)}</span>
                        </div>
                        <div className="border-t border-[var(--border)] pt-2 text-right">
                          <span className="block text-[9px] uppercase text-[var(--text-secondary)]">Invested</span>
                          <InvestedLine t={t} className="!text-xs font-mono font-bold !text-[var(--text-primary)]" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setExpandedId(open ? null : t.id)}
                          aria-expanded={open}
                          className="inline-flex min-h-[32px] cursor-pointer items-center gap-1 font-mono text-xs font-bold text-[var(--warning)]"
                        >
                          Charges -₹{money(t.totalDeductions)}
                          <ChevronDown className={`h-3.5 w-3.5 text-[var(--text-secondary)] transition-transform ${open ? 'rotate-180' : ''}`} />
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditing(t)}
                            aria-label={`Edit ${t.symbol} trade`}
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-primary)]"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(t)}
                            aria-label={`Remove ${t.symbol} trade`}
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--negative-bg)] hover:text-[var(--negative)]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {open && (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg bg-[var(--surface-muted)] p-2.5 text-[11px]">
                          {chargeLines(t).map(([label, v]) => (
                            <div key={label} className="flex justify-between gap-2 text-[var(--text-secondary)]">
                              <span>{label}</span>
                              <span className="font-mono font-bold text-[var(--text-primary)]">₹{money(v)}</span>
                            </div>
                          ))}
                          <div className="col-span-2 flex justify-between border-t border-[var(--border)] pt-1 text-[var(--text-secondary)]">
                            <span>Held</span>
                            <span className="font-mono font-bold text-[var(--text-primary)]">{t.daysHeld} day{t.daysHeld === 1 ? '' : 's'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {editing && (
        <EditTradeModal
          trade={editing}
          onClose={() => setEditing(null)}
          onSave={(updates) => {
            updateTradeRecord(editing.id, updates);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
};
