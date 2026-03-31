import React, { useState } from 'react';
import Navbar from './components/Navbar';
import FormCard from './components/FormCard';
import Dashboard from './components/Dashboard';

export function calculateEMI(P, annualRate, n) {
  if (P <= 0 || n <= 0) return 0;
  const r = annualRate / 12 / 100;
  if (r === 0) return P / n;
  return (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function evaluateLoanSafety(income, existingEMIs, newEMI, expenses, employmentType) {
  const dti = income > 0 ? ((existingEMIs + newEMI) / income) * 100 : Infinity;
  const disposable = income - (existingEMIs + newEMI + expenses);
  const disposablePct = income > 0 ? (disposable / income) * 100 : -Infinity;
  
  let advice = '';
  let reasons = [];
  let riskMode = '';

  if (dti > 50 || disposablePct < 10 || disposable < 0) {
    advice = 'DO NOT TAKE LOAN';
    riskMode = 'Danger';
    if (dti > 50) reasons.push("High EMI burden (Debt-to-Income > 50%).");
    if (disposablePct < 10 && disposable >= 0) reasons.push("Low remaining income after expenses (< 10%).");
    if (disposable < 0) reasons.push("Negative cash flow: You cannot afford daily expenses with this loan.");
    if (employmentType === 'self-employed') reasons.push("Unstable financial buffer for self-employed income.");
  } else if (dti < 30 && disposablePct > 30) {
    advice = 'SAFE TO TAKE LOAN';
    riskMode = 'Safe';
    reasons.push("Healthy EMI burden (Debt-to-Income < 30%).");
    reasons.push("Strong financial buffer after all expenses (> 30%).");
    if (employmentType === 'salaried') reasons.push("Stable salaried income minimizes risk.");
  } else {
    advice = 'TAKE WITH CAUTION';
    riskMode = 'Caution';
    if (dti >= 30) reasons.push("Moderate EMI burden (Debt-to-Income ≥ 30%).");
    if (disposablePct <= 30 && disposablePct >= 10) reasons.push("Moderate remaining income after expenses (between 10% and 30%).");
    if (employmentType === 'self-employed') reasons.push("Self-employed income requires a larger safety cushion.");
  }

  if (reasons.length < 3) {
      if (advice === 'SAFE TO TAKE LOAN') reasons.push("Comfortable living standards maintained.");
      if (advice === 'TAKE WITH CAUTION') reasons.push("Maintain strict budget discipline to avoid default.");
      if (advice === 'DO NOT TAKE LOAN') reasons.push("Consider increasing income or reducing existing expenses first.");
  }
  
  const stressIncome = income * 0.8;
  const stressDti = stressIncome > 0 ? ((existingEMIs + newEMI) / stressIncome) * 100 : Infinity;
  const stressDisposable = stressIncome - (existingEMIs + newEMI + expenses);

  return { dti, disposable, disposablePct, advice, riskMode, reasons: reasons.slice(0, 3), stressIncome, stressDti, stressDisposable };
}

function App() {
  const [formData, setFormData] = useState({
    income: '',
    existingEMIs: '',
    monthlyExpenses: '',
    loanAmount: '',
    interestRate: '12',
    tenure: '12',
    employmentType: 'salaried',
  });

  const [result, setResult] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const evaluateLoan = (e) => {
    e.preventDefault();
    const income = parseFloat(formData.income) || 0;
    const existingEMIs = parseFloat(formData.existingEMIs) || 0;
    const monthlyExpenses = parseFloat(formData.monthlyExpenses) || 0;
    const loanAmount = parseFloat(formData.loanAmount) || 0;
    const interestRate = parseFloat(formData.interestRate) || 12;
    const tenure = parseInt(formData.tenure, 10) || 12;

    if (!income || income <= 0) { alert('Monthly Income must be a positive number!'); return; }
    if (!loanAmount || loanAmount <= 0) { alert('Desired Loan Amount must be a positive number!'); return; }

    const newEMI = calculateEMI(loanAmount, interestRate, tenure);
    const safetyResult = evaluateLoanSafety(income, existingEMIs, newEMI, monthlyExpenses, formData.employmentType);
    
    setResult({
        ...safetyResult,
        income,
        existingEMIs,
        newEMI,
        monthlyExpenses,
        loanAmount,
    });
  };

  return (
    <div className="relative min-h-screen px-4 pt-10 sm:px-6 lg:px-8 w-screen overflow-x-hidden font-sans">
      <div className="aurora-bg">
        <div className="aurora-blob blob-1"></div>
        <div className="aurora-blob blob-2"></div>
        <div className="aurora-blob blob-3"></div>
      </div>
      <Navbar account={null} />

      <main className="max-w-7xl mx-auto pt-24 pb-24 relative z-10 w-full">
        <div className="flex flex-col gap-10 mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col lg:flex-row gap-8 items-start justify-center max-w-6xl mx-auto w-full">
              <div className="w-full lg:w-[45%] flex">
                <FormCard
                  formData={formData}
                  handleInputChange={handleInputChange}
                  evaluateLoan={evaluateLoan}
                />
              </div>
              <div className="w-full lg:w-[55%] flex min-h-[500px]">
                {result ? (
                  <Dashboard result={result} />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center glass-card p-12 border border-dashed border-gray-500/50 opacity-70 flex-1 bg-black/20">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <p className="text-gray-300 text-center text-lg leading-relaxed max-w-sm">
                      Fill in your financial details to evaluate your true loan safety risk and simulate stress scenarios.
                    </p>
                  </div>
                )}
              </div>
            </div>
        </div>
      </main>
    </div>
  );
}

export default App;
