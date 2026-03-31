import React from 'react';

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

export default function FormCard({ formData, handleInputChange, evaluateLoan }) {
  return (
    <div className="glass-card p-5 sm:p-8 w-full relative group shadow-2xl">
      <div className="relative bg-glass-bg rounded-2xl">
        <h2 className="text-2xl font-bold text-center mb-1 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Loan Safety Assessor
        </h2>
        <p className="text-center text-xs text-gray-500 mb-6 uppercase tracking-wider">Strict Financial Safety Rules</p>

        <form onSubmit={evaluateLoan} className="space-y-4">

          <InputField
            id="income" name="income" value={formData.income} onChange={handleInputChange}
            label="Monthly Income (₹)" placeholder="e.g. 75000" required min="1"
          />

          <InputField
            id="existingEMIs" name="existingEMIs" value={formData.existingEMIs} onChange={handleInputChange}
            label="Existing EMIs (₹)" hint="– current loan obligations"
            placeholder="e.g. 10000 (0 if none)"
          />

          <InputField
            id="monthlyExpenses" name="monthlyExpenses" value={formData.monthlyExpenses} onChange={handleInputChange}
            label="Essential Monthly Expenses (₹)" hint="– rent, food, bills"
            placeholder="e.g. 25000" required min="0"
          />

          <div className="pt-2 border-t border-glass-border/30">
            <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">New Loan Details</h3>
          </div>

          <InputField
            id="loanAmount" name="loanAmount" value={formData.loanAmount} onChange={handleInputChange}
            label="Desired Loan Amount (₹)" placeholder="e.g. 500000" required min="1"
          />

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="interestRate" className="block text-sm font-medium text-gray-400 mb-1 uppercase tracking-wider">
                Interest Rate (%)
              </label>
              <input
                type="number" id="interestRate" name="interestRate"
                value={formData.interestRate} onChange={handleInputChange}
                className="glass-input" min="0" step="0.1" required
              />
            </div>
            <div className="flex-1">
              <label htmlFor="tenure" className="block text-sm font-medium text-gray-400 mb-1 uppercase tracking-wider">
                Tenure (Months)
              </label>
              <input
                type="number" id="tenure" name="tenure"
                value={formData.tenure} onChange={handleInputChange}
                className="glass-input" min="1" step="1" required
              />
            </div>
          </div>

          <div className="pt-2">
             <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">Employment Type</label>
             <div className="flex gap-4">
                <label className="flex items-center gap-2 text-gray-300">
                   <input type="radio" name="employmentType" value="salaried" checked={formData.employmentType === 'salaried'} onChange={handleInputChange} className="w-4 h-4 text-indigo-500" />
                   Salaried
                </label>
                <label className="flex items-center gap-2 text-gray-300">
                   <input type="radio" name="employmentType" value="self-employed" checked={formData.employmentType === 'self-employed'} onChange={handleInputChange} className="w-4 h-4 text-indigo-500" />
                   Self-Employed
                </label>
             </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold tracking-widest uppercase hover:from-indigo-400 hover:to-purple-500 mt-6 relative overflow-hidden flex justify-center items-center h-[52px] rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
          >
            Evaluate Safety Risk
          </button>

        </form>
      </div>
    </div>
  );
}
