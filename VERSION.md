# Version Log & Modification History

This file maintains a strict chronological record of all application versions, feature updates, bug fixes, and architectural modifications.

## [v1.6.0] - 2026-10-06
### Admin Account Lifecycle, Password Visibility Controls & P&L Formatting Update
- **Admin Account Disabling & Deletion Provisions**:
  - Implemented Admin account disabling (`/api/admin/toggle-user`) and permanent account deletion (`/api/admin/delete-user`).
  - Disabled users are blocked from logging in with an HTTP 403 Forbidden status message.
  - Added Account Status (`ACTIVE` / `DISABLED`) and Enable/Disable & Delete buttons to the Admin Panel user directory table.
- **Eye / Eye-Off Password Visibility Toggles**:
  - Added interactive show/hide password buttons (`Eye`/`EyeOff` icons) across all password input fields in Admin Panel, Auth Modal, and Portfolio Settings.
- **Top Performing Asset & Financial P&L Formatting**:
  - Fixed `+-` sign formatting bugs for negative returns, adding dynamic `Gain: +` vs `Loss: -` labels and red badges (`rose-400`) for losses.
  - Cleaned up negative currency output (`-₹X,XXX.XX`).
- **Conditional Watchlist Rendering in Portfolio Inspection**:
  - Updated Admin User Portfolio Inspection modal to only render the Watchlist section if the user has items in their watchlist.

---

## [v1.5.0] - 2026-09-29
### Authentic Live Stock Price API & Watchlist Simplification
- **Authentic Live Yahoo Finance Market API ([`/api/stocks/quote`](file:///d:/Manoj/Personal%20Projects/Stocks-Portfolio/src/app/api/stocks/quote/route.ts))**:
  - Implemented server-side API proxy querying live Yahoo Finance APIs (`/v7/finance/quote` & `/v8/finance/chart`) for real original Indian NSE stock prices (`RELIANCE.NS`, `TCS.NS`, `INFY.NS`, `HDFCBANK.NS`, `ICICIBANK.NS`, `TATAMOTORS.NS`, `SBIN.NS`, `BHARTIARTL.NS`, `ITC.NS`, `ZOMATO.NS`).
  - Added continuous 8-second client auto-polling in [`StockContext.tsx`](file:///d:/Manoj/Personal%20Projects/Stocks-Portfolio/src/context/StockContext.tsx) to dynamically update all holdings and watchlists with live market prices.

- **Single Unified Watchlist Simplification**:
  - Removed multi-watchlist tabs (`Watchlist 1` through `Watchlist 5`) per user directive.
  - Built single unified Watchlist component ([`WatchlistTab.tsx`](file:///d:/Manoj/Personal%20Projects/Stocks-Portfolio/src/components/WatchlistTab.tsx)) displaying live stock cards, market depth, and quick buy/sell order tickets.

---

## [v1.4.0] - 2026-09-29
### Indian Stock Market Real-Time Analysis & Technical Signals Release
- Dedicated Market Analysis Hub ([`AnalysisTab.tsx`](file:///d:/Manoj/Personal%20Projects/Stocks-Portfolio/src/components/AnalysisTab.tsx)) with technical signal meters (`STRONG BUY`, `BUY`, `NEUTRAL`, `SELL`, `STRONG SELL`), RSI-14, SMA 20/50, MACD, and daily Pivot Points (PP, S1/S2, R1/R2).
- Indian Market Benchmark Indices Live Dashboard (**NIFTY 50**, **BANK NIFTY**, **NIFTY IT**, **NIFTY SMALLCAP**, **INDIA VIX**), FII/DII net institutional cash flows, and Sector Heatmap.

---

## [v1.3.0] - 2026-09-29
### Zerodha & Groww Style Market Watchlist & Live Quotes Release
- 5-Level Market Depth Table (Bids vs Asks) and CNC/MIS order ticket window.

---

## [v1.2.0] - 2026-09-29
### Indian Rupee (₹ INR) Currency Standardization
- Standardized currency exclusively to **INR (₹)** across all holdings, watchlists, stats, forms, and calculation engines.

---

## [v1.1.0] - 2026-09-29
### Cloud DB Encryption & Admin User Management Release
- AES-256-GCM Payload Encryption & Decryption server-side.
- Admin-Only Account Creation restricting user registration strictly to Administrators.

---

## [v1.0.0] - 2026-09-29
### Initial Release & Core Features
- Initial authentication, portfolio tracking, live streamer, forward and reverse tax calculators.

---

*Note: Update this file with every pull request or major feature modification.*
