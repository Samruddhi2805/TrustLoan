import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Info, TrendingDown } from 'lucide-react';

export default function Dashboard({ result }) {
  if (!result) return null;

  const {
    dti, disposable, advice, riskMode, reasons, 
    stressIncome, stressDti, stressDisposable
  } = result;

  const riskColors = {
    Safe: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    Caution: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    Danger: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
  };
  
  const riskGradient = {
    Safe: 'from-emerald-500 to-emerald-700',
    Caution: 'from-amber-400 to-orange-600',
    Danger: 'from-rose-500 to-red-700'
  };

  const IconObj = riskMode === 'Safe' ? CheckCircle : riskMode === 'Caution' ? AlertTriangle : ShieldAlert;

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-500">
      
      {/* FINAL ADVICE DISPLAY */}
      <div className={`glass-card p-6 flex flex-col items-center justify-center border-l-4 ${
          riskMode === 'Safe' ? 'border-l-emerald-500' : 
          riskMode === 'Caution' ? 'border-l-amber-500' : 'border-l-rose-500'
        } shadow-lg relative overflow-hidden`}
      >
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[80px] bg-gradient-to-br ${riskGradient[riskMode]} opacity-20`}></div>
        <div className="flex items-center gap-4 z-10">
          <IconObj className={`w-10 h-10 ${
              riskMode === 'Safe' ? 'text-emerald-400' : 
              riskMode === 'Caution' ? 'text-amber-400' : 'text-rose-400'
          }`} />
          <h2 className="text-3xl font-bold tracking-tight text-white">{advice}</h2>
        </div>
        <p className="mt-3 text-gray-400 text-sm tracking-wider uppercase font-semibold">Risk Meter: {riskMode.toUpperCase()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Metrics */}
        <div className="glass-card p-6 flex flex-col justify-center relative shadow-lg">
           <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-2 font-medium flex items-center gap-2">
             <Info className="w-4 h-4"/> Current DTI
           </h4>
           <div className="flex items-end gap-2">
             <p className={`text-4xl font-bold font-mono tracking-tighter ${
                dti < 30 ? 'text-emerald-400' : dti <= 50 ? 'text-amber-400' : 'text-rose-400'
             }`}>
               {dti === Infinity ? "N/A" : `${dti.toFixed(1)}%`}
             </p>
           </div>
           
           <h4 className="text-gray-400 text-xs uppercase tracking-wider mt-6 mb-2 font-medium flex items-center gap-2">
             <Info className="w-4 h-4"/> Disposable Income Buffer
           </h4>
           <p className={`text-4xl font-bold font-mono tracking-tighter ${
               disposable > 0 ? 'text-blue-300' : 'text-rose-400'
           }`}>
             ₹{new Intl.NumberFormat('en-IN').format(disposable)}
           </p>
        </div>

        {/* Top 3 Reasons */}
        <div className="glass-card p-6 shadow-lg bg-black/20">
           <h4 className="text-gray-400 text-sm uppercase tracking-wider mb-4 font-bold border-b border-glass-border/40 pb-2">
             Primary Safety Reasons
           </h4>
           <ul className="space-y-4">
             {reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className={`min-w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${riskColors[riskMode]}`}>
                    {idx + 1}
                  </div>
                  <span className="text-sm text-gray-300 leading-relaxed">{reason}</span>
                </li>
             ))}
           </ul>
        </div>
      </div>

      {/* Stress Simulation */}
      <div className="glass-card overflow-hidden shadow-lg border border-purple-500/20 bg-gradient-to-br from-black/40 to-indigo-950/20 mt-2">
         <div className="p-5 border-b border-glass-border flex items-center gap-3">
            <TrendingDown className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Stress Simulation</h3>
            <span className="ml-auto text-[10px] sm:text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full uppercase tracking-widest font-bold border border-purple-500/30">
               Income drops 20%
            </span>
         </div>
         <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-black/30">
            <div>
               <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">New Stressed Income</p>
               <p className="text-xl font-mono text-gray-300">₹{new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(stressIncome)}</p>
            </div>
            <div>
               <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">New Stressed DTI</p>
               <p className={`text-xl font-mono font-bold ${
                   stressDti < 30 ? 'text-emerald-400' : stressDti <= 50 ? 'text-amber-400' : 'text-rose-400'
               }`}>
                   {stressDti === Infinity ? "N/A" : `${stressDti.toFixed(1)}%`}
               </p>
            </div>
            <div className="sm:col-span-2 mt-2">
               <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">New Disposable Cash Flow</p>
               <div className="flex flex-col sm:flex-row sm:items-baseline gap-3">
                 <p className={`text-4xl font-mono font-bold ${
                     stressDisposable >= 0 ? 'text-purple-300' : 'text-rose-500'
                 }`}>
                     ₹{new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(stressDisposable)}
                 </p>
                 {stressDisposable < 0 && <span className="text-xs text-rose-500 uppercase tracking-wider font-bold bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20 w-max">Dangerously Negative</span>}
               </div>
               <p className="text-xs text-gray-400 mt-4 max-w-lg leading-relaxed">
                  This simulates an emergency scenario (e.g. temporary job loss, business dip) while you still have to pay all EMIs and basic expenses.
               </p>
            </div>
         </div>
      </div>

    </div>
  );
}
