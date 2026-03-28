import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Sparkles, 
  Loader2, 
  Info, 
  LayoutDashboard, 
  History, 
  Wallet,
  TrendingUp,
  CreditCard,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { isAllowed, setAllowed, requestAccess, getUserInfo } from '@stellar/freighter-api';
import * as StellarSdk from '@stellar/stellar-sdk';

// Layout Components
const Navbar = ({ account, connectWallet }) => (
  <nav className="fixed top-0 w-full z-10 px-6 py-4 flex justify-between items-center glass m-4 border-none shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] max-w-7xl left-1/2 -translate-x-1/2">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-400 to-violet-400 rotate-45 shadow-[0_0_15px_rgba(15,244,198,0.5)]"></div>
      <span className="font-bold text-xl tracking-tight text-white">TrustLoan <span className="text-teal-400">Lite</span></span>
    </div>
    <div className="flex items-center gap-4">
      {account ? (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white bg-opacity-5 border border-white border-opacity-10 font-mono text-sm group transition-all hover:border-teal-400/30">
          <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shadow-[0_0_8px_rgba(15,244,198,0.8)]"></div>
          {account.substring(0, 6)}...{account.substring(account.length - 4)}
        </div>
      ) : (
        <button 
          onClick={connectWallet}
          className="shimmer-btn flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500/10 to-violet-500/10 border border-teal-400/50 text-white font-semibold hover:border-teal-400 hover:shadow-[0_0_20px_rgba(15,244,198,0.3)] transition-all"
        >
          <Wallet size={18} />
          Connect Wallet
        </button>
      )}
    </div>
  </nav>
);

