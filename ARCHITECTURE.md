# TrustLoan Lite - Architecture Documentation

## 🏗️ System Architecture

### High-Level Overview
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   MetaMask       │    │  Smart Contract │    │   Blockchain    │
│   (React/Vite)  │◄──►│   Wallet         │◄──►│   (Polygon)     │◄──►│   (Testnet)     │
│                 │    │                  │    │                 │    │                 │
│ • UI/UX         │    │ • Connection     │    │ • DTI Logic     │    │ • Transactions  │
│ • Form Input    │    │ • Signing        │    │ • Events        │    │ • Storage       │
│ • Results       │    │ • Provider       │    │ • Validation    │    │ • Hash          │
└─────────────────┘    └──────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Flow
1. **User Interaction** → Frontend captures financial data
2. **Wallet Connection** → MetaMask provides signer & provider
3. **Contract Call** → Frontend calls smart contract via ethers.js
4. **Transaction** → Contract executes DTI calculation
5. **Event Emission** → Contract emits EligibilityChecked event
6. **Result Display** → Frontend shows result + transaction hash

## 🧩 Smart Contract Architecture

### Contract Structure
```solidity
contract TrustLoanLite {
    // Events
    event EligibilityChecked(address user, uint256 income, uint256 expenses, 
                            uint256 loanAmount, bool approved, string reason);
    
    // Storage
    mapping(address => EligibilityResult) public eligibilityHistory;
    
    // Functions
    function checkEligibility(uint256 _income, uint256 _expenses, uint256 _loanAmount) public;
    function getEligibility(address _user) public view returns (EligibilityResult);
    function calculateDTI(uint256 _income, uint256 _expenses) public pure returns (uint256);
}
```

### DTI Calculation Logic
```
DTI = expenses / income
if DTI < 0.4 (40%) → APPROVED
else → REJECTED with "DTI_TOO_HIGH" reason
```

### Data Flow
1. Input validation (income > 0, expenses >= 0, loanAmount > 0)
2. DTI calculation with 18 decimal precision
3. Eligibility determination
4. Result storage in mapping
5. Event emission with all parameters

## 🎨 Frontend Architecture

### Component Hierarchy
```
App
├── AuroraBackground
├── Navigation
│   ├── Logo
│   └── WalletInfo
├── HeroCard (when disconnected)
│   ├── Title
│   ├── Subtitle
│   └── ConnectButton
└── FormCard (when connected)
    ├── InputFields
    │   ├── Income
    │   ├── Expenses
    │   └── LoanAmount
    ├── CheckButton
    └── ResultCard
        ├── Status (APPROVED/REJECTED)
        ├── Reason
        ├── DTI Ratio
        └── Transaction Hash
```

### State Management
```javascript
const [account, setAccount] = useState(null);           // Wallet address
const [provider, setProvider] = useState(null);         // Ethers provider
const [contract, setContract] = useState(null);         // Contract instance
const [loading, setLoading] = useState(false);          // Loading state
const [result, setResult] = useState(null);             // Eligibility result
const [formData, setFormData] = useState({              // Form data
  income: '',
  expenses: '',
  loanAmount: ''
});
```

### Key Functions
- `checkIfWalletIsConnected()` - Auto-connect on load
- `connectWallet()` - MetaMask connection
- `handleInputChange()` - Form data management
- `checkEligibility()` - Contract interaction
- `formatAddress()` - Address display formatting

## 🔗 Wallet Integration

### MetaMask Connection Flow
1. Check if `window.ethereum` exists
2. Request account access
3. Create ethers provider and signer
4. Instantiate contract with signer
5. Update UI state

### Transaction Flow
1. Convert user input to wei (18 decimals)
2. Call `contract.checkEligibility()`
3. Wait for transaction confirmation
4. Parse transaction receipt for events
5. Extract and display results

## 🎨 UI/UX Design System

### Design Tokens
```css
--bg-primary: #060612;
--bg-card: rgba(6, 6, 18, 0.7);
--accent-teal: #0ff4c6;
--accent-violet: #7b2ff7;
--accent-pink: #f72585;
--accent-cyan: #4cc9f0;
```

### Glassmorphism Effects
- `backdrop-filter: blur(20px)`
- `background: rgba(6, 6, 18, 0.7)`
- `border: 1px solid rgba(255, 255, 255, 0.1)`

### Animations
- Aurora blobs: 20s floating animation
- Status dot: 2s pulse effect
- Button hover: Transform + glow effects
- Loading spinner: 1s rotation

## 📊 Data Flow Diagram

```
User Input (Income: $5000, Expenses: $1500, Loan: $10000)
    ↓
Frontend Validation
    ↓
Convert to Wei (5000000000000000000000, 1500000000000000000000, 10000000000000000000000)
    ↓
Contract Call: checkEligibility(incomeWei, expensesWei, loanAmountWei)
    ↓
Smart Contract:
    - Validate inputs
    - Calculate DTI: 1500/5000 = 0.3 (30%)
    - Compare: 0.3 < 0.4 → APPROVED
    - Store result
    - Emit event
    ↓
Transaction Mined
    ↓
Frontend:
    - Parse event
    - Display: ✓ APPROVED, DTI: 0.30, Tx Hash: 0x123...
```

## 🔒 Security Considerations

### Smart Contract Security
- Input validation prevents zero/negative values
- Integer arithmetic with proper precision
- No external dependencies (no oracle attacks)
- No admin functions (decentralized)

### Frontend Security
- MetaMask integration (no private key exposure)
- Input sanitization
- Transaction confirmation before signing
- Read-only contract calls where possible

## 🚀 Deployment Architecture

### Local Development
```
Hardhat Node (localhost:8545)
    ↓
Contract Deployment (0x5FbDB2315678afecb367f032d93F642f64180aa3)
    ↓
Frontend (localhost:5173)
```

### Production Deployment
```
Polygon Mumbai Testnet
    ↓
Contract Deployment (TBD)
    ↓
Vercel Frontend
    ↓
Live DApp
```

## 📈 Performance Optimizations

### Smart Contract
- Minimal storage (only essential mapping)
- Efficient uint256 arithmetic
- No loops in main functions
- Gas-optimized event structure

### Frontend
- React state management (no unnecessary re-renders)
- Lazy loading of components
- Optimized CSS animations
- Efficient ethers.js usage

## 🔄 Testing Architecture

### Unit Tests (Hardhat + Chai)
- Contract function testing
- Edge case validation
- Event emission verification
- DTI calculation accuracy

### Integration Tests
- Wallet connection flow
- Form submission process
- Transaction handling
- Result display accuracy

### User Testing
- 5+ real wallet addresses
- Feedback collection via Google Forms
- UX/UI evaluation
- Performance assessment

---

**Architecture designed for scalability, security, and user experience** 🚀
