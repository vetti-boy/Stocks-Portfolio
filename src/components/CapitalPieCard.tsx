'use client';

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { CapitalBreakdown } from '@/lib/tradeLedger';

interface CapitalPieCardProps {
  breakdown: CapitalBreakdown;
  /** 'realized' = sold trades, 'unrealized' = money still invested in open holdings */
  mode: 'realized' | 'unrealized';
}

const C_OWN = 'var(--brand-primary)';
const C_MTF = 'var(--warning)';
const C_WIN = 'var(--positive)';
const C_LOSS = 'var(--negative)';

const money = (n: number, d = 2) => Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const signedMoney = (n: number, d = 2) => `${n >= 0 ? '+' : '-'}₹${money(n, d)}`;
const pct = (n: number, d = 2) => `${n >= 0 ? '+' : '-'}${Math.abs(n).toFixed(d)}%`;
const compact = (n: number) => {
  const a = Math.abs(n);
  if (a >= 10000000) return `₹${(a / 10000000).toFixed(2)}Cr`;
  if (a >= 100000) return `₹${(a / 100000).toFixed(2)}L`;
  if (a >= 10000) return `₹${(a / 1000).toFixed(1)}K`;
  return `₹${money(a, 0)}`;
};

type SliceKey = 'own' | 'mtf' | 'profit';
interface Slice {
  key: SliceKey;
  name: string;
  value: number;
  color: string;
}