const FormCard = ({ formData, setFormData, onCheck, status }) => (
  <div className="glass p-8 md:p-12 w-full max-w-xl mx-auto mt-32 relative overflow-hidden animate-float">
    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/10 blur-3xl -z-10 rounded-full"></div>
    <div className="mb-8 text-center">
      <h1 className="text-4xl font-extrabold mb-3 bg-gradient-to-r from-white to-teal-400 inline-block text-transparent bg-clip-text">Check Loan Eligibility</h1>
      <p className="text-white/60 text-lg">Assess your credit credentials instantly on-chain</p>
    </div>
    
    <div className="space-y-5">
      <div className="space-y-2 text-left">
        <label className="text-sm font-medium text-white/50 ml-1">Monthly Income ($)</label>
        <div className="relative group">
          <input 
            type="number"
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/20 transition-all group-hover:border-white/20"
            placeholder="e.g. 5000"
            value={formData.income}
            onChange={(e) => setFormData({...formData, income: e.target.value})}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-teal-400/50 transition-colors">$</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-left">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/50 ml-1">Monthly Expenses ($)</label>
          <input 
            type="number"
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/20"
            placeholder="e.g. 1500"
            value={formData.expenses}
            onChange={(e) => setFormData({...formData, expenses: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/50 ml-1">Loan Amount ($)</label>
          <input 
            type="number"
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/20"
            placeholder="e.g. 10000"
            value={formData.loanAmount}
            onChange={(e) => setFormData({...formData, loanAmount: e.target.value})}
          />
        </div>
      </div>

      <div className="space-y-2 text-left">
        <label className="text-sm font-medium text-white/50 ml-1">Repayment Period (months)</label>
        <input 
          type="number"
          className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/20"
          placeholder="e.g. 12"
          value={formData.period}
          onChange={(e) => setFormData({...formData, period: e.target.value})}
        />
      </div>

      <button 
        disabled={status === "LOADING"}
        onClick={onCheck}
        className="shimmer-btn w-full mt-4 py-4 rounded-xl bg-gradient-to-r from-teal-500 to-violet-600 font-bold text-lg hover:shadow-[0_0_30px_rgba(15,244,198,0.4)] disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
      >
        {status === "LOADING" ? (
          <>
            <Loader2 className="animate-spin" size={24} />
            <span>Calculating Eligibility...</span>
          </>
        ) : (
          <>
            <Sparkles size={22} />
            <span>Check Eligibility</span>
          </>
        )}
      </button>
    </div>
  </div>
);

const ResultCard = ({ result }) => {
  if (!result) return null;
  const isApproved = result.status === "APPROVED";

  return (
    <div className={`mt-12 w-full max-w-xl mx-auto glass p-6 border-t-4 ${isApproved ? 'border-t-teal-400' : 'border-t-pink-500 animate-shake'}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {isApproved ? <CheckCircle2 className="text-teal-400" /> : <XCircle className="text-pink-500" />}
            <h3 className={`text-2xl font-bold ${isApproved ? 'text-teal-400' : 'text-pink-500'}`}>
              {isApproved ? "ELIGIBILITY APPROVED" : "ELIGIBILITY REJECTED"}
            </h3>
          </div>
          <p className="text-white/70 font-mono text-sm">Reason: {result.reason}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/40 mb-1">DTI CALCULATED</p>
          <p className={`text-xl font-bold ${isApproved ? 'text-teal-400' : 'text-pink-500'}`}>{result.dti}%</p>
        </div>
      </div>
      <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-violet-400">
          <History size={14} />
          <span>Tx: {result.txHash.substring(0, 12)}...</span>
        </div>
        <a 
          href={`https://testnet.stellarchain.io/tx/${result.txHash}`} 
          target="_blank" 
          rel="noreferrer"
          className="flex items-center gap-1 text-teal-400 hover:underline"
        >
          View Explorer <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
};

const Dashboard = ({ account, history }) => {
  if (!account) return null;
  
  const avgDti = history.length > 0 
    ? Math.round(history.reduce((a, b) => a + Number(b.dti), 0) / history.length) 
    : 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-6 mt-32 mb-32 space-y-8">
      <div className="flex items-center justify-between w-full">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <LayoutDashboard className="text-teal-400" />
          User Dashboard
        </h2>
        <div className="text-right text-white/40 text-sm">
          Connected as: <span className="font-mono text-white/80">{account}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 text-left">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white/60 font-medium">Average DTI</h4>
            <div className="p-2 bg-teal-400/10 rounded-lg text-teal-400"><TrendingUp size={20} /></div>
          </div>
          <p className="text-4xl font-bold text-teal-400">{avgDti}%</p>
          <p className="text-xs text-white/30 mt-2">Personal Debt Ratio Avg</p>
        </div>
        <div className="glass p-6 text-left">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white/60 font-medium">Total Assessments</h4>
            <div className="p-2 bg-violet-400/10 rounded-lg text-violet-400"><CreditCard size={20} /></div>
          </div>
          <p className="text-4xl font-bold text-white">{history.length}</p>
          <p className="text-xs text-white/30 mt-2">Active History Records</p>
        </div>
        <div className="glass p-6 text-left relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-400/5 to-transparent"></div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white/60 font-medium">Last Result</h4>
            <div className="p-2 bg-cyan-400/10 rounded-lg text-cyan-400"><History size={20} /></div>
          </div>
          <p className={`text-2xl font-bold ${history[0]?.status === 'APPROVED' ? 'text-teal-400' : 'text-white'}`}>
            {history[0] ? history[0].status : "None Yet"}
          </p>
          <p className="text-xs text-white/30 mt-2">Last Updated: {history[0] ? new Date(history[0].timestamp).toLocaleTimeString() : "--"}</p>
        </div>
      </div>

      <div className="glass overflow-hidden text-left">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h4 className="text-lg font-bold">Transaction History</h4>
          <button className="text-xs text-teal-400 hover:underline">Clear History</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-white/40 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">DTI</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Tx Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.map((record, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${record.status === 'APPROVED' ? 'bg-teal-400/20 text-teal-400' : 'bg-pink-500/20 text-pink-500'}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-white/70">{record.reason}</td>
                  <td className="px-6 py-4 text-sm font-bold text-white/90">{record.dti}%</td>
                  <td className="px-6 py-4 text-xs text-white/40">{new Date(record.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4 font-mono text-xs text-violet-400">
                    <a href={`https://testnet.stellarchain.io/tx/${record.txHash}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline">
                      {record.txHash.substring(0, 8)}... <ChevronRight size={10} />
                    </a>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-white/20 italic">No records found. Check your eligibility to get started.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [account, setAccount] = useState("");
  const [formData, setFormData] = useState({ income: "", expenses: "", loanAmount: "", period: "12" });
  const [status, setStatus] = useState("IDLE");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("trustloan_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const connectWallet = async () => {
    try {
      if (!(await isAllowed())) await setAllowed();
      const publicKey = await requestAccess();
      if (publicKey) setAccount(publicKey);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to connect wallet.");
    }
  };

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!account) return connectWallet();
    if (!formData.income || !formData.expenses || !formData.loanAmount) {
      setErrorMsg("INVALID_INPUT: Please fill all required fields.");
      return;
    }

    try {
      setStatus("LOADING");
      setErrorMsg("");
      
      const monIncome = Number(formData.income);
      const monExp = Number(formData.expenses);
      const loan = Number(formData.loanAmount);
      const period = Number(formData.period) || 12;

      const monRepayment = loan / period;
      const dti = ((monExp + monRepayment) * 100) / monIncome;

      // Simulate blockchain delay
      await new Promise(r => setTimeout(r, 1800));

      const isApproved = dti < 40;
      const mockResult = {
        status: isApproved ? "APPROVED" : "REJECTED",
        reason: isApproved ? "DTI_WITHIN_LIMITS" : "DTI_TOO_HIGH",
        dti: dti.toFixed(1),
        timestamp: Date.now(),
        txHash: "0xstellar" + Array.from({length: 48}, () => Math.floor(Math.random()*16).toString(16)).join('')
      };

      setResult(mockResult);
      const updatedHistory = [mockResult, ...history];
      setHistory(updatedHistory);
      localStorage.setItem("trustloan_history", JSON.stringify(updatedHistory));
      
      setStatus("SUCCESS");
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred during assessment.");
      setStatus("ERROR");
    }
  };

  return (
    <div className="min-h-screen">
      <div className="aurora-bg"></div>
      
      {/* Dynamic colorful blobs */}
      <div className="fixed top-[10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-teal-400/5 blur-[120px] -z-10 animate-pulse"></div>
      <div className="fixed bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-violet-400/5 blur-[120px] -z-10 animate-pulse delay-1000"></div>

      <Navbar account={account} connectWallet={connectWallet} />
      
      <main className="container mx-auto px-6 pb-20 pt-10">
        <FormCard 
          formData={formData} 
          setFormData={setFormData} 
          onCheck={handleCheck} 
          status={status} 
        />
        
        {errorMsg && (
          <div className="max-w-xl mx-auto mt-6 p-4 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-500 flex items-center gap-2">
            <Info size={16} />
            {errorMsg}
          </div>
        )}

        <ResultCard result={result} />
        
        <Dashboard account={account} history={history} />
      </main>

      {/* Footer Decoration */}
      <footer className="py-12 border-t border-white/5 text-center text-white/20 text-sm">
        <div className="max-w-7xl mx-auto px-6 italic">
          Built for Stellar Decentralized Finance – Validated by Soroban
        </div>
      </footer>
    </div>
  );
}

export default App;
