'use client';

import React, { useEffect, useId, useState } from 'react';
import { Smile, X } from 'lucide-react';

type Mood = 'happy' | 'sad' | 'idle';

interface PortfolioMascotProps {
  /** Net unrealized P&L of the whole portfolio, after charges (₹) */
  netPnL: number;
  /** Net P&L as a percentage of invested capital */
  pnlPercent: number;
  hasHoldings: boolean;
}

const HIDE_KEY = 'stockpulse-mascot-hidden';
const INK = '#22223B';

const inr = (n: number) =>
  '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function getMood(hasHoldings: boolean, netPnL: number): Mood {
  if (!hasHoldings || Math.abs(netPnL) < 0.005) return 'idle';
  return netPnL > 0 ? 'happy' : 'sad';
}

function getMessage(mood: Mood, netPnL: number, pnlPercent: number): string {
  const pct = `${pnlPercent >= 0 ? '+' : '-'}${Math.abs(pnlPercent).toFixed(2)}%`;
  if (mood === 'happy') return `Woohoo! You're up ${inr(netPnL)} (${pct}) 🎉`;
  if (mood === 'sad') return `Ouch… down ${inr(netPnL)} (${pct}). Hang in there!`;
  return 'Add a holding and I\'ll cheer (or cry) with you!';
}

