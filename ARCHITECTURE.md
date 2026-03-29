# TrustLoan Lite - Architecture Document

## Overview
TrustLoan Lite is a decentralized web application (dApp) built to seamlessly calculate Debt-to-Income (DTI) metrics and verify loan eligibility transparently on the **Stellar Testnet**. The project's architecture leverages a React-based frontend dynamically connected to the Stellar network using the Freighter Wallet extension.

## Tech Stack
-   **Frontend:** React.js (Vite), Tailwind CSS (Dark Aurora Glassmorphism)
-   **Icons:** Lucide-React
-   **Wallet Integration:** `@stellar/freighter-api` (V6)
-   **Network SDK:** `@stellar/stellar-sdk`

## Core Architecture Flow

1.  **Frontend Render (React.js)**
    - Built using functional components structured across `/src/components`. Features modern glassmorphism UI tailored for high user retention.
2.  **Wallet Management (Freighter API)**
    - Uses a non-blocking background polling mechanism (`getAddress` & `isAllowed`) running on a `1.5s` reactive interval. Handles user connection, real-time address switching, and secure disconnections without manual page refreshes.
3.  **Data Processing & Algorithm**
    - The DTI calculation executes client-side to ensure zero latency:
      `DTI = (Monthly Expenses + (Desired Loan / Repayment Period)) / Monthly Income`
    - Threshold logic triggers an immediate `APPROVED` (<0.4 DTI) or `REJECTED` state alongside designated reason codes.
4.  **On-Chain Verification (Stellar SDK)**
    - Instead of just returning UI feedback, the app builds a `TransactionBuilder` payload consisting of a microscopic `0.0000001 XLM` self-payment explicitly to imprint an **immutable Memo field**.
    - The memo encodes the evaluation (`DTI:X.XX|APP/REJ|REASON`).
    - The transaction is securely passed to the user's Freighter extension for decentralized signing via `signTransaction()`.
    - Once submitted to the `Horizon Testnet`, the React state updates dynamically, logging a persistent Transaction Hash and providing a verified testnet block explorer link to the user.

## Component Structure
-   `App.jsx`: State container, orchestrator, and Ledger integration handler.
-   `Navbar.jsx`: Branding and precise wallet state UI.
-   `FormCard.jsx`: Intuitive data capture module.
-   `ResultCard.jsx`: Feedback screen rendering the final decision and transaction proofs.
-   `Dashboard.jsx`: Session analytics summarizing past interactions.
