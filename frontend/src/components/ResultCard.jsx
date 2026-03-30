import React from 'react';
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';

export default function ResultCard({ result }) {
  if (!result) return null;

  const isApproved = result.approved;
  
  return (
    <div className={`glass-card p-8 h-full w-full border-t-4 shadow-2xl ${isApproved ? 'border-t-emerald-500' : 'border-t-rose-500'}`}>
      <div className="flex flex-col items-center justify-center h-full text-center space-y-5">
        {isApproved ? (
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex flex-shrink-0 items-center justify-center animate-[pulseGlow_2s_infinite]">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-full bg-rose-500/20 flex flex-shrink-0 items-center justify-center">
            <XCircle className="w-12 h-12 text-rose-500" />
          </div>
        )}
        
        <h3 className={`text-4xl font-extrabold tracking-tight ${isApproved ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isApproved ? 'APPROVED' : 'REJECTED'}
        </h3>
        
        <div className="text-gray-300 space-y-4 w-full px-4">
          <div className="bg-white/5 p-4 rounded-xl border border-glass-border">
            <p className="text-sm uppercase tracking-wider text-gray-400 font-semibold mb-1">Calculated DTI Score</p>
            <p className="font-mono text-4xl font-bold text-accent-cyan">{result.dti}</p>
          </div>

          {!isApproved && (
             <div className="bg-rose-500/10 p-5 rounded-xl border border-rose-500/20 text-rose-300 text-sm font-medium text-left">
               <p className="flex items-center gap-2 font-bold mb-2">
                 <XCircle className="w-4 h-4" /> Message:
               </p>
               {result.reason === 'DTI_TOO_HIGH' 
                 ? "We couldn't approve your request because your Debt-to-Income (DTI) ratio exceeded the safe threshold of 0.40. To increase your chances, try requesting a smaller loan amount, extending the repayment period, or reducing monthly expenses."
                 : "We couldn't evaluate your request due to invalid input metrics. Please ensure all values are positive numerical amounts."}
             </div>
          )}
          
          {isApproved && (
             <div className="bg-emerald-500/10 p-5 rounded-xl border border-emerald-500/20 text-emerald-300 text-sm font-medium text-left">
               <p className="flex items-center gap-2 font-bold mb-2">
                 <CheckCircle className="w-4 h-4" /> Message:
               </p>
               Your calculated DTI profile meets our safe risk tolerance thresholds! Your eligibility status has been permanently recorded on-chain.
             </div>
          )}
        </div>
        
        <div className="w-full bg-black/40 rounded-xl p-5 mt-6 border border-glass-border/50">
          <p className="text-sm text-gray-400 mb-2 uppercase tracking-wider font-semibold">Stellar Transaction Hash</p>
          <p className="text-xs font-mono text-gray-300 break-all w-full text-center bg-white/5 p-3 rounded-lg border border-glass-border/30">
            {result.txHash}
          </p>
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${result.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 text-sm text-accent-cyan hover:text-accent-teal transition-colors font-medium"
          >
            <span>View on Explorer</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
