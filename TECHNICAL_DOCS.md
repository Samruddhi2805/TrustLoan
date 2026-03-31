# TrustLoan Lite — Technical Documentation & User Guide

> **Version:** Black Belt (Level 6) | **Network:** Stellar Testnet | **Updated:** March 2026

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Advanced Feature: Fee Sponsorship (Gasless Transactions)](#2-advanced-feature-fee-sponsorship-gasless-transactions)
3. [On-Chain Data Indexer](#3-on-chain-data-indexer)
4. [Platform Metrics & Monitoring](#4-platform-metrics--monitoring)
5. [Financial Logic Specification](#5-financial-logic-specification)
6. [Component Reference](#6-component-reference)
7. [User Guide](#7-user-guide)
8. [Production Deployment Notes](#8-production-deployment-notes)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Vite + React)                   │
│                       trust-loan-coral.vercel.app                 │
│                                                                   │
│  ┌───────────┐   ┌────────────┐   ┌──────────────┐              │
│  │  FormCard  │   │ ResultCard │   │  Dashboard   │              │
│  │(DTI Inputs)│   │(Result +  │   │(Metrics +    │              │
│  │+ FeeBump   │   │ Tx Hash)  │   │ Indexer)     │              │
│  └─────┬──────┘   └────┬──────┘   └──────┬───────┘              │
│        │               │                  │                       │
│  ┌─────▼──────────────────────────────────▼───────┐              │
│  │                   App.jsx                       │              │
│  │  - DTI/EMI calculations                         │              │
│  │  - Freighter wallet integration                  │              │
│  │  - Fee Bump (gasless) transaction builder        │              │
│  │  - Active user counter (CounterAPI)              │              │
│  └──────────┬──────────────┬───────────────────────┘              │
└─────────────┼──────────────┼───────────────────────────────────┘
              │              │
    ┌─────────▼──────┐  ┌───▼──────────────────────────────────┐
    │  Freighter     │  │       Stellar Testnet Network          │
    │  Extension     │  │                                        │
    │  (User Signs   │  │  horizon-testnet.stellar.org           │
    │  Inner TX)     │  │  - Account info                        │
    └─────────┬──────┘  │  - Transaction submission              │
              │          │  - Payment history (indexer)           │
    ┌─────────▼──────┐  └────────────────────────────────────────┘
    │  Fee Sponsor   │
    │  Keypair       │
    │  (Signs outer  │
    │  Fee Bump TX)  │
    └────────────────┘
```

---

## 2. Advanced Feature: Fee Sponsorship (Gasless Transactions)

### What is it?

TrustLoan Lite implements **Stellar Fee Bump Transactions** (specified in [CAP-0015](https://github.com/stellar/stellar-protocol/blob/master/core/cap-0015.md)).

A **Fee Bump** allows a third party (the "sponsor" or fee source) to pay the network transaction fees on behalf of the end user. This makes TrustLoan Lite effectively **gasless** — users can check their DTI on-chain without spending any XLM.

### How It Works (Step by Step)

```
User fills form → App builds Inner Transaction (DTI check)
                                  ↓
         User signs Inner TX via Freighter (no fee paid yet)
                                  ↓
     Platform wraps it: buildFeeBumpTransaction(sponsor, '1000 stroops', innerTx)
                                  ↓
              Sponsor Keypair signs the outer Fee Bump envelope
                                  ↓
          Stellar Network receives Fee Bump Tx → records both
          Inner TX hash is logged in the DTI stats dashboard
```

### Code Location

```javascript
// App.jsx — inside prepareStellarTransaction()
if (useFeeBump && FEE_SPONSOR_KEYPAIR) {
  const feeBumpTx = TransactionBuilder.buildFeeBumpTransaction(
    FEE_SPONSOR_KEYPAIR,
    '1000',         // 1000 stroops fee paid by sponsor
    signedInnerTx,
    Networks.TESTNET
  );
  feeBumpTx.sign(FEE_SPONSOR_KEYPAIR);
  txToSubmit = feeBumpTx;
  gasless = true;
}
```

### Production Architecture (Recommended)

In production, the sponsor secret must **never** be in the frontend. The recommended architecture:

```
User's Browser ──[Signed Inner TX XDR]──► Signing API (Lambda / CF Worker)
                                                   │
                                         [Wraps in Fee Bump]
                                         [Signs with server-held secret]
                                                   │
                                         [Returns Fee Bump XDR]
                                                   │
User's Browser ◄────────────────────────[Submits to Horizon]
```

---

## 3. On-Chain Data Indexer

### Approach

The Dashboard's **On-Chain Data Indexer** reverse-engineers the blockchain to surface a user's historical DTI checks directly from the Stellar Ledger — no centralized database required.

**Endpoint Used:**
```
GET https://horizon-testnet.stellar.org/accounts/{publicKey}/payments?limit=50&order=desc
```

**Algorithm:**
1. Fetch the user's 50 most recent payment operations from Horizon.
2. For each payment, resolve its parent transaction via `_links.transaction.href`.
3. Filter transactions where `memo_type = "text"` and `memo` starts with `"DTI:"`.
4. Parse the memo format: `DTI:<value>%|<STATUS>`.
5. Display the verified data in a readable table with a live explorer link.

**Data Format (Memo):**
```
DTI:43.2%|APPROVE
DTI:71.8%|REJECT
DTI:61.5%|CONDITIONAL
```

This indexer provides **trustless, verifiable proof** of every eligibility check — no backend, no database.

---

## 4. Platform Metrics & Monitoring

### Active User Metric
- **Provider:** [CounterAPI](https://counterapi.dev/)
- **Endpoint:** `https://api.counterapi.dev/v1/trustloan_lite/active_users_v2`
- **Deduplication:** localStorage deduplications per device — each unique wallet address is only counted once per browser.
- **Polling:** App polls every 10 seconds for live count updates.

### Metrics Dashboard (In-App)
| Metric | Source |
|--------|--------|
| Total Active Users | CounterAPI shared counter |
| Platform Transactions | Derived: `activeUsers * 3 + 12` (based on avg 3 checks per user) |
| 30-Day Retention Rate | Tracked via user feedback form + Google Sheets |
| Per-Session Avg DTI | Computed from `history` state in-app |
| Per-Session Approval Rate | Computed from `history` state in-app |

### Monitoring Approach
- All Stellar transactions are publicly verifiable at `stellar.expert/explorer/testnet`
- Horizon API responses are monitored via try/catch; failures surface in the browser console
- Vercel analytics dashboard provides uptime and performance monitoring for the frontend

---

## 5. Financial Logic Specification

### EMI Calculation
Standard reducing balance EMI formula:

```
EMI = [P × r × (1+r)^n] / [(1+r)^n – 1]

Where:
  P = Loan Principal
  r = Monthly Interest Rate = Annual Rate / 12 / 100
  n = Loan Tenure in Months
```

### DTI (Debt-to-Income) Calculation
```
DTI = (Existing EMIs + New EMI) / Monthly Income
```

### Disposable Income Percentage
```
Disposable% = (Income – Existing EMIs – New EMI) / Income × 100
```

### 3-Tier Eligibility Decision Tree
```
IF NewEMI > Income           → REJECT (EMI_EXCEEDS_INCOME)
ELSE IF DTI ≤ 55% AND Disp% ≥ 20%  → APPROVE
ELSE IF DTI ≤ 70% AND Disp% ≥ 15%  → CONDITIONAL
ELSE                         → REJECT
```

---

## 6. Component Reference

| Component | File | Props | Purpose |
|-----------|------|-------|---------|
| `App` | `App.jsx` | — | Root state management: wallet, history, fee bump, user count |
| `Navbar` | `Navbar.jsx` | `account, connectWallet, disconnectWallet, activeUserCount` | Top navigation with live user badge |
| `FormCard` | `FormCard.jsx` | `formData, handleInputChange, checkEligibility, loading, useFeeBump, setUseFeeBump, sponsorAddress` | Loan eligibility form with real-time preview |
| `ResultCard` | `ResultCard.jsx` | `result` | Post-submission result with breakdown and Stellar TX link |
| `Dashboard` | `Dashboard.jsx` | `account, history, activeUserCount` | Global metrics, session stats, on-chain indexer |
| `FeeBumpBadge` | `FeeBumpBadge.jsx` | `isActive, sponsorAddress` | Indicates gasless mode is active; expandable with sponsor info |

---

## 7. User Guide

### Prerequisites
- **Desktop browser** (Chrome, Brave, Edge, Firefox)
- **Freighter Wallet Extension** installed: [freighter.app](https://freighter.app)
- Freighter connected to **Testnet** (Settings → Network → Testnet)
- Any amount of Testnet XLM (get free at [laboratory.stellar.org/account-creator](https://laboratory.stellar.org/account-creator))

### Step-by-Step Usage

**Step 1: Connect Wallet**
1. Open [trust-loan-coral.vercel.app](https://trust-loan-coral.vercel.app)
2. Click **"Connect Wallet to Begin"**
3. Freighter will prompt you to authorize TrustLoan Lite — click **Grant Access**

**Step 2: Fill in Your Financial Details**
| Field | Description |
|-------|-------------|
| Monthly Income (₹) | Your total take-home monthly salary |
| Existing EMIs (₹) | Total of all current loan payments (0 if none) |
| Monthly Expenses (₹) | Rent, food, bills etc. (informational — not in DTI) |
| Loan Amount (₹) | The amount you want to borrow |
| Interest Rate (%) | Annual interest rate (default 12%) |
| Tenure (Months) | How long to repay (default 12 months) |

**Step 3: Review Live Preview**
As you type, a **Live Preview** panel shows your estimated EMI, DTI ratio, and disposable income in real time with color-coded thresholds.

**Step 4: Check Eligibility**
1. Click **"Check Eligibility"**
2. Freighter will pop up asking you to sign your DTI transaction — click **Approve**
3. The platform wraps it in a Fee Bump envelope (you pay zero fees!)
4. The result appears immediately with a full breakdown

**Step 5: View on Blockchain**
Click **"View on Stellar Explorer"** to verify your DTI check transaction immutably on the Stellar Testnet blockchain.

---

## 8. Production Deployment Notes

### Current Deployment
- **Platform:** Vercel (Automatic deploys from `main` branch)
- **URL:** [trust-loan-coral.vercel.app](https://trust-loan-coral.vercel.app)
- **Build Command:** `npm run build`
- **Output Dir:** `dist`

### Environment Variables (for production)
```bash
# Do NOT store sponsor secret in frontend for production
# Use a signing API instead (see Section 2)
VITE_HORIZON_URL=https://horizon-testnet.stellar.org
VITE_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
```

### Community Contribution
- Twitter post about TrustLoan Lite: [Link to post]
- Post includes live demo link, key features, and a call for testnet users to try the app
