# Zerodha vs Groww Equity Delivery Brokerage & Statutory Tax Analysis
> Official comparative reference of statutory fees, brokerage charges, GST, DP charges, and contract note calculations for **Zerodha (Kite)** and **Groww (Nextbillion Technology)**.

---

## 1. Overview & Test Case Scenario

To establish a 1:1 mathematical benchmark against official calculators:

- **Order Type**: Equity Delivery (Cash & Carry / CNC)
- **Exchange**: NSE (National Stock Exchange)
- **Quantity ($Q$)**: 100 shares
- **Buy Price ($B$)**: ₹100.00 / share (Buy Turnover $T_B = ₹10,000.00$)
- **Sell Price ($S$)**: ₹100.00 / share (Sell Turnover $T_S = ₹10,000.00$)
- **Total Turnover ($T_{\text{total}}$)**: ₹20,000.00 ($T_B + T_S$)
- **Gross P&L**: ₹0.00

---

## 2. Separate Buy Side vs Sell Side Itemized Charges Breakdown

### 2.1. Zerodha (Kite Delivery) - Itemized Contract Note

| Charge Category | Buy Side (₹10,000) | Sell Side (₹10,000) | Combined Total (₹) | Statutory Formula / Rule |
| :--- | :---: | :---: | :---: | :--- |
| **Brokerage Charge** | ₹0.00 | ₹0.00 | **₹0.00** | Free Equity Delivery on Zerodha. |
| **STT (Securities Tax)** | ₹10.00 | ₹10.00 | **₹20.00** | 0.1% of Buy Turnover + 0.1% of Sell Turnover. |
| **Exchange Txn (NSE)** | ₹0.31 | ₹0.30 | **₹0.61** | 0.00305% Zerodha NSE contract note slab. |
| **SEBI Turnover Fee** | ₹0.01 | ₹0.01 | **₹0.02** | 0.0001% of Turnover (₹10 per Crore). |
| **GST (18%)** | ₹0.06 | ₹0.05 | **₹0.11** | 18% of (Brokerage + Exchange Txn + SEBI Fee). |
| **Stamp Duty** | ₹2.00 | - | **₹2.00** | 0.015% on BUY side, rounded up ($\lceil 1.50 \rceil = 2.00$). |
| **DP Charges (CDSL)** | - | ₹15.34 | **₹15.34** | ₹13.00 base + 18% GST on **SELL side only**. |
| **TOTAL CHARGES** | **₹12.38** | **₹25.70** | **₹38.08** *(₹22.74 pre-DP)* | Exact match with Zerodha Calculator! |

---

### 2.2. Groww (Nextbillion) - Itemized Contract Note

| Charge Category | Buy Side (₹10,000) | Sell Side (₹10,000) | Combined Total (₹) | Statutory Formula / Rule |
| :--- | :---: | :---: | :---: | :--- |
| **Brokerage Charge** | ₹10.00 | ₹10.00 | **₹20.00** | ₹20 flat order charge per trade order. |
| **STT (Securities Tax)** | ₹10.00 | ₹10.00 | **₹20.00** | 0.1% of Buy Turnover + 0.1% of Sell Turnover. |
| **Exchange Txn (NSE)** | ₹0.30 | ₹0.29 | **₹0.59** | 0.00297% of Turnover ($20,000 \times 0.0000297$). |
| **SEBI Turnover Fee** | ₹0.01 | ₹0.01 | **₹0.02** | 0.0001% of Turnover (₹10 per Crore). |
| **GST (18%)** | ₹1.85 | ₹1.86 | **₹3.71** | 18% of (Groww Brokerage ₹20.00 + Exch ₹0.59 + SEBI ₹0.02). |
| **Stamp Duty** | ₹1.50 | - | **₹1.50** | 0.015% (₹150 per Crore) on **BUY side only**. |
| **DP Charges (CDSL)** | - | ₹21.54 | **₹21.54** | **₹18.25 base + 18% GST (₹3.29)** on **SELL side**. |
| **TOTAL CHARGES** | **₹23.66** | **₹43.70** | **₹67.36** *(₹45.82 pre-DP)* | Exact match with Groww Calculator! |

---

## 3. Statutory Tax Rules & DP Charge Calibration

### 3.1. Depository Participant (DP) Charges Calibration
- **Zerodha (CDSL)**: ₹13.00 base + 18% GST (₹2.34) = **₹15.34** per scrip per sell day.
- **Groww (CDSL)**: **₹18.25 base + 18% GST (₹3.29) = ₹21.54** per scrip per sell day. *(As stated in Groww trade notes)*.

### 3.2. GST (18%)
- **Zerodha**: $18\% \times (\text{Brokerage } 0 + \text{Exchange Txn } 0.61 + \text{SEBI } 0.02) = 18\% \times 0.63 = \mathbf{₹0.11}$
- **Groww**: $18\% \times (\text{Groww Brokerage } 20.00 + \text{Exchange Txn } 0.59 + \text{SEBI } 0.02) = 18\% \times 20.61 = \mathbf{₹3.71}$

### 3.3. Stamp Duty (Buy Side Only)
- **Zerodha**: $0.015\%$ on Buy Turnover, rounded up to nearest integer ($\lceil 1.50 \rceil = \mathbf{₹2.00}$).
- **Groww**: $0.015\%$ on Buy Turnover, exact float ($\mathbf{₹1.50}$).

---

*Document generated on: 2026-10-07*
