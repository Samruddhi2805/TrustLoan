import React from 'react';
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';

function fmt(n) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

function StatRow({ label, value, sub }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-glass-border/30 last:border-none">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-right">
        <span className="font-mono font-bold text-white text-sm">{value}</span>
        {sub && <span className="ml-1 text-xs text-gray-500">{sub}</span>}
      </span>
    </div>
  );
}

function getRejectionMessage(reason) {
  switch (reason) {
    case 'DTI_TOO_HIGH':
      return "Your Debt-to-Income (DTI) ratio exceeds the 50% threshold. Try requesting a smaller loan, extending the tenure, or reducing existing debt obligations.";
    case 'LOW_DISPOSABLE':
      return "Your disposable income after all loan obligations would fall below 20% of your monthly income — the minimum required to cover living expenses.";
    case 'DTI_AND_DISPOSABLE':
      return "Both your DTI ratio is too high and disposable income is insufficient. Consider reducing the loan amount or paying off existing EMIs first.";
    default:
      return "We couldn't evaluate your request due to invalid input values. Please ensure all fields contain valid positive amounts.";
  }
}

export default function ResultCard({ result }) {
  if (!result) return null;

  const isApproved = result.approved;
  const dtiPercent = (result.dti * 100).toFixed(1);
  const minDisposable = result.income * 0.2;

  const dtiColor =
    result.dti <= 0.4 ? 'text-emerald-400' :
    result.dti <= 0.5 ? 'text-amber-400' : 'text-rose-400';

  return (
    <div className={`glass-card p-8 h-full w-full border-t-4 shadow-2xl ${isApproved ? 'border-t-emerald-500' : 'border-t-rose-500'}`}>
      <div className="flex flex-col h-full space-y-5">

        {/* Status Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          {isApproved ? (
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center animate-[pulseGlow_2s_infinite]">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-rose-500" />
            </div>
          )}
          <h3 className={`text-3xl font-extrabold tracking-tight ${isApproved ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isApproved ? 'APPROVED' : 'REJECTED'}
          </h3>
        </div>

        {/* Calculation Breakdown */}
        <div className="bg-white/5 rounded-xl border border-glass-border p-4 space-y-1">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">Calculation Breakdown</p>
          <StatRow label="Monthly Income" value={`₹${fmt(result.income)}`} />
          <StatRow label="Existing EMIs" value={`₹${fmt(result.existingEMIs)}`} />
          <StatRow label="New EMI" value={`₹${fmt(result.newEMI)}`} sub={`@ ${result.interestRate}% for ${result.tenure}mo`} />
          <StatRow
            label="DTI Ratio"
            value={
              <span className={dtiColor}>{dtiPercent}%</span>
            }
            sub="threshold: ≤ 50%"
          />
          <StatRow
            label="Disposable Income"
            value={
              <span className={result.disposable >= minDisposable ? 'text-emerald-400' : 'text-rose-400'}>
                ₹{fmt(result.disposable)}
              </span>
            }
            sub={`min: ₹${fmt(minDisposable)}`}
          />
        </div>

        {/* Decision Reason */}
        {isApproved ? (
          <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 text-emerald-300 text-sm">
            <p className="flex items-center gap-2 font-bold mb-1">
              <CheckCircle className="w-4 h-4" /> Why Approved
            </p>
            Your DTI ratio of <strong>{dtiPercent}%</strong> is within the safe limit (≤ 50%) and your disposable income of <strong>₹{fmt(result.disposable)}</strong> covers the required 20% minimum (₹{fmt(minDisposable)}). Your eligibility has been recorded on-chain.
          </div>
        ) : (
          <div className="bg-rose-500/10 p-4 rounded-xl border border-rose-500/20 text-rose-300 text-sm">
            <p className="flex items-center gap-2 font-bold mb-1">
              <XCircle className="w-4 h-4" /> Why Rejected
            </p>
            {getRejectionMessage(result.reason)}
          </div>
        )}

        {/* Transaction Hash */}
        <div className="w-full bg-black/40 rounded-xl p-4 border border-glass-border/50 mt-auto">
          <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider font-semibold">Stellar Transaction Hash</p>
          <p className="text-xs font-mono text-gray-300 break-all bg-white/5 p-3 rounded-lg border border-glass-border/30">
            {result.txHash}
          </p>
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${result.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 text-sm text-accent-cyan hover:text-accent-teal transition-colors font-medium"
          >
            <span>View on Stellar Explorer</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
