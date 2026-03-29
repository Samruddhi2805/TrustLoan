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
        
        <div className="text-gray-300 space-y-2">
          <p className="font-semibold text-lg">Reason: <span className="text-white uppercase tracking-wider">{result.reason}</span></p>
          <p>Calculated DTI: <span className="font-mono text-accent-cyan text-xl ml-2">{result.dti}</span></p>
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