/** Pulse the bull: jumps for joy when the portfolio is in profit, cries when it is in loss. */
export const PortfolioMascot: React.FC<PortfolioMascotProps> = ({ netPnL, pnlPercent, hasHoldings }) => {
  const uid = useId().replace(/:/g, '');
  const mood = getMood(hasHoldings, netPnL);
  const [hidden, setHidden] = useState(false);
  const [bubble, setBubble] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setHidden(localStorage.getItem(HIDE_KEY) === '1');
    } catch {
      // Ignored
    }
  }, []);

  // Greet the user with a speech bubble whenever the mood changes (not on every price tick).
  // On phones the bubble would cover the figures, so there it only opens when tapped.
  useEffect(() => {
    if (!mounted || hidden) return;
    if (typeof window !== 'undefined' && !window.matchMedia('(min-width: 768px)').matches) return;
    setBubble(true);
    const t = setTimeout(() => setBubble(false), 7000);
    return () => clearTimeout(t);
  }, [mood, mounted, hidden]);

  const setHiddenPersist = (value: boolean) => {
    setHidden(value);
    try {
      if (value) localStorage.setItem(HIDE_KEY, '1');
      else localStorage.removeItem(HIDE_KEY);
    } catch {
      // Ignored
    }
  };

  if (!mounted) return null;

  if (hidden) {
    return (
      <button
        type="button"
        onClick={() => setHiddenPersist(false)}
        aria-label="Show portfolio mascot"
        title="Show mascot"
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 md:bottom-5 md:right-5 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--brand-primary)] shadow-lg transition hover:scale-110 cursor-pointer"
      >
        <Smile className="h-4 w-4" />
      </button>
    );
  }

  const message = getMessage(mood, netPnL, pnlPercent);
  const bodyId = `${uid}-body`;

  return (
    <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-2 md:bottom-4 md:right-5 z-30 select-none" data-mood={mood}>
      {/* Speech bubble */}
      <div
        role="status"
        aria-live="polite"
        className={`absolute bottom-full right-2 mb-2 w-max max-w-[190px] md:mb-3 md:max-w-[220px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[11px] font-semibold leading-snug text-[var(--text-primary)] shadow-xl transition-all duration-300 ${
          bubble ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
        }`}
      >
        {message}
        <span className="absolute -bottom-1.5 right-8 h-3 w-3 rotate-45 border-b border-r border-[var(--border)] bg-[var(--surface)]" />
      </div>

      <button
        type="button"
        onClick={() => setBubble((b) => !b)}
        onMouseEnter={() => {
          if (window.matchMedia('(hover: hover)').matches) setBubble(true);
        }}
        aria-label={message}
        className="relative block cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
      >
        <svg
          viewBox="0 -14 120 144"
          className={`mascot mascot-${mood} h-[70px] w-[61px] md:h-[110px] md:w-[96px]`}
          style={{ overflow: 'visible' }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={bodyId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#DCC5C0" />
              <stop offset="1" stopColor="#B49A9C" />
            </linearGradient>
          </defs>

          <ellipse className="mascot-shadow" cx="60" cy="122" rx="30" ry="6" fill="#000" opacity="0.22" />

          {/* Mood extras: confetti (happy) / rain cloud (sad) */}
          {mood === 'happy' && (
            <g className="mascot-sparkles" fill="#F2E9E4">
              <path className="mascot-spark s1" d="M10 30 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" />
              <path className="mascot-spark s2" d="M108 22 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5z" />
              <circle className="mascot-spark s3" cx="100" cy="60" r="3" fill="#E6B35A" />
              <circle className="mascot-spark s4" cx="16" cy="64" r="3" fill="#3DDC97" />
              <circle className="mascot-spark s5" cx="60" cy="-6" r="3" fill="#F0707F" />
            </g>
          )}
          {mood === 'sad' && (
            <g className="mascot-cloud">
              <g fill="#7B86A3" stroke={INK} strokeWidth="2.5" strokeLinejoin="round">
                <circle cx="44" cy="-2" r="9" />
                <circle cx="60" cy="-6" r="11" />
                <circle cx="76" cy="-2" r="9" />
                <rect x="38" y="-3" width="44" height="11" rx="5.5" stroke="none" />
              </g>
              <g stroke="#7FC4F0" strokeWidth="2.5" strokeLinecap="round">
                <line className="mascot-rain r1" x1="46" y1="12" x2="45" y2="17" />
                <line className="mascot-rain r2" x1="60" y1="12" x2="59" y2="17" />
                <line className="mascot-rain r3" x1="74" y1="12" x2="73" y2="17" />
              </g>
            </g>
          )}

          <g className="mascot-body">
            {/* Legs */}
            <rect x="38" y="104" width="17" height="15" rx="7.5" fill="#9A8C98" stroke={INK} strokeWidth="3" />
            <rect x="65" y="104" width="17" height="15" rx="7.5" fill="#9A8C98" stroke={INK} strokeWidth="3" />

            {/* Arms (behind the body so the shoulders tuck in) */}
            <g className="mascot-arm mascot-arm-l">
              <rect x="13" y="72" width="16" height="30" rx="8" fill="#B49A9C" stroke={INK} strokeWidth="3" />
            </g>
            <g className="mascot-arm mascot-arm-r">
              <rect x="91" y="72" width="16" height="30" rx="8" fill="#B49A9C" stroke={INK} strokeWidth="3" />
            </g>

            {/* Horns */}
            <path d="M33 46 C24 38 22 26 28 16 C35 24 44 31 49 38 Z" fill="#F2E9E4" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
            <path d="M87 46 C96 38 98 26 92 16 C85 24 76 31 71 38 Z" fill="#F2E9E4" stroke={INK} strokeWidth="3" strokeLinejoin="round" />

            {/* Head / body */}
            <ellipse cx="60" cy="74" rx="40" ry="38" fill={`url(#${bodyId})`} stroke={INK} strokeWidth="3" />
            <ellipse cx="44" cy="52" rx="11" ry="6" fill="#fff" opacity="0.28" transform="rotate(-28 44 52)" />

            {/* Cheeks */}
            <circle cx="36" cy="82" r="6.5" fill="#F28B9B" opacity={mood === 'sad' ? 0.35 : 0.6} />
            <circle cx="84" cy="82" r="6.5" fill="#F28B9B" opacity={mood === 'sad' ? 0.35 : 0.6} />

            {/* Snout */}
            <ellipse cx="60" cy="89" rx="16" ry="11" fill="#F2E9E4" stroke={INK} strokeWidth="2.5" />
            <circle cx="54" cy="87" r="2.2" fill={INK} />
            <circle cx="66" cy="87" r="2.2" fill={INK} />

            {/* Eyes + mouth per mood */}
            {mood === 'happy' && (
              <>
                <path d="M38 67 Q45 55 52 67" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
                <path d="M68 67 Q75 55 82 67" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
                <path d="M50 95 Q60 109 70 95 Z" fill={INK} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
                <path d="M54 101 Q60 106 66 101 Q60 98 54 101 Z" fill="#F0707F" />
              </>
            )}
            {mood === 'sad' && (
              <>
                <g className="mascot-eye">
                  <ellipse cx="46" cy="67" rx="6.5" ry="7.5" fill={INK} />
                  <ellipse cx="74" cy="67" rx="6.5" ry="7.5" fill={INK} />
                  <circle cx="44" cy="64" r="2.4" fill="#fff" />
                  <circle cx="72" cy="64" r="2.4" fill="#fff" />
                </g>
                <path d="M37 59 L54 50" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
                <path d="M83 59 L66 50" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
                <path d="M52 99 Q60 91 68 99" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
                {/* Streaming tears */}
                <path className="mascot-tear t1" d="M44 73 q-5 8 0 11 q5 -3 0 -11 Z" fill="#7FC4F0" stroke="#4B9FD6" strokeWidth="1" />
                <path className="mascot-tear t2" d="M76 73 q-5 8 0 11 q5 -3 0 -11 Z" fill="#7FC4F0" stroke="#4B9FD6" strokeWidth="1" />
                <path className="mascot-tear t3" d="M44 73 q-5 8 0 11 q5 -3 0 -11 Z" fill="#7FC4F0" stroke="#4B9FD6" strokeWidth="1" />
                <path className="mascot-tear t4" d="M76 73 q-5 8 0 11 q5 -3 0 -11 Z" fill="#7FC4F0" stroke="#4B9FD6" strokeWidth="1" />
              </>
            )}
            {mood === 'idle' && (
              <>
                <g className="mascot-eye">
                  <ellipse cx="46" cy="67" rx="5.5" ry="6.5" fill={INK} />
                  <ellipse cx="74" cy="67" rx="5.5" ry="6.5" fill={INK} />
                  <circle cx="44" cy="65" r="2" fill="#fff" />
                  <circle cx="72" cy="65" r="2" fill="#fff" />
                </g>
                <path d="M53 96 Q60 101 67 96" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
              </>
            )}
          </g>
        </svg>
      </button>

      <button
        type="button"
        onClick={() => setHiddenPersist(true)}
        aria-label="Hide portfolio mascot"
        title="Hide mascot"
        className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] opacity-70 transition hover:opacity-100 cursor-pointer md:-right-1 md:-top-1 md:h-5 md:w-5"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};
