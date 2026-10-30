'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pencil, X, AlertCircle, Info } from 'lucide-react';
import { useStock } from '@/context/StockContext';
import { LedgerTrade, buildTradeLedger, toYMD } from '@/lib/tradeLedger';
import { TradeRecord } from '@/types/stock';

interface EditTradeModalProps {
  trade: LedgerTrade;
  onClose: () => void;
  onSave: (updates: Partial<TradeRecord>) => void;
}

const money = (n: number) => Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const signed = (n: number) => `${n >= 0 ? '+' : '-'}₹${money(n)}`;

/** Correct the buy / sell details of an already-sold trade (e.g. a wrong buy date). */
export const EditTradeModal: React.FC<EditTradeModalProps> = ({ trade, onClose, onSave }) => {
  const { holdings, taxSettings } = useStock();
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const [buyDate, setBuyDate] = useState(toYMD(trade.buyDate) || '');
  const [buyPrice, setBuyPrice] = useState(String(trade.buyP));
  const [sellDate, setSellDate] = useState(trade.soldOn);
  const [sellPrice, setSellPrice] = useState(String(trade.sellP));
  const [quantity, setQuantity] = useState(String(trade.quantity));

  useEffect(() => {
    firstFieldRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const nums = {
    buyPrice: parseFloat(buyPrice),
    sellPrice: parseFloat(sellPrice),
    quantity: parseFloat(quantity),
  };

  const error = (() => {
    if (!toYMD(buyDate)) return 'Enter a valid buy date.';
    if (!toYMD(sellDate)) return 'Enter a valid sell date.';
    if (!(nums.quantity > 0)) return 'Quantity must be greater than 0.';
    if (!(nums.buyPrice >= 0) || !Number.isFinite(nums.buyPrice)) return 'Enter a valid buy price.';
    if (!(nums.sellPrice >= 0) || !Number.isFinite(nums.sellPrice)) return 'Enter a valid sell price.';
    if (buyDate > sellDate) return 'The buy date cannot be after the sell date.';
    return null;
  })();

  // Everything the ledger derives (charges, net P&L, holding period) is recomputed from the edited values
  const draft = useMemo((): Partial<TradeRecord> => {
    const qty = nums.quantity > 0 ? nums.quantity : trade.quantity;
    const scale = trade.quantity > 0 ? qty / trade.quantity : 1;
    const own = trade.ownQuantity !== undefined ? Math.round(trade.ownQuantity * scale) : undefined;
    return {
      buyDate,
      buyPrice: Number.isFinite(nums.buyPrice) ? nums.buyPrice : trade.buyP,
      price: Number.isFinite(nums.sellPrice) ? nums.sellPrice : trade.sellP,
      sellDate,
      date: sellDate,
      quantity: qty,
      ...(trade.isMTF && own !== undefined ? { ownQuantity: own, mtfQuantity: Math.max(0, qty - own) } : {}),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyDate, buyPrice, sellDate, sellPrice, quantity]);

  const preview = useMemo(() => {
    if (error) return null;
    const rec = { ...trade, ...draft, totalValue: (draft.price as number) * (draft.quantity as number) } as TradeRecord;
    // Drop the cached MTF day count so it follows the edited dates
    delete (rec as Partial<TradeRecord>).mtfDaysHeld;
    return buildTradeLedger([rec], holdings, taxSettings)[0];
  }, [draft, error, trade, holdings, taxSettings]);

  const handleSave = () => {
    if (error || !preview) return;
    onSave({
      ...draft,
      grossPnL: +preview.grossPnL.toFixed(2),
      totalDeductions: +preview.totalDeductions.toFixed(2),
      realizedPnL: +preview.netPnL.toFixed(2),
      realizedPnLPercent: +preview.netRoiPercent.toFixed(2),
      ...(trade.isMTF ? { mtfDaysHeld: preview.daysHeld } : {}),
    });
  };

  const fieldClass = 'glass-input mt-1 block w-full';
  const labelClass = 'text-[11px] font-semibold text-[var(--text-secondary)]';
  const changed = preview && (Math.abs(preview.netPnL - trade.netPnL) > 0.004 || preview.daysHeld !== trade.daysHeld);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${trade.symbol} trade`}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl sm:rounded-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold text-[var(--text-primary)]">
              <Pencil className="h-4 w-4 text-[var(--brand-primary)]" /> Edit trade
            </h3>
            <p className="mt-0.5 font-mono text-xs text-[var(--text-secondary)]">
              {trade.symbol} · {trade.broker === 'ANGELONE' ? 'Angel One' : trade.broker === 'GROWW' ? 'Groww' : 'Zerodha'}
              {trade.isMTF ? ` · MTF ${trade.mtfMultiplier || 2.5}x` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!trade.buyDateRecorded && (
          <div className="mt-3 flex gap-2 rounded-lg border border-[var(--warning-border)] bg-[var(--warning-bg)] p-2.5 text-[11px] text-[var(--text-secondary)]">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--warning)]" />
            This trade has no saved buy date, so the sell date was shown instead. Enter the real one below.
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className={labelClass}>
            Buy date
            <input ref={firstFieldRef} type="date" value={buyDate} max={sellDate || undefined} onChange={(e) => setBuyDate(e.target.value)} className={fieldClass} />
          </label>
          <label className={labelClass}>
            Buy price (₹)
            <input type="number" inputMode="decimal" step="any" min="0" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} className={`${fieldClass} font-mono`} />
          </label>
          <label className={labelClass}>
            Sell date
            <input type="date" value={sellDate} min={buyDate || undefined} onChange={(e) => setSellDate(e.target.value)} className={fieldClass} />
          </label>
          <label className={labelClass}>
            Sell price (₹)
            <input type="number" inputMode="decimal" step="any" min="0" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} className={`${fieldClass} font-mono`} />
          </label>
          <label className={`${labelClass} col-span-2`}>
            Quantity sold
            <input type="number" inputMode="decimal" step="any" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={`${fieldClass} font-mono`} />
          </label>
        </div>

        {/* Live recalculation */}
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-xs">
          {error ? (
            <div className="flex items-center gap-2 text-[var(--negative)]">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          ) : preview ? (
            <div className="space-y-1.5 font-mono">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span className="font-sans">Held</span>
                <span className="font-bold text-[var(--text-primary)]">{preview.daysHeld} day{preview.daysHeld === 1 ? '' : 's'}</span>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span className="font-sans">Charges</span>
                <span className="font-bold text-[var(--warning)]">-₹{money(preview.totalDeductions)}</span>
              </div>
              <div className="flex items-baseline justify-between border-t border-[var(--border)] pt-1.5">
                <span className="font-sans font-semibold text-[var(--text-primary)]">Net realized P&amp;L</span>
                <span className={`text-sm font-extrabold ${preview.netPnL >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>{signed(preview.netPnL)}</span>
              </div>
              {changed && (
                <div className="text-right font-sans text-[10px] text-[var(--text-muted)]">
                  was {signed(trade.netPnL)}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!!error}
            className="pill-btn-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
};
