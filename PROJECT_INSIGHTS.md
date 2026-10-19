# Project Insights & Architecture Documentation

## Executive Overview
**StockPulse PRO** is an enterprise-grade stock portfolio tracker and live financial analytics application. It features **single Google Sign-In authentication**, **cloud database persistence with MongoDB Atlas**, **Admin user management & account controls (Toggle/Delete/Portfolio Inspection)**, real-time market tickers, and an advanced **Net P&L & Target Selling Price Calculator**.

---

## Security & Database Architecture

### 1. Cloud Database Persistence with MongoDB Atlas
All user stock holdings, watchlists, trade history, and tax settings are persisted server-side directly to MongoDB Atlas:
- **Persistence Standard**: MongoDB Atlas `UserData` collection with strict schema integrity (`minimize: false` to ensure empty/mixed sub-objects are never stripped).
- **Persistence Flow**:
  1. Client sends portfolio payload to `POST /api/user/data` containing `userId`, `userEmail`, `holdings`, `watchlist`, `tradeHistory`, and `taxSettings`.
  2. Server uses atomic upsert matching `{ $or: [{ userId }, { userEmail }] }` to link portfolio data to the user's permanent identity.
  3. Returns confirmation and updates client sync status to `synced`.
- **Query & Session Retrieval Flow**:
  1. Authenticated user requests portfolio data via `GET /api/user/data?userId=...&userEmail=...`.
  2. Server queries MongoDB `UserData` document by `userId` or `userEmail`.
  3. Clean JSON data is delivered to the user session. If user previously added stocks as guest, the client automatically migrates local holdings to their Google MongoDB document.

### 2. Single Google Authentication Flow (`/api/auth/google`)
All fragmented email/password, guest, and OTP login flows have been unified into **Google Sign-In as the single authentication type**:
- **Google Identity Services (GIS)**: Accepts signed Google ID tokens (`credential` JWT) and verifies user identity (`email`, `name`, `sub`, `avatar`).
- **One-Click Account Provisioning**: If user doesn't exist in MongoDB, auto-provisions user account with default role `USER` (or `ADMIN` for `mailfortempusage@gmail.com`).
- **Account Disabling Enforcement**: If user is disabled by Administrator, authentication returns HTTP 403 Forbidden.
- **Client Session**: Clean `localStorage` session persistence (`stocks_app_user`) linking all client operations to the Google account.

---

## Environment Variables Configuration

To run with MongoDB Cloud Atlas and custom encryption keys, configure `.env.local` in the root directory:

