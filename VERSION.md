# Version Log & Modification History

This file maintains a strict chronological record of all application versions, feature updates, bug fixes, and architectural modifications.

## [v1.9.0] - 2026-10-21
### Angel One Integration, Search Autocomplete Fix, Session-Only Guest Mode & UI Polish
- **Angel One Broker Integration & UI Alignment**:
  - Integrated **Angel One** across the Brokerage Calculator, Navbar presets, Trade History, and Stock Purchase/Edit forms.
  - Added Angel One brokerage rate calculations: ₹0 Buy / ₹20 Sell (Delivery), 0.1% max ₹20 (MTF), and ₹20.00 DP charge (+ 18% GST).
  - Redesigned Broker Platform selection in both "Record Stock Purchase" and "Edit Stock Holding" modals into a full-width 3-column grid (`grid grid-cols-3 gap-2`), completely eliminating button overflow past the modal box border.
  - Streamlined modal layout by pairing Exchange and Purchase Date in a balanced 2-column row.
- **Stock Autocomplete Re-Opening Fix (`PortfolioTab.tsx`)**:
  - Fixed issue where selecting a stock suggestion re-triggered the search debounce `useEffect` due to `formData.symbol` mutation, which previously caused suggestions to pop back open over the form.
  - Introduced `isSuggestionSelectedRef` guard to immediately clear search results and prevent re-querying upon selection.
  - Added `onBlur` dismiss timer so clicking into other fields cleanly hides the suggestion dropdown.
- **Single Google Sign-In & Temporary Guest Mode (`AuthModal.tsx` & `AuthContext.tsx`)**:
  - Streamlined the sign-in modal to display a single, unified Google Sign-In option and removed duplicate buttons and test profiles.
  - Implemented **Temporary Guest Mode**:
    - Guest session and portfolio data are strictly isolated to `sessionStorage`.
    - Zero database overhead: Guest actions never send write operations to MongoDB Atlas and never persist to `localStorage`.
    - Data is automatically discarded when the browser tab or app is closed.
- **Code Audit & Dead Code Removal**:
  - Cleaned up unused icon imports across `PortfolioTab.tsx` and `AuthModal.tsx`.
  - Added `client_secret*.json` to `.gitignore` to prevent committing Google Cloud OAuth credentials.
  - Verified clean TypeScript compilation (`npx tsc --noEmit`) and successful Next.js production bundle build (`npm run build`).

## [v1.8.0] - 2026-10-19
### Google Sign-In Single Authentication & Cloud Database Portfolio Storage Fix
- **Single Google Sign-In Implementation (`/api/auth/google`)**:
  - Removed all email/password login, registration, OTP verification, first-time mandatory password change, and guest login pathways.
  - Implemented Google Sign-In as the single unified login mechanism with Google Identity Services (GIS) and one-click Google account verification.
  - Added support for `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `.env.local` and auto-provisioning of Google users into MongoDB `User` collection.
  - Configured Master Administrator designation automatically for `mailfortempusage@gmail.com`.
- **MongoDB Portfolio Persistence Fix (`/api/user/data` & `StockContext.tsx`)**:
  - Fixed portfolio data loss bug where empty/mixed payload objects were stripped by Mongoose by enabling `{ minimize: false }` on `UserDataSchema`.
  - Replaced transient `userId` query lookups with unified `{ $or: [{ userId }, { userEmail }] }` lookups across GET and POST endpoints.
  - Fixed React 19 state updater side-effects by removing network fetch calls from inside `setState((prev) => ...)` and decoupling them into a reliable `persistPortfolio` service.
  - Enabled automatic seamless migration of local/guest holdings to the user's MongoDB cloud document upon signing in with Google.
  - Fixed JSON portfolio import to immediately trigger cloud database synchronization.
- **Admin Panel Streamlining**:
  - Removed legacy password reset actions, password input fields, and OTP modals from Admin Console.
  - Updated user directory to display real Google users from MongoDB Atlas with avatar, role management, enable/disable status controls, and decrypted portfolio inspection.

## [v1.7.0] - 2026-10-07
### Dynamic IST Market Schedule, Multi-Broker DP Charges & SMTP Email Dispatcher
- **Dynamic Real-Time Indian Stock Market Status (`src/utils/marketStatus.ts`)**:
  - Implemented real-time IST schedule evaluator (`Pre-Open`, `Live Trading Session`, `Post-Market`, `Market Closed` & `Weekend`).
  - Integrated dynamic badge colors and continuous 30-second session polling into Navbar header and Market Analysis regime status bar.
- **Dynamic Multi-Broker DP Charges Calculator**:
  - Integrated editable DP Charge input field and presets for Zerodha (₹15.93), Groww (₹23.60), Angel One (₹23.60), Upstox (₹21.83), ICICI Direct (₹29.50), and Custom.
- **Gmail SMTP Registration Welcome Email Dispatcher**:
  - Added `sendSelfRegistrationConfirmationEmail()` to format and send welcome emails to newly registered users.
  - Configured Gmail SMTP App Password (`SMTP_EMAIL` & `SMTP_PASSWORD`) in `.env.local`.
- **Authentication Lifecycle & Session Persistence**:
  - Enforced login modal prompt on page load after logging out, removing auto-login defaults.
  - Implemented clean `localStorage` session persistence for active logged-in sessions.

---

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
