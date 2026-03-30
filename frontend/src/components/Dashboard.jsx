import React from 'react';
import { History, BarChart3, Clock, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

export default function Dashboard({ account, history }) {
  if (!account) return null;

  const totalChecks = history.length;
  const avgDti = totalChecks > 0 
    ? (history.reduce((acc, curr) => acc + parseFloat(curr.dti), 0) / totalChecks).toFixed(2)
    : '0.00';
  
  const approvalRate = totalChecks > 0
    ? ((history.filter(h => h.approved).length / totalChecks) * 100).toFixed(0)
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
                      <span className="bg-black/30 px-2 py-1 rounded">{item.dti}</span>
                    </td>
                    <td className="p-4">
                      {item.approved ? (
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
    </div>
  );
}
