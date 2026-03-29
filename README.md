# TrustLoan Lite 🌟

A decentralized financial application generating on-chain verified Debt-to-Income (DTI) ratings, leveraging the speed and transparency of the **Stellar Network**.

## Live Links
- **Live Demo Site**: `[Insert your deployed Vercel/Netlify link here]`
- **Demo Video**: `[Insert YouTube/Loom demo video link here]`
- **User Feedback Excel Sheet**: `[Insert Google Sheets link here]`
- **User Google Form (For testing)**: `[Insert Form Link]`

---

## 🚀 Features
- **Real-Time Freighter Integration:** Features background polling to identify account switches or lockouts securely without page refreshes.
- **DTI Verification:** Instantly calculates DTI metrics and determines approval likelihood dynamically. 
- **Immutable Ledger Logging:** Submits mathematically verified results via Stellar transaction Memos. 
- **Verifiable Block Explorer Links:** Each transaction is logged dynamically to `stellar.expert`.
- **In-Session Dashboard:** Logs personal checks in real time.

---

## 🛠️ Usage / Local Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo>
   cd trustloan-lite
   ```
2. **Install modules:**
   ```bash
   npm install
   ```
3. **Run Dev server:**
   ```bash
   npm run dev
   ```
4. **Prerequisites:** Please ensure you have the **Freighter Browser Extension** installed, unlocked, and connected to the **Testnet**.

---

## 👥 Real-World MVP Validations
Currently, TrustLoan Lite has been tested by the following real `Stellar Testnet` users:
1. `[WALLET_ADDRESS_1]`
2. `[WALLET_ADDRESS_2]`
3. `[WALLET_ADDRESS_3]`
4. `[WALLET_ADDRESS_4]`
5. `[WALLET_ADDRESS_5]`

### Ongoing User Feedback
*All responses from our early testnet users are exported from Google Forms and actively tracked on our attached Excel Sheet at the top of this document.*

### Future Improvements (Post-Iteration Plan)
Based on current user feedback and platform analysis, our next major technical updates include:
- Refactoring `DTI` metrics to dynamically capture real network balances via `horizon.stellar.org`.
- *Commit tracking improvement:* `[Link to future git commit here]`
