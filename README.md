# TrustLoan Lite - Level 5 Stellar/Polygon MVP

A decentralized application (dApp) built to seamlessly evaluate user loan eligibility directly on-chain based on income and expenses without complex centralized intermediaries. 

This is the MVP (Minimum Viable Product) for Level 5 submission.

## 🚀 Live Demo & Links
- **Live dApp URL (Vercel)**: [https://trustloan-lite.vercel.app](https://trustloan-lite.vercel.app) *(Replace with actual URL)*
- **Demo Video**: [Link to Loom/YouTube Video]
- **Smart Contract Address**: [0xYourDeployedPolygonAmoyContractHere]
- **Explorer Link**: [Polygonscan Amoy Explorer Link]

## 🎭 UI/UX Design Theme
- **Theme**: Dark Aurora Glassmorphism
- **Features**: Animated deep space galaxy backgrounds, frosted glass cards (glassmorphism), neon pulsing glows, and floating blob animations. Built using pure vanilla CSS and functional React principles.

## 🛠 Tech Stack
- **Frontend**: React.js + Vite
- **Blockchain Interface**: Freighter API + Stellar SDK
- **Smart Contract Target**: Soroban (Rust)
- **Network**: Stellar Testnet
- **Deployment & Hosting**: Vercel

## 📖 Architecture Diagram

```mermaid
graph TD;
    User[📱 User (Frontend UI)] -->|Connects Wallet| Wallet[🦊 Freighter Wallet];
    User -->|Inputs Income & Expenses| UI[🖥️ React App (Vercel)];
    UI -->|Calls Soroban Contract| Node[🔗 Stellar Horizon Testnet];
    Node -->|Executes Verification| Contract[📜 Soroban Rust Contract];
    Contract -->|Calculates DTI| Logic{DTI < 0.4?};
    Logic -- Yes --> Approved[✅ Emit Event: APPROVED];
    Logic -- No --> Rejected[❌ Emit Event: REJECTED];
    Approved --> UI;
    Rejected --> UI;
    UI -->|Displays Result & Tx Hash| User;
```

## 📊 Deployment Commands

### Smart Contract Deployment
```bash
# Compile contracts
npx hardhat compile

# Deploy to Polygon Amoy
npx hardhat run scripts/deploy.cjs --network polygonAmoy
```

### Frontend Deployment
```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Build for production
npm run build
```

## 👥 Real User Feedback & Iteration
Following the core requirements of Level 5, we collected feedback from 5+ real testnet users using a Google form.

- **Google Form Responses**: [Link to Google Sheets/Excel]
- **Target Audience Tested**: Active Web3 testnet users / Discord community members.
- **Key Wallets Tested**:
  1. `0x123...abc`
  2. `0x456...def`
  3. `0x789...ghi`
  4. `0x012...jkl`
  5. `0x345...mno`

### 🔄 Mandatory Iteration
**Feedback received from users:** 
"The error messages were too confusing and didn't clearly state what was missing. It would be helpful to show a loading spinner when the transaction is waiting for confirmation in my wallet."

**Action Taken (Iteration #1):**
Implemented a dedicated `LOADING` state variable and a loading spinner inside the submit button using `lucide-react`. Clarified catch-block error handling to distinctively parse User Denied Transaction versus Contract Revert reasons.

- **Improvement Commit Link**: [Link to GitHub Commit showing loading integration]

---
*Created for the TrustLoan Decentralized Finance Suite.*
