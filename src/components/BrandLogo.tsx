import React from 'react';

interface BrandLogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

/** StockPulse brand lockup: animated SVG app icon + wordmark (sits on the always-dark sidebar). */
export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 36, showWordmark = true, className = '' }) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <img
      src="/logo-icon.svg"
      alt="StockPulse"
      width={size}
      height={size}
      style={{ height: size, width: size }}
      className="shrink-0 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
    />
    {showWordmark && (
      <div className="leading-none select-none">
        <div className="text-[19px] font-extrabold tracking-tight">
          <span className="text-[#F2E9E4]">STOCK</span>
          <span className="text-[#C9ADA7]">PULSE</span>
        </div>
        <div className="mt-1 whitespace-nowrap text-[7px] font-semibold uppercase tracking-[0.17em] text-[#9A8C98]">
          Portfolio Intelligence
        </div>
      </div>
    )}
  </div>
);
