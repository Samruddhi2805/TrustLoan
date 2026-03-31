import React, { useState } from 'react';
import { Zap, ChevronDown, ChevronUp, Info } from 'lucide-react';

export default function FeeBumpBadge({ isActive, sponsorAddress }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-xl border transition-all duration-300 overflow-hidden ${isActive ? 'border-accent-teal/40 bg-accent-teal/5' : 'border-gray-600/30 bg-white/5'}`}>
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isActive ? 'bg-accent-teal/20' : 'bg-gray-500/20'}`}>
            <Zap className={`w-4 h-4 ${isActive ? 'text-accent-teal' : 'text-gray-400'}`} />
          </div>
          <span className={`text-sm font-semibold ${isActive ? 'text-accent-teal' : 'text-gray-400'}`}>
            {isActive ? 'Gasless Mode Active (Fee Sponsored)' : 'Standard Fee Mode'}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 text-xs text-gray-400 space-y-2 border-t border-glass-border/30 pt-3 mt-1">
          <div className="flex gap-2">
            <Info className="w-4 h-4 text-accent-teal flex-shrink-0 mt-0.5" />
            <p>
              <strong className="text-gray-200">Fee Bump (SEP-0015):</strong> This transaction uses Stellar's
              Fee Bump mechanism. A platform-level sponsor account wraps your transaction with an
              outer fee bump, covering the network fees on your behalf. <strong className="text-gray-200">You pay zero XLM in fees.</strong>
            </p>
          </div>
          {sponsorAddress && (
            <div className="bg-black/30 rounded-lg p-2 font-mono text-gray-500 break-all">
              <span className="text-gray-500">Sponsor: </span>
              <span className="text-accent-teal/80">{sponsorAddress}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
