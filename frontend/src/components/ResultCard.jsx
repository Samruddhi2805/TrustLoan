import React from 'react';
import { CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';

function fmt(n) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

function StatRow({ label, value, badge }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-glass-border/30 last:border-none">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-mono font-bold text-white text-sm">{value}</span>
        {badge && <span className="text-xs text-gray-500">{badge}</span>}
      </span>
    </div>
  );
}

const STATUS_CONFIG = {
  APPROVE: {
    icon: <CheckCircle className="w-10 h-10 text-emerald-400" />,
    bg: 'bg-emerald-500/20',
    border: 'border-t-emerald-500',
    textColor: 'text-emerald-400',
    boxBg: 'bg-emerald-500/10 border-emerald-500/20',
    boxText: 'text-emerald-300',
    label: 'APPROVED',
  },
  CONDITIONAL: {
    icon: <AlertCircle className="w-10 h-10 text-amber-400" />,
    bg: 'bg-amber-500/20',
    border: 'border-t-amber-500',
    textColor: 'text-amber-400',
    boxBg: 'bg-amber-500/10 border-amber-500/20',
    boxText: 'text-amber-300',
    label: 'RISKY',
  },
  REJECT: {
    icon: <XCircle className="w-10 h-10 text-rose-400" />,
    bg: 'bg-rose-500/20',
    border: 'border-t-rose-500',
    textColor: 'text-rose-400',
    boxBg: 'bg-rose-500/10 border-rose-500/20',
    boxText: 'text-rose-300',
    label: 'REJECTED',
  },
};

export default function ResultCard({ result }) {
  if (!result) return null;

  const cfg = STATUS_CONFIG[result.status] || STATUS_CONFIG.REJECT;
  const dtiPct = (result.dti * 100).toFixed(1);
  const dispPct = result.disposablePct?.toFixed(1) ?? '—';
  const ncfPct  = result.netCashFlowPct?.toFixed(1) ?? null;

  // DTI: <40% safe, 40–60% risky, >60% reject
  const dtiColor =
    result.dti < 0.40 ? 'text-emerald-400' :
    result.dti <= 0.60 ? 'text-amber-400' : 'text-rose-400';

  // Disposable: ≥20% safe, <20% risky
  const dispColor =
    result.disposablePct >= 20 ? 'text-emerald-400' :
    result.disposablePct >= 10 ? 'text-amber-400' : 'text-rose-400';

  const ncfColor =
    result.netCashFlow > 0 ? 'text-blue-300' : 'text-rose-400';

  return (
    <div className={`glass-card p-5 sm:p-8 h-full w-full border-t-4 shadow-2xl ${cfg.border}`}>
      <div className="flex flex-col h-full space-y-5">

        {/* Status Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className={`w-16 h-16 rounded-full ${cfg.bg} flex items-center justify-center ${result.status === 'APPROVE' ? 'animate-[pulseGlow_2s_infinite]' : ''}`}>
            {cfg.icon}
          </div>
          <h3 className={`text-2xl font-extrabold tracking-tight ${cfg.textColor}`}>
            {cfg.label}
          </h3>
        </div>

        {/* Calculation Breakdown */}
        <div className="bg-white/5 rounded-xl border border-glass-border p-4 space-y-1">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">Calculation Breakdown</p>
          <StatRow label="Monthly Income" value={`₹${fmt(result.income)}`} />
          <StatRow label="Existing EMIs" value={`₹${fmt(result.existingEMIs)}`} />
          {result.monthlyExpenses > 0 && (
            <StatRow label="Monthly Expenses" value={`₹${fmt(result.monthlyExpenses)}`} badge="(informational)" />
          )}
          <StatRow label="New EMI" value={`₹${fmt(result.newEMI)}`} badge={`@ ${result.interestRate}% / ${result.tenure}mo`} />
          <StatRow
            label="DTI Ratio"
            value={<span className={dtiColor}>{dtiPct}%</span>}
            badge="Safe <40% | Risky 40–60% | Reject >60%"
          />
          <StatRow
            label="Disposable Income"
            value={<span className={dispColor}>{dispPct}%</span>}
            badge="Safe ≥20%"
          />
          <StatRow
            label="Net Cash Flow"
            value={
              <span className={ncfColor}>
                ₹{fmt(result.netCashFlow ?? (result.income - result.existingEMIs - result.newEMI - result.monthlyExpenses))}
              </span>
            }
            badge={ncfPct !== null ? (parseFloat(ncfPct) >= 10 ? `${ncfPct}% of income ✓` : `${ncfPct}% of income ⚠`) : 'income − EMIs − expenses'}
          />
        </div>

        {/* Decision Reason */}
        <div className={`p-4 rounded-xl border ${cfg.boxBg} ${cfg.boxText} text-sm`}>
          <p className="flex items-center gap-2 font-bold mb-2">
            {result.status === 'APPROVE' && <CheckCircle className="w-4 h-4" />}
            {result.status === 'CONDITIONAL' && <AlertCircle className="w-4 h-4" />}
            {result.status === 'REJECT' && <XCircle className="w-4 h-4" />}
            {result.status === 'APPROVE' ? 'Why you were approved' :
             result.status === 'CONDITIONAL' ? 'Why this is flagged as Risky' :
             'Why you were not approved'}
          </p>
          <p className="leading-relaxed">
            {result.reason === 'EMI_EXCEEDS_INCOME'
              ? `Rejected — the calculated EMI of ₹${fmt(result.newEMI)} exceeds your monthly income of ₹${fmt(result.income)}. This loan is not serviceable.`
              : result.reason}
          </p>
        </div>

        {/* Transaction Hash */}
        <div className="w-full bg-black/40 rounded-xl p-4 border border-glass-border/50 mt-auto">
          <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider font-semibold">Stellar Transaction Hash</p>
          <p className="text-xs font-mono text-gray-300 break-all bg-white/5 p-3 rounded-lg border border-glass-border/30">
            {result.txHash}
          </p>
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${result.txHash}`}
            target="_blank" rel="noopener noreferrer"
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
