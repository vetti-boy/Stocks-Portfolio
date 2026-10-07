# Indian Stock Market Equity Delivery Brokerage & Tax Analysis
> Comprehensive comparative study of statutory fees, brokerage charges, tax regimes, and contract note calculations for **Zerodha (Kite)** and **Groww (Nextbillion Technology)**.

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

## 2. Zerodha vs Groww Detailed Itemized Breakdown

### Comparison Table (Qty 100 @ ₹100 Buy / ₹100 Sell)

| Fee / Tax Parameter | Zerodha (Kite) | Groww (Nextbillion) | Statutory Rate / Formula |
| :--- | :---: | :---: | :--- |
| **Brokerage Charge** | **₹0.00** | **₹20.00** | Zerodha: ₹0 for Delivery.<br/>Groww: $\min(0.05\% \times \text{Order Value}, ₹20)$ per trade. |
| **STT (Securities Transaction Tax)** | **₹20.00** | **₹20.00** | $0.1\%$ on Buy Turnover + $0.1\%$ on Sell Turnover ($10,000 \times 0.001 + 10,000 \times 0.001$). |
| **Exchange Txn Charge (NSE)** | **₹0.61** | **₹0.59** | $0.00297\%$ of Total Turnover ($\text{Turnover} \times 0.0000297$). |
| **SEBI Turnover Fee** | **₹0.02** | **₹0.02** | $0.0001\%$ of Total Turnover (₹10 per Crore). |
| **GST (Goods & Services Tax)** | **₹0.11** | **₹3.71** | $18\%$ on $(\text{Brokerage} + \text{Exchange Txn Charge} + \text{SEBI Fee})$. |
| **Stamp Duty (State)** | **₹2.00** | **₹1.50** | $0.015\%$ (₹150 per Crore) on **BUY side turnover only**. |
| **DP Charges (Depository Participant)**| **₹15.34** | **₹15.93** | Applied once per scrip on sell transactions.<br/>Zerodha: ₹13 + 18% GST = ₹15.34<br/>Groww: ₹13.50 + 18% GST = ₹15.93 |
| **Total Statutory Tax & Charges** | **₹22.74** | **₹45.82** | $\sum \text{Brokerage} + \text{STT} + \text{Exchange} + \text{SEBI} + \text{GST} + \text{Stamp Duty}$ |
| **Points to Breakeven** | **₹0.23 / share** | **₹0.46 / share** | $\text{Total Charges} / \text{Quantity}$ |
| **Net P&L (Post Charges)** | **-₹22.74** | **-₹45.82** | $\text{Gross Profit} - \text{Total Charges}$ |

---

## 3. Statutory Tax Formulas & SEBI Guidelines

### 3.1. Brokerage
- **Zerodha**: ₹0 (Free for Equity Delivery buy and sell orders).
- **Groww**: Lower of 0.05% of trade value or ₹20 per executed order.
- **Upstox**: Lower of 0.05% of trade value or ₹20 per executed order.
- **Angel One**: ₹0 for Equity Delivery orders.
- **ICICI Direct**: 0.55% for Direct Prime Equity Delivery.

### 3.2. STT (Securities Transaction Tax)
- **Equity Delivery**: 0.1% on Buy value **and** 0.1% on Sell value.
- **Equity Intraday**: 0.025% on Sell value only.

$$\text{STT}_{\text{total}} = (T_B \times 0.001) + (T_S \times 0.001)$$

### 3.3. Exchange Transaction Charges
- **NSE**: 0.00297% of Total Turnover ($T_{\text{total}} \times 0.0000297$).
- **BSE**: 0.00375% of Total Turnover ($T_{\text{total}} \times 0.0000375$).

### 3.4. SEBI Turnover Charge
- **All Segments**: ₹10 per crore = 0.0001% of Total Turnover ($T_{\text{total}} \times 0.000001$).

### 3.5. Stamp Duty
- **Equity Delivery**: 0.015% (₹150 per crore) on **BUY side value only**.

$$\text{Stamp Duty} = T_B \times 0.00015$$

### 3.6. GST (Goods and Services Tax)
- Standard 18% GST applied to financial services:

$$\text{GST} = 18\% \times (\text{Total Brokerage} + \text{Exchange Txn Charge} + \text{SEBI Fee})$$

### 3.7. Depository Participant (DP) Charges
- Charged by the Depository Participant (CDSL / NSDL) **only when selling shares** from demat account:
- **Zerodha (CDSL)**: ₹13.00 + 18% GST = **₹15.34** per scrip per day.
- **Groww (CDSL)**: ₹13.50 + 18% GST = **₹15.93** per scrip per day.
- **Upstox (CDSL)**: ₹18.50 + 18% GST = **₹21.83** per scrip per day.
- **Angel One (CDSL)**: ₹20.00 + 18% GST = **₹23.60** per scrip per day.

### 3.8. Points to Breakeven
- Minimum price increase required per share to avoid a net loss:

$$\text{Breakeven (₹/share)} = \frac{\text{Total Statutory Tax \& Charges}}{\text{Quantity}}$$

---

## 4. Codebase Reference Map

The calculations documented in this analysis are implemented across the following files in the project:

1. **`src/lib/brokerageCalculator.ts`**:
   - `calculateEquityDeliveryBrokerage()`: Pure calculation engine for Zerodha, Groww, Upstox, Angel One, and Custom tariffs.
2. **`src/types/stock.ts`**:
   - `TaxSettings`: Configurable tariff parameters (`brokerPreset`, `exchange`, `flatBrokerageBuy`, `flatBrokerageSell`, `brokeragePercent`, `sttPercent`, `stampDutyPercent`, `gstPercent`, `flatDpCharges`).
   - `CalculationResult`: Itemized contract note data structure.
3. **`src/components/CalculatorTab.tsx`**:
   - Forward & Reverse target selling price calculator UI with live contract note preview matching official Zerodha/Groww layouts.
4. **`src/components/PortfolioTab.tsx`**:
   - Realized & unrealized P&L contract note receipt modal for executed trades.

---

*Document generated on: 2026-10-07*
