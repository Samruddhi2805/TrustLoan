import React, { useMemo } from 'react';
import { calculateEMI, calculateDTI, calculateDisposable } from '../App';

// Real-time preview helper
function usePreview(formData) {
  return useMemo(() => {
    const income = parseFloat(formData.income) || 0;
    const existingEMIs = parseFloat(formData.existingEMIs) || 0;
    const loanAmount = parseFloat(formData.loanAmount) || 0;
    const interestRate = parseFloat(formData.interestRate) || 12;
    const tenure = parseInt(formData.tenure, 10) || 12;

    if (!income || !loanAmount) return null;

    const newEMI = calculateEMI(loanAmount, interestRate, tenure);
    const dti = calculateDTI(existingEMIs, newEMI, income);
    const disposable = calculateDisposable(income, existingEMIs, newEMI);
    const minDisposable = income * 0.2;

    return { newEMI, dti, disposable, minDisposable };
  }, [formData]);
}

function fmt(n) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

export default function FormCard({ formData, handleInputChange, checkEligibility, loading }) {
  const preview = usePreview(formData);

  const dtiPercent = preview ? (preview.dti * 100).toFixed(1) : null;
  const dtiColor =
    !preview ? 'text-gray-400' :
    preview.dti <= 0.4 ? 'text-emerald-400' :
    preview.dti <= 0.5 ? 'text-amber-400' : 'text-rose-400';

  return (
    <div className="glass-card p-8 w-full relative group shadow-2xl">
      <div className="relative bg-glass-bg rounded-2xl">
        <h2 className="text-2xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Check Eligibility
        </h2>
        <p className="text-center text-xs text-gray-500 mb-6 uppercase tracking-wider">Real-world EMI &amp; DTI logic</p>

        <form onSubmit={checkEligibility} className="space-y-4">
          {/* Monthly Income */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1 uppercase tracking-wider">
              Monthly Income (₹)
            </label>
            <input
              type="number"
              name="income"
              id="income"
              value={formData.income}
              onChange={handleInputChange}
              placeholder="e.g. 75000"
              className="glass-input"
              required
              min="1"
            />
          </div>

          {/* Existing EMIs */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1 uppercase tracking-wider">
              Existing EMIs (₹) <span className="normal-case text-gray-600 text-xs font-normal">– loan obligations only</span>
            </label>
            <input
              type="number"
              name="existingEMIs"
              id="existingEMIs"
              value={formData.existingEMIs}
              onChange={handleInputChange}
              placeholder="e.g. 10000 (0 if none)"
              className="glass-input"
              min="0"
            />
          </div>

          {/* Desired Loan Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1 uppercase tracking-wider">
              Desired Loan Amount (₹)
            </label>
            <input
              type="number"
              name="loanAmount"
              id="loanAmount"
              value={formData.loanAmount}
              onChange={handleInputChange}
              placeholder="e.g. 500000"
              className="glass-input"
              required
              min="1"
            />
          </div>

          {/* Interest Rate & Tenure side by side */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-400 mb-1 uppercase tracking-wider">
                Interest Rate (%)
              </label>
              <input
                type="number"
                name="interestRate"
                id="interestRate"
                value={formData.interestRate}
                onChange={handleInputChange}
                placeholder="e.g. 12"
                className="glass-input"
                min="0"
                step="0.1"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-400 mb-1 uppercase tracking-wider">
                Tenure (Months)
              </label>
              <input
                type="number"
                name="tenure"
                id="tenure"
                value={formData.tenure}
                onChange={handleInputChange}
                placeholder="e.g. 36"
                className="glass-input"
                min="1"
                step="1"
              />
            </div>
          </div>

          {/* Real-time preview */}
          {preview && (
            <div className="mt-2 rounded-xl border border-glass-border bg-white/5 p-4 space-y-2 text-sm">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">Live Calculation Preview</p>
              <div className="flex justify-between">
                <span className="text-gray-400">New EMI</span>
                <span className="text-white font-mono font-bold">₹{fmt(preview.newEMI)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">DTI Ratio</span>
                <span className={`font-mono font-bold ${dtiColor}`}>{dtiPercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Disposable Income</span>
                <span className={`font-mono font-bold ${preview.disposable >= preview.minDisposable ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ₹{fmt(preview.disposable)}
                </span>
              </div>
              <div className="pt-2 border-t border-glass-border/50">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>DTI threshold: ≤ 50%</span>
                  <span>Min Disposable: ₹{fmt(preview.minDisposable)}</span>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            id="check-eligibility-btn"
            disabled={loading}
            className="w-full btn-gradient mt-4 relative overflow-hidden flex justify-center items-center h-[52px]"
          >
            {loading ? (
              <span className="flex items-center gap-3">
                <svg className="animate-spin h-5 w-5 text-navy-bg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Calculating...
              </span>
            ) : 'Check Eligibility'}
          </button>
        </form>
      </div>
    </div>
  );
}
