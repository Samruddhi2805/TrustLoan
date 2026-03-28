import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Shield, Sparkles, Loader2, Info } from 'lucide-react';
import TrustLoanArtifact from './artifacts/contracts/TrustLoan.sol/TrustLoan.json';

// Target Polygon Amoy Testnet (Chain ID 80002)
const TARGET_CHAIN_ID = "0x13882"; 
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0xYourDeployedContractAddressHere";

function App() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("0");
  const [chainId, setChainId] = useState("");
  const [formData, setFormData] = useState({ income: "", expenses: "", loanAmount: "" });
  const [status, setStatus] = useState("IDLE"); // IDLE, LOADING, SUCCESS, ERROR
  const [result, setResult] = useState(null); // { eligibility, reason, txHash }
  const [errorMsg, setErrorMsg] = useState("");

  const formatAddress = (addr) => `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    }
  }, []);

  const handleAccountsChanged = async (accounts) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      await updateBalances(accounts[0]);
    } else {
      setAccount("");
      setBalance("0");
    }
  };

  const updateBalances = async (addr) => {
    if (window.ethereum) {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);
      const network = await web3Provider.getNetwork();
      setChainId(ethers.toBeHex(network.chainId));
      
      const bal = await web3Provider.getBalance(addr);
      setBalance(ethers.formatEther(bal).substring(0, 6));
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        handleAccountsChanged(accounts);
      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to connect wallet.");
      }
    } else {
      setErrorMsg("Please install MetaMask to use this dApp.");
    }
  };

  const checkEligibility = async (e) => {
    e.preventDefault();
    if (!account) return setErrorMsg("Please connect your wallet first.");
    if (!formData.income || !formData.expenses || !formData.loanAmount) return setErrorMsg("All fields are required.");
    
    // Warn if not on Polygon Amoy but don't strictly block for local testing flexibility
    if (chainId !== TARGET_CHAIN_ID && chainId !== "0x539" && chainId !== "0x7a69") {
       console.warn("You are not on Polygon Amoy or Localhost.");
    }

    try {
      setStatus("LOADING");
      setErrorMsg("");
      setResult(null);

      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await web3Provider.getSigner();
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, TrustLoanArtifact.abi, signer);
      
      // Values are sent as Wei/smallest units to avoid precision errors in contract
      const incomeWei = ethers.parseUnits(formData.income.toString(), 18);
      const expensesWei = ethers.parseUnits(formData.expenses.toString(), 18);
      const loanWei = ethers.parseUnits(formData.loanAmount.toString(), 18);

      const tx = await contract.checkEligibility(incomeWei, expensesWei, loanWei);
      const receipt = await tx.wait();

      // Read Event Emitted
      const event = receipt.logs.map(log => {
        try {
           return contract.interface.parseLog(log);
        } catch (e) { return null; }
      }).find(parsed => parsed && parsed.name === 'EligibilityChecked');

      if (event) {
        setResult({
           status: event.args.status,
           reason: event.args.reason,
           txHash: tx.hash
        });
      } else {
         throw new Error("Event not found in transaction receipt");
      }
      
      setStatus("SUCCESS");
    } catch (err) {
      console.error(err);
      setStatus("ERROR");
      setErrorMsg(err.reason || err.message || "An error occurred while checking eligibility.");
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
              <span className="eyebrow">- STELLAR/POLYGON MVP -</span>
              <h1 className="title">Check Loan Eligibility</h1>
              <p className="subtitle">Connect your wallet to experience borderless, seamless decentralized credit assessment instantly.</p>
              
              <div style={{ padding: '20px' }}>
                <Shield size={48} color="#0ff4c6" style={{ margin: '0 auto', display: 'block' }} className="animated-shield" />
              </div>

              <button className="btn-primary" onClick={connectWallet}>
                <Sparkles size={18} style={{marginRight: '8px', verticalAlign: 'middle'}}/> 
                Connect Wallet
              </button>
            </>
          ) : (
            <>
              <span className="eyebrow" style={{ color: '#7b2ff7' }}>- YOUR FINANCES -</span>
              <h1 className="title">Loan Application</h1>
              <p className="subtitle">Balance: {balance} MATIC</p>
              
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
                      Tx: <a href={`https://amoy.polygonscan.com/tx/${result.txHash}`} target="_blank" rel="noreferrer">{formatAddress(result.txHash)}</a>
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
