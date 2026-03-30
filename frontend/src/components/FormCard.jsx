import React from 'react';

export default function FormCard({ formData, handleInputChange, checkEligibility, loading }) {
  return (
    <div className="glass-card p-8 w-full relative group shadow-2xl">
      <div className="relative bg-glass-bg rounded-2xl">
        <h2 className="text-2xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Check Eligibility
        </h2>
        
        <form onSubmit={checkEligibility} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">
              Monthly Income (₹)
            </label>
            <input
              type="number"
              name="income"
              value={formData.income}
              onChange={handleInputChange}
              placeholder="e.g. 5000"
              className="glass-input"
              required
              min="1"
              step="0.01"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">
              Monthly Expenses (₹)
            </label>
            <input
              type="number"
              name="expenses"
              value={formData.expenses}
              onChange={handleInputChange}
              placeholder="e.g. 1500"
              className="glass-input"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">
              Desired Loan Amount (₹)
            </label>
            <input
              type="number"
              name="loanAmount"
              value={formData.loanAmount}
              onChange={handleInputChange}
              placeholder="e.g. 10000"
              className="glass-input"
              required
              min="1"
              step="0.01"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">
              Repayment Period (Months)
            </label>
            <input
              type="number"
              name="repaymentPeriod"
              value={formData.repaymentPeriod}
              onChange={handleInputChange}
              placeholder="e.g. 12 (Optional)"
              className="glass-input"
              min="1"
              step="1"
            />
            <p className="text-xs text-gray-500 mt-1">If blank, defaults to 12 months for calculation.</p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-gradient mt-6 relative overflow-hidden flex justify-center items-center h-[56px]"
          >
            {loading ? (
              <span className="flex items-center gap-3">
                <svg className="animate-spin h-5 w-5 text-navy-bg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Calculating...
              </span>
            ) : (
              'Check Eligibility'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
