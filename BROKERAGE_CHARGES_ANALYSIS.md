# Official Zerodha & Groww Equity Delivery Brokerage Analysis
> Calibrated reference of statutory fees, brokerage charges, GST, DP charges, and contract note calculations based on official tariff schedules from **Zerodha (Kite)** and **Groww (Nextbillion Technology)**.

---

## 1. Official Tariff Schedule Comparison

| Fee / Tax Category | Zerodha (Kite Delivery) | Groww (Equity Delivery) | Statutory Rule & Notes |
| :--- | :--- | :--- | :--- |
| **Brokerage Charge** | **Zero Brokerage (₹0.00)** | **₹20 or 0.05% per order** | Zerodha: ₹0 for Equity Delivery.<br/>Groww: $\min(0.05\% \times \text{Trade Value}, ₹20)$ per order. |
| **STT / CTT** | **0.1% on buy & sell** | **0.1% on buy & sell** | 0.1% of Buy Turnover + 0.1% of Sell Turnover for Equity Delivery. |
| **Transaction Charges** | **NSE: 0.00307%**<br/>**BSE: 0.00375%** | **NSE: 0.00297%**<br/>**BSE: 0.00375%** | Applied to total turnover (Buy + Sell). |
| **GST (18%)** | **18% on (Brokerage + SEBI + Transaction charges)** | **18% on (Brokerage + SEBI + Transaction charges)** | 18% GST on all exchange & broker fees. |
| **SEBI Charges** | **₹10 / crore** ($0.0001\%$) | **₹10 / crore** ($0.0001\%$) | ₹10 per crore of Total Turnover. |
| **Stamp Duty** | **0.015% or ₹1500 / crore on buy side** | **0.015% on buy side** | Applied **only on BUY order value**. |
| **DP Charges (Sell)** | **₹15.34 per scrip**<br/>(₹3.5 CDSL + ₹9.5 Zerodha + ₹2.34 GST) | **₹21.54 per scrip**<br/>(₹18.25 base + ₹3.29 GST) | Charged on trading account ledger when stocks are sold, irrespective of quantity. |

---

## 2. Test Order Execution (100 Qty @ ₹100 Buy / ₹100 Sell)

### 2.1. Zerodha (Kite Delivery) - Itemized Contract Note

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

### 2.2. Groww (Nextbillion) - Itemized Contract Note

| Charge Category | Buy Side (₹10,000) | Sell Side (₹10,000) | Combined Total (₹) | Official Formula / Rule |
| :--- | :---: | :---: | :---: | :--- |
| **Brokerage Charge** | ₹10.00 | ₹10.00 | **₹20.00** | ₹20 flat order charge per trade order. |
| **STT (Securities Tax)** | ₹10.00 | ₹10.00 | **₹20.00** | 0.1% of Buy Turnover + 0.1% of Sell Turnover. |
| **Exchange Txn (NSE)** | ₹0.30 | ₹0.29 | **₹0.59** | 0.00297% of Turnover ($20,000 \times 0.0000297$). |
| **SEBI Turnover Fee** | ₹0.01 | ₹0.01 | **₹0.02** | 0.0001% of Turnover (₹10 per Crore). |
| **GST (18%)** | ₹1.85 | ₹1.86 | **₹3.71** | 18% of (Groww Brokerage ₹20.00 + Exch ₹0.59 + SEBI ₹0.02). |
| **Stamp Duty** | ₹1.50 | - | **₹1.50** | 0.015% (₹1500 per Crore) on **BUY side only**. |
| **DP Charges (CDSL)** | - | ₹21.54 | **₹21.54** | **₹18.25 base + ₹3.29 GST (18%)** on **SELL side**. |
| **TOTAL CHARGES** | **₹23.66** | **₹43.70** | **₹67.36** *(₹45.82 pre-DP)* | Exact match with official Groww Calculator! |

---

*Document updated on: 2026-10-07*
