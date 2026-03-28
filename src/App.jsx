import { useState, useEffect } from 'react';
import { isAllowed, setAllowed, requestAccess, getUserInfo } from '@stellar/freighter-api';
import * as StellarSdk from '@stellar/stellar-sdk';
import { Shield, Sparkles, Loader2, Info } from 'lucide-react';

// The ID of the Soroban contract deployed on Stellar Testnet
const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID || "CAC...YOUR_CONTRACT_ADDRESS_HERE";
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;

function App() {
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("0");
  const [formData, setFormData] = useState({ income: "", expenses: "", loanAmount: "" });
  const [status, setStatus] = useState("IDLE"); // IDLE, LOADING, SUCCESS, ERROR
  const [result, setResult] = useState(null); // { eligibility, reason, txHash }
  const [errorMsg, setErrorMsg] = useState("");

  const formatAddress = (addr) => `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  const loadStellarBalance = async (pubKey) => {
    try {
      const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
      const accountInfo = await server.loadAccount(pubKey);
      const xlmBalance = accountInfo.balances.find(b => b.asset_type === 'native');
      if (xlmBalance) setBalance(xlmBalance.balance);
    } catch (e) {
      console.error(e);
      setBalance("0 (Account not funded/found on testnet)");
    }
  };

  const connectWallet = async () => {
    try {
      if (!(await isAllowed())) {
        await setAllowed();
      }
      const publicKey = await requestAccess();
      if (publicKey) {
        setAccount(publicKey);
        await loadStellarBalance(publicKey);
      }
    } catch (error) {
      console.error(error);
      setErrorMsg("Failed to connect Freighter. Is it installed?");
    }
  };

  const checkEligibility = async (e) => {
    e.preventDefault();
    if (!account) return setErrorMsg("Please connect your Freighter wallet first.");
    if (!formData.income || !formData.expenses || !formData.loanAmount) return setErrorMsg("All fields are required.");

    try {
      setStatus("LOADING");
      setErrorMsg("");
      setResult(null);

      const incomeNum = parseInt(formData.income);
      const expensesNum = parseInt(formData.expenses);
      
      const dtiPercent = Math.floor((expensesNum * 100) / incomeNum);
      
      // In a full Level 5 implementation, this calls Soroban using SorobanRpc
      // For this MVP transition to Freighter, we simulate the blockchain verification
      // (Since deploying a Soroban contract requires compiling rust into a specific binary structure)
      
      // Setup mock delay for blockchain simulation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const isApproved = dtiPercent < 40;
      const statusRes = isApproved ? "APPROVED" : "REJECTED";
      const reasonRes = isApproved ? "DTI_WITHIN_LIMITS" : "DTI_TOO_HIGH";
      
      // Mock Tx Hash for Stellar
      const mockTxHash = "0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');

      setResult({
        status: statusRes,
        reason: reasonRes,
        txHash: mockTxHash
      });
      
      setStatus("SUCCESS");
    } catch (err) {
      console.error(err);
      setStatus("ERROR");
      setErrorMsg("An error occurred interacting with the Soroban network.");
    }
  };

  return (
    <>
      <div className="aurora-bg">
        <div className="blob blob-teal"></div>
        <div className="blob blob-violet"></div>
        <div className="blob blob-pink"></div>
      </div>

      <div className="app-container">
        {/* Navbar */}
        <nav className="navbar">
          <div className="logo-section">
            <div className="logo-gem"></div>
            <span className="logo-text">TrustLoan Lite</span>
          </div>
          <div>
            {account ? (
              <div className="wallet-badge">
                <div className="status-dot"></div>
                {formatAddress(account)}
              </div>
            ) : (
              <span className="wallet-badge" style={{opacity: 0.5}}>Not Connected</span>
            )}
          </div>
        </nav>

        {/* Hero Form */}
        <div className="hero-card">
          <div className="glow-accent"></div>
          
          {!account ? (
            <>
              <span className="eyebrow">- STELLAR/SOROBAN MVP -</span>
              <h1 className="title">Check Loan Eligibility</h1>
              <p className="subtitle">Connect your Freighter wallet to view balance and assess credentials instantly.</p>
              
              <div style={{ padding: '20px' }}>
                <Shield size={48} color="#0ff4c6" style={{ margin: '0 auto', display: 'block' }} className="animated-shield" />
              </div>

              <button className="btn-primary" onClick={connectWallet}>
                <Sparkles size={18} style={{marginRight: '8px', verticalAlign: 'middle'}}/> 
                Connect Freighter
              </button>
            </>
          ) : (
            <>
              <span className="eyebrow" style={{ color: '#7b2ff7' }}>- YOUR FINANCES -</span>
              <h1 className="title">Loan Application</h1>
              <p className="subtitle">Balance: {balance} XLM</p>
              
              <form onSubmit={checkEligibility}>
                <div className="form-group">
                  <label className="form-label">Monthly Income ($)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={formData.income}
                    onChange={(e) => setFormData({...formData, income: e.target.value})}
                    placeholder="e.g. 5000"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Monthly Expenses ($)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={formData.expenses}
                    onChange={(e) => setFormData({...formData, expenses: e.target.value})}
                    placeholder="e.g. 1500"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Desired Loan Amount ($)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={formData.loanAmount}
                    onChange={(e) => setFormData({...formData, loanAmount: e.target.value})}
                    placeholder="e.g. 10000"
                    required
                  />
                </div>

                {errorMsg && (
                  <div className="error-msg">
                    <Info size={16} style={{marginRight: '5px', verticalAlign: 'text-top'}}/>
                    {errorMsg}
                  </div>
                )}

                {result && (
                  <div className={`result-card ${result.status}`}>
                    <div className="result-header">
                      {result.status === "APPROVED" ? "✓ APPROVED" : "✕ REJECTED"}
                    </div>
                    <div>Reason: {result.reason}</div>
                    <div className="tx-hash">
                      Tx: <a href={`https://testnet.stellarchain.io/tx/${result.txHash}`} target="_blank" rel="noreferrer">{formatAddress(result.txHash)}</a>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '30px' }}>
                  <button type="submit" className="btn-primary" disabled={status === "LOADING"}>
                    {status === "LOADING" ? (
                       <Loader2 className="animate-spin" size={20} style={{margin: '0 auto'}}/>
                    ) : (
                       "Check Eligibility"
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
