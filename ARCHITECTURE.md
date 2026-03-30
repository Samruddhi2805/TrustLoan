# TrustLoan Lite - Architecture Document

## Overview

TrustLoan Lite is a decentralized web application (dApp) built on the **Stellar Testnet** that transparently calculates Debt-to-Income (DTI) ratios and verifies loan eligibility on-chain. It uses a **Soroban smart contract** for trustless eligibility checks and the **Freighter Wallet** browser extension for user authentication and transaction signing.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React.js (Vite) |
| Styling | Tailwind CSS + Custom Glassmorphism CSS |
| Blockchain Network | Stellar Testnet |
| Smart Contract | Soroban (Rust / WASM) |
| Wallet Integration | Freighter Browser Extension |
| Stellar SDK | `@stellar/stellar-sdk` |
| Deployment | Vercel (Frontend) |

---

## Project Structure

```
trustloan-lite/
├── contract/
│   └── contracts/
│       ├── Cargo.toml               # Rust package manifest
│       └── src/
│           └── lib.rs               # Soroban smart contract logic
├── frontend/
│   ├── index.html                   # App entry point
│   ├── vite.config.js               # Vite build config
│   ├── tailwind.config.js           # Tailwind CSS config
│   ├── package.json
│   ├── jsconfig.json
│   └── src/
│       ├── main.jsx                 # React root mount
│       ├── App.jsx                  # State container & orchestrator
│       ├── index.css                # Global styles & design tokens
│       └── components/
│           ├── Navbar.jsx           # Branding + wallet connection UI
│           ├── FormCard.jsx         # Loan input form
│           ├── ResultCard.jsx       # Eligibility result + tx proof
│           └── Dashboard.jsx        # Session analytics & history
├── ARCHITECTURE.md                  # This file
└── README.md                        # Project overview & setup guide
```

---

## Core Architecture Flow

```
User (Browser)
      │
      ▼
┌─────────────┐       Freighter Extension
│  React App  │ ◄────────────────────────┐
│  (Vercel)   │                          │
│             │  1. Connect Wallet        │
│  Navbar.jsx │ ─────────────────────────►
│             │  2. Sign Transaction      │
│  FormCard   │ ─────────────────────────►
│   .jsx      │                          │
│             │                          │
│  ResultCard │                          │
│   .jsx      │                          │
└──────┬──────┘
       │
       │  3. Submit to Stellar SDK
       ▼
┌──────────────────┐
│  Stellar Testnet │
│  (Horizon API)   │
│                  │
│  Soroban Smart   │
│  Contract        │
│  (Rust / WASM)   │
│                  │
│  check_eligibility()
│  - DTI < 40%  → APPROVED
│  - DTI 40-50% → REJECTED (high debt)
│  - DTI > 50%  → DTI_TOO_HIGH
└──────────────────┘
       │
       │  4. Return Result + Tx Hash
       ▼
  User sees result on ResultCard
  (with Stellar Explorer link)
```

---

## Smart Contract Logic (`lib.rs`)

The Soroban contract exposes the following functions:

| Function | Description |
|---|---|
| `check_eligibility(user, income, expenses, loan_amount)` | Calculates DTI, stores result on-chain, emits event |
| `get_user_history(user)` | Returns all past results for a given wallet address |
| `get_all_history()` | Returns all results stored on the contract |
| `calculate_dti(income, expenses)` | Helper to compute DTI ratio (scaled by 10000) |
| `version()` | Returns contract version number |

### DTI Calculation

```
DTI (scaled) = (expenses × 10000) / income

Decision Rules:
- DTI < 4000  (< 40%)  → ✅ APPROVED
- DTI ≤ 5000  (40–50%) → ❌ REJECTED - "We couldn't approve your request. Your current debt obligations are relatively high."
- DTI > 5000  (> 50%)  → ❌ REJECTED - "DTI_TOO_HIGH"
```

---

## Wallet & Transaction Flow

1. User clicks **"Connect Wallet"** → Freighter extension is detected via `window.freighter`.
2. App requests public key via `getPublicKey()`.
3. User fills in income, expenses, and loan amount, then clicks **"Check Eligibility"**.
4. App builds a Stellar transaction invoking the Soroban contract's `check_eligibility` function.
5. Transaction is signed via `signTransaction()` in the Freighter extension.
6. Signed transaction is submitted to the **Stellar Testnet Horizon API**.
7. Result (Approved / Rejected) and the **Transaction Hash** are displayed on the `ResultCard`.
8. User can verify the transaction on **[Stellar Expert Explorer](https://stellar.expert/explorer/testnet)**.

---

## Deployment

| Resource | Link |
|---|---|
| Live Frontend | https://trust-loan-coral.vercel.app |
| GitHub Repository | https://github.com/Samruddhi2805/TrustLoan |
| Stellar Network | Testnet |

---

## Known Constraints

- **Mobile support**: Freighter is a desktop browser extension only. The DApp does not support mobile browsers.
- **Account funding**: New Stellar testnet accounts must be funded via Friendbot before they can interact with the contract (avoids 404 errors from Horizon).
- **Network**: The contract is deployed on **Stellar Testnet** only.
