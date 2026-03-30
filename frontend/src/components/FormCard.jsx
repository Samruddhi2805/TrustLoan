import React, { useMemo } from 'react';
import { calculateEMI, calculateDTI, calculateDisposablePct } from '../App';

function usePreview(formData) {
  return useMemo(() => {
    const income = parseFloat(formData.income) || 0;
    const existingEMIs = parseFloat(formData.existingEMIs) || 0;
    const monthlyExpenses = parseFloat(formData.monthlyExpenses) || 0;
    const loanAmount = parseFloat(formData.loanAmount) || 0;
    const interestRate = parseFloat(formData.interestRate) || 12;
    const tenure = parseInt(formData.tenure, 10) || 12;

    if (!income || !loanAmount) return null;

    const newEMI = calculateEMI(loanAmount, interestRate, tenure);
    const dti = calculateDTI(existingEMIs, newEMI, income);
    const disposablePct = calculateDisposablePct(income, existingEMIs, newEMI);
    // Net take-home = income minus ALL outflows (EMIs + expenses) — informational only
    const netTakeHome = income - existingEMIs - newEMI - monthlyExpenses;

    return { newEMI, dti, disposablePct, netTakeHome, monthlyExpenses };
  }, [formData]);
}

function fmt(n) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

function InputField({ id, label, hint, placeholder, name, value, onChange, min = "0", step, required }) {
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline gap-2 text-sm font-medium text-gray-400 mb-1 uppercase tracking-wider">
        {label}
        {hint && <span className="normal-case text-gray-600 text-xs font-normal">{hint}</span>}
      </label>
      <input
        type="number" id={id} name={name} value={value}
        onChange={onChange} placeholder={placeholder}
        className="glass-input" required={required}
        min={min} step={step}
      />
    </div>
  );
}

export default function FormCard({ formData, handleInputChange, checkEligibility, loading }) {
  const preview = usePreview(formData);

  const dtiPct = preview ? (preview.dti * 100).toFixed(1) : null;

  const dtiColor = !preview ? 'text-gray-400'
    : preview.dti <= 0.55 ? 'text-emerald-400'
    : preview.dti <= 0.70 ? 'text-amber-400' : 'text-rose-400';

  const dispColor = !preview ? 'text-gray-400'
    : preview.disposablePct >= 20 ? 'text-emerald-400'
    : preview.disposablePct >= 15 ? 'text-amber-400' : 'text-rose-400';

  const verdict = !preview ? null
    : preview.newEMI > parseFloat(formData.income || 0) ? { text: '⚠ EMI exceeds income — will be Rejected', cls: 'text-rose-400 bg-rose-500/10' }
    : preview.dti <= 0.55 && preview.disposablePct >= 20 ? { text: '✓ Likely APPROVED', cls: 'text-emerald-400 bg-emerald-500/10' }
    : preview.dti <= 0.70 && preview.disposablePct >= 15 ? { text: '~ You may qualify — bank will verify your details', cls: 'text-amber-400 bg-amber-500/10' }
    : { text: '✗ Likely REJECTED', cls: 'text-rose-400 bg-rose-500/10' };

  return (
    <div className="glass-card p-8 w-full relative group shadow-2xl">
      <div className="relative bg-glass-bg rounded-2xl">
        <h2 className="text-2xl font-bold text-center mb-1 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Check Eligibility
        </h2>
        <p className="text-center text-xs text-gray-500 mb-6 uppercase tracking-wider">Standard EMI · DTI · Disposable Logic</p>

        <form onSubmit={checkEligibility} className="space-y-4">

          {/* Monthly Income */}
          <InputField
            id="income" name="income" value={formData.income} onChange={handleInputChange}
            label="Monthly Income (₹)" placeholder="e.g. 75000" required min="1"
          />

          {/* Existing EMIs */}
          <InputField
            id="existingEMIs" name="existingEMIs" value={formData.existingEMIs} onChange={handleInputChange}
            label="Existing EMIs (₹)" hint="– current loan obligations only"
            placeholder="e.g. 10000 (0 if none)"
          />

          {/* Monthly Expenses */}
          <div>
            <label htmlFor="monthlyExpenses" className="flex items-baseline gap-2 text-sm font-medium text-gray-400 mb-1 uppercase tracking-wider">
              Monthly Expenses (₹)
              <span className="normal-case text-gray-600 text-xs font-normal">– rent, food, utilities, etc.</span>
            </label>
            <input
              type="number" id="monthlyExpenses" name="monthlyExpenses"
              value={formData.monthlyExpenses} onChange={handleInputChange}
              placeholder="e.g. 25000" className="glass-input" min="0"
            />
            <p className="text-xs text-gray-600 mt-1 pl-1">
              ℹ️ Used for your net take-home estimate. <em>Not included in DTI calculation.</em>
            </p>
          </div>

          {/* Loan Amount */}
          <InputField
            id="loanAmount" name="loanAmount" value={formData.loanAmount} onChange={handleInputChange}
            label="Loan Amount (₹)" placeholder="e.g. 500000" required min="1"
          />

          {/* Interest Rate + Tenure */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="interestRate" className="block text-sm font-medium text-gray-400 mb-1 uppercase tracking-wider">
                Interest Rate (%)
              </label>
              <input
                type="number" id="interestRate" name="interestRate"
                value={formData.interestRate} onChange={handleInputChange}
                placeholder="12" className="glass-input" min="0" step="0.1"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="tenure" className="block text-sm font-medium text-gray-400 mb-1 uppercase tracking-wider">
                Tenure (Months)
              </label>
              <input
                type="number" id="tenure" name="tenure"
                value={formData.tenure} onChange={handleInputChange}
                placeholder="12" className="glass-input" min="1" step="1"
              />
            </div>
          </div>

          {/* Real-time Preview */}
          {preview && (
            <div className="rounded-xl border border-glass-border bg-white/5 p-4 space-y-2 text-sm">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">📊 Live Preview</p>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">New EMI</span>
                <span className="font-mono font-bold text-white">₹{fmt(preview.newEMI)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">DTI Ratio</span>
                <div className="text-right">
                  <span className={`font-mono font-bold ${dtiColor}`}>{dtiPct}%</span>
                  <span className="ml-2 text-xs text-gray-600">≤55% ✓ · ≤70% ~</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Disposable Income</span>
                <div className="text-right">
                  <span className={`font-mono font-bold ${dispColor}`}>{preview.disposablePct.toFixed(1)}%</span>
                  <span className="ml-2 text-xs text-gray-600">≥20% ✓ · ≥15% ~</span>
                </div>
              </div>

              {/* Net take-home (includes expenses) */}
              {preview.monthlyExpenses > 0 && (
                <div className="flex justify-between items-center pt-1 border-t border-glass-border/30">
                  <span className="text-gray-500 text-xs">Net Cash After All Outflows</span>
                  <span className={`font-mono font-semibold text-xs ${preview.netTakeHome >= 0 ? 'text-blue-300' : 'text-rose-400'}`}>
                    ₹{fmt(preview.netTakeHome)}
                  </span>
                </div>
              )}

              {/* Quick verdict */}
              <div className={`mt-1 text-xs font-semibold text-center py-1.5 rounded-md ${verdict.cls}`}>
                {verdict.text}
              </div>
            </div>
          )}

          <button
            type="submit" id="check-eligibility-btn" disabled={loading}
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