export const CapitalPieCard: React.FC<CapitalPieCardProps> = ({ breakdown: b, mode }) => {
  const isProfit = b.profit >= 0;
  const realized = mode === 'realized';
  const profitName = realized ? (isProfit ? 'Profit' : 'Loss') : isProfit ? 'Unrealized profit' : 'Unrealized loss';

  // Profit goes first so it starts at 12 o'clock, then your money, then the MTF fund
  const slices: Slice[] = [
    { key: 'profit', name: profitName, value: Math.abs(b.profit), color: isProfit ? C_WIN : C_LOSS },
    { key: 'own', name: 'My money', value: b.own, color: C_OWN },
    { key: 'mtf', name: 'MTF fund', value: b.mtf, color: C_MTF },
  ].filter((s) => s.value > 0.004) as Slice[];

  const ownPct = b.invested > 0 ? (b.own / b.invested) * 100 : 0;
  const mtfPct = b.invested > 0 ? (b.mtf / b.invested) * 100 : 0;

  const renderLabel = (p: any) => {
    const { cx, cy, midAngle, outerRadius, payload } = p;
    const RAD = Math.PI / 180;
    const r = outerRadius + 20;
    const x = cx + r * Math.cos(-midAngle * RAD);
    const y = cy + r * Math.sin(-midAngle * RAD);
    const anchor = x >= cx ? 'start' : 'end';
    const s: Slice = payload;
    const lines: { t: string; bold?: boolean; fill?: string }[] =
      s.key === 'profit'
        ? [
            { t: signedMoney(b.profit, 0), bold: true, fill: s.color },
            { t: `${pct(b.returnOnTotal)} with MTF` },
            { t: `${pct(b.returnOnOwn)} my money` },
          ]
        : [
            { t: compact(s.value), bold: true },
            { t: `${(s.key === 'own' ? ownPct : mtfPct).toFixed(1)}%` },
          ];
    const top = Math.sin(midAngle * RAD) > 0.45; // label sits above the ring: stack upwards so it never overlaps it
    const lineH = 12.5;
    const startY = top ? y - (lines.length - 1) * lineH : y - (lines.length > 1 ? 4 : 0);
    return (
      <g>
        {lines.map((l, i) => (
          <text
            key={i}
            x={x + (anchor === 'start' ? 3 : -3)}
            y={startY + i * lineH}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize={l.bold ? 12 : 10}
            fontWeight={l.bold ? 800 : 600}
            fill={l.fill || (l.bold ? 'var(--text-primary)' : 'var(--text-secondary)')}
            style={{ fontFamily: l.bold ? 'var(--font-mono), monospace' : 'inherit' }}
          >
            {l.t}
          </text>
        ))}
      </g>
    );
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const s: Slice = payload[0].payload;
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2.5 text-xs shadow-xl">
        <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} /> {s.name}
        </div>
        <div className="mt-1 font-mono text-sm font-extrabold text-[var(--text-primary)]">
          {s.key === 'profit' ? signedMoney(b.profit) : `₹${money(s.value)}`}
        </div>
        <div className="mt-1 space-y-0.5 text-[var(--text-secondary)]">
          {s.key === 'profit' ? (
            <>
              <div>With MTF: <span className="font-bold text-[var(--text-primary)]">{pct(b.returnOnTotal)}</span> on ₹{money(b.invested, 0)}</div>
              <div>Only my money: <span className="font-bold text-[var(--text-primary)]">{pct(b.returnOnOwn)}</span> on ₹{money(b.own, 0)}</div>
            </>
          ) : (
            <div>
              <span className="font-bold text-[var(--text-primary)]">{(s.key === 'own' ? ownPct : mtfPct).toFixed(2)}%</span> of total money
            </div>
          )}
        </div>
      </div>
    );
  };

  const Dot = ({ color }: { color: string }) => <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />;
  const tile = 'rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3.5';
  const tileLabel = 'flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]';

  return (
    <div className="glass-shell">
      <div className="glass-core space-y-4 p-5">
        <div>
          <h3 className="flex items-center gap-2 font-mono text-sm font-bold text-[var(--text-primary)]">
            <PieIcon className="h-4 w-4 text-[var(--brand-primary)]" />
            {realized ? 'Where your money went' : 'Where your money is'}
          </h3>
          <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
            {realized
              ? 'Money deployed in the trades shown above: your own cash vs the broker’s MTF fund, and what you made on it.'
              : 'Money currently invested in your open holdings: your own cash vs the broker’s MTF fund, with the unrealized profit.'}{' '}
            The % beside your money and the MTF fund is their share of the total money deployed.
          </p>
        </div>

        {b.count === 0 || b.invested <= 0 ? (
          <div className="py-10 text-center text-sm text-[var(--text-secondary)]">
            {realized ? 'No sold trades in this period yet.' : 'No holdings yet.'}
          </div>
        ) : (
          <div className="grid items-center gap-6 lg:grid-cols-[minmax(300px,380px)_1fr]">
            {/* Donut */}
            <div className="relative mx-auto h-[290px] w-full max-w-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 34, right: 8, bottom: 20, left: 8 }}>
                  <Pie
                    data={slices}
                    dataKey="value"
                    nameKey="name"
                    startAngle={90}
                    endAngle={-270}
                    innerRadius="52%"
                    outerRadius="76%"
                    paddingAngle={slices.length > 1 ? 2 : 0}
                    stroke="var(--surface)"
                    strokeWidth={2}
                    label={renderLabel}
                    labelLine={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
                    isAnimationActive={false}
                  >
                    {slices.map((s) => (
                      <Cell key={s.key} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-3 text-center">
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Total money</span>
                <span className="font-mono text-base font-extrabold text-[var(--text-primary)]">
                  {b.invested >= 100000 ? compact(b.invested) : `₹${money(b.invested, 0)}`}
                </span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className={tile}>
                <div className={tileLabel}>Total money deployed</div>
                <div className="mt-1.5 font-mono text-xl font-extrabold text-[var(--text-primary)]">₹{money(b.invested)}</div>
                <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">my money + MTF fund · {b.count} {realized ? 'trade' : 'holding'}{b.count === 1 ? '' : 's'}</p>
              </div>

              <div className={tile}>
                <div className={tileLabel}><Dot color={C_OWN} /> My money</div>
                <div className="mt-1.5 font-mono text-xl font-extrabold text-[var(--text-primary)]">₹{money(b.own)}</div>
                <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">{ownPct.toFixed(1)}% of total money</p>
              </div>

              <div className={tile}>
                <div className={tileLabel}><Dot color={C_MTF} /> MTF fund (broker)</div>
                <div className="mt-1.5 font-mono text-xl font-extrabold text-[var(--text-primary)]">₹{money(b.mtf)}</div>
                <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">{b.mtf > 0 ? `${mtfPct.toFixed(1)}% of total money` : 'No MTF used — all of it is your money'}</p>
              </div>

              <div className={tile}>
                <div className={tileLabel}><Dot color={isProfit ? C_WIN : C_LOSS} /> {profitName} (after charges{b.mtf > 0 ? ' & interest' : ''})</div>
                <div className={`mt-1.5 font-mono text-xl font-extrabold ${isProfit ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>{signedMoney(b.profit)}</div>
                <div className="mt-1 space-y-0.5 text-[11px]">
                  <div className="flex items-baseline justify-between gap-2 text-[var(--text-secondary)]">
                    <span>With MTF <span className="text-[var(--text-muted)]">(on ₹{money(b.invested, 0)})</span></span>
                    <span className={`font-mono font-bold ${isProfit ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>{pct(b.returnOnTotal)}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2 text-[var(--text-secondary)]">
                    <span>Only my money <span className="text-[var(--text-muted)]">(on ₹{money(b.own, 0)})</span></span>
                    <span className={`font-mono font-bold ${isProfit ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>{pct(b.returnOnOwn)}</span>
                  </div>
                </div>
              </div>

              <div className={`${tile} sm:col-span-2`}>
                <div className={tileLabel}>My money after {realized ? (isProfit ? 'profit' : 'loss') : isProfit ? 'unrealized profit' : 'unrealized loss'}</div>
                <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-mono text-xl font-extrabold text-[var(--text-primary)]">₹{money(b.ownPlusProfit)}</span>
                  <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                    ₹{money(b.own, 0)} {isProfit ? '+' : '−'} ₹{money(b.profit, 0)}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">What your own cash {realized ? 'turned into' : 'is worth now'} once the broker&apos;s MTF fund is paid back.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
