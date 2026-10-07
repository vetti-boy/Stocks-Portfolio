# Zerodha vs Groww Equity Delivery Brokerage & Statutory Tax Analysis
> Comprehensive comparative study of statutory fees, brokerage charges, tax regimes, and itemized Buy/Sell contract note calculations for **Zerodha (Kite)** and **Groww (Nextbillion Technology)**.

---

## 1. Overview & Test Case Scenario

To establish a 1:1 mathematical benchmark, the following standard order execution is used:

- **Order Type**: Equity Delivery (Cash & Carry / CNC)
- **Exchange**: NSE (National Stock Exchange)
- **Quantity ($Q$)**: 100 shares
- **Buy Price ($B$)**: ₹100.00 / share (Buy Turnover $T_B = ₹10,000.00$)
- **Sell Price ($S$)**: ₹100.00 / share (Sell Turnover $T_S = ₹10,000.00$)
- **Total Turnover ($T_{\text{total}}$)**: ₹20,000.00 ($T_B + T_S$)
- **Gross P&L**: ₹0.00

---

## 2. Separate Buy Side vs Sell Side Itemized Charges Breakdown

### 2.1. Zerodha (Kite Delivery) - Itemized Buy & Sell Breakdown

| Charge Category | Buy Side (₹10,000) | Sell Side (₹10,000) | Combined Total (₹) | Statutory Formula / Rule |
| :--- | :---: | :---: | :---: | :--- |
| **Brokerage Charge** | ₹0.00 | ₹0.00 | **₹0.00** | Free Equity Delivery on Zerodha. |
| **STT (Securities Tax)** | ₹10.00 | ₹10.00 | **₹20.00** | 0.1% of Buy Turnover + 0.1% of Sell Turnover. |
| **Exchange Txn (NSE)** | ₹0.30 | ₹0.30 | **₹0.60 / ₹0.61** | 0.00297% of Turnover ($10,000 \times 0.0000297$). |
| **SEBI Turnover Fee** | ₹0.01 | ₹0.01 | **₹0.02** | 0.0001% of Turnover (₹10 per Crore). |
| **GST (18%)** | ₹0.05 | ₹0.05 | **₹0.11** | 18% of (Brokerage + Exchange Txn + SEBI Fee). |
| **Stamp Duty** | ₹1.50 | - | **₹1.50 / ₹2.00** | 0.015% (₹150 per Crore) on **BUY side only**. |
| **DP Charges (CDSL)** | - | ₹15.34 | **₹15.34** | ₹13.00 + 18% GST on **SELL side only**. |
| **TOTAL CHARGES** | **₹11.86** | **₹25.70** | **₹37.56** *(₹22.74 pre-DP)* | Sum of all Buy & Sell statutory duties. |

---

### 2.2. Groww (Nextbillion) - Itemized Buy & Sell Breakdown

| Charge Category | Buy Side (₹10,000) | Sell Side (₹10,000) | Combined Total (₹) | Statutory Formula / Rule |
| :--- | :---: | :---: | :---: | :--- |
| **Brokerage Charge** | ₹5.00 | ₹5.00 | **₹10.00** *(or ₹20 max)* | $\min(0.05\% \times \text{Turnover}, ₹20)$ per order. |
| **STT (Securities Tax)** | ₹10.00 | ₹10.00 | **₹20.00** | 0.1% of Buy Turnover + 0.1% of Sell Turnover. |
| **Exchange Txn (NSE)** | ₹0.30 | ₹0.30 | **₹0.59 / ₹0.60** | 0.00297% of Turnover ($10,000 \times 0.0000297$). |
| **SEBI Turnover Fee** | ₹0.01 | ₹0.01 | **₹0.02** | 0.0001% of Turnover (₹10 per Crore). |
| **GST (18%)** | ₹0.96 | ₹0.96 | **₹1.91** *(or ₹3.71 max)*| 18% of (Brokerage + Exchange Txn + SEBI Fee). |
| **Stamp Duty** | ₹1.50 | - | **₹1.50** | 0.015% (₹150 per Crore) on **BUY side only**. |
| **DP Charges (CDSL)** | - | ₹15.93 | **₹15.93** | ₹13.50 + 18% GST on **SELL side only**. |
| **TOTAL CHARGES** | **₹17.77** | **₹32.20** | **₹49.96** *(₹45.82 flat)* | Sum of all Buy & Sell statutory duties. |

---

## 3. Statutory Tax Rules Summary

### 3.1. Buy-Side Specific Charges
- **Stamp Duty**: Charged exclusively on the **BUY order** ($0.015\% \times \text{Buy Turnover}$).

### 3.2. Sell-Side Specific Charges
- **DP Charge (Depository Participant)**: Charged by CDSL/NSDL exclusively when **selling shares** from demat account.
  - Zerodha: ₹13.00 + 18% GST = **₹15.34**
  - Groww: ₹13.50 + 18% GST = **₹15.93**

### 3.3. Both Sides (Buy & Sell) Charges
- **STT (Securities Transaction Tax)**: 0.1% on Buy value AND 0.1% on Sell value for Equity Delivery.
- **Exchange Transaction Fee**: 0.00297% for NSE, 0.00375% for BSE on both sides.
- **SEBI Fee**: 0.0001% (₹10 per Crore) on both sides.
- **GST (18%)**: 18% applied on (Brokerage + Exchange Txn + SEBI Fee) for both sides.

---

## 4. Codebase Reference Map

1. **`src/lib/brokerageCalculator.ts`**:
   - `calculateEquityDeliveryBrokerage()`: Pure calculation engine computing separate `totalBuyCharges` and `totalSellCharges`.
2. **`src/types/stock.ts`**:
   - `TaxSettings`: Configured exclusively for `'ZERODHA' | 'GROWW'`.
   - `CalculationResult`: Contains separate itemized Buy and Sell charge breakdown properties.
3. **`src/components/CalculatorTab.tsx`**:
   - Renders a 3-column Buy Side vs Sell Side contract note table for Zerodha & Groww.
4. **`src/components/PortfolioTab.tsx`**:
   - Renders itemized contract note trade receipts.

---

*Document generated on: 2026-10-07*
