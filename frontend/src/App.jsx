import React, { useState, useEffect } from 'react';
import { isAllowed, setAllowed, getAddress, isConnected as checkFreighterConnected, signTransaction } from '@stellar/freighter-api';
import { Horizon, TransactionBuilder, Networks, Asset, Operation, Memo, FeeBumpTransaction, Keypair } from '@stellar/stellar-sdk';
import Navbar from './components/Navbar';
import FormCard from './components/FormCard';
import ResultCard from './components/ResultCard';
import Dashboard from './components/Dashboard';
import FeeBumpBadge from './components/FeeBumpBadge';

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
 * Net Cash Flow = Income – (Existing EMIs + New EMI + Expenses)
 */
export function calculateNetCashFlow(income, existingEMIs, newEMI, expenses) {
  return income - existingEMIs - newEMI - expenses;
}

// ─── Structured Decision Engine ──────────────────────────────────────────────
// Tier 1 – Hard Reject:   Net Cash Flow < 0  OR  DTI > 0.60
// Tier 2 – Risk Zone:     DTI 0.40–0.60  OR  Disposable < 20%
// Tier 3 – Approved:      DTI < 0.40  AND  Disposable ≥ 20%  AND  NCF > 0
// Conflict override:      DTI < 0.40 but NCF < 10% of income → RISKY

export function evaluateEligibility(income, existingEMIs, newEMI, expenses = 0) {
  if (income <= 0) {
    return {
      status: 'REJECT',
      reason: 'Income must be greater than zero.',
      dti: Infinity,
      disposablePct: 0,
      netCashFlow: 0,
      netCashFlowPct: 0,
    };
  }

  const dti            = calculateDTI(existingEMIs, newEMI, income);
  const disposablePct  = calculateDisposablePct(income, existingEMIs, newEMI);
  const netCashFlow    = calculateNetCashFlow(income, existingEMIs, newEMI, expenses);
  const netCashFlowPct = (netCashFlow / income) * 100;

  const dtiPct  = (dti * 100).toFixed(1);
  const dispStr = disposablePct.toFixed(1);
  const ncfStr  = fmt(netCashFlow);

  let status, reason;

  // ── Tier 1: Hard Reject ───────────────────────────────────────────────────
  if (netCashFlow < 0) {
    status = 'REJECT';
    reason = `Rejected because your net cash flow is negative (₹${ncfStr}). After paying all EMIs and expenses, you'd have nothing left — this loan is not serviceable.`;
  } else if (dti > 0.60) {
    status = 'REJECT';
    reason = `Rejected because your DTI is ${dtiPct}%, which exceeds the hard limit of 60%. This indicates your total EMI burden is too high relative to your income.`;

  // ── Tier 2: Risk Zone ─────────────────────────────────────────────────────
  } else if (dti >= 0.40 && dti <= 0.60) {
    status = 'CONDITIONAL';
    reason = `Flagged as Risky — your DTI is ${dtiPct}% (safe threshold: <40%, risky: 40–60%). A lender may review this further. Your disposable income is ${dispStr}% and net cash flow is ₹${ncfStr}.`;
  } else if (disposablePct < 20) {
    status = 'CONDITIONAL';
    reason = `Flagged as Risky — your disposable income is only ${dispStr}%, which is below the safe threshold of 20%. This means there is limited financial buffer after EMI payments.`;

  // ── Tier 3: Conflict Check ────────────────────────────────────────────────
  } else if (dti < 0.40 && disposablePct >= 20 && netCashFlowPct < 10) {
    status = 'CONDITIONAL';
    reason = `Flagged as Risky — although your DTI is a healthy ${dtiPct}%, your net cash flow (₹${ncfStr}) is less than 10% of your income after all outflows. This leaves very little financial cushion.`;

  // ── Tier 3: Approved ──────────────────────────────────────────────────────
  } else if (dti < 0.40 && disposablePct >= 20 && netCashFlow > 0) {
    status = 'APPROVE';
    reason = `Approved because DTI is ${dtiPct}% (safe: <40%), disposable income is ${dispStr}%, and net cash flow is positive (₹${ncfStr}). Your financial profile comfortably supports this loan.`;

  // ── Fallback ──────────────────────────────────────────────────────────────
  } else {
    status = 'REJECT';
    reason = `Rejected — DTI is ${dtiPct}%, disposable income is ${dispStr}%, and net cash flow is ₹${ncfStr}. One or more metrics fell outside the acceptable range.`;
  }

  return { status, reason, dti, disposablePct, netCashFlow, netCashFlowPct };
}

function fmt(n) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

// Tracker logic removed. Enforcing strict Rust backend.

// ─── Fee Sponsorship Config (Advanced Feature: Gasless Transactions) ───────────
// A platform-managed sponsor account funds all transaction fees.
// Users connect with Freighter and sign only their DTI check — the platform
// wraps it in a Fee Bump envelope so users pay ZERO XLM in network fees.
const FEE_SPONSOR_SECRET = 'SAHIRBIVDDCJT2QUFEMEI6ZAIZXEKOZPF43Z2AEHP4GQXJ4NHRTIVX5L'; // Testnet demo sponsor
const FEE_SPONSOR_KEYPAIR = (() => {
  try { return Keypair.fromSecret(FEE_SPONSOR_SECRET); } catch { return null; }
})();
const FEE_SPONSOR_ADDRESS = FEE_SPONSOR_KEYPAIR ? FEE_SPONSOR_KEYPAIR.publicKey() : null;

