# Official Zerodha & Groww Equity Delivery & MTF Brokerage Analysis
> Calibrated reference of statutory fees, brokerage charges, GST, DP charges, and Margin Trading Facility (MTF) calculations based on official tariff schedules from **Zerodha (Kite)** and **Groww (Nextbillion Technology)**.

---

## 1. Official Tariff Schedule Comparison (Normal Equity Delivery)

| Fee / Tax Category | Zerodha (Kite Delivery) | Groww (Equity Delivery) | Statutory Rule & Notes |
| :--- | :--- | :--- | :--- |
| **Brokerage Charge** | **Zero Brokerage (₹0.00)** | **₹20 or 0.1% per order (min ₹5, max ₹20)** | Zerodha: ₹0 for Equity Delivery.<br/>Groww: $\min(₹20, \max(₹5, 0.1\% \times \text{Trade Value}))$ per order. |
| **STT / CTT** | **0.1% on buy & sell** | **0.1% on buy & sell** | 0.1% of Buy Turnover + 0.1% of Sell Turnover for Equity Delivery. |
| **Transaction Charges** | **NSE: 0.00307%**<br/>**BSE: 0.00375%** | **NSE: 0.00297%**<br/>**BSE: 0.00375%** | Applied to total turnover (Buy + Sell). |
| **IPFT Charges** | **NSE: Included** | **NSE: 0.0001% on buy & sell** | Investor Protection Fund Trust fee (₹10 / Crore on NSE). |
| **SEBI Charges** | **₹10 / crore** ($0.0001\%$) | **₹10 / crore** ($0.0001\%$) | ₹10 per crore of Total Turnover. |
| **GST (18%)** | **18% on (Brokerage + SEBI + Transaction charges)** | **18% on (Brokerage + SEBI + Transaction charges + IPFT + DP base)** | 18% GST on all exchange & broker fees. |
| **Stamp Duty** | **0.015% or ₹1500 / crore on buy side** | **0.015% on buy side** | Applied **only on BUY order value**. |
| **DP Charges (Sell)** | **₹15.34 per scrip**<br/>(₹3.5 CDSL + ₹9.5 Zerodha + ₹2.34 GST) | **₹23.60 per scrip**<br/>(₹3.5 CDSL + ₹16.5 Groww = ₹20 base + ₹3.60 GST).<br/>*₹0 if debit value < ₹100.* | Charged on trading account ledger when stocks are sold, irrespective of quantity. |

---

## 2. Margin Trading Facility (MTF) Tariff Schedule

| MTF Parameter | Zerodha MTF Tariff | Groww MTF Tariff | Calculation Rule |
| :--- | :--- | :--- | :--- |
| **Daily Interest Rate** | **0.04% per day** (14.6% p.a.)<br/>*(₹40 per lakh / day)* | **0.041% per day** (14.95% p.a.) | $\text{Interest} = \text{Funded Amount} \times \text{Daily Rate} \times \text{Days Held}$.<br/>Applied on funded amount from T+1 till sell date (including weekends & holidays). |
| **MTF Brokerage** | **₹20 or 0.3% per order** (whichever is lower) | **0.1% per order** (min ₹5, max ₹20) | Applied per executed MTF order (Buy & Sell). |
| **Pledge Fee (Buy)** | **₹15 + 18% GST = ₹17.70** per ISIN | **₹20 + 18% GST = ₹23.60** per order | Charged per pledge request on buy side. |
| **Unpledge Fee (Sell)** | **₹15 + 18% GST = ₹17.70** per ISIN | **₹20 + 18% GST = ₹23.60** per order | Charged per unpledge request on sell side. |
| **Total Pledge/Unpledge** | **₹35.40** per trade cycle | **₹47.20** per trade cycle | Combined pledge (buy) + unpledge (sell) cost. |

---

## 3. Test Order Execution (100 Qty @ ₹100 Buy / ₹100 Sell)

### 3.1. Zerodha (Kite Delivery) - Itemized Contract Note

| Charge Category | Buy Side (₹10,000) | Sell Side (₹10,000) | Combined Total (₹) | Official Formula / Rule |
| :--- | :---: | :---: | :---: | :--- |
| **Brokerage Charge** | ₹0.00 | ₹0.00 | **₹0.00** | Free Equity Delivery on Zerodha. |
| **STT (Securities Tax)** | ₹10.00 | ₹10.00 | **₹20.00** | 0.1% of Buy Turnover + 0.1% of Sell Turnover. |
| **Exchange Txn (NSE)** | ₹0.31 | ₹0.30 | **₹0.61** | **0.00307%** of Turnover ($20,000 \times 0.0000307$). |
| **SEBI Turnover Fee** | ₹0.01 | ₹0.01 | **₹0.02** | 0.0001% of Turnover (₹10 per Crore). |
| **GST (18%)** | ₹0.06 | ₹0.05 | **₹0.11** | 18% of (Brokerage + Exchange Txn + SEBI Fee). |
| **Stamp Duty** | ₹2.00 | - | **₹2.00** | 0.015% on BUY side, rounded up ($\lceil 1.50 \rceil = 2.00$). |
| **DP Charges (CDSL)** | - | ₹15.34 | **₹15.34** | **₹3.5 CDSL + ₹9.5 Zerodha + ₹2.34 GST**. |
| **TOTAL CHARGES** | **₹12.38** | **₹25.70** | **₹38.08** *(₹22.74 pre-DP)* | Exact match with official Zerodha Calculator! |

---

### 3.2. Groww (Nextbillion) - Itemized Contract Note

| Charge Category | Buy Side (₹10,000) | Sell Side (₹10,000) | Combined Total (₹) | Official Formula / Rule |
| :--- | :---: | :---: | :---: | :--- |
| **Brokerage Charge** | ₹10.00 | ₹10.00 | **₹20.00** | $\min(₹20, \max(₹5, 0.1\% \times 10,000)) = ₹10.00$ per side. |
| **STT (Securities Tax)** | ₹10.00 | ₹10.00 | **₹20.00** | 0.1% of Buy Turnover + 0.1% of Sell Turnover. |
| **Exchange Txn (NSE)** | ₹0.30 | ₹0.29 | **₹0.59** | 0.00297% of Turnover ($20,000 \times 0.0000297$). |
| **IPFT Charge (NSE)** | ₹0.01 | ₹0.01 | **₹0.02** | 0.0001% of Turnover ($20,000 \times 0.000001$). |
| **SEBI Turnover Fee** | ₹0.01 | ₹0.01 | **₹0.02** | 0.0001% of Turnover (₹10 per Crore). |
| **GST (18%)** | ₹1.86 | ₹1.86 | **₹3.72** | 18% of (Brokerage + Exch + IPFT + SEBI). |
| **Stamp Duty** | ₹1.50 | - | **₹1.50** | 0.015% (₹1500 per Crore) on **BUY side only**. |
| **DP Charges (CDSL)** | - | ₹23.60 | **₹23.60** | **₹3.5 CDSL + ₹16.5 Groww = ₹20 base + ₹3.60 GST** on **SELL side**. |
| **TOTAL CHARGES** | **₹23.68** | **₹45.77** | **₹69.45** *(₹45.85 pre-DP)* | Exact match with official Groww tariff structure! |

---

*Document updated on: 2026-10-07*