```env
# MongoDB Atlas / Cloud Database Connection URI
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/stocks-portfolio?retryWrites=true&w=majority

# 32-Byte Secret Encryption Key (for AES-256-GCM)
ENCRYPTION_KEY=my-super-secret-32-byte-aes-encryption-key-2026

# JWT / Auth Secret
JWT_SECRET=super-secret-jwt-token-key-2026

# Nodemailer SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## Financial Calculation & Formatting Rules

### 1. Top Performing Asset & P&L Display Logic
- **Gain / Loss Dynamic Formatting**:
  - Positive Return: Displays `Gain: +₹...` with green badge (`text-emerald-400 bg-emerald-500/10`).
  - Negative Return: Displays `Loss: -₹...` with red badge (`text-rose-400 bg-rose-500/10`).
  - Eliminates sign collision bugs (`+-` or `+₹-`).
- **Standardized Currency Formatting**:
  - All negative monetary amounts across cards and tables are formatted cleanly as `-₹X,XXX.XX` instead of `₹-X,XXX.XX`.

### 2. Forward Net P&L Formula
$$\text{Gross Sale Value} = \text{Quantity} \times \text{Sell Price}$$
$$\text{Total Cost} = (\text{Quantity} \times \text{Buy Price}) + \text{Buy Brokerage} + \text{Stamp Duty}$$
$$\text{Total Fees} = \text{Buy Brokerage} + \text{Sell Brokerage} + \text{Stamp Duty} + \text{STT Charges} + \text{GST Charges}$$
$$\text{Gross Profit} = \text{Gross Sale Value} - \text{Total Cost} - \text{Sell Brokerage} - \text{STT} - \text{GST}$$
$$\text{Tax Amount} = \max(0, \text{Gross Profit} \times \text{Tax Rate})$$
$$\text{Net Take-Home P\&L} = \text{Gross Profit} - \text{Tax Amount}$$

### 3. Target Sell Price Reverse Formula
Solves required selling price per share $P_{sell}$ to achieve exact target net profit $P_{net}$:
$$S = \frac{\text{Total Buy Cost} + \text{Sell Fixed Fees} + \frac{P_{net}}{1 - T_{rate}}}{1 - k}$$
$$P_{sell} = \frac{S}{\text{Quantity}}$$
Where $k$ is the combined fee percentage coefficient of brokerage, STT, and GST.

---

## Complete File Structure Map
```
stocks-portfolio/
├── VERSION.md                           # Chronological version history log (v1.6.0)
├── PROJECT_INSIGHTS.md                  # Comprehensive architecture & workflow docs
├── package.json                         # Dependencies (Mongoose, Bcryptjs, Nodemailer, Recharts, Tailwind v4)
├── tsconfig.json                        # TypeScript configuration
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── create-user/route.ts # Admin account creation API
│   │   │   │   ├── delete-user/route.ts # Admin permanent user deletion API
│   │   │   │   ├── toggle-user/route.ts # Admin disable/enable user account API
│   │   │   │   ├── reset-password/route.ts # Admin direct password override API
│   │   │   │   ├── user-portfolio/route.ts # Decrypted user holdings inspection API
│   │   │   │   └── users/route.ts       # Admin user directory query API
│   │   │   ├── auth/
│   │   │   │   ├── change-password/route.ts # First-time mandatory passcode change API
│   │   │   │   ├── login/route.ts       # Cloud DB auth & disabled status verification API
│   │   │   │   ├── send-otp/route.ts    # Nodemailer 6-digit OTP dispatch API
│   │   │   │   └── verify-otp-change-password/route.ts # OTP verification & password update API
│   │   │   ├── stocks/
│   │   │   │   ├── quote/route.ts       # Live Yahoo Finance market quote proxy API
│   │   │   │   └── search/route.ts      # Live stock search autocomplete API
│   │   │   └── user/
│   │   │       └── data/route.ts        # AES-256-GCM encrypted save & server decryption API
│   │   ├── layout.tsx
│   │   ├── page.tsx                     # Main tab orchestrator
│   │   └── globals.css                  # Design tokens & glassmorphism styling
│   ├── components/
│   │   ├── Navbar.tsx                   # Header with live ticker marquee & AES status
│   │   ├── PortfolioTab.tsx             # Stock holdings, P&L cards, modal & trade history
│   │   ├── WatchlistTab.tsx             # Unified watchlist, market depth & order ticket
│   │   ├── AnalysisTab.tsx              # Market analysis hub, technical indicators & sector heatmap
│   │   ├── CalculatorTab.tsx            # Forward & Reverse Target P&L Calculator
│   │   ├── AdminPanel.tsx               # Admin Console with user directory, disable/delete & inspection
│   │   ├── AuthModal.tsx                # Authentication, password change & OTP modal
│   │   ├── CommandPaletteModal.tsx      # Quick command search palette
│   │   ├── PinLockModal.tsx             # Security PIN lock screen
│   │   └── InsightsTab.tsx              # Interactive viewer for VERSION.md & INSIGHTS
│   ├── context/
│   │   ├── AuthContext.tsx              # User authentication & role management context
│   │   └── StockContext.tsx             # Live portfolio state & Cloud DB auto-sync
│   ├── lib/
│   │   ├── email.ts                     # Nodemailer SMTP email sender utility
│   │   ├── encryption.ts                # AES-256-GCM encryption & decryption helper
│   │   └── mongodb.ts                   # Mongoose cloud database connection helper
│   ├── models/
│   │   ├── User.ts                      # Mongoose User schema with ADMIN/USER roles & isDisabled
│   │   └── UserData.ts                  # Mongoose schema for encrypted portfolio payloads
│   └── types/
│       └── stock.ts                     # TypeScript interfaces
```
