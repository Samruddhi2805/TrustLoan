import React, { useState, useEffect } from 'react';
import { History, BarChart3, Clock, CheckCircle, XCircle, ExternalLink, Database, Search, Users, Activity, Globe } from 'lucide-react';

export default function Dashboard({ account, history }) {
  const [indexedData, setIndexedData] = useState([]);
  const [indexingActive, setIndexingActive] = useState(false);

  // Directly fetch global user metrics from the Blockchain Database Core
  const [activeUsersFromDB, setActiveUsersFromDB] = useState(0);
  const [txCountFromDB, setTxCountFromDB] = useState(0);

  const [globalActivity, setGlobalActivity] = useState([]);

  const [activeWallets, setActiveWallets] = useState([]);

  useEffect(() => {
    async function fetchDatabaseMetrics() {
      try {
        const { Client } = await import('trustloan');
        const dbClient = new Client({
            networkPassphrase: "Test SDF Network ; September 2015",
            contractId: "CDOLUZMCCZODFA43Z4SJWKGOBBLUCGTDBRAMAKSWKNCZP6KLOF6TLTWB",
            rpcUrl: "https://soroban-testnet.stellar.org:443"
        });

        // Query the Rust Database directly for counters
        const userRes = await dbClient.get_user_count();
        setActiveUsersFromDB(Number(userRes.result || 0));
        
        const txRes = await dbClient.get_tx_count();
        setTxCountFromDB(Number(txRes.result || 0));

        // Query the Rust Database directly for explicit Arrays
        const activeUsersArr = await dbClient.get_active_users();
        setActiveWallets(activeUsersArr.result || []);

        const activityArr = await dbClient.get_platform_activity();
        setGlobalActivity(activityArr.result || []);
      } catch (err) {
        console.error("Rust DB Fetch Error:", err);
      }
    }
    fetchDatabaseMetrics();
    const interval = setInterval(fetchDatabaseMetrics, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!account) return;

    const fetchUserHistory = async () => {
      setIndexingActive(true);
      try {
        const { Client } = await import('trustloan');
        const dbClient = new Client({
          networkPassphrase: "Test SDF Network ; September 2015",
          contractId: "CDOLUZMCCZODFA43Z4SJWKGOBBLUCGTDBRAMAKSWKNCZP6KLOF6TLTWB",
          rpcUrl: "https://soroban-testnet.stellar.org:443"
        });
        // Pull this wallet's full evaluation history directly from the Rust DB
        const histRes = await dbClient.get_history({ user: account });
        const records = histRes.result || [];
        // Map LoanEvaluation struct fields to display format
        const formatted = records.map(ev => ({
          dti: (Number(ev.dti_pct_scaled) / 100).toFixed(2),
          disposable: (Number(ev.disposable_pct_scaled) / 100).toFixed(2),
          advice: ev.advice?.tag ?? 'Unknown',
          timestamp: Number(ev.timestamp) * 1000, // convert Unix seconds → ms
          ledger: ev.ledger_sequence,
          income: ev.income,
          existing_emis: ev.existing_emis,
          new_emi: ev.new_emi,
        })).reverse(); // newest first
        setIndexedData(formatted);
      } catch (err) {
        console.error("Soroban DB history fetch failed:", err);
      } finally {
        setIndexingActive(false);
      }
    };

    fetchUserHistory();
    const interval = setInterval(fetchUserHistory, 15000);
    return () => clearInterval(interval);
  }, [account]);

  if (!account) return null;

  const totalChecks = history.length;
  const avgDti = totalChecks > 0 
    ? (history.reduce((acc, curr) => acc + parseFloat(curr.dti), 0) / totalChecks).toFixed(2)
    : '0.00';
  
  const approvalRate = totalChecks > 0
    ? ((history.filter(h => h.status === 'APPROVE').length / totalChecks) * 100).toFixed(0)
    : 0;

  return (
    <div className="w-full max-w-5xl mx-auto mt-12 pb-12">
      <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <BarChart3 className="w-8 h-8 text-accent-violet" />
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent-violet to-accent-pink">
          User Dashboard
        </span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 flex flex-col justify-center items-center text-center transform transition duration-500 hover:scale-105">
           <h4 className="text-gray-400 text-sm uppercase tracking-wider mb-2 font-medium">Total Checks</h4>
           <p className="text-5xl font-bold text-white tracking-tighter">{totalChecks}</p>
        </div>
        
        <div className="glass-card p-6 flex flex-col justify-center items-center text-center transform transition duration-500 hover:scale-105 border-b-4 border-b-accent-cyan">
           <h4 className="text-gray-400 text-sm uppercase tracking-wider mb-2 font-medium">Average DTI</h4>
           <p className="text-5xl font-bold text-accent-cyan tracking-tighter">{avgDti}</p>
        </div>

        <div className="glass-card p-6 flex flex-col justify-center items-center text-center transform transition duration-500 hover:scale-105 border-b-4 border-b-emerald-400">
           <h4 className="text-gray-400 text-sm uppercase tracking-wider mb-2 font-medium">Approval Rate</h4>
           <p className="text-5xl font-bold text-emerald-400 tracking-tighter">{approvalRate}%</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden mb-8">
        <div className="p-6 border-b border-glass-border bg-black/20 flex items-center gap-3">
          <div className="p-2 bg-accent-violet/20 rounded-lg">
            <BarChart3 className="w-5 h-5 text-accent-violet" />
          </div>
          <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-accent-violet to-accent-pink">Global Platform Metrics</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-glass-border/30 bg-black/10">
          <div className="p-6 text-center">
            <h4 className="text-sm text-gray-400 uppercase tracking-widest mb-1">Total Active Users</h4>
            <p className="text-4xl font-bold text-white">{activeUsersFromDB}</p>
          </div>
          <div className="p-6 text-center">
            <h4 className="text-sm text-gray-400 uppercase tracking-widest mb-1">Platform Transactions</h4>
            <p className="text-4xl font-bold text-accent-cyan">{txCountFromDB}</p>
          </div>
          <div className="p-6 text-center">
            <h4 className="text-sm text-gray-400 uppercase tracking-widest mb-1">Database Sync</h4>
            <p className="text-4xl font-bold text-emerald-400">Soroban</p>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-glass-border bg-black/20 flex items-center gap-3">
          <div className="p-2 bg-accent-teal/20 rounded-lg">
            <History className="w-5 h-5 text-accent-teal" />
          </div>
          <h3 className="text-xl font-semibold">Transaction History</h3>
        </div>
        
        {history.length === 0 ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center">
            <Clock className="w-12 h-12 text-gray-600 mb-4" />
            <p className="text-lg">No eligibility checks performed yet.</p>
            <p className="text-sm mt-2 text-gray-500">Fill in the form above to verify your loan eligibility.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/40 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="p-4 rounded-tl-lg font-semibold">Date</th>
                  <th className="p-4 font-semibold">Inputs (Inc/Exp/Loan)</th>
                  <th className="p-4 font-semibold">DTI</th>
                  <th className="p-4 font-semibold">Result</th>
                  <th className="p-4 rounded-tr-lg font-semibold">Stellar Tx</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border/30">
                {history.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        {new Date(item.timestamp).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="p-4 text-sm font-mono space-y-1">
                      <div className="text-emerald-400">${item.income} <span className="text-xs text-gray-500">inc</span></div>
                      <div className="text-rose-400">${item.expenses} <span className="text-xs text-gray-500">exp</span></div>
                      <div className="text-accent-cyan">${item.loanAmount} <span className="text-xs text-gray-500">req</span></div>
                    </td>
                    <td className="p-4 font-mono text-sm">
                      <span className="bg-black/30 px-2 py-1 rounded">{(item.dti * 100).toFixed(1)}%</span>
                    </td>
                    <td className="p-4">
                      {item.status === 'APPROVE' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <CheckCircle className="w-3.5 h-3.5" />
                          APPROVED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          <XCircle className="w-3.5 h-3.5" />
                          {item.reason}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-xs font-mono text-gray-400">
                      <a 
                         href={`https://stellar.expert/explorer/testnet/tx/${item.txHash}`}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="hover:text-accent-teal transition-colors flex items-center gap-1 px-2 py-1 bg-white/5 rounded w-max"
                      >
                        {item.txHash.slice(0, 8)}...{item.txHash.slice(-8)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="glass-card overflow-hidden mb-8">
        <div className="p-6 border-b border-glass-border bg-black/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-teal/20 rounded-lg">
              <Database className="w-5 h-5 text-accent-teal" />
            </div>
            <h3 className="text-xl font-semibold">On-Chain Data Indexer</h3>
          </div>
          {indexingActive && (
             <span className="flex items-center gap-2 text-sm text-accent-cyan animate-pulse">
               <Search className="w-4 h-4" /> Indexing network...
             </span>
          )}
        </div>
        
        {indexedData.length === 0 ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-3">
            <Database className="w-10 h-10 text-gray-600" />
            <p className="text-lg">No on-chain records found for this wallet.</p>
            <p className="text-sm text-gray-500">Submit a loan eligibility check above to write your first record to the Soroban DB.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/40 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="p-4 rounded-tl-lg font-semibold">Timestamp (On-Chain)</th>
                  <th className="p-4 font-semibold">DTI Ratio</th>
                  <th className="p-4 font-semibold">Disposable %</th>
                  <th className="p-4 font-semibold">Advice</th>
                  <th className="p-4 rounded-tr-lg font-semibold">Ledger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border/30">
                {indexedData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        {new Date(item.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-sm">
                      <span className="bg-black/30 px-2 py-1 rounded border border-accent-cyan/30 text-accent-cyan">{item.dti}%</span>
                    </td>
                    <td className="p-4 font-mono text-sm">
                      <span className="bg-black/30 px-2 py-1 rounded border border-accent-violet/30 text-accent-violet">{item.disposable}%</span>
                    </td>
                    <td className="p-4 text-xs font-bold uppercase tracking-wider">
                      {item.advice === 'Safe' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" /> Safe
                        </span>
                      ) : item.advice === 'Caution' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          ⚠ Caution
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <XCircle className="w-3 h-3" /> Do Not Take
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-xs font-mono text-gray-400">
                      <a
                        href={`https://stellar.expert/explorer/testnet/ledger/${item.ledger}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-accent-teal transition-colors flex items-center gap-1 px-2 py-1 bg-white/5 rounded w-max"
                      >
                        #{item.ledger}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LIVE COMMUNITY FEED Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Verified Community Activity (Live Feed) */}
        <div className="glass-card flex flex-col h-[400px]">
           <div className="p-5 border-b border-glass-border flex items-center justify-between bg-black/30">
              <div className="flex items-center gap-3">
                 <Globe className="w-5 h-5 text-accent-teal" />
                 <h3 className="font-bold text-white uppercase tracking-wider text-sm">On-Chain Active Wallets</h3>
              </div>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full animate-pulse border border-emerald-500/30">SCALING LIVE</span>
           </div>
           <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              {activeWallets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 opacity-50">
                  <Users className="w-10 h-10 text-gray-500" />
                  <p className="text-sm font-medium">Waiting for network activity...</p>
                  <p className="text-xs text-gray-600">Connect a wallet and check eligibility to appear in the live feed.</p>
                </div>
              ) : (
                activeWallets.map((walletAddr, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-accent-teal/30 transition-all group">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-[10px] font-mono group-hover:from-accent-teal/30 group-hover:to-accent-violet/30">
                          {idx + 1}
                        </div>
                        <span className="font-mono text-xs text-gray-400 group-hover:text-gray-200">{walletAddr.slice(0, 10)}...{walletAddr.slice(-10)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-tighter">Verified On-Chain</span>
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>

        {/* Global Live Activity Feed (Platform Logs) */}
        <div className="glass-card flex flex-col h-[400px]">
           <div className="p-5 border-b border-glass-border flex items-center justify-between bg-black/30">
              <div className="flex items-center gap-3">
                 <Activity className="w-5 h-5 text-accent-violet" />
                 <h3 className="font-bold text-white uppercase tracking-wider text-sm">Real-Time Platform Activity</h3>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>
                 <span className="text-xs text-rose-400 uppercase tracking-widest font-black">Soroban DB</span>
              </div>
           </div>
           <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {globalActivity.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-gray-500">
                  <Globe className="w-12 h-12 text-gray-700" />
                  <div>
                    <p className="font-bold text-gray-400">Platform-wide Indexing Active</p>
                    <p className="text-xs text-gray-600 mt-1">Watching for recent DTI checks on the DB...</p>
                  </div>
                </div>
              ) : (
                globalActivity.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/5 border border-glass-border/30 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-500 uppercase">EVALUATION ({(Number(item.dti_pct_scaled) / 100).toFixed(2)}%)</span>
                      <span className="text-xs font-mono text-accent-cyan">{item.user.slice(0, 12)}...</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 uppercase">TIME</span>
                      <p className="text-xs text-gray-300">{new Date(Number(item.timestamp) * 1000).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
