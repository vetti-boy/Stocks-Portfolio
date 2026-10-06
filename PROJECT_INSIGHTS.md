# Project Insights & Architecture Documentation

## Executive Overview
**StockPulse PRO** is an enterprise-grade stock portfolio tracker and live financial analytics application. It features **application-level AES-256-GCM encryption**, **cloud database persistence with MongoDB Atlas**, **Admin-only user account provisioning & lifecycle management (Disable/Delete)**, automated **Email OTP & credential dispatch via Nodemailer**, real-time market tickers, and an advanced **Net P&L & Target Selling Price Calculator**.

---

## Security & Database Architecture

### 1. Application-Level AES-256-GCM Cloud Encryption
All user stock holdings, watchlists, trade history, and tax settings are encrypted server-side before being written to MongoDB:
- **Encryption Standard**: `AES-256-GCM` (Galois/Counter Mode with 128-bit Authentication Tag & 16-byte random IV).
- **Encryption Flow**:
  1. Client sends portfolio payload to `/api/user/data`.
  2. Next.js Server API route converts payload to JSON string and encrypts it with `ENCRYPTION_KEY`.
  3. Formatted encrypted string (`iv:authTag:encryptedHex`) is saved to MongoDB in the `UserData` collection.
- **Decryption Flow**:
  1. Authenticated user requests portfolio data via `GET /api/user/data`.
  2. Server queries MongoDB `UserData` document, extracts `encryptedPayload` string, verifies auth tag, and decrypts the string server-side.
  3. Clean JSON data is delivered to the user session.

### 2. Admin User Lifecycle & Account Control Architecture
- **Admin Account Provisioning (`/api/admin/create-user`)**:
  - Admins can provision user accounts with: Full Name, Email, Role (`USER` / `ADMIN`), Temporary Password (hashed with `bcryptjs`), and Default Currency (`INR`).
  - Users created by Admin are flagged with `mustChangePassword: true`, requiring a passcode change on first login.
- **Account Disabling & Blocking (`/api/admin/toggle-user`)**:
  - Admins can toggle user accounts between `ACTIVE` and `DISABLED`.
  - When an account is disabled, the login API endpoint (`/api/auth/login`) rejects login attempts with an HTTP 403 Forbidden status: *"Your account has been disabled by Administrator. Access is blocked until re-enabled."*
- **Permanent Account Deletion (`/api/admin/delete-user`)**:
  - Admins can permanently remove user accounts and erase all associated AES-256-GCM encrypted portfolio data from MongoDB.
- **Decrypted Portfolio Inspection (`/api/admin/user-portfolio`)**:
  - Authorized Admins can inspect decrypted user stock holdings. The Watchlist section is conditionally rendered only when the inspected user actually has watchlist stocks.
- **Show/Hide Password UI Controls**:
  - Interactive password visibility toggles (`Eye` / `EyeOff` icons) are implemented across all password input fields (Login, Registration, Admin Account Creation, Direct Admin Reset, First-Time Passcode Update, Email OTP Passcode Update, and Broker API Secret inputs).

### 3. Automated Email Dispatch & OTP Verification (Nodemailer)
- **Email Credentials Dispatch**: Automated email notifications sent upon user creation and password overrides.
- **Voluntary Passcode Reset via Email OTP**: Users can request a 6-digit OTP code dispatched to their email address to update their passcode securely.

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
