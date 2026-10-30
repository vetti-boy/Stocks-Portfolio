'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarRange, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { addDays, todayYMD } from '@/lib/tradeLedger';

export interface DateRangeValue {
  from: string;
  to: string;
}

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (range: DateRangeValue) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Days (YYYY-MM-DD) that have a trade; they get a small dot so you can see where your trades are. */
  markedDates?: Set<string>;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MON_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const fmt = (s: string) => `${+s.slice(8, 10)} ${MON_SHORT[+s.slice(5, 7) - 1]} ${s.slice(0, 4)}`;
const daysBetween = (a: string, b: string) => Math.round((Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10)) - Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10))) / 86400000);

/** Cells for one month grid, Monday first. `null` = leading / trailing blank. */
function monthCells(year: number, month: number): (string | null)[] {
  const lead = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= count; d++) cells.push(ymd(year, month, d));
  return cells;
}

const shiftMonth = (view: { y: number; m: number }, by: number) => {
  const t = view.y * 12 + view.m + by;
  return { y: Math.floor(t / 12), m: ((t % 12) + 12) % 12 };
};

/** Click a start date, then an end date, on one calendar. Opens as a popover (or a bottom sheet on phones). */
export const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange, open, onOpenChange, markedDates }) => {
  const today = todayYMD();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<string | null>(null); // first click of a new selection
  const [hover, setHover] = useState<string | null>(null);
  const [view, setView] = useState(() => {
    const base = value.from || value.to || today;
    return { y: +base.slice(0, 4), m: +base.slice(5, 7) - 1 };
  });
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [isPhone, setIsPhone] = useState(false);

  // Position + reset whenever it opens
  useEffect(() => {
    if (!open) return;
    setAnchor(null);
    setHover(null);
    const base = value.from || value.to || today;
    setView({ y: +base.slice(0, 4), m: +base.slice(5, 7) - 1 });
    const measure = () => {
      setIsPhone(window.innerWidth < 640);
      if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !triggerRef.current?.contains(t)) onOpenChange(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onOpenChange(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onOpenChange]);

  // The range being shown: a live preview while picking, otherwise the saved range
  const shown = useMemo(() => {
    if (anchor) {
      const other = hover || anchor;
      return anchor <= other ? { from: anchor, to: other } : { from: other, to: anchor };
    }
    return value.from || value.to ? { from: value.from || value.to, to: value.to || value.from } : null;
  }, [anchor, hover, value]);

  const pick = (day: string) => {
    if (!anchor) {
      setAnchor(day);
      setHover(day);
      return;
    }
    const range = anchor <= day ? { from: anchor, to: day } : { from: day, to: anchor };
    onChange(range);
    setAnchor(null);
    setHover(null);
    onOpenChange(false);
  };

  const quick = (days: number) => {
    onChange({ from: addDays(today, -(days - 1)), to: today });
    onOpenChange(false);
  };

  const triggerText = value.from || value.to ? `${value.from ? fmt(value.from) : 'Start'}  →  ${value.to ? fmt(value.to) : 'Today'}` : 'Select dates';
  const second = shiftMonth(view, 1);
  const months = isPhone ? [view] : [view, second];

  const PANEL_W = 600;
  const style: React.CSSProperties | undefined =
    !isPhone && rect
      ? {
          width: PANEL_W,
          left: Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - PANEL_W - 8)),
          ...(rect.bottom + 420 > window.innerHeight && rect.top > 440
            ? { bottom: window.innerHeight - rect.top + 8 }
            : { top: rect.bottom + 8 }),
        }
      : undefined;

  const panel = (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Choose a date range"
      style={style}
      className={
        isPhone
          ? 'fixed inset-x-0 bottom-0 z-[70] max-h-[90vh] overflow-y-auto rounded-t-2xl border border-[var(--border)] bg-[var(--surface)] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl'
          : 'fixed z-[70] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-2xl'
      }
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0 text-xs text-[var(--text-secondary)]">
          {anchor ? (
            <span>
              Now pick the <span className="font-bold text-[var(--text-primary)]">end date</span>
              <span className="text-[var(--text-muted)]"> · started {fmt(anchor)}</span>
            </span>
          ) : (
            <span>
              Pick the <span className="font-bold text-[var(--text-primary)]">start date</span>, then the end date
            </span>
          )}
        </div>
        {isPhone && (
          <button onClick={() => onOpenChange(false)} aria-label="Close calendar" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)]">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex items-start gap-5">
        {months.map((mo, idx) => {
          const cells = monthCells(mo.y, mo.m);
          return (
            <div key={`${mo.y}-${mo.m}`} className="min-w-0 flex-1" onMouseLeave={() => anchor && setHover(anchor)}>
              <div className="mb-2 flex items-center justify-between">
                {idx === 0 ? (
                  <button onClick={() => setView((v) => shiftMonth(v, -1))} aria-label="Previous month" className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                ) : (
                  <span className="h-8 w-8" />
                )}
                <div className="text-sm font-bold text-[var(--text-primary)]">
                  {MONTHS[mo.m]} {mo.y}
                </div>
                {idx === months.length - 1 ? (
                  <button onClick={() => setView((v) => shiftMonth(v, 1))} aria-label="Next month" className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <span className="h-8 w-8" />
                )}
              </div>

              <div className="grid grid-cols-7 text-center">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="pb-1 text-[10px] font-bold uppercase text-[var(--text-muted)]">
                    {w}
                  </div>
                ))}
                {cells.map((day, i) => {
                  if (!day) return <div key={`b${i}`} />;
                  const inRange = !!shown && day >= shown.from && day <= shown.to;
                  const isStart = shown?.from === day;
                  const isEnd = shown?.to === day;
                  const edge = isStart || isEnd;
                  const isToday = day === today;
                  const marked = markedDates?.has(day);
                  return (
                    <div
                      key={day}
                      className={`relative ${inRange ? 'bg-[var(--brand-soft)]' : ''} ${isStart ? 'rounded-l-full' : ''} ${isEnd ? 'rounded-r-full' : ''}`}
                    >
                      <button
                        type="button"
                        onClick={() => pick(day)}
                        onMouseEnter={() => anchor && setHover(day)}
                        aria-label={fmt(day) + (marked ? ', has trades' : '')}
                        aria-pressed={edge}
                        className={`relative mx-auto flex h-9 w-9 cursor-pointer flex-col items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                          edge
                            ? 'bg-[var(--brand-primary)] text-[var(--on-brand)]'
                            : 'text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                        } ${isToday && !edge ? 'ring-1 ring-[var(--brand-primary)]' : ''}`}
                      >
                        {+day.slice(8)}
                        {marked && (
                          <span
                            className="absolute bottom-[3px] h-1 w-1 rounded-full"
                            style={{ background: edge ? 'var(--on-brand)' : 'var(--positive)' }}
                          />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            ['Last 7 days', 7],
            ['Last 30 days', 30],
            ['Last 90 days', 90],
          ].map(([label, n]) => (
            <button
              key={label as string}
              onClick={() => quick(n as number)}
              className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
          {shown && <span>{daysBetween(shown.from, shown.to) + 1} day{daysBetween(shown.from, shown.to) === 0 ? '' : 's'} selected</span>}
          {(value.from || value.to) && (
            <button
              onClick={() => {
                onChange({ from: '', to: '' });
                setAnchor(null);
                onOpenChange(false);
              }}
              className="cursor-pointer font-semibold text-[var(--text-secondary)] underline-offset-2 hover:text-[var(--text-primary)] hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`inline-flex min-h-[40px] cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
          open
            ? 'border-[var(--brand-primary)] bg-[var(--brand-soft)] text-[var(--text-primary)]'
            : 'border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-primary)] hover:border-[var(--border-strong)]'
        }`}
      >
        <CalendarRange className="h-4 w-4 shrink-0 text-[var(--brand-primary)]" />
        <span className="font-mono text-xs sm:text-sm">{triggerText}</span>
      </button>

      {open && typeof document !== 'undefined' &&
        createPortal(
          <>
            {isPhone && <div className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-[2px]" onClick={() => onOpenChange(false)} />}
            {(isPhone || style) && panel}
          </>,
          document.body
        )}
    </>
  );
};
