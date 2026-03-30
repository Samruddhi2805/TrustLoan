import React, { useState, useEffect } from 'react';
import { isAllowed, setAllowed, getAddress, isConnected as checkFreighterConnected, signTransaction } from '@stellar/freighter-api';
import { Horizon, TransactionBuilder, Networks, Asset, Operation, Memo } from '@stellar/stellar-sdk';
import Navbar from './components/Navbar';
import FormCard from './components/FormCard';
import ResultCard from './components/ResultCard';
import Dashboard from './components/Dashboard';

// ─── Core Financial Calculations ─────────────────────────────────────────────

/**
 * Standard EMI formula: [P × r × (1+r)^n] / [(1+r)^n – 1]
 */
export function calculateEMI(P, annualRate, n) {
  if (P <= 0 || n <= 0) return 0;
  const r = annualRate / 12 / 100;
  if (r === 0) return P / n;
  return (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

/**
 * DTI = (Existing EMIs + New EMI) / Monthly Income
 */
export function calculateDTI(existingEMIs, newEMI, income) {
  if (income <= 0) return Infinity;
  return (existingEMIs + newEMI) / income;
}

/**
 * Disposable % = (Income – Existing EMIs – New EMI) / Income × 100
 */
export function calculateDisposablePct(income, existingEMIs, newEMI) {
  if (income <= 0) return 0;
  return ((income - existingEMIs - newEMI) / income) * 100;
}

/**
 * 3-Tier Decision Logic:
 *   IF EMI > Income → REJECT
 *   ELSE IF DTI ≤ 0.55 AND Disposable% ≥ 20% → APPROVE
 *   ELSE IF DTI ≤ 0.70 AND Disposable% ≥ 15% → CONDITIONAL
 *   ELSE → REJECT
 */
export function evaluateEligibility(income, existingEMIs, newEMI) {
  const dti = calculateDTI(existingEMIs, newEMI, income);
  const disposablePct = calculateDisposablePct(income, existingEMIs, newEMI);

  let status, reason;

  if (newEMI > income) {
    status = 'REJECT';
    reason = 'EMI_EXCEEDS_INCOME';
  } else if (dti <= 0.55 && disposablePct >= 20) {
    status = 'APPROVE';
    reason = `Approved because DTI is ${(dti * 100).toFixed(0)}% and disposable income is ${disposablePct.toFixed(0)}%`;
  } else if (dti <= 0.70 && disposablePct >= 15) {
    status = 'CONDITIONAL';
    reason = `Good news — your profile looks possible! Your DTI is ${(dti * 100).toFixed(0)}% and you'd have ${disposablePct.toFixed(0)}% of your income left after EMIs. A bank may approve this after verifying your documents or salary slips.`;
  } else {
    status = 'REJECT';
    if (dti > 0.70 && disposablePct < 15) {
      reason = `Rejected because DTI is ${(dti * 100).toFixed(0)}% (max 70%) and disposable income is only ${disposablePct.toFixed(0)}% (min 15%).`;
    } else if (dti > 0.70) {
      reason = `Rejected because DTI is ${(dti * 100).toFixed(0)}%, which exceeds the maximum allowed limit of 70%.`;
    } else {
      reason = `Rejected because disposable income is only ${disposablePct.toFixed(0)}%, which is below the minimum required 15%.`;
    }
  }

  return { status, reason, dti, disposablePct };
}

// ─── Active Users Tracker (Cross-Device via CounterAPI) ────────────────────────
const COUNTER_NAMESPACE = 'trustloan_lite';
const COUNTER_KEY = 'active_users';

// Get the current shared count from the API
async function fetchSharedUserCount() {
  try {
    const res = await fetch(`https://api.counterapi.dev/v1/${COUNTER_NAMESPACE}/${COUNTER_KEY}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.count ?? 0;
  } catch {
    // fallback to localStorage count
    try {
      const stored = localStorage.getItem('tl_seen_wallets');
      return stored ? JSON.parse(stored).length : 0;
    } catch { return 0; }
  }
}

// Check if this wallet has been counted before (localStorage per-device dedup)
function isNewWallet(address) {
  try {
    const seen = JSON.parse(localStorage.getItem('tl_seen_wallets') || '[]');
    return !seen.includes(address);
  } catch { return true; }
}

function markWalletSeen(address) {
  try {
    const seen = JSON.parse(localStorage.getItem('tl_seen_wallets') || '[]');
    if (!seen.includes(address)) {
      localStorage.setItem('tl_seen_wallets', JSON.stringify([...seen, address]));
    }
  } catch {}
}

// Increment shared counter + mark wallet seen locally
async function registerActiveUser(address) {
  if (!isNewWallet(address)) return; // already counted on this device
  markWalletSeen(address);
  try {
    await fetch(`https://api.counterapi.dev/v1/${COUNTER_NAMESPACE}/${COUNTER_KEY}/up`);
  } catch {}
}

// ─── App Component ────────────────────────────────────────────────────────────

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [isManuallyDisconnected, setIsManuallyDisconnected] = useState(false);
  const [activeUserCount, setActiveUserCount] = useState(0);

  // Fetch shared user count on mount and poll every 10s for real-time updates
  useEffect(() => {
    const updateCount = () => fetchSharedUserCount().then(count => setActiveUserCount(count));
    updateCount();
    const countInterval = setInterval(updateCount, 10000);
    return () => clearInterval(countInterval);
  }, []);

  const [formData, setFormData] = useState({
    income: '',
    existingEMIs: '',
    monthlyExpenses: '',
    loanAmount: '',
    interestRate: '12',
    tenure: '12',
  });

  useEffect(() => {
    if (isManuallyDisconnected) return;
    checkIfWalletIsConnected();
    const intervalId = setInterval(() => checkIfWalletIsConnected(true), 1500);
    return () => clearInterval(intervalId);
  }, [isManuallyDisconnected]);

  const disconnectWallet = () => {
    setIsManuallyDisconnected(true);
    setAccount(null);
    setContract(null);
  };

  const prepareStellarTransaction = (publicKey) => ({
    checkEligibility: async (income, existingEMIs, loanAmount, interestRate, tenure) => {
      const newEMI = calculateEMI(loanAmount, interestRate, tenure);
      const { status, reason, dti, disposablePct } = evaluateEligibility(income, existingEMIs, newEMI);

      try {
        const server = new Horizon.Server('https://horizon-testnet.stellar.org');
        const accountData = await server.loadAccount(publicKey);

        const memoStr = `DTI:${(dti * 100).toFixed(1)}%|${status}`;
        const transaction = new TransactionBuilder(accountData, {
          fee: await server.fetchBaseFee(),
          networkPassphrase: Networks.TESTNET,
        })
          .addOperation(Operation.payment({
            destination: publicKey,
            asset: Asset.native(),
            amount: '0.0000001',
          }))
          .addMemo(Memo.text(memoStr))
          .setTimeout(30)
          .build();

        const response = await signTransaction(transaction.toXDR(), { networkPassphrase: Networks.TESTNET });
        if (response.error) throw new Error(response.error);
        if (!response.signedTxXdr) throw new Error('Transaction signing was cancelled or failed');

        const signedTx = TransactionBuilder.fromXDR(response.signedTxXdr, Networks.TESTNET);
        const txResult = await server.submitTransaction(signedTx);

        return {
          wait: async () => ({ hash: txResult.hash }),
          resultData: { status, reason, dti, disposablePct, newEMI },
        };
      } catch (error) {
        console.error('Stellar Network Error:', error);
        throw error;
      }
    },
  });

  const checkIfWalletIsConnected = async (isPolling = false) => {
    try {
      const connected = await checkFreighterConnected();
      if (connected) {
        const allowed = await isAllowed();
        if (allowed) {
          const { address, error } = await getAddress();
          if (address && !error) {
            setAccount((prev) => {
              if (prev !== address) {
                setContract(prepareStellarTransaction(address));
                // If they automatically connected on page load, register them
                registerActiveUser(address).then(() => {
                  fetchSharedUserCount().then(setActiveUserCount);
                });
              }
              return address;
            });
            return;
          }
        }
      }
      if (isPolling) { setAccount(null); setContract(null); }
    } catch (error) {
      if (!isPolling) console.log('Freighter issue:', error);
    }
  };

  const connectWallet = async () => {
    try {
      setIsManuallyDisconnected(false);
      const connected = await checkFreighterConnected();
      if (!connected) {
        alert('Freighter wallet not detected. Please install the Freighter browser extension.');
        return;
      }
      await setAllowed();
      const { address, error } = await getAddress();
      if (error) throw new Error(error);
      if (address) {
        setAccount(address);
        setContract(prepareStellarTransaction(address));
        await registerActiveUser(address);           // register in shared counter
        const count = await fetchSharedUserCount();  // fetch updated shared count
        setActiveUserCount(count);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Error connecting wallet. Make sure Freighter is installed and unlocked.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const checkEligibility = async (e) => {
    e.preventDefault();
    if (!contract) { alert('Please connect your wallet first!'); return; }

    const income = parseFloat(formData.income);
    const existingEMIs = parseFloat(formData.existingEMIs) || 0;
    const monthlyExpenses = parseFloat(formData.monthlyExpenses) || 0;
    const loanAmount = parseFloat(formData.loanAmount);
    const interestRate = parseFloat(formData.interestRate) || 12;
    const tenure = parseInt(formData.tenure, 10) || 12;

    if (!income || income <= 0) { alert('Monthly Income must be a positive number!'); return; }
    if (existingEMIs < 0) { alert('Existing EMIs cannot be negative!'); return; }
    if (monthlyExpenses < 0) { alert('Monthly Expenses cannot be negative!'); return; }
    if (!loanAmount || loanAmount <= 0) { alert('Desired Loan Amount must be a positive number!'); return; }
    if (interestRate < 0) { alert('Interest rate cannot be negative!'); return; }
    if (tenure <= 0) { alert('Loan tenure must be at least 1 month!'); return; }

    setLoading(true);
    setResult(null);

    try {
      const tx = await contract.checkEligibility(income, existingEMIs, loanAmount, interestRate, tenure);
      const receipt = await tx.wait();

      const newResult = {
        status: tx.resultData.status,
        reason: tx.resultData.reason,
        txHash: receipt.hash,
        income,
        existingEMIs,
        monthlyExpenses,
        loanAmount,
        interestRate,
        tenure,
        newEMI: tx.resultData.newEMI,
        dti: tx.resultData.dti,
        disposablePct: tx.resultData.disposablePct,
        timestamp: Date.now(),
      };

      setResult(newResult);
      setHistory((prev) => [newResult, ...prev]);
    } catch (error) {
      console.error('Error checking eligibility:', error);
      alert('Error checking eligibility! See console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen px-4 pt-10 sm:px-6 lg:px-8 w-screen overflow-x-hidden font-sans">
      {/* Aurora Background */}
      <div className="aurora-bg">
        <div className="aurora-blob blob-1"></div>
        <div className="aurora-blob blob-2"></div>
        <div className="aurora-blob blob-3"></div>
      </div>

      <Navbar account={account} connectWallet={connectWallet} disconnectWallet={disconnectWallet} activeUserCount={activeUserCount} />

      <main className="max-w-7xl mx-auto pt-24 pb-24 relative z-10 w-full">
        {!account ? (
          <div className="mt-24 sm:mt-32 flex flex-col items-center justify-center text-center max-w-2xl mx-auto glass-card p-12 shadow-2xl transform transition hover:scale-[1.02]">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-accent-teal via-accent-cyan to-accent-violet">
              DeFi Loans Simplified
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-10 leading-relaxed font-light">
              Connect your wallet to check your loan eligibility on-chain instantly using real EMI &amp; DTI financial logic.
            </p>
            <button
              onClick={connectWallet}
              className="btn-gradient text-lg px-8 py-5 flex items-center gap-3 w-max mx-auto shadow-lg hover:shadow-accent-teal/50 hover:-translate-y-1 transition duration-300 relative overflow-hidden group rounded-full"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-full"></div>
              <svg className="w-6 h-6 z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
              <span className="z-10 font-bold tracking-wide">Connect Wallet to Begin</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-10 mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col lg:flex-row gap-8 items-stretch justify-center max-w-6xl mx-auto w-full">
              <div className="w-full lg:w-1/2 flex">
                <FormCard
                  formData={formData}
                  handleInputChange={handleInputChange}
                  checkEligibility={checkEligibility}
                  loading={loading}
                />
              </div>
              <div className="w-full lg:w-1/2 flex min-h-[400px]">
                {result ? (
                  <ResultCard result={result} />
                ) : loading ? (
                  <div className="h-full w-full flex flex-col items-center justify-center glass-card p-12 flex-1 shadow-inner border border-glass-border/40 bg-black/40 backdrop-blur-sm">
                    <span className="loading w-16 h-16 border-4 border-gray-600 border-t-accent-teal border-r-accent-cyan rounded-full animate-spin shadow-[0_0_30px_rgba(12,244,198,0.3)]"></span>
                    <p className="mt-6 text-accent-cyan animate-[pulseGlow_2s_infinite] font-medium tracking-wider uppercase text-sm">Calculating via Smart Contract...</p>
                  </div>
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center glass-card p-12 border border-dashed border-gray-500/50 opacity-70 flex-1 hover:opacity-100 transition-opacity bg-black/20">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <p className="text-gray-300 text-center text-lg leading-relaxed max-w-sm">
                      Fill in your financial details to securely verify your loan eligibility and record it on the blockchain.
                    </p>
                  </div>
                )}
              </div>
            </div>
            <Dashboard account={account} history={history} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