// Removed static mock APIs
// ─── App Component ────────────────────────────────────────────────────────────

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [isManuallyDisconnected, setIsManuallyDisconnected] = useState(false);
  const [activeUserCount, setActiveUserCount] = useState(0);

  const [useFeeBump, setUseFeeBump] = useState(true); // Gasless mode on by default

  // Fetch true active user count from Soroban DB on mount + real-time polling
  useEffect(() => {
    async function updateCount() {
       try {
           const { Client } = await import('trustloan');
           const client = new Client({
              networkPassphrase: Networks.TESTNET,
              contractId: "CDOLUZMCCZODFA43Z4SJWKGOBBLUCGTDBRAMAKSWKNCZP6KLOF6TLTWB",
              rpcUrl: "https://soroban-testnet.stellar.org:443"
           });
           const userRes = await client.get_user_count();
           setActiveUserCount(Number(userRes.result || 0));
       } catch (err) { console.error(err); }
    }
    updateCount();
    const interval = setInterval(updateCount, 15000); // 15-second real-time polling
    return () => clearInterval(interval);
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
    checkEligibility: async (income, existingEMIs, loanAmount, interestRate, tenure, expenses) => {
      // 1. Math computation for visual display
      const newEMI = calculateEMI(loanAmount, interestRate, tenure);
      const { status, reason, dti, disposablePct, netCashFlow, netCashFlowPct } = evaluateEligibility(income, existingEMIs, newEMI, expenses);

      try {
        // 2. Import Soroban SDK Bindings (dynamically to avoid React hydration issues)
        const { Client } = await import('trustloan');
        const client = new Client({
            networkPassphrase: Networks.TESTNET,
            contractId: "CDOLUZMCCZODFA43Z4SJWKGOBBLUCGTDBRAMAKSWKNCZP6KLOF6TLTWB",
            rpcUrl: "https://soroban-testnet.stellar.org:443",
            publicKey: publicKey
        });

        // 3. Assemble the Soroban transaction natively
        // Simulate contract via RPC to fetch resource fees
        const txResponse = await client.evaluate({
            user: publicKey,
            income: Math.floor(income),
            existing_emis: Math.floor(existingEMIs),
            new_emi: Math.floor(newEMI),
            expenses: Math.floor(formData.monthlyExpenses || 0),
            employment: { tag: "Salaried", values: undefined } 
        });

        const txBuilt = await txResponse.built;

        // User signs the Soroban execution footprint
        const response = await signTransaction(txBuilt.toXDR(), { networkPassphrase: Networks.TESTNET });
        if (response.error) throw new Error(response.error);
        if (!response.signedTxXdr) throw new Error('Transaction signing was cancelled or failed');

        const signedInnerTx = TransactionBuilder.fromXDR(response.signedTxXdr, Networks.TESTNET);

        let txToSubmit = signedInnerTx;
        let gasless = false;

        // Advanced Feature: Fee Bump (Gasless) wraps the Soroban payload
        if (useFeeBump && FEE_SPONSOR_KEYPAIR) {
          try {
            const feeBumpTx = TransactionBuilder.buildFeeBumpTransaction(
              FEE_SPONSOR_KEYPAIR,
              '20000', // Soroban execution fees require a higher fee bump
              signedInnerTx,
              Networks.TESTNET
            );
            feeBumpTx.sign(FEE_SPONSOR_KEYPAIR);
            txToSubmit = feeBumpTx;
            gasless = true;
          } catch (feeBumpErr) {
            console.warn('Fee bump failed, falling back to standard tx:', feeBumpErr.message);
            txToSubmit = signedInnerTx;
          }
        }

        const server = new Horizon.Server('https://horizon-testnet.stellar.org');
        const txResult = await server.submitTransaction(txToSubmit);

        return {
          wait: async () => ({ hash: txResult.hash }),
          resultData: { status, reason, dti, disposablePct, netCashFlow, netCashFlowPct, newEMI, gasless },
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
      const tx = await contract.checkEligibility(income, existingEMIs, loanAmount, interestRate, tenure, monthlyExpenses);
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
        netCashFlow: tx.resultData.netCashFlow,
        netCashFlowPct: tx.resultData.netCashFlowPct,
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
            <div className="mt-8 pt-6 border-t border-glass-border/30 w-full sm:hidden text-center">
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-4 py-3 rounded-xl text-sm leading-relaxed max-w-sm">
                <svg className="w-10 h-10 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-left font-medium">Hello there! The Freighter wallet extension currently only supports <b>Desktop browsers</b>. Please open this site on your computer to connect.</p>
              </div>
            </div>
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
                  useFeeBump={useFeeBump}
                  setUseFeeBump={setUseFeeBump}
                  sponsorAddress={FEE_SPONSOR_ADDRESS}
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
            <Dashboard account={account} history={history} activeUserCount={activeUserCount} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
