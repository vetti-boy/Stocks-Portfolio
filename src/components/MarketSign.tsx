'use client';

import React from 'react';
import { MarketStatusInfo } from '@/utils/marketStatus';

interface MarketSignProps {
  status: MarketStatusInfo;
  className?: string;
}

function describe(status: MarketStatusInfo): string {
  if (status.isOpen) return 'Market is open';
  if (status.statusText === 'PRE-OPEN') return 'Market is closed — pre-open session, trading starts at 9:15 AM IST';
  return 'Market is closed';
}

/** Coffee-shop style hanging board: shows only OPEN or CLOSED. */
export const MarketSign: React.FC<MarketSignProps> = ({ status, className = '' }) => {
  const open = status.isOpen;
  const label = open ? 'OPEN' : 'CLOSED';

  return (
    <div
      role="status"
      aria-label={describe(status)}
      title={describe(status)}
      className={`market-sign ${open ? 'market-sign-open' : 'market-sign-closed'} ${className}`}
    >
      <div className="market-sign-swing">
        {/* Hook + cord */}
        <svg className="market-sign-cord" viewBox="0 0 64 13" width="64" height="13" aria-hidden="true">
          <line x1="32" y1="3" x2="13" y2="13" stroke="#C9A66B" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="32" y1="3" x2="51" y2="13" stroke="#C9A66B" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="32" cy="2.6" r="2.4" fill="#9A8C98" stroke="#5F5C68" strokeWidth="1" />
        </svg>

        {/* Board (re-keyed so it flips whenever the market opens or closes) */}
        <div key={label} className="market-sign-board">
          <span className="market-sign-hole" style={{ left: 9 }} />
          <span className="market-sign-hole" style={{ right: 9 }} />
          <span className="market-sign-text">{label}</span>
        </div>
      </div>
    </div>
  );
};
